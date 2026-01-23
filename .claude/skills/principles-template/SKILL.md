# Principles Template Skill

This skill provides the HTML template structure for life principles sections.

## Main Section Template

```html
<!-- {Section Title} -->
<hr class="custom-hr">
<div id="{{SECTION_ID}}-section" class="section">
    <div class="accordion-header">
        <h3><i class="fas fa-{{ICON}}"></i> {{SECTION_TITLE}}</h3>
        <i class="fas fa-chevron-down accordion-icon"></i>
    </div>
    <div class="accordion-content">
        {{CONTENT}}
    </div>
</div>
```

## Available Sections

| Section Title | Section ID | Icon |
|---------------|------------|------|
| Practice | practice | dumbbell |
| Philosophy | philosophy | brain |
| Friends | friends | user-friends |
| Enemies | enemies | user-slash |
| Job | job | briefcase |
| Family | family | home |
| Health | health | heartbeat |
| Education | education | graduation-cap |
| Personality | personality | user |
| Ownership | ownership | key |
| Church | church | church |
| Pleasure | pleasure | heart |
| Finance | finance | chart-line |

## Content Formats

### Simple List
```html
<ul>
    <li><span>Simple principle statement</span></li>
    <li><span>Another principle</span></li>
</ul>
```

### List with Bold Titles
```html
<ul>
    <li><span><strong>Principle Name</strong>: Description and explanation of the principle.</span></li>
    <li><span><strong>Another Principle</strong>: Its description here.</span></li>
</ul>
```

### List with Subheadings
```html
<ul>
    <h4>Category Name</h4>
    <li><span>Principle in this category</span></li>
    <li><span>Another principle</span></li>

    <h4>Another Category</h4>
    <li><span>Principle here</span></li>
</ul>
```

### List with Horizontal Rule Separator
```html
<ul>
    <li><span>Principle one</span></li>
    <li><span>Principle two</span></li>
    <hr>
    <li><span>Different topic principle</span></li>
</ul>
```

## Sub-accordion Template (for Practice, Finance)

```html
<div class="sub-accordion-header">
    <h3>{{SUBSECTION_TITLE}}</h3>
    <i class="fas fa-chevron-down sub-accordion-icon"></i>
</div>
<div class="sub-accordion-content">
    <p><strong>{{INTRO_STATEMENT}}</strong></p>
    <ul>
        <li><span><strong>{{PRACTICE_NAME}}</strong>: {{DESCRIPTION}}</span></li>
    </ul>
</div>
<hr class="custom-hr">
```

### Sub-accordion Sections in Practice

| Subsection | Description |
|------------|-------------|
| Strengthen Your Willpower | Willpower training exercises |
| Strengthen Your Discipline | Discipline building habits |
| Strengthen Your Mindfulness | Mindfulness practices |
| Integration of practices | Combining all practices |

### Sub-accordion Sections in Finance

| Subsection | Emoji | Description |
|------------|-------|-------------|
| Капитал | 💰 | Capital investment strategies |
| Бизнес/Предпринимательство | 🏢 | Business and entrepreneurship |
| Труд/Экспертиза | 🛠️ | Work and expertise |

## Principle Writing Guidelines (Russian)

### Strong Opening
- Start with action verb: "Не изменять...", "Развивать...", "Учиться..."
- Or state universal truth: "Все проходит, пройдет и это"

### Clear Structure
```
<strong>Concept Name</strong>: Explanation that is practical and actionable.
```

### Quotation Sources
When referencing authors:
```html
<li><span><strong>Важность времени</strong>: Хорошо организованное время — это верный признак хорошо организованного ума. Сэр Исаак Питмен</span></li>
```

## Example Principles (Russian)

```html
<ul>
    <li><span><strong>Знание и саморазвитие</strong>: Тот кто сегодня читает книги, завтра будет управлять теми кто их не читает. Прочитав 100 осознанно выбранных книг ты станешь другим человеком.</span></li>
    <li><span><strong>Мысли определяют реальность</strong>: Человек сначала думает, потом говорит, потом делает. Все это превращается в поступки, поступки определяют характер, а характер определяет жизнь.</span></li>
    <li><span>Кто хочет, тот ищет возможности, кто не хочет — ищет причины.</span></li>
    <li><span>Работай, работай, работай - нет результатов, но ты становишься лучше. Продолжай работать - и придет успех!</span></li>
</ul>
```

## Usage

1. Identify the appropriate section for new principles
2. Write principles in Russian following the established style
3. Use correct HTML structure with `<li><span>` wrapper
4. For new sections, include accordion header and content wrapper
5. Append to existing section or create new section in `principles.html`