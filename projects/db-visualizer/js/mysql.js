/* ===== MySQL Index Modes ===== */

DBIV.mysql = {};

DBIV.mysql.modes = [
    { id: 'btree', label: 'B-Tree Index', desc: 'B+Tree traversal: root \u2192 internal nodes \u2192 leaf \u2192 data page. Index narrows search from O(n) to O(log n). Compare with Full Table Scan to see the difference.' },
    { id: 'hash', label: 'Hash Index', desc: 'Hash function maps key to bucket for O(1) lookup. Only supports equality queries (=). Range queries (>, <, BETWEEN) cannot use hash indexes.' },
    { id: 'composite', label: 'Composite Index', desc: 'Multi-column index follows the leftmost prefix rule. INDEX(a, b, c) can be used for queries on (a), (a,b), or (a,b,c), but NOT (b,c) alone.' },
    { id: 'fulltext', label: 'Full-Text Index', desc: 'Inverted index: text is tokenized into words, each word maps to a posting list of document IDs. Supports MATCH...AGAINST queries.' },
    { id: 'explain', label: 'EXPLAIN Plan', desc: 'Query \u2192 Parser \u2192 Optimizer \u2192 Index Selection \u2192 Access Method. EXPLAIN shows how MySQL plans to execute your query, including cost estimates.' },
];

DBIV.mysql.details = {
    btree: {
        principles: [
            'B+Tree keeps all data in leaf nodes; internal nodes store only keys and pointers for navigation',
            'Tree stays balanced after every INSERT/DELETE via page splits and merges, guaranteeing O(log n) lookups',
            'Leaf nodes are linked in a doubly-linked list, enabling efficient range scans without backtracking',
            'InnoDB clusters rows by primary key (clustered index); secondary indexes store PK values, not row pointers',
            'Page size (16 KB default) determines fan-out: higher fan-out = fewer levels = fewer disk reads'
        ],
        concepts: [
            { term: 'Page / Block', definition: 'Smallest I/O unit (16 KB in InnoDB). Each tree node occupies one page. Fewer pages read = faster query.' },
            { term: 'Fan-out', definition: 'Number of child pointers per internal node. High fan-out keeps tree shallow (3-4 levels for billions of rows).' },
            { term: 'Clustered Index', definition: 'InnoDB table IS the B+Tree ordered by primary key. Row data lives in leaf pages. Only one per table.' },
            { term: 'Covering Index', definition: 'Index that contains all columns needed by a query. Avoids going back to the clustered index (no "bookmark lookup").' },
            { term: 'Page Split', definition: 'When a leaf page is full and a new key must be inserted, the page splits in two. Causes fragmentation over time.' }
        ]
    },
    hash: {
        principles: [
            'Hash index maps key through a hash function directly to a bucket for O(1) average-case equality lookups',
            'Only supports equality predicates (=, IN); cannot be used for range queries, ORDER BY, or partial matches',
            'Hash collisions are resolved by chaining entries within the same bucket',
            'In MySQL, only the MEMORY engine supports explicit hash indexes; InnoDB uses adaptive hash index internally',
            'Adaptive Hash Index (AHI) in InnoDB is built automatically for hot pages — not manually controlled'
        ],
        concepts: [
            { term: 'Hash Function', definition: 'Maps an arbitrary key to a fixed-size bucket number. Good functions distribute keys uniformly across buckets.' },
            { term: 'Bucket', definition: 'A slot in the hash table. Contains one or more entries (via chaining) that share the same hash value.' },
            { term: 'Collision', definition: 'Two different keys hash to the same bucket. Resolved by chaining or open addressing.' },
            { term: 'Adaptive Hash', definition: 'InnoDB automatically builds an in-memory hash index for frequently accessed B-Tree leaf pages. Transparent to the user.' },
            { term: 'O(1) Lookup', definition: 'Constant-time access regardless of table size — the key advantage of hash indexes for point queries.' }
        ]
    },
    composite: {
        principles: [
            'Composite index INDEX(a, b, c) follows the leftmost prefix rule: usable for (a), (a,b), or (a,b,c) but NOT (b,c) alone',
            'Column order matters: place high-selectivity columns and equality predicates first for best filtering',
            'A range predicate on column N stops the index from being used for columns N+1, N+2, etc.',
            'Composite indexes can satisfy ORDER BY if the sort order matches the index column order',
            'The ESR rule (Equality, Sort, Range) guides optimal column ordering in composite indexes'
        ],
        concepts: [
            { term: 'Leftmost Prefix', definition: 'Index (a,b,c) can satisfy queries on (a), (a,b), (a,b,c), but not (b), (c), or (b,c). Must start from the left.' },
            { term: 'Selectivity', definition: 'Ratio of distinct values to total rows. High selectivity (many unique values) means better filtering power.' },
            { term: 'Index Skip Scan', definition: 'MySQL 8.0+ optimization: can use a composite index even when the leading column is skipped, if it has few distinct values.' },
            { term: 'ESR Rule', definition: 'Equality columns first, then Sort columns, then Range columns — the optimal order for composite index design.' },
            { term: 'Covering Index', definition: 'A composite index that includes all columns referenced by the query, eliminating the need for table lookups.' }
        ]
    },
    fulltext: {
        principles: [
            'Full-text index creates an inverted index: each word maps to a posting list of document IDs where it appears',
            'Text is tokenized by the parser, then filtered (stopwords removed, minimum word length applied)',
            'Supports three search modes: Natural Language (relevance ranking), Boolean (operators +, -, *), and Query Expansion',
            'InnoDB full-text uses an auxiliary table design with FTS_DOC_ID for document tracking',
            'Full-text search calculates relevance scores based on TF-IDF (Term Frequency - Inverse Document Frequency)'
        ],
        concepts: [
            { term: 'Inverted Index', definition: 'Maps each unique word to the list of documents containing it. The core data structure behind full-text search.' },
            { term: 'Posting List', definition: 'For each word, stores the list of document IDs (and positions) where that word occurs.' },
            { term: 'Stopwords', definition: 'Common words (the, is, at) excluded from indexing because they appear in too many documents to be useful.' },
            { term: 'TF-IDF', definition: 'Term Frequency * Inverse Document Frequency. Words that are common in a doc but rare overall get higher relevance.' },
            { term: 'Boolean Mode', definition: 'Allows operators: + (must include), - (must exclude), * (wildcard), "" (exact phrase) for precise search control.' }
        ]
    },
    explain: {
        principles: [
            'EXPLAIN shows the execution plan the optimizer chose — which indexes, join order, and access methods will be used',
            'The optimizer evaluates multiple plans and picks the one with lowest estimated cost (based on statistics)',
            'Key columns to check: type (access method), key (chosen index), rows (estimated rows to examine), Extra (additional info)',
            'Access types from best to worst: system > const > eq_ref > ref > range > index > ALL',
            'EXPLAIN ANALYZE (MySQL 8.0.18+) actually executes the query and shows real vs estimated row counts'
        ],
        concepts: [
            { term: 'Access Type', definition: 'How MySQL accesses the table: ALL (full scan), index (full index scan), range (index range), ref (index lookup), const (single row).' },
            { term: 'Cost Estimate', definition: 'Optimizer assigns a cost to each plan based on I/O and CPU. Lower cost = preferred plan. Based on table statistics.' },
            { term: 'Index Selection', definition: 'Optimizer picks the index that filters the most rows. May choose full scan if index selectivity is poor.' },
            { term: 'Using filesort', definition: 'Appears in Extra when MySQL must sort results outside the index. Often indicates a missing or mismatched index.' },
            { term: 'Using index', definition: 'Appears in Extra when the query is satisfied entirely from the index (covering index) — no table data access needed.' }
        ]
    }
};

/* ===== Shared Query Card Builder ===== */
DBIV.mysql._queryCard = function(query, presets) {
    return `
    <div class="query-card" id="query-card">
        <span class="port port-right" id="port-query"></span>
        <div class="query-card-header">
            <span class="query-card-icon">&#x1F50D;</span>
            <span class="query-card-name">Query</span>
        </div>
        <textarea class="query-input" id="query-input">${query}</textarea>
        <div class="preset-buttons">
            ${presets.map(p => `<button class="preset-btn" data-query="${p.replace(/"/g, '&quot;')}">${p.length > 30 ? p.slice(0, 30) + '...' : p}</button>`).join('')}
        </div>
        <button class="card-send-btn" id="btn-run-query">Run Query</button>
    </div>`;
};

DBIV.mysql._setupQueryCard = function(runFn) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('query-input').value = btn.dataset.query;
        };
    });
    document.getElementById('btn-run-query').onclick = runFn;
};

/* ---------- 1. B-Tree Index ---------- */
DBIV.mysql.btree = {
    init() {
        const data = DBIV.sampleData.users;
        const presets = [
            'SELECT * FROM users WHERE id = 5',
            'SELECT * FROM users WHERE id = 9',
            'SELECT * FROM users WHERE id = 3',
            'SELECT * FROM users WHERE id BETWEEN 4 AND 8',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mysql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'B+Tree (id)';

        const tree = DBIV.sampleData.btreeFromField(data, 'id');
        DBIV.renderBTree(document.getElementById('index-body'), tree);

        const pages = DBIV.sampleData.toPages(data, 4);
        DBIV.renderDataPages(document.getElementById('results-col'), pages);

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mysql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;

        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const match = query.match(/WHERE\s+id\s*=\s*(\d+)/i);
        const rangeMatch = query.match(/WHERE\s+id\s+BETWEEN\s+(\d+)\s+AND\s+(\d+)/i);
        const targetId = match ? parseInt(match[1]) : null;

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - full table scan`);
            const rows = document.querySelectorAll('.data-row');
            const matchIdx = targetId ? Array.from(rows).findIndex(r => r.querySelector('.data-row-id').textContent == targetId) : -1;
            const startTime = performance.now();
            await DBIV.animateFullScan(Array.from(rows), { matchIndex: matchIdx });
            const elapsed = Math.round(performance.now() - startTime);
            DBIV.addStats(3, rows.length, 0, elapsed);

            if (targetId !== null) {
                DBIV.log('RESULT', `Q${qid}: Found id=${targetId} after scanning ${rows.length} rows`);
            }

            if (DBIV.state.comparisonMode) {
                const indexPath = DBIV.findPathInTree(targetId || 1, document.querySelectorAll('.tree-node'));
                const indexTime = Math.round(elapsed / 50) || 2;
                DBIV.showComparison(
                    { pages: 1 + indexPath.length, rows: targetId ? 1 : 5, time: indexTime },
                    { pages: 3, rows: rows.length, time: elapsed }
                );
            }
        } else {
            const treeNodes = document.querySelectorAll('.tree-node');
            const path = DBIV.findPathInTree(targetId || 1, treeNodes);

            const startTime = performance.now();
            await DBIV.animateTreeTraversal(path);

            const portQuery = document.getElementById('port-query');
            const indexBody = document.getElementById('index-body');
            await DBIV.animateDot(portQuery, indexBody, { label: `Q${qid}`, duration: 350 });

            DBIV.log('LOOKUP', `Q${qid}: B+Tree traversal: ${path.length} nodes visited`);

            if (targetId !== null) {
                const rows = document.querySelectorAll('.data-row');
                rows.forEach(r => {
                    if (r.querySelector('.data-row-id').textContent == targetId) {
                        r.classList.add('matched');
                        setTimeout(() => r.classList.remove('matched'), 1500);
                    }
                });

                const resultCol = document.getElementById('results-col');
                await DBIV.animateDot(indexBody, resultCol, { label: `id=${targetId}`, duration: 300 });
                DBIV.log('FETCH', `Q${qid}: Data page read for id=${targetId}`);
                DBIV.log('RESULT', `Q${qid}: 1 row returned`);
            } else if (rangeMatch) {
                const low = parseInt(rangeMatch[1]);
                const high = parseInt(rangeMatch[2]);
                const rows = document.querySelectorAll('.data-row');
                let count = 0;
                rows.forEach(r => {
                    const rid = parseInt(r.querySelector('.data-row-id').textContent);
                    if (rid >= low && rid <= high) {
                        r.classList.add('matched');
                        setTimeout(() => r.classList.remove('matched'), 1500);
                        count++;
                    }
                });
                DBIV.log('FETCH', `Q${qid}: Leaf scan for range [${low}, ${high}]`);
                DBIV.log('RESULT', `Q${qid}: ${count} rows returned`);
            }

            const elapsed = Math.round(performance.now() - startTime);
            DBIV.addStats(1 + path.length, targetId ? 1 : 5, path.length, elapsed > 200 ? Math.round(elapsed / 50) : 2);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1 + path.length, rows: targetId ? 1 : 5, time: Math.round(elapsed / 50) || 2 },
                    { pages: 3, rows: 12, time: 45 }
                );
            }
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 2. Hash Index ---------- */
DBIV.mysql.hash = {
    buckets: [],

    init() {
        const data = DBIV.sampleData.users;
        const numBuckets = 4;
        this.buckets = Array.from({ length: numBuckets }, () => []);

        data.forEach(u => {
            const b = DBIV.hashKey(u.email) % numBuckets;
            this.buckets[b].push(u);
        });

        const presets = [
            'SELECT * FROM users WHERE email = "alice@mail.com"',
            'SELECT * FROM users WHERE email = "dave@mail.com"',
            'SELECT * FROM users WHERE email = "jack@mail.com"',
            'SELECT * FROM users WHERE email > "b"',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mysql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Hash Index (email)';

        let bodyHtml = '<div class="hash-container">';
        bodyHtml += '<div class="hash-function" id="hash-fn">hash(key) mod 4</div>';
        this.buckets.forEach((bucket, i) => {
            bodyHtml += `<div class="hash-bucket" id="hbucket-${i}">`;
            bodyHtml += `<span class="hash-bucket-id">B${i}</span>`;
            bodyHtml += '<div class="hash-bucket-items">';
            bucket.forEach(u => {
                bodyHtml += `<span class="hash-item" data-email="${u.email}">${u.email.split('@')[0]}</span>`;
            });
            bodyHtml += '</div></div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        const pages = DBIV.sampleData.toPages(data, 4);
        DBIV.renderDataPages(document.getElementById('results-col'), pages);

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mysql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const eqMatch = query.match(/email\s*=\s*"([^"]+)"/i);
        const rangeMatch = query.match(/email\s*>\s*"([^"]+)"/i);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        if (isMiss && eqMatch) {
            DBIV.log('MISS', `Q${qid}: Index not used - full table scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(3, rows.length, 0, 38);
            DBIV.log('RESULT', `Q${qid}: Full scan forced - ${rows.length} rows examined`);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 3, rows: rows.length, time: 38 },
                    { pages: 3, rows: rows.length, time: 38 }
                );
            }
        } else if (rangeMatch) {
            DBIV.log('MISS', `Q${qid}: Hash index does NOT support range queries!`);
            DBIV.log('SCAN', `Q${qid}: Falling back to full table scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');

            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(3, rows.length, 0, 38);
            DBIV.log('RESULT', `Q${qid}: Range query requires full scan with hash index`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 3, rows: rows.length, time: 38 },
                    { pages: 3, rows: rows.length, time: 38 }
                );
            }
        } else if (eqMatch) {
            const email = eqMatch[1];
            const bucketIdx = DBIV.hashKey(email) % 4;

            const hashFn = document.getElementById('hash-fn');
            await DBIV.animateHash(email, document.getElementById('hbucket-' + bucketIdx), hashFn);

            DBIV.log('HASH', `Q${qid}: hash("${email}") = bucket ${bucketIdx}`);

            const items = document.querySelectorAll(`#hbucket-${bucketIdx} .hash-item`);
            let found = false;
            items.forEach(item => {
                if (item.dataset.email === email) {
                    item.classList.add('matched');
                    setTimeout(() => item.classList.remove('matched'), 1500);
                    found = true;
                }
            });

            if (found) {
                const portQuery = document.getElementById('port-query');
                const resultCol = document.getElementById('results-col');
                await DBIV.animateDot(portQuery, resultCol, { label: email.split('@')[0], duration: 350 });

                const user = DBIV.sampleData.users.find(u => u.email === email);
                if (user) {
                    const rows = document.querySelectorAll('.data-row');
                    rows.forEach(r => {
                        if (r.querySelector('.data-row-id').textContent == user.id) {
                            r.classList.add('matched');
                            setTimeout(() => r.classList.remove('matched'), 1500);
                        }
                    });
                }
                DBIV.addStats(1, 1, 1, 1);
                DBIV.log('RESULT', `Q${qid}: Found in bucket ${bucketIdx}, 1 row returned`);
            } else {
                DBIV.addStats(1, 0, 1, 1);
                DBIV.log('RESULT', `Q${qid}: Not found in bucket ${bucketIdx}`);
            }

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1, rows: 1, time: 1 },
                    { pages: 3, rows: 12, time: 38 }
                );
            }

            setTimeout(() => {
                document.querySelectorAll('.hash-bucket').forEach(b => b.classList.remove('targeted'));
            }, 1500);
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 3. Composite Index ---------- */
DBIV.mysql.composite = {
    init() {
        const presets = [
            'SELECT * FROM users WHERE city = "NYC"',
            'SELECT * FROM users WHERE city = "NYC" AND age = 28',
            'SELECT * FROM users WHERE city = "NYC" AND age = 28 AND name = "Alice"',
            'SELECT * FROM users WHERE age = 28',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mysql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Composite (city, age, name)';

        const data = [...DBIV.sampleData.users].sort((a, b) =>
            a.city.localeCompare(b.city) || a.age - b.age || a.name.localeCompare(b.name)
        );

        const tree = {
            levels: [
                [{ keys: ['NYC', 'SF'], pointers: true }],
                [
                    { keys: data.filter(u => u.city === 'LA').map(u => `${u.age}`) },
                    { keys: data.filter(u => u.city === 'NYC').map(u => `${u.age}`) },
                    { keys: data.filter(u => u.city === 'SF').map(u => `${u.age}`) },
                ]
            ]
        };
        DBIV.renderBTree(document.getElementById('index-body'), tree);

        const pages = DBIV.sampleData.toPages(data, 4);
        DBIV.renderDataPages(document.getElementById('results-col'), pages);

        document.getElementById('extra-panels').innerHTML = `
        <div style="padding:8px 12px;background:var(--dbiv-card-bg);border:1px solid var(--dbiv-border);border-radius:6px;font-size:12px;color:var(--dbiv-text-light);">
            <strong style="color:var(--dbiv-text)">Leftmost Prefix Rule:</strong>
            INDEX(city, age, name) supports: <span style="color:#6fcf97">(city)</span>, <span style="color:#6fcf97">(city, age)</span>, <span style="color:#6fcf97">(city, age, name)</span>.
            <span style="color:#f38ba8">NOT (age)</span>, <span style="color:#f38ba8">NOT (age, name)</span>, <span style="color:#f38ba8">NOT (name)</span>.
        </div>`;

        DBIV.mysql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const cityMatch = query.match(/city\s*=\s*"([^"]+)"/i);
        const ageMatch = query.match(/age\s*=\s*(\d+)/i);
        const nameMatch = query.match(/name\s*=\s*"([^"]+)"/i);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const prefixCols = [];
        if (cityMatch) prefixCols.push('city');
        if (cityMatch && ageMatch) prefixCols.push('age');
        if (cityMatch && ageMatch && nameMatch) prefixCols.push('name');

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - full table scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(3, rows.length, 0, 35);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 3, rows: rows.length, time: 35 },
                    { pages: 3, rows: rows.length, time: 35 }
                );
            }
        } else if (!cityMatch && (ageMatch || nameMatch)) {
            DBIV.log('MISS', `Q${qid}: Cannot use composite index - leftmost prefix "city" not in query`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');

            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(3, rows.length, 0, 35);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 3, rows: rows.length, time: 35 },
                    { pages: 3, rows: rows.length, time: 35 }
                );
            }

            const treeKeys = document.querySelectorAll('.tree-key');
            treeKeys.forEach(k => {
                k.style.background = '#3d1a1a';
                k.style.color = '#f38ba8';
                setTimeout(() => { k.style.background = ''; k.style.color = ''; }, 1500);
            });
        } else {
            DBIV.log('INDEX', `Q${qid}: Using ${prefixCols.length} column(s) of composite index: (${prefixCols.join(', ')})`);

            const treeNodes = document.querySelectorAll('.tree-node');
            const path = [treeNodes[0]];

            if (cityMatch) {
                const rootKeys = treeNodes[0].querySelectorAll('.tree-key');
                rootKeys.forEach(k => {
                    if (k.dataset.key === cityMatch[1]) {
                        k.classList.add('active');
                        setTimeout(() => k.classList.remove('active'), 1200);
                    } else {
                        k.classList.add('compared');
                        setTimeout(() => k.classList.remove('compared'), 1200);
                    }
                });

                const cityChildMap = { 'LA': 0, 'NYC': 1, 'SF': 2 };
                const cityIdx = cityChildMap[cityMatch[1]];
                if (cityIdx !== undefined && treeNodes[cityIdx + 1]) {
                    path.push(treeNodes[cityIdx + 1]);
                }
            }

            await DBIV.animateTreeTraversal(path);

            const data = DBIV.sampleData.users;
            let results = data;
            if (cityMatch) results = results.filter(u => u.city === cityMatch[1]);
            if (ageMatch) results = results.filter(u => u.age === parseInt(ageMatch[1]));
            if (nameMatch) results = results.filter(u => u.name === nameMatch[1]);

            const rows = document.querySelectorAll('.data-row');
            rows.forEach(r => {
                const rid = parseInt(r.querySelector('.data-row-id').textContent);
                if (results.find(u => u.id === rid)) {
                    r.classList.add('matched');
                    setTimeout(() => r.classList.remove('matched'), 1500);
                }
            });

            DBIV.addStats(1 + path.length, results.length, path.length, 2);
            DBIV.log('RESULT', `Q${qid}: ${results.length} row(s) returned using index`);

            if (DBIV.state.comparisonMode) {
                const rows = document.querySelectorAll('.data-row');
                DBIV.showComparison(
                    { pages: 1 + path.length, rows: results.length, time: 2 },
                    { pages: 3, rows: rows.length, time: 35 }
                );
            }
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 4. Full-Text Index ---------- */
DBIV.mysql.fulltext = {
    documents: [
        { id: 1, text: 'MySQL database performance tuning guide' },
        { id: 2, text: 'PostgreSQL advanced indexing strategies' },
        { id: 3, text: 'Database replication and high availability' },
        { id: 4, text: 'MySQL query optimization techniques' },
        { id: 5, text: 'Full-text search in MySQL databases' },
        { id: 6, text: 'Performance monitoring for database systems' },
        { id: 7, text: 'Advanced MySQL configuration and tuning' },
        { id: 8, text: 'Database backup and recovery strategies' },
    ],
    invertedIndex: {},

    init() {
        this.invertedIndex = {};
        const stopWords = ['and', 'the', 'for', 'in', 'a', 'an', 'of', 'to'];

        this.documents.forEach(doc => {
            const tokens = doc.text.toLowerCase().split(/\s+/).filter(t => !stopWords.includes(t) && t.length > 2);
            tokens.forEach(token => {
                if (!this.invertedIndex[token]) this.invertedIndex[token] = [];
                if (!this.invertedIndex[token].includes(doc.id)) {
                    this.invertedIndex[token].push(doc.id);
                }
            });
        });

        const presets = [
            'SELECT * FROM docs WHERE MATCH(text) AGAINST("mysql")',
            'SELECT * FROM docs WHERE MATCH(text) AGAINST("database performance")',
            'SELECT * FROM docs WHERE MATCH(text) AGAINST("tuning")',
            'SELECT * FROM docs WHERE MATCH(text) AGAINST("strategies")',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mysql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Full-Text (inverted)';

        let bodyHtml = '<div class="gin-container">';
        const sortedTokens = Object.keys(this.invertedIndex).sort().slice(0, 12);
        sortedTokens.forEach(token => {
            const docIds = this.invertedIndex[token];
            bodyHtml += `<div class="gin-entry" id="ft-${token}" data-token="${token}">`;
            bodyHtml += `<span class="gin-token">${token}</span>`;
            bodyHtml += '<div class="gin-posting-list">';
            docIds.forEach(id => {
                bodyHtml += `<span class="gin-doc-ref" data-docid="${id}">doc${id}</span>`;
            });
            bodyHtml += '</div></div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        let resultsHtml = '<div class="data-page"><div class="data-page-header">Documents</div>';
        this.documents.forEach(doc => {
            resultsHtml += `<div class="data-row" id="ftdoc-${doc.id}">`;
            resultsHtml += `<span class="data-row-id">${doc.id}</span>`;
            resultsHtml += `<span class="data-row-value">${doc.text}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mysql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const match = query.match(/AGAINST\s*\("([^"]+)"\)/i);
        if (!match) {
            DBIV.log('MISS', `Q${qid}: Invalid MATCH...AGAINST syntax`);
            return;
        }

        const searchTerms = match[1].toLowerCase().split(/\s+/);
        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - sequential document scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const allRows = [];
            this.documents.forEach(doc => {
                const row = document.getElementById('ftdoc-' + doc.id);
                if (row) allRows.push(row);
            });
            await DBIV.animateFullScan(allRows);
            const matched = this.documents.filter(doc =>
                searchTerms.some(term => doc.text.toLowerCase().includes(term))
            );
            matched.forEach(doc => {
                const row = document.getElementById('ftdoc-' + doc.id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });
            DBIV.addStats(1, this.documents.length, 0, this.documents.length * 3);
            DBIV.log('RESULT', `Q${qid}: ${matched.length} doc(s) found via sequential scan`);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1, rows: this.documents.length, time: this.documents.length * 3 },
                    { pages: 1, rows: this.documents.length, time: this.documents.length * 3 }
                );
            }
            statusEl.textContent = 'ready';
            statusEl.className = 'index-status ready';
            return;
        }

        const matchedDocIds = new Set();
        for (const term of searchTerms) {
            const entry = document.getElementById('ft-' + term);
            if (entry) {
                entry.classList.add('matched');
                DBIV.log('LOOKUP', `Q${qid}: Token "${term}" \u2192 posting list: [${this.invertedIndex[term].join(', ')}]`);

                const refs = entry.querySelectorAll('.gin-doc-ref');
                refs.forEach(ref => {
                    ref.classList.add('matched');
                    matchedDocIds.add(parseInt(ref.dataset.docid));
                });

                await DBIV.sleep(400);
            } else {
                DBIV.log('LOOKUP', `Q${qid}: Token "${term}" not found in index`);
            }
        }

        matchedDocIds.forEach(id => {
            const row = document.getElementById('ftdoc-' + id);
            if (row) {
                row.classList.add('matched');
                setTimeout(() => row.classList.remove('matched'), 2000);
            }
        });

        DBIV.addStats(searchTerms.length, matchedDocIds.size, searchTerms.length, 3);
        DBIV.log('RESULT', `Q${qid}: ${matchedDocIds.size} document(s) matched`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: searchTerms.length, rows: matchedDocIds.size, time: 3 },
                { pages: 1, rows: this.documents.length, time: this.documents.length * 3 }
            );
        }

        setTimeout(() => {
            document.querySelectorAll('.gin-entry').forEach(e => e.classList.remove('matched'));
            document.querySelectorAll('.gin-doc-ref').forEach(e => e.classList.remove('matched'));
        }, 2000);

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 5. EXPLAIN Plan ---------- */
DBIV.mysql.explain = {
    init() {
        const presets = [
            'SELECT * FROM users WHERE id = 5',
            'SELECT * FROM users WHERE email = "alice@mail.com"',
            'SELECT * FROM users WHERE city = "NYC" AND age > 25',
            'SELECT * FROM users WHERE name LIKE "%ali%"',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mysql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'EXPLAIN Analyzer';

        document.getElementById('index-body').innerHTML = `
        <div class="explain-flow" id="explain-flow">
            <div class="explain-step" id="exp-parse">
                <span class="explain-step-icon">&#x1F4DD;</span>
                <div class="explain-step-content">
                    <div class="explain-step-title">Parser</div>
                    <div class="explain-step-detail" id="exp-parse-detail">Waiting for query...</div>
                </div>
            </div>
            <div class="explain-arrow">\u25BC</div>
            <div class="explain-step" id="exp-optimize">
                <span class="explain-step-icon">&#x2699;</span>
                <div class="explain-step-content">
                    <div class="explain-step-title">Optimizer</div>
                    <div class="explain-step-detail" id="exp-optimize-detail">Cost-based analysis</div>
                </div>
            </div>
            <div class="explain-arrow">\u25BC</div>
            <div class="explain-step" id="exp-index">
                <span class="explain-step-icon">&#x1F50D;</span>
                <div class="explain-step-content">
                    <div class="explain-step-title">Index Selection</div>
                    <div class="explain-step-detail" id="exp-index-detail">Choose access method</div>
                </div>
            </div>
            <div class="explain-arrow">\u25BC</div>
            <div class="explain-step" id="exp-exec">
                <span class="explain-step-icon">&#x1F3C3;</span>
                <div class="explain-step-content">
                    <div class="explain-step-title">Execution</div>
                    <div class="explain-step-detail" id="exp-exec-detail">Execute plan</div>
                </div>
            </div>
        </div>`;

        let resultsHtml = `
        <div class="result-card" id="explain-result">
            <div class="result-card-header">EXPLAIN Output</div>
            <div id="explain-output" style="font-size:10px;font-family:monospace;color:var(--dbiv-text-light);">
                Run a query to see the EXPLAIN plan.
            </div>
        </div>`;
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mysql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('EXPLAIN', `Q${qid}: ${query}`);

        const steps = ['exp-parse', 'exp-optimize', 'exp-index', 'exp-exec'];
        steps.forEach(id => {
            document.getElementById(id).classList.remove('active', 'completed');
        });

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        // Step 1: Parse
        document.getElementById('exp-parse').classList.add('active');
        document.getElementById('exp-parse-detail').textContent = `Parsing: ${query.slice(0, 40)}...`;
        DBIV.log('EXPLAIN', `Q${qid}: Parsing SQL statement`);
        await DBIV.sleep(500);
        document.getElementById('exp-parse').classList.remove('active');
        document.getElementById('exp-parse').classList.add('completed');

        // Step 2: Optimize
        document.getElementById('exp-optimize').classList.add('active');
        const hasIdWhere = /WHERE\s+id\s*=/i.test(query);
        const hasEmailWhere = /WHERE\s+email\s*=/i.test(query);
        const hasLike = /LIKE\s+"%/i.test(query);
        const hasCityAge = /city.*AND.*age/i.test(query);

        let accessType, possibleKeys, key, rows, extra;
        if (hasIdWhere) {
            accessType = 'const'; possibleKeys = 'PRIMARY'; key = 'PRIMARY'; rows = 1; extra = 'Using index';
        } else if (hasEmailWhere) {
            accessType = 'ref'; possibleKeys = 'idx_email'; key = 'idx_email'; rows = 1; extra = 'Using index condition';
        } else if (hasCityAge) {
            accessType = 'range'; possibleKeys = 'idx_city_age'; key = 'idx_city_age'; rows = 4; extra = 'Using index condition; Using where';
        } else if (hasLike) {
            accessType = 'ALL'; possibleKeys = 'NULL'; key = 'NULL'; rows = 12; extra = 'Using where (leading wildcard)';
        } else {
            accessType = 'ALL'; possibleKeys = 'NULL'; key = 'NULL'; rows = 12; extra = 'Using where';
        }

        const cost = accessType === 'const' ? 1.0 : accessType === 'ref' ? 2.3 : accessType === 'range' ? 8.5 : 24.0;
        document.getElementById('exp-optimize-detail').textContent = `Cost estimate: ${cost} | type: ${accessType}`;
        DBIV.log('EXPLAIN', `Q${qid}: Optimizer cost=${cost}, type=${accessType}`);
        await DBIV.sleep(600);
        document.getElementById('exp-optimize').classList.remove('active');
        document.getElementById('exp-optimize').classList.add('completed');

        // Step 3: Index Selection
        document.getElementById('exp-index').classList.add('active');
        document.getElementById('exp-index-detail').textContent = `key: ${key} | possible: ${possibleKeys}`;
        DBIV.log('EXPLAIN', `Q${qid}: Selected key=${key}, possible_keys=${possibleKeys}`);
        await DBIV.sleep(500);
        document.getElementById('exp-index').classList.remove('active');
        document.getElementById('exp-index').classList.add('completed');

        // Step 4: Execution
        document.getElementById('exp-exec').classList.add('active');
        document.getElementById('exp-exec-detail').textContent = `rows=${rows}, extra="${extra}"`;
        DBIV.log('EXPLAIN', `Q${qid}: Execution rows=${rows}, ${extra}`);
        await DBIV.sleep(400);
        document.getElementById('exp-exec').classList.remove('active');
        document.getElementById('exp-exec').classList.add('completed');

        // Show EXPLAIN output
        document.getElementById('explain-output').innerHTML = `
<div style="margin-bottom:4px;color:var(--dbiv-text);font-weight:700;">EXPLAIN ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}</div>
<table style="width:100%;border-collapse:collapse;font-size:10px;">
<tr style="color:var(--dbiv-accent);border-bottom:1px solid var(--dbiv-border);">
    <td>type</td><td>possible_keys</td><td>key</td><td>rows</td><td>Extra</td>
</tr>
<tr>
    <td style="color:${accessType === 'ALL' ? '#f38ba8' : '#6fcf97'}">${accessType}</td>
    <td>${possibleKeys}</td>
    <td style="color:${key === 'NULL' ? '#f38ba8' : '#6fcf97'}">${key}</td>
    <td>${rows}</td>
    <td>${extra}</td>
</tr>
</table>`;

        DBIV.addStats(accessType === 'ALL' ? 3 : 1, rows, key !== 'NULL' ? 1 : 0, Math.round(cost));
        DBIV.log('RESULT', `Q${qid}: EXPLAIN complete`);

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};
