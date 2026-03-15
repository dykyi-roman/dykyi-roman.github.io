# GitFlow Visualizer

Interactive visualizer for 11 Git branching strategies with animated SVG git graphs, step-by-step animation, and educational content (principles, concepts, trade-offs).

## Branching Strategies

| Strategy | Accent | Modes |
|----------|--------|-------|
| Classic GitFlow | `#89b4fa` | Feature, Release, Hotfix |
| GitHub Flow | `#a6e3a1` | Feature+PR, Deploy, Quick Fix |
| GitLab Flow | `#fab387` | Feature, Staging, Production |
| Trunk-Based | `#cba6f7` | Direct, Short-lived, Feature Flags |
| OneFlow | `#f9e2af` | Release Rebase, Hotfix Cherry-pick, Feature Rebase |
| Environment | `#94e2d5` | Full Promotion, Hotfix, Rollback |
| Release | `#f38ba8` | Create, Patch, Parallel |
| Forking | `#89dceb` | Fork+PR, Sync, Maintainer Review |
| Ship/Show/Ask | `#eba0ac` | Ship, Show, Ask |
| Scaled GitFlow | `#74c7ec` | Team, Program, Release |
| Cherry-pick | `#f5c2e7` | Backport, Forward Port, Multi-version |

## Architecture

```
projects/gitflow-visualizer/
├── index.html           # Layout shell
├── img.svg              # Preview for projects.html card
├── css/
│   └── style.css        # --gfv-* variables, git graph styles
├── js/
│   ├── engine.js        # GFV namespace, SVG renderer, animation engine
│   ├── classic.js       # Classic GitFlow (Driessen)
│   ├── github.js        # GitHub Flow
│   ├── gitlab.js        # GitLab Flow
│   ├── trunk.js         # Trunk-Based Development
│   ├── oneflow.js       # OneFlow
│   ├── environment.js   # Environment Branching
│   ├── release.js       # Release Branching
│   ├── forking.js       # Forking Workflow
│   ├── ship-show-ask.js # Ship/Show/Ask
│   ├── scaled.js        # Scaled GitFlow / SAFe
│   ├── cherrypick.js    # Cherry-pick Flow
│   └── app.js           # Config registry, controls, bootstrap, GFV_refresh
└── i18n/
    ├── en.json          # English (authoritative — all keys required)
    ├── ru.json          # Russian
    ├── de.json          # German
    ├── es.json          # Spanish
    └── fr.json          # French
```

### Pattern

- **Namespace**: `GFV` on `window`
- **CSS prefix**: `--gfv-*`
- **Two-level tabs**: Level 1 = flow strategy, Level 2 = mode (scenario)
- **engine.js**: namespace, state, SVG git graph rendering, step animation, logging, pause/resume, step mode
- **Per-variant JS**: registers `GFV.{variant}` with `modes[]`, `branchRules[]`, `details{}`, per-mode `init()/steps()/run()`
- **app.js**: `flowConfigs` registry, `switchFlow()`, `switchMode()`, `setupControls()`, hash routing

### Git Graph Rendering

Everything is rendered in SVG:
- Branch lanes: horizontal colored lines at fixed Y positions
- Commits: circles on branch lines
- Merges: curved SVG paths connecting branches
- Tags: labeled rectangles
- PRs: dashed paths with badge
- Cherry-picks: dotted arrows
- Deploys: rocket emoji markers

## Controls

| Control | Description |
|---------|-------------|
| **Run** | Start the selected flow animation |
| **Pause / Resume** | Freeze or resume mid-animation |
| **Reset** | Clear state, log, and re-initialize current mode |
| **Step Mode** | Toggle step-by-step execution with Back / Next navigation. Can also be entered from a paused animation |
| **Speed** | Adjustable: Slow (100–300ms), Normal (300–700ms), Fast (700–1000ms), Ultra (>1000ms). Persisted in `localStorage` |

URL hash encodes the active flow and mode (e.g., `#classic/feature`, `#github/deploy`, `#trunk/flags`), enabling deep links and browser back/forward.

## Internationalization

Translations are loaded via `window.I18N` from two JSON tiers:

- `resources/i18n/ui.{lang}.json` — shared UI strings (buttons, labels, legend)
- `projects/gitflow-visualizer/i18n/{lang}.json` — flow names, mode descriptions, principles, concepts, trade-offs

Supported languages: **en, ru, fr, de, es**. Language is detected from `?lang=` URL param → `localStorage['i18n-lang']` → `navigator.language`.

All translatable strings in JS use `I18N.t(key, params, fallback)`. DOM elements use `data-i18n`, `data-i18n-title`, `data-i18n-placeholder` attributes. After a language switch, `window.GFV_refresh()` re-translates tabs and re-initializes the current flow/mode.

## Development

```bash
python -m http.server 8000
# Navigate to http://localhost:8000/projects/gitflow-visualizer/
```

## Author

**Dykyi Roman** — Software Engineer

- Website: [dykyi-roman.github.io](https://dykyi-roman.github.io/)
- GitHub: [dykyi-roman](https://github.com/dykyi-roman)
