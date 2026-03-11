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
│   └── app.js           # Config registry, controls, bootstrap
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

## Development

```bash
python -m http.server 8000
# Navigate to http://localhost:8000/projects/gitflow-visualizer/
```

## URL Hash Navigation

Supports deep linking: `#classic/feature`, `#github/deploy`, `#trunk/flags`, etc.