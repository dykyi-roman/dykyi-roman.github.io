# Projects — Contributing Guide

How to contribute: add a new project, fix a bug, or improve an existing one.

## Bug Fixes & Changes to Existing Projects

### Getting Started

1. Fork the repository and clone locally
2. Start a local server from the repo root:
   ```bash
   python -m http.server 8000
   ```
3. Open the project you want to change: `http://localhost:8000/projects/{name}/`

### Where to Look

| What to change | Where |
|----------------|-------|
| Visualizer animation logic | `projects/{name}/js/{topic}.js` — `init()`, `run()`, `steps()` methods |
| Visualizer engine (shared rendering, arrows, step mode) | `projects/{name}/js/engine.js` |
| Tabs, controls, bootstrap | `projects/{name}/js/app.js` |
| Visual styles, colors, layout | `projects/{name}/css/style.css` |
| Translations | `projects/{name}/i18n/{lang}.json` |
| Project listing page | `pages/projects.html` |
| Shared site header | `headers.html` |
| Shared site styles | `resources/style.css` |
| Shared i18n library | `resources/i18n.js` |
| Shared UI translations | `resources/i18n/ui.{lang}.json` |

### Bug Fix Workflow

1. **Reproduce** — open the project locally, confirm the bug
2. **Locate** — find the relevant file (see table above)
3. **Fix** — make minimal changes, don't refactor unrelated code
4. **Test manually** — check that the fix works in the browser at all breakpoints (1200px, 900px, 768px, 600px, 480px)
5. **Check other modes** — for visualizers, verify all modes still work (e.g., HTTP, Console, Message)
6. **Check i18n** — if you changed text, update all language files (`en.json`, `ru.json`, `fr.json`, `de.json`, `es.json`). English (`en.json`) is authoritative — all keys must exist there

### Adding a New Mode to a Visualizer

Each visualizer topic file registers modes. To add a new mode:

1. Open `projects/{name}/js/{topic}.js`
2. Add a new mode object to the `modes[]` array:
   ```js
   { id: 'new-mode', label: 'New Mode', desc: 'Description' }
   ```
3. Create the mode implementation:
   ```js
   {NS}.{topic}['new-mode'] = {
       init() { /* render diagram */ },
       steps() { return [{ elementId, label, description, logType, layerId }]; },
       run() { /* animate flow */ },
       stepOptions() { return { requestLabel: '...' }; }
   };
   ```
4. Add `tradeoffs` to the `details` object:
   ```js
   {NS}.{topic}.details['new-mode'] = {
       principles: [...],
       concepts: [...],
       tradeoffs: { pros: [...], cons: [...], whenToUse: [...] }
   };
   ```
5. Add all translation keys to `i18n/en.json` and other language files

### Adding a New Topic to a Visualizer

For example, adding a new architecture to Architecture Visualizer:

1. Create `projects/{name}/js/{new-topic}.js`
2. Register the namespace: `{NS}.{newTopic} = { modes: [...], depRules: [...], details: {...} }`
3. Implement mode objects with `init()`, `steps()`, `run()`
4. Add theme colors in `engine.js` → `{NS}.setAccentColors()` themes map
5. Add `<script src="js/{new-topic}.js"></script>` to `index.html` **before** `app.js`
6. Register in `app.js` configs (e.g., `archConfigs` or `patternConfigs`)
7. Add a tab button in `index.html`
8. Add all i18n keys

### Improving Styles

- Use CSS variables from the project's own namespace (`--archv-*`, `--pv-*`, `--gfv-*`, etc.)
- Do not use the site's `--color-*` variables inside visualizer styles
- Test at responsive breakpoints: 900px and 600px
- Standalone experiments manage their own CSS — no restrictions on variable naming

### Common Pitfalls

- **Script order matters** — `engine.js` must load first, `app.js` must load last. Topic files go in between
- **i18n keys must match** — if `en.json` has a key, all other language files must have it too (can be English as fallback)
- **Don't break the namespace** — each topic file extends the global namespace object, never replaces it
- **Header fetch path** — projects at `projects/{name}/index.html` use `../../headers.html`
- **No `file://`** — always test via HTTP server, `fetch()` won't work otherwise

### Pull Request Guidelines

- One PR per logical change (bug fix, new mode, new topic)
- Descriptive title: `fix(pattern-visualizer): Builder animation skips step 3` or `feat(architecture-visualizer): add Pipe & Filter architecture`
- Include a screenshot or screen recording for visual changes
- Mention which modes/languages were tested

---

## Adding a New Project

### Two Project Types

### 1. Visualizer

Interactive educational tool following the shared namespace/engine architecture.

**Structure:**

```
projects/{name}-visualizer/
├── index.html          # Layout shell, loads site CSS + own CSS/JS
├── css/style.css       # Dark theme with own CSS variable prefix (--{ns}-*)
├── js/
│   ├── engine.js       # Global namespace ({NS}), state, renderers, animations
│   ├── {topic}.js      # Per-topic modules registering {NS}.{topic}
│   └── app.js          # Bootstrap: tab switching, controls, DOMContentLoaded
├── i18n/
│   ├── en.json         # English (required, authoritative)
│   ├── ru.json         # Russian
│   ├── de.json         # German
│   ├── es.json         # Spanish
│   └── fr.json         # French
├── img.svg             # Preview image for the project card
└── README.md
```

**Requirements:**

- Global namespace on `window` (e.g., `window.ARCHV`, `window.PV`, `window.GFV`)
- Each topic file registers `{NS}.{topic}` with `modes[]`, `depRules[]`, `details{}` and per-mode objects with `init()`, `steps()`, `run()` methods
- `app.js` loads last, reads all registered namespaces, wires UI
- Register `window.{NS}_refresh()` for i18n language switching
- Use `I18N.load(projectId, basePath)` in init
- CSS variables must use own prefix (`--{ns}-*`), not the site's `--color-*`
- No external dependencies (npm, CDN) — pure HTML5/CSS3/vanilla JS

**Existing examples:** `architecture-visualizer`, `pattern-visualizer`, `gitflow-visualizer`, `db-visualizer`, `message-broker-visualizer`, `algorithm-visualizer`

### 2. Standalone Experiment

Self-contained mini web app with its own styles and logic.

**Structure:**

```
projects/{name}/
├── index.html          # Entry point
├── style.css           # Self-contained styles (or css/ folder)
├── *.js                # App logic
├── {preview-image}     # PNG or SVG for project card
└── README.md
```

**No shared architecture required.** Can use any internal structure.

**Existing examples:** `crossword`, `uuid-to-picture`, `office-ai`

## Step-by-Step

### 1. Create the project folder

```
projects/{your-project}/
```

### 2. Build the project

Follow either the Visualizer or Standalone structure above.

### 3. Add a preview image

- SVG preferred (`img.svg`) — used as thumbnail on the projects listing page
- PNG is acceptable for standalone experiments

### 4. Add a header container

Every project page must include header injection:

```html
<div id="header-container"></div>
<script>
    fetch('../../headers.html')
        .then(r => r.text())
        .then(data => document.getElementById('header-container').innerHTML = data)
        .catch(err => console.error('Error loading header:', err));
</script>
```

### 5. Register in `pages/projects.html`

Add a card to the appropriate section:

**Visualizers** — inside the first `<ul class="articles-ring">`:

```html
<li>
    <a href="../projects/{your-project}">
        <div class="article-card">
            <img src="../projects/{your-project}/img.svg" alt="{Title}" class="article-thumb">
            <span class="article-title" data-i18n="projects.visualizers.{key}">{Title}</span>
        </div>
    </a>
</li>
```

**Experiments** — inside the second `<ul class="articles-ring">`:

```html
<li>
    <a href="../projects/{your-project}/index.html">
        <div class="article-card">
            <img src="../projects/{your-project}/{preview-image}" alt="{Title}" class="article-thumb">
            <span class="article-title" data-i18n="projects.experiments.{key}">{Title}</span>
        </div>
    </a>
</li>
```

### 6. Add i18n keys (if using i18n)

Add the project title translation key to `projects/portfolio/i18n/{lang}.json` files.

For visualizer projects, create `projects/{your-project}/i18n/en.json` (required) and additional language files.

### 7. Write a README

Document the project: what it does, features, architecture, how to run locally.

## Running Locally

```bash
# From the repository root
python -m http.server 8000

# Open http://localhost:8000/projects/{your-project}/
```

HTTP server is required — `fetch()` for headers and i18n won't work with `file://`.

## Checklists

### New Project

- [ ] Project folder created in `projects/`
- [ ] `index.html` with header container and fetch script
- [ ] Preview image (SVG or PNG)
- [ ] Card added to `pages/projects.html`
- [ ] i18n translation keys added (if applicable)
- [ ] README.md written
- [ ] Works locally via `python -m http.server`
- [ ] No external CDN dependencies (for visualizers)
- [ ] Responsive at 900px, 600px, 480px breakpoints

### Bug Fix / Change

- [ ] Bug reproduced locally before fixing
- [ ] Minimal change — no unrelated refactoring
- [ ] All visualizer modes still work (Run, Pause, Reset, Step Mode)
- [ ] All languages updated if text changed (`en.json` + `ru.json` + `fr.json` + `de.json` + `es.json`)
- [ ] Tested at responsive breakpoints (900px, 600px)
- [ ] No console errors in browser DevTools
