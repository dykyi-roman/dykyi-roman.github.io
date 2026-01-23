# Book Review Template Skill

This skill provides the HTML template structure for book reviews on the website.

## Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dykyi Roman - Software Engineer</title>
    <link rel="icon" href="../icon.ico" type="image/x-icon">
    <link rel="stylesheet" type="text/css" href="../resources/style.css">
    <style>
        .concept {
            background-color: white;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
        }

        .philosophy {
            background-color: #fdedec;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #e74c3c;
        }

        .philosophy-title {
            font-weight: bold;
            color: #c0392b;
            margin-bottom: 10px;
        }

        .character {
            background-color: #eaf2f8;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
        }

        .character-title {
            font-weight: bold;
            color: #2980b9;
            margin-bottom: 10px;
        }

        .quote {
            font-style: italic;
            color: #555;
            border-left: 4px solid #7f8c8d;
            padding: 15px;
            margin: 25px 0;
            background-color: #f8f9f9;
        }

        .comparison {
            margin: 25px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }

        .comparison-row {
            display: flex;
            border-bottom: 1px solid #ddd;
        }

        .comparison-row:last-child {
            border-bottom: none;
        }

        .comparison-header {
            font-weight: bold;
            background-color: #f2f2f2;
        }

        .comparison-cell {
            flex: 1;
            padding: 12px 15px;
        }

        .symbol {
            background-color: #f5eef8;
            padding: 20px;
            border-radius: 5px;
            margin: 25px 0;
            border-left: 4px solid #9b59b6;
        }

        .symbol-title {
            font-weight: bold;
            color: #8e44ad;
            margin-bottom: 10px;
        }

        .case-study {
            background-color: #e8f6f3;
            padding: 20px;
            border-radius: 5px;
            margin: 25px 0;
            border-left: 4px solid #1abc9c;
        }

        .case-title {
            font-weight: bold;
            color: #16a085;
            margin-bottom: 10px;
        }
    </style>
    <link rel="stylesheet" href="../resources/navigation.css">
</head>
<body>
<!-- Side Navigation -->
<div class="side-nav">
    <button class="nav-button" onclick="scrollToSection('book-section')">Intro</button>
    <button class="nav-button" onclick="scrollToSection('video-section')">Video</button>
    <button class="nav-button" onclick="scrollToSection('review-section')">Review</button>
    <button class="nav-button" onclick="scrollToSection('notes-section')">Notes</button>
</div>

<div class="container">
    <!-- Include header from external file -->
    <div id="header-container"></div>

    <!--  Book  -->
    <div id="book-section" class="section">
        <h3>{{BOOK_TITLE}}</h3>
        <p><strong>Author:</strong> {{AUTHOR_NAME}}</p>

        <div class="post-content">
            {{BOOK_DESCRIPTION_RU}}
        </div>
    </div>

    <hr class="custom-hr">

    <!--  Video  -->
    <div id="video-section" class="section">
        <h3>Video</h3>
        <div class="post-content">
            <div class="test-answer"><a href="{{VIDEO_URL}}">{{VIDEO_TITLE}}</a></div>
        </div>
    </div>

    <hr class="custom-hr">

    <!-- Review  -->
    <div id="review-section" class="section">
        <h3>Review</h3>
        {{REVIEW_CONCEPTS}}
    </div>

    <hr class="custom-hr">

    <!-- Notes   -->
    <div id="notes-section" class="section">
        <h3>Notes</h3>
        <ul>
            {{NOTES_RU}}
        </ul>
    </div>
</div>

<script src="../resources/load-header.js"></script>
</body>
<script src="../resources/back-to-top.js"></script>
<script src="../resources/navigation.js"></script>
</html>
```

## Placeholders

| Placeholder | Description | Language |
|-------------|-------------|----------|
| `{{BOOK_TITLE}}` | Book title | English |
| `{{AUTHOR_NAME}}` | Author's name | English |
| `{{BOOK_DESCRIPTION_RU}}` | Book description | Russian |
| `{{VIDEO_URL}}` | URL to related video | - |
| `{{VIDEO_TITLE}}` | Video title | Russian |
| `{{REVIEW_CONCEPTS}}` | Review content blocks | English |
| `{{NOTES_RU}}` | Quotes from the book | Russian |

## Review Concept Blocks

### Philosophy Block (Red - #e74c3c)
```html
<div class="concept">
    <h2>1. Философия объективизма</h2>

    <div class="philosophy">
        <div class="philosophy-title">Основные принципы:</div>
        <ul>
            <li><strong>Principle Name:</strong> Description</li>
        </ul>
    </div>
</div>
```

### Character Block (Blue - #3498db)
```html
<div class="character">
    <div class="character-title">Character Name as Symbol:</div>
    <p>Character analysis and significance...</p>
</div>
```

### Quote Block (Gray - #7f8c8d)
```html
<div class="quote">
    "Memorable quote from the book that encapsulates a key idea."
</div>
```

### Comparison Table
```html
<div class="comparison">
    <div class="comparison-row comparison-header">
        <div class="comparison-cell">Criterion</div>
        <div class="comparison-cell">Group A</div>
        <div class="comparison-cell">Group B</div>
    </div>
    <div class="comparison-row">
        <div class="comparison-cell">Aspect</div>
        <div class="comparison-cell">Value A</div>
        <div class="comparison-cell">Value B</div>
    </div>
</div>
```

### Symbol Block (Purple - #9b59b6)
```html
<div class="symbol">
    <div class="symbol-title">Symbol Name:</div>
    <p>Explanation of the symbol's meaning and significance...</p>
    <ul>
        <li><strong>Symbol 1:</strong> Meaning</li>
        <li><strong>Symbol 2:</strong> Meaning</li>
    </ul>
</div>
```

### Case Study Block (Teal - #1abc9c)
```html
<div class="case-study">
    <div class="case-title">Example: "Case Name"</div>
    <p>Description of the case and its significance...</p>
</div>
```

## Notes Format (Russian)

```html
<li><span>Quote text from the book in Russian.</span></li>
<li><span>Another quote with context if needed.</span></li>
```

## File Naming Convention

Book reviews are saved in `/book/` directory with slug-based naming:
- `atlas_shrugged.html`
- `crime_and_punishment.html`
- `the_fountainhead.html`

## Usage

1. Create filename from book title (lowercase, underscores)
2. Replace all placeholders with actual content
3. Save to `/book/{book_slug}.html`
4. Update `books.html` to include link to new review