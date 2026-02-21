# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Dykyi Roman (Software Engineer). Static site hosted on GitHub Pages at `https://dykyi-roman.github.io/`. Pure HTML5, CSS3, and vanilla JavaScript — no build system, no frameworks, no package manager.

## Development

No build commands. Use any local HTTP server (required for fetch-based header loading):

```bash
python -m http.server 8000
```

Validate HTML syntax: `node --check` is not applicable; manually verify in browser.

## Architecture

### Header System

All pages dynamically load `headers.html` via JavaScript fetch. Two patterns exist:

1. **Root pages** (`index.html`, `articles.html`, `books.html`, `principles.html`, `audit.html`, `travel.html`, `letter_to_daughter.html`) — inline `<script>` fetching `headers.html`
2. **Subdirectory pages** (`articles/*.html`, `book/*.html`, `audit/*.html`) — use `resources/load-header.js` which fetches `../headers.html`

When creating new pages, include `<div id="header-container"></div>` and the appropriate fetch script. Navigation links in `headers.html` use full absolute URLs (`https://dykyi-roman.github.io/...`), while asset paths (images, favicon) use root-relative URLs (`/images/photo.jpg`).

### Page Types and Styling

| Page Type | Location | Stylesheets |
|-----------|----------|-------------|
| Main pages | Root (`*.html`) | `resources/style.css` |
| Articles | `articles/*.html` | `style.css` + `navigation.css` + `article-style.css` |
| Book reviews | `book/*.html` | `style.css` + `navigation.css` + optionally `vocabulary-section.css` |
| Travel | `travel.html` | `style.css` + `navigation.css` + `travel.css` (+ FontAwesome + globe.gl CDN) |
| Principles | `principles.html` | `style.css` (+ FontAwesome CDN) |
| Letter | `letter_to_daughter.html` | `style.css` + `navigation.css` |

### CSS Variables & Design Tokens

All colors, typography, spacing, and transitions are defined as CSS custom properties in `:root` of `resources/style.css`. **Always use variables instead of hardcoded values** (exceptions: inside `linear-gradient()`, `rgba()`, and `@media print`).

Key variable groups:
- **Colors**: `--color-primary` (#dc7603), `--color-primary-hover`, `--color-primary-visited`, `--color-text`, `--color-text-light`, `--color-background`, `--color-white`, `--color-success`, `--color-heading`
- **Font**: `--font-family` (system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
- **Spacing**: `--spacing-xs` (5px) through `--spacing-lg` (30px)
- **Transitions**: `--transition-fast` (0.2s), `--transition-normal` (0.3s)

### CSS Scoping Convention

Card-like list styles (background, box-shadow, hover transforms) on `index.html` are scoped to `.section > ul > li`, **not** global `ul li`. This prevents style leakage into `.content ul li`, `.subtopics li`, `.articles-ring li`, etc. When adding new list styles, scope them appropriately.

### Global CSS Behaviors

- `scroll-behavior: smooth` on `html, body` (with `prefers-reduced-motion: reduce` fallback)
- `line-height: 1.6` on `html, body`
- Print styles (`@media print`): hides `.back-to-top`, `.skip-link`, `.social-icons`, `.header-links`, `.plane-icon`, `.countries-container`, `.site-footer`

### Content Patterns

- **Articles**: Numbered sequentially (`1.html` through `N.html`). Images in `articles/img/` follow pattern `N.png` (main) and `N.1.png`, `N.2.png` (additional). Articles are in English with meta format: "X min read | Mon DD, YYYY"
- **Book reviews**: Named by book slug (e.g., `atlas_shrugged.html`). Use `book/template.html` as starting point. The template defines 4 sections with side navigation: Intro, Review, Vocabulary, Notes. However, individual reviews may omit sections (e.g., skip Vocabulary) or add custom inline `<style>` blocks for unique visual elements (comparison tables, level containers, quote boxes, concept headers, etc.). When a review omits the Vocabulary section, it also omits the `vocabulary-section.css` stylesheet.
- **Audit case studies**: `audit/1.html`, `audit/2.html`
- **Principles**: Single page (`principles.html`) with 13 accordion categories, content in Russian. Main accordions open by default; sub-accordions (in Practice and Finance) collapsed
- **Travel**: Single page (`travel.html`) with 3D globe (globe.gl), country data by continent, and multiple sections inside `travel-stats`: Detailed Statistics, Longest Stays, My Top 5 Countries, Travel Adventures (story cards), Journey Timeline (`<details open>`), Country Analytics (`<details>`). Uses glassmorphism design with gradient `#667eea → #764ba2`, gold accent `#FFD700` for titles. Countries sorted by `visitDate` ascending
- **Letter to daughter**: Single page (`letter_to_daughter.html`) with collapsible topic blocks (12 sections: Family, Travel, Birth, Experience, Personal, Childhood, Career, Relationships, Faith, World, Letters). Content in Russian. Uses `.topic-block` with `expanded`/`collapsed` classes, `.content` blocks collapsible via h5 elements. Special CSS classes: `.historical-note`, `.archive-document`, `.family-member`, `.reflection`

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
| `resources/travel.js` | Travel data (countriesData by continent, each with flag/name/visitDate/duration/rating/highlights/notes) |

### Responsive Breakpoints

- `1200px` — navigation collapses to mobile toggle
- `900px` — header layout stacks vertically
- `768px` — article text and layout adjustments
- `600px` — company logos shrink, job details compress, list layout adjustments
- `480px` — small screen adaptations
- `400px` — minimal layout tweaks

### Adding New Content

- **New article**: Create `articles/{next_number}.html`, add main image as `articles/img/{number}.png`, register in `articles.html` listing
- **New book review**: Copy `book/template.html` to `book/{slug}.html`, customize sections and inline styles as needed, register in `books.html` listing
- **New audit**: Create `audit/{next_number}.html`, register in `audit.html` listing

### SEO & Accessibility

All pages include: meta charset UTF-8, viewport, Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`), canonical link, author meta. Root pages include JSON-LD schema (e.g., Person on `index.html`). Accessibility: skip-to-content link (`.skip-link`), ARIA attributes on interactive elements, keyboard navigation (Enter/Space), `.visually-hidden` class for screen readers.

### CDN Dependencies

- **FontAwesome 6.5.1** — icons for principles and travel pages
- **globe.gl** (unpkg) — 3D globe visualization for travel page
- **simple-icons v11** (jsDelivr) — social media icons in header
- **Google Maps MarkerClusterer** (unpkg) — travel page map clustering

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