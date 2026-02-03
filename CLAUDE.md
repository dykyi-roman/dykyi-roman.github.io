# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Dykyi Roman (Software Engineer). Static site hosted on GitHub Pages — pure HTML5, CSS3, and vanilla JavaScript with no build system.

## Development

No build commands. Use any local HTTP server (required for fetch-based header loading):

```bash
python -m http.server 8000
```

## Architecture

### Header System
All pages dynamically load `headers.html` via JavaScript fetch. Two patterns exist:

1. **Root pages** (`index.html`, `articles.html`, etc.) — inline script fetching `headers.html`
2. **Subdirectory pages** (`articles/*.html`, `book/*.html`) — use `resources/load-header.js` which fetches `../headers.html`

When creating new pages, include `<div id="header-container"></div>` and the appropriate fetch script.

### Page Types and Styling

| Page Type | Location | Stylesheets |
|-----------|----------|-------------|
| Main pages | Root (`*.html`) | `resources/style.css` |
| Articles | `articles/*.html` | `style.css` + `navigation.css` + `article-style.css` |
| Book reviews | `book/*.html` | `style.css` + `navigation.css` + `vocabulary-section.css` |

### Content Patterns

- **Articles**: Numbered sequentially (`1.html`, `2.html`...) with images in `articles/img/` matching the article number
- **Book reviews**: Named by book title (e.g., `atlas_shrugged.html`). Use `book/template.html` as starting point for new reviews
- **Audit case studies**: `audit/*.html`

### Key JavaScript Components

- `resources/load-header.js` — header injection for subdirectory pages
- `resources/navigation.js` — side navigation with `scrollToSection()` function
- `resources/back-to-top.js` — scroll-to-top button

## GitHub Actions

`blog-post-workflow.yml` runs daily to sync blog posts from Medium and Habr RSS feeds.