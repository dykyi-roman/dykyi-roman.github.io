# /author Command

Interactive workflow for creating content on Dykyi Roman's personal website.

## Workflow

When the user invokes `/author`, follow these steps:

### Step 1: Ask Content Type

Use AskUserQuestion to ask what type of content to create:

```
Question: "What type of content would you like to create?"
Header: "Content type"
Options:
1. Technical Article (label: "Article", description: "Technical article in English for articles/ directory")
2. Book Review (label: "Book Review", description: "Book review with philosophy analysis for book/ directory")
3. Life Principles (label: "Principles", description: "Life principles section in Russian for principles.html")
4. Letter to Daughter (label: "Letter", description: "Personal letter section in Russian for letter_to_daughter.html")
```

### Step 2: Gather Information Based on Type

#### For Technical Article:
Ask the following questions:
1. "What is the article topic?" (free text)
2. "What are the main sections/chapters?" (free text)
3. "What is the estimated reading time?" (options: "5 min", "10 min", "15 min", "20 min", "25 min", "30 min")
4. "What technologies/concepts should be covered?" (free text)

#### For Book Review:
Ask the following questions:
1. "What is the book title and author?" (free text)
2. "What are the main philosophical concepts?" (free text)
3. "What key characters should be analyzed?" (free text)
4. "What quotes should be included?" (free text)

#### For Life Principles:
Ask the following questions:
1. "What life area does this principle cover?" (options: "Practice", "Philosophy", "Friends", "Enemies", "Job", "Family", "Health", "Education", "Personality", "Ownership", "Church", "Pleasure", "Finance")
2. "What is the main principle statement?" (free text)
3. "What supporting points should be included?" (free text)

#### For Letter to Daughter:
Ask the following questions:
1. "What section is this for?" (options: "Family", "Travel", "Birth", "Experience", "Personal", "Childhood", "Career", "Relationships", "Faith", "World", "Letters")
2. "What topic within the section?" (free text)
3. "What key memories/stories to include?" (free text)
4. "What life lessons should be conveyed?" (free text)

### Step 3: Invoke Appropriate Agent

Based on the content type selected, spawn the appropriate agent using the Task tool:

- **Article**: Use `article-writer` agent with gathered information
- **Book Review**: Use `book-reviewer` agent with gathered information
- **Principles**: Use `principles-builder` agent with gathered information
- **Letter**: Use `letter-writer` agent with gathered information

Pass all gathered information to the agent in a structured prompt.

### Step 4: Generate HTML

The agent will generate HTML content following the appropriate template from skills.

### Step 5: Propose Save Location

After content is generated, propose the file path:

- **Article**: `/Users/dykyi/projects/dykyi-roman.github.io/articles/{next_number}.html`
- **Book Review**: `/Users/dykyi/projects/dykyi-roman.github.io/book/{book_name_slug}.html`
- **Principles**: Append to `/Users/dykyi/projects/dykyi-roman.github.io/principles.html`
- **Letter**: Append to `/Users/dykyi/projects/dykyi-roman.github.io/letter_to_daughter.html`

Ask the user to confirm before saving.

## Important Notes

- Articles and Book Reviews are written in **English**
- Principles and Letters are written in **Russian**
- Always use the exact HTML structure and CSS classes from the templates
- For articles, determine the next available number by checking existing files
- All content should match the style and tone of existing content on the website