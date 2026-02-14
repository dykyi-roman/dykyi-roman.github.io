# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Dykyi Roman (Software Engineer). Static site hosted on GitHub Pages at `https://dykyi-roman.github.io/`. Pure HTML5, CSS3, and vanilla JavaScript — no build system, no frameworks, no package manager.

## Development

No build commands. Use any local HTTP server (required for fetch-based header loading):

```bash
python -m http.server 8000
```

## Architecture

### Header System

All pages dynamically load `headers.html` via JavaScript fetch. Two patterns exist:

1. **Root pages** (`index.html`, `articles.html`, `books.html`, `principles.html`, `audit.html`, `travel.html`, `letter_to_daughter.html`) — inline `<script>` fetching `headers.html`
2. **Subdirectory pages** (`articles/*.html`, `book/*.html`, `audit/*.html`) — use `resources/load-header.js` which fetches `../headers.html`

When creating new pages, include `<div id="header-container"></div>` and the appropriate fetch script. All navigation links in `headers.html` use absolute URLs (`https://dykyi-roman.github.io/...`).

### Page Types and Styling

| Page Type | Location | Stylesheets |
|-----------|----------|-------------|
| Main pages | Root (`*.html`) | `resources/style.css` |
| Articles | `articles/*.html` | `style.css` + `navigation.css` + `article-style.css` |
| Book reviews | `book/*.html` | `style.css` + `navigation.css` + `vocabulary-section.css` |
| Travel | `travel.html` | `style.css` + `travel.css` |
| Principles | `principles.html` | `style.css` (+ FontAwesome CDN) |

### CSS Variables

Defined in `:root` of `resources/style.css`:
- Primary color: `--color-primary: #dc7603`, hover: `--color-primary-hover: #ff6600`
- Font: Arial, sans-serif
- Spacing: `--spacing-xs` (5px) through `--spacing-lg` (30px)

### Content Patterns

- **Articles** (15 total): Numbered sequentially (`1.html` through `15.html`). Images in `articles/img/` follow pattern `N.png` (main) and `N.1.png`, `N.2.png` (additional). Articles are in English with meta format: "X min read | Mon DD, YYYY"
- **Book reviews** (16 total): Named by book slug (e.g., `atlas_shrugged.html`). Use `book/template.html` as starting point. Template has 4 sections: Intro, Review, Vocabulary, Notes with side navigation. Book reviews often include custom inline `<style>` blocks for unique visual elements (comparison tables, level containers, quote boxes, etc.)
- **Audit case studies**: `audit/1.html`, `audit/2.html`
- **Principles**: Single page (`principles.html`) with 13 accordion categories, content in Russian. Main accordions open by default; sub-accordions (in Practice and Finance) collapsed
- **Travel**: Single page (`travel.html`) with 3D globe (globe.gl library), country stats, and Instagram/Facebook post links

### Content Language

- Articles: English
- Book reviews: English structure, Russian for intro/notes/quotes sections
- Principles and personal letters: Russian

### Key JavaScript Components

| File | Purpose |
|------|---------|
| `resources/load-header.js` | Header injection for subdirectory pages |
| `resources/navigation.js` | Side navigation with `scrollToSection()`, mobile toggle, collapsible topics |
| `resources/back-to-top.js` | Dynamic scroll-to-top button (appears after 300px scroll) |
| `resources/accordion.js` | Expand/collapse sections for principles page (main sections open by default) |
| `resources/globe.js` | 3D interactive globe for travel page |
| `resources/country-stats.js` | Country statistics (GDP, safety, tourism, etc.) |
| `resources/travel.js` | Travel data for 44+ visited countries |

## GitHub Actions

`.github/workflows/blog-post-workflow.yml` runs daily (cron `0 0 * * *`) to sync blog posts from Medium and Habr RSS feeds.

## Claude Code Integration

### Custom Commands

- `/author <type>` — content creation workflow for `article`, `book`, `principles`, or `letter` pages. Invokes specialized agents from `.claude/agents/`
- `/commit` — automated git add, commit with generated message, and push

### Agents (`.claude/agents/`)

Four specialized content-creation agents, each with detailed instructions for HTML structure, styling, and tone:

| Agent | Content Type | Language |
|-------|-------------|----------|
| `article-writer.md` | Technical articles | English |
| `book-reviewer.md` | Book reviews with philosophical analysis | English + Russian |
| `principles-builder.md` | Life principles (accordion format) | Russian |
| `letter-writer.md` | Personal letter sections | Russian |

### Skills (`.claude/skills/`)

HTML templates with placeholders for each content type: `article-template`, `book-review-template`, `principles-template`, `letter-template`. Each contains a `SKILL.md` with the scaffolding structure.