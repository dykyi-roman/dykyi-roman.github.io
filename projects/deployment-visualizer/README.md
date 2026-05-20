# Deployment Visualizer

Interactive, animated visualizer of software **deployment strategies** — how new code
reaches production and what happens to the backing infrastructure during a release.

Live: <https://dykyi-roman.github.io/projects/deployment-visualizer/>

## What it shows

Six strategies, each with three scenarios (**Success**, **Migration failure**,
**Application failure**) — 18 animated flows in total:

| Strategy | Idea |
|----------|------|
| **Big Bang** | Stop everything, migrate, deploy, start. One downtime window. |
| **Rolling** | Replace instances batch by batch behind the load balancer. Zero downtime. |
| **Blue-Green** | Deploy and test a full second environment, then switch the router atomically. |
| **Canary** | Send a small slice of traffic to the new version first, then widen it. |
| **Feature Toggle** | Ship code dark behind an OFF flag; release by ramping the flag. |
| **Shadow** | Mirror real traffic to a non-serving copy of the new version. |

Every flow animates the **deploy pipeline**, **schema migrations** (the expand-contract
pattern), **app-instance** version transitions, **traffic routing**, and the live **I/O
state** of four backing services: PostgreSQL, Redis, Kafka, and Elasticsearch.

## Architecture

Follows the shared visualizer pattern used across this site.

```
deployment-visualizer/
  index.html            layout shell
  css/style.css         dark theme, --dv-* variables
  js/engine.js          DV namespace: state, board renderers, animateFlow, step mode, log
  js/big-bang.js        DV['big-bang']      — 3 scenario modes
  js/rolling.js         DV['rolling']
  js/blue-green.js      DV['blue-green']
  js/canary.js          DV['canary']
  js/feature-toggle.js  DV['feature-toggle']
  js/shadow.js          DV['shadow']
  js/app.js             strategy/mode switching, controls, bootstrap, DV_refresh
  i18n/{en,ru,de,es,fr}.json
  img.svg               preview thumbnail
```

- Global namespace **`DV`** on `window`; CSS variables prefixed **`--dv-*`**.
- `engine.js` loads first, then the six strategy files, then `app.js`.
- Each strategy registers `DV['{id}']` with `modes`, `properties`, and three per-mode
  objects (`success`, `migration-fail`, `app-fail`) each exposing `init()`, `steps()`,
  `stepOptions()`, `run()`.
- A **step** is a plain object describing board effects (`stage`, `instances`, `traffic`,
  `services`, `flag`, `outage`, `rollback`, …) plus a `descKey` and `logType`.
  `DV.animateFlow()` applies steps in sequence; step mode replays them for forward/back.
- Internationalization via the shared `window.I18N` library; `window.DV_refresh()` is
  registered for live language switching.

## Local development

No build step. Serve the repository root over HTTP and open the page:

```bash
python -m http.server 8000
# http://localhost:8000/projects/deployment-visualizer/
```
