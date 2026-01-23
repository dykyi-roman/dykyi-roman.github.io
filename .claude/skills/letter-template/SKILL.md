# Letter Template Skill

This skill provides the HTML template structure for "Letter to Daughter" sections.

## Section Template

```html
<div id="section-{{SECTION_ID}}" class="letter-section">
    <h3>{{SECTION_NUMBER}}. {{SECTION_TITLE}}</h3>

    {{TOPIC_BLOCKS}}
</div>
```

## Available Sections

| Section | ID | Number |
|---------|-----|--------|
| Семья и корни | family | I |
| Travel | travel | II |
| Birth | birth | III |
| Experience | experience | IV |
| Personal | personal | VI |
| Childhood | childhood | VII |
| Career | career | VIII |
| Relationships | relationships | IX |
| Faith | faith | X |
| World | world | XI |
| Letters | letters | XII |

## Topic Block Template

```html
<div class="topic-block expanded">
    <h4>{{TOPIC_TITLE}}</h4>
    <p class="hint">{{HINT_TEXT}}</p>
    <ul class="subtopics">
        <li>{{SUBTOPIC_1}}</li>
        <li>{{SUBTOPIC_2}}</li>
    </ul>
    <div class="content">
        {{CONTENT}}
    </div>
</div>
```

## Content Elements

### Main Heading with Date
```html
<h5>{{PERSON_NAME_OR_TOPIC}}</h5>
<p class="date-info"><em>{{DATE_OR_PERIOD}}</em></p>
```

### Subheadings
```html
<h6>{{SUBSECTION_TITLE}}</h6>
```

### Chapter Introduction (Italicized)
```html
<p class="chapter-intro"><em>Introduction text that sets the tone for the chapter...</em></p>
```

### Regular Paragraphs
```html
<p>Regular paragraph text with <strong>bold</strong> and <em>italic</em> formatting.</p>
```

### Lists
```html
<ul>
    <li>List item one</li>
    <li>List item with <strong>emphasis</strong></li>
</ul>
```

### Historical Note Block (Beige)
```html
<blockquote class="historical-note">
    <p><strong>Историческая справка о {{PLACE/EVENT}}</strong></p>
    <p>Historical context and background information...</p>
</blockquote>
```

### Archive Document Block (Gray)
```html
<blockquote class="archive-document">
    <p><strong>{{DOCUMENT_TITLE}}</strong><br>
    <em>{{DATE}}</em></p>
    <p>«Document text content...»</p>
    <ul>
        <li>Document point one</li>
        <li>Document point two</li>
    </ul>
</blockquote>
```

### Archive Findings List
```html
<ul class="archive-findings">
    <li><strong>{{YEAR}}</strong> — description of finding from records, mentioning <em>«quoted text»</em>.</li>
</ul>
```

### Family Member Block
```html
<p class="family-member"><strong>{{FULL_NAME}}</strong> <em>({{BIRTH_DATE}} — {{DEATH_DATE_OR_STATUS}})</em></p>
<p>Description of the person, their life, and connection to the family...</p>
```

### Personal Reflection (Conclusion)
```html
<p class="reflection"><em>Personal thoughts, lessons learned, or emotional conclusion...</em></p>
```

### Links (YouTube, External)
```html
<p>Text with <a target="_blank" href="{{URL}}">link text</a> embedded.</p>
```

## Content Structure Guidelines

### For Family History
1. **Introduction**: Set context and significance
2. **Historical Background**: Place, time period, circumstances
3. **Family Members**: Individual stories and relationships
4. **Documents/Evidence**: Archive findings, photographs references
5. **Reflection**: Personal meaning and lessons

### For Personal Stories
1. **Context**: When and where
2. **Description**: What happened
3. **People Involved**: Who was there
4. **Emotions**: How it felt
5. **Significance**: Why it matters

### For Life Lessons
1. **Experience**: What happened
2. **Challenge**: What was difficult
3. **Learning**: What was learned
4. **Application**: How it applies to life
5. **Message to Daughter**: What you want her to know

## Example Content (Russian)

```html
<div class="content">
    <h5>Прадедушка — Кропачев Анатолий</h5>
    <p class="date-info"><em>03 марта 1931 - ???</em></p>

    <p>Прадедушку я не застал в своей памяти. Как рассказывала бабушка, он умер ещё до моего рождения из-за алкоголя.</p>

    <p>К бабушке он относился плохо: часто выпивал и нередко поднимал на неё руку. Разводиться в те времена было не принято, поэтому они так и жили вместе.</p>

    <blockquote class="historical-note">
        <p><strong>О жизни в те времена</strong></p>
        <p>Historical context about the era and circumstances...</p>
    </blockquote>

    <p class="reflection"><em>Эта история напоминает мне о том, как важно разрывать циклы нездоровых паттернов и строить семью на любви и уважении.</em></p>
</div>
```

## Writing Tone (Russian)

- **Personal**: Write as father to daughter
- **Warm**: Use tender, caring language
- **Honest**: Include both good and difficult memories
- **Reflective**: Share what you've learned
- **Specific**: Include names, dates, places
- **Visual**: Describe scenes and moments

## Usage

1. Identify the appropriate section for new content
2. Write in Russian with personal, warm tone
3. Use appropriate CSS classes for formatting
4. Include specific details and dates
5. Add reflections and lessons
6. Append to existing section in `letter_to_daughter.html`