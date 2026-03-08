# Database Index Visualizer

Interactive visualizer for database index structures across **MySQL**, **PostgreSQL**, **MongoDB**, and **Redis**. Built with pure HTML5, CSS3, and vanilla JavaScript — no frameworks, no dependencies.

![Preview](img.svg)

## Live Demo

[https://dykyi-roman.github.io/projects/db-visualizer/](https://dykyi-roman.github.io/projects/db-visualizer/)

## Features

### MySQL (5 Index Types)

| Mode | Description | Supported Queries |
|------|-------------|-------------------|
| **B-Tree Index** | B+Tree traversal: root -> internal nodes -> leaf -> data page. O(log n) lookup | `WHERE id = N`, `WHERE id BETWEEN N AND M` |
| **Hash Index** | Hash function maps key to bucket for O(1) equality-only lookups. Range queries trigger full scan | `WHERE email = "..."`, `WHERE email > "..."` (fallback) |
| **Composite Index** | Multi-column index with leftmost prefix rule: INDEX(city, age, name) | `WHERE city = "..."`, `WHERE city = "..." AND age = N`, all 3 cols, or skip prefix (miss) |
| **Full-Text Index** | Inverted index with tokenization, stop word filtering, and posting lists | `MATCH(text) AGAINST("...")` with single and multi-term search |
| **EXPLAIN Plan** | Query -> Parser -> Optimizer -> Index Selection -> Execution visualization | Any SELECT with WHERE — produces EXPLAIN output table with type, key, rows, Extra |

### PostgreSQL (5 Index Types)

| Mode | Description | Supported Queries |
|------|-------------|-------------------|
| **B-Tree** | B-Tree with MVCC visibility (xmin/xmax transaction IDs, dead tuples, VACUUM) | `WHERE id = N`, `WHERE id BETWEEN N AND M` |
| **Hash Index** | 4-page structure: meta page, bucket pages, overflow pages, bitmap pages | `WHERE email = "..."`, `WHERE email > "..."` (fallback) |
| **GIN Index** | Generalized Inverted Index for JSONB — maps tags/keys to posting lists of heap TIDs | `WHERE data @> '{"tags": ["..."]}'`, `WHERE data @> '{"lang": "..."}'` |
| **GiST Index** | Generalized Search Tree for geometric data with bounding box overlap checks | `WHERE pos <@ box '((x1,y1),(x2,y2))'` |
| **BRIN Index** | Block Range Index storing min/max per block range for correlated data | `WHERE ts BETWEEN N AND M`, `WHERE ts = N` |

### MongoDB (4 Index Types)

| Mode | Description | Supported Queries |
|------|-------------|-------------------|
| **Single Field** | B-Tree index on a single document field with equality, range, and sort support | `find({ age: N })`, `find({ age: { $gt: N } })`, `find({ age: { $gte: N, $lte: M } })` |
| **Compound Index** | Multi-key compound index with prefix rule and sort optimization | `find({ city: "..." })`, `find({ city: "...", age: N })`, `.sort({ age: 1 })` |
| **Multikey Index** | Array field indexing — one document creates multiple index entries | `find({ tags: "..." })`, `find({ tags: { $all: ["...", "..."] } })` |
| **Text Index** | Text search with stemming, stop word removal, and TF-IDF scoring | `find({ $text: { $search: "..." } })` with single and multi-term search |

### Redis (3 Index Types)

| Mode | Description | Supported Commands |
|------|-------------|-------------------|
| **Sorted Set (ZSET)** | Skip list + hash table with O(log n) insert/lookup by score | `ZRANGEBYSCORE key min max`, `ZRANGE key start stop`, `ZADD key score member` |
| **Hash (Rehashing)** | Progressive rehashing with dual hash tables and bucket-by-bucket migration | `HGET key`, `HSET key value`, `TRIGGER REHASH` |
| **Secondary Index** | Sorted Sets as manual secondary indexes for numeric ranges and string prefixes | `ZRANGEBYSCORE idx:age min max`, `ZRANGEBYSCORE idx:salary min max`, `ZRANGEBYLEX idx:name [A [D` |

### Global Controls

| Control | Description |
|---------|-------------|
| **Run Query** | Execute a query through the selected index structure |
| **Burst** | Run 5 queries rapidly in sequence with 200ms delay between each |
| **Index Miss** | Next query bypasses the index (full table/collection scan) |
| **Reset** | Clear all state, counters, logs, and re-initialize current mode |
| **Compare with Full Scan** | Toggle side-by-side comparison panel: index scan vs full scan performance |

### Visualization Engine

- **B+Tree traversal** — node highlighting with fade effect on non-path nodes, step-by-step descent
- **Full table scan** — row-by-row scanning animation with yellow highlight, matched rows turn green
- **Hash function** — hash box activation, bucket targeting with glow effect
- **Skip list** — level-based traversal from top level down, forward scanning at each level
- **GiST bounding boxes** — visual overlap detection with query box overlay on coordinate plane
- **BRIN block ranges** — sequential block scanning with match/skip classification
- **EXPLAIN pipeline** — step-by-step flow: Parser -> Optimizer -> Index Selection -> Execution
- **Inverted index** — token lookup highlighting with posting list reference resolution (used by Full-Text, GIN, Multikey, Text)
- **Real-time stats bar** — Pages Read, Rows Examined, Index Lookups, Query Time (cumulative across queries)
- **Comparison panel** — index scan vs full scan with color-coded faster/slower indicators
- **Color-coded event log** with timestamps and 9 event types: `QUERY`, `SCAN`, `LOOKUP`, `FETCH`, `MISS`, `RESULT`, `HASH`, `EXPLAIN`, `INDEX`
- **Database-specific color themes** — MySQL teal (#00758F), PostgreSQL blue (#336791), MongoDB green (#47A248), Redis red (#DC382D)

## Architecture

### Global Namespace Pattern

All modules register on a shared `DBIV` object (`window.DBIV`). Each database file creates a namespace (e.g., `DBIV.mysql`, `DBIV.postgresql`) with a `modes` array and mode objects. Each mode object exposes two methods:

- `init()` — renders query card, index structure, data pages, and binds event handlers
- `run()` — executes the query: parses input, animates traversal, updates stats, logs events

### Application Lifecycle

```
DOMContentLoaded
  -> setupControls()          # bind Run, Burst, Miss, Reset, Compare, DB tabs
  -> switchDb('mysql')        # set accent colors, render mode tabs
    -> switchMode('mysql', 'btree')   # clear state, call mode.init()
```

### Key Engine Components

| Component | Function | Description |
|-----------|----------|-------------|
| `DBIV.state` | State management | Current DB, mode, query ID, stats counters, comparison mode, delivery queue |
| `DBIV.log()` | Event logging | Appends timestamped, color-coded entries to the event log panel |
| `DBIV.renderBTree()` | Tree renderer | Generates nested `.tree-level` > `.tree-node` > `.tree-key` HTML from tree data |
| `DBIV.renderSkipList()` | Skip list renderer | Generates multi-level skip list with forward arrows and NIL terminators |
| `DBIV.renderDataPages()` | Data renderer | Generates paginated data rows with ID and value columns |
| `DBIV.findPathInTree()` | Path finder | Traverses rendered B+Tree DOM to find the path to a target value |
| `DBIV.animateTreeTraversal()` | Tree animation | Highlights path nodes sequentially, fades non-path nodes |
| `DBIV.animateFullScan()` | Scan animation | Scans rows sequentially with yellow highlight, marks matched row green |
| `DBIV.animateHash()` | Hash animation | Activates hash function display, targets destination bucket |
| `DBIV.animateDot()` | Dot animation | Animates a flying dot between two DOM elements (simplified timer) |
| `DBIV.showComparison()` | Comparison display | Renders side-by-side stats with faster/slower color coding |
| `DBIV.setAccentColors()` | Theming | Sets `--dbiv-accent`, `--dbiv-accent-bg`, `--dbiv-accent-light` CSS variables per DB |
| `DBIV.sampleData` | Data generator | 12-user dataset with `toPages()` paginator and `btreeFromField()` tree builder |

### Sample Data

The engine provides a shared dataset of 12 users (Alice through Leo) with fields: `id`, `name`, `age`, `email`, `city`. MongoDB extends this with `tags` and `bio` fields. Redis modes use independent datasets (leaderboard members, hash entries, user records with salary).

## Project Structure

```
db-visualizer/
├── index.html              # Layout shell: DB tabs, controls, stats, viz area, log
├── css/
│   └── style.css           # Dark theme, DB-specific colors, responsive (900px/600px)
├── js/
│   ├── engine.js           # DBIV namespace, state, renderers, animations, helpers
│   ├── mysql.js            # 5 modes: btree, hash, composite, fulltext, explain
│   ├── postgresql.js       # 5 modes: btree (MVCC), hash (4-page), gin, gist, brin
│   ├── mongodb.js          # 4 modes: single, compound, multikey, text
│   ├── redis.js            # 3 modes: zset (skip list), hash-index (rehashing), secondary
│   └── app.js              # IIFE: DB switching, mode tabs, control bindings, bootstrap
├── img.svg                 # Project preview image
└── README.md
```

### Script Load Order

Scripts must load in this exact order (each depends on the previous):

1. `engine.js` — defines `DBIV` namespace and all shared utilities
2. `mysql.js` — registers `DBIV.mysql` with modes and `_queryCard` helper
3. `postgresql.js` — registers `DBIV.postgresql`, reuses `DBIV.mysql._queryCard`
4. `mongodb.js` — registers `DBIV.mongodb` with custom query card (leaf icon)
5. `redis.js` — registers `DBIV.redis` with custom query card (lightning icon)
6. `app.js` — IIFE that reads all `DBIV.*` namespaces and wires up the UI

## Styling

### CSS Custom Properties

The project uses its own `--dbiv-*` CSS variable namespace (separate from the site's `--color-*` variables):

| Variable | Value | Purpose |
|----------|-------|---------|
| `--dbiv-bg` | `#141922` | Main background |
| `--dbiv-card-bg` | `#1a2030` | Card/panel background |
| `--dbiv-border` | `#2a3444` | Borders and dividers |
| `--dbiv-text` | `#e0e4ea` | Primary text |
| `--dbiv-text-light` | `#8892a4` | Secondary/muted text |
| `--dbiv-accent` | Dynamic | Set per database via `setAccentColors()` |
| `--dbiv-accent-bg` | Dynamic | Dark tinted background matching accent |
| `--dbiv-accent-light` | Dynamic | Light border matching accent |
| `--dbiv-radius` | `8px` | Border radius |
| `--dbiv-transition` | `0.25s ease` | Default transition |

### Database Color Themes

| Database | Accent | Background | Light |
|----------|--------|------------|-------|
| MySQL | `#00758F` | `#0d1f24` | `#153038` |
| PostgreSQL | `#336791` | `#0d1724` | `#152538` |
| MongoDB | `#47A248` | `#0d1f10` | `#15301a` |
| Redis | `#DC382D` | `#2a1616` | `#3d1c1c` |

### Responsive Breakpoints

- **900px** — visualization grid collapses from 3-column to single column, port connectors hidden
- **600px** — DB tabs stack vertically, stats bar wraps to 2x2, controls stack, comparison panel stacks

## Tech Stack

- **HTML5** — semantic markup with ARIA attributes (`role="tablist"`, `aria-selected`, `aria-label`)
- **CSS3** — custom properties, grid layout, flexbox, CSS animations (shake, scanPulse), dark theme
- **Vanilla JavaScript** — IIFE module in app.js, object literals for modes, async/await animations
- **No dependencies** — zero npm packages, zero CDN libraries

## Running Locally

```bash
# Any local HTTP server (required for fetch-based header loading)
python -m http.server 8000

# Then open
# http://localhost:8000/projects/db-visualizer/
```

## Author

**Dykyi Roman** — Software Engineer

- Website: [dykyi-roman.github.io](https://dykyi-roman.github.io/)
- GitHub: [dykyi-roman](https://github.com/dykyi-roman)
