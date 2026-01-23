# Article Template Skill

This skill provides the HTML template structure for technical articles on the website.

## Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ARTICLE_TITLE}} - Dykyi Roman</title>
    <link rel="icon" href="../icon.ico" type="image/x-icon">
    <link rel="stylesheet" type="text/css" href="../resources/style.css">
    <link rel="stylesheet" href="../resources/navigation.css">
    <link rel="stylesheet" href="../resources/article-style.css">
</head>
<body>
<div class="container">
    <!-- Include header from external file -->
    <div id="header-container"></div>

    <!-- Article Content -->
    <div class="article-container">
        <div class="article-header">
            <h1 class="article-title">{{ARTICLE_TITLE}}</h1>
            <div class="article-meta">{{READING_TIME}} min read | {{DATE}}</div>
            <img src="img/{{ARTICLE_NUMBER}}.png" alt="{{ARTICLE_TITLE}}"
                 class="article-featured-img">
        </div>

        <div class="article-content">
            {{CONTENT}}
        </div>
    </div>
</div>

<script src="../resources/load-header.js"></script>
</body>
<script src="../resources/back-to-top.js"></script>
<script src="../resources/navigation.js"></script>
</html>
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{ARTICLE_TITLE}}` | Full article title | "The Era of AI: How AI Agents Are Changing IT Development" |
| `{{READING_TIME}}` | Estimated reading time in minutes | "25" |
| `{{DATE}}` | Publication date | "Dec 10, 2025" |
| `{{ARTICLE_NUMBER}}` | Article number (for image) | "14" |
| `{{CONTENT}}` | Main article content | See content structure below |

## Content Structure

### Introduction
```html
<h1>Introduction</h1>
<p>Opening paragraph that hooks the reader...</p>
<p>Second paragraph establishing context...</p>
```

### Main Sections
Use Roman numerals for main sections:
```html
<h1>[I] Section Title</h1>
<h2>Subsection Title</h2>
<p>Content...</p>
```

### Key Elements

#### Links
```html
<h3><a href="https://example.com" target="_blank">Tool Name</a></h3>
<p>Description of the tool...</p>
```

#### Lists
```html
<ul>
    <li>Item one</li>
    <li><strong>Bold item:</strong> with description</li>
    <li><code>Code item</code>: explanation</li>
</ul>
```

#### Code/Diagrams
```html
<pre>
┌─────────────┐     ┌─────────────┐
│   Box One   │────▶│   Box Two   │
└─────────────┘     └─────────────┘
</pre>
```

#### Blockquotes
```html
<blockquote>Important quote or example that stands out from the text.</blockquote>
```

### Conclusion
```html
<h1>Conclusion</h1>
<p>Summary of key points...</p>
<p>Forward-looking perspective...</p>
```

## File Naming Convention

Articles are saved in `/articles/` directory with sequential numbering:
- `1.html`, `2.html`, ..., `15.html`, etc.

Corresponding images go in `/articles/img/`:
- `1.png`, `2.png`, ..., `15.png`, etc.

## Usage

1. Determine the next available article number
2. Replace all placeholders with actual content
3. Save to `/articles/{number}.html`
4. Add corresponding image to `/articles/img/{number}.png`
5. Update `articles.html` to include link to new article