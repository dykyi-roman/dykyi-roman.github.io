# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Dykyi Roman (Software Engineer). This is a static site hosted on GitHub Pages with no build system or package manager.

## Technology Stack

- Pure HTML5, CSS3, and vanilla JavaScript
- No frameworks, bundlers, or build tools
- Hosted as GitHub Pages static site

## Project Structure

```
/
├── index.html              # Main portfolio page
├── headers.html            # Shared header component (loaded via fetch)
├── articles.html           # Articles listing page
├── books.html              # Book reviews listing
├── principles.html         # Principles page
├── travel.html             # Travel map/info
├── audit.html              # Technical audit services
├── letter_to_daughter.html # Personal content
├── articles/               # Individual article HTML files (1.html - 15.html)
│   └── img/                # Article images
├── book/                   # Book review HTML files
├── audit/                  # Audit case studies
├── photos/                 # Personal photos
├── images/                 # Site images (logos, etc.)
└── resources/              # Shared CSS and JS
    ├── style.css           # Main stylesheet
    ├── article-style.css   # Article-specific styles
    ├── navigation.css      # Navigation styles
    ├── travel.css          # Travel page styles
    ├── travel.js           # Travel page functionality
    ├── navigation.js       # Navigation functionality
    ├── back-to-top.js      # Scroll-to-top button
    └── accordion.js        # Accordion UI component
```

## Development

No build commands required. Open HTML files directly in a browser or use any local HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js (if npx available)
npx serve
```

## Architecture Notes

- **Header inclusion**: All pages load `headers.html` dynamically via JavaScript fetch
- **Styling**: Main pages use `resources/style.css`, articles use `resources/article-style.css`
- **No templating**: Each HTML file is self-contained (except for the shared header)
- **Articles**: Numbered sequentially (1.html, 2.html, etc.) with corresponding images in `articles/img/`