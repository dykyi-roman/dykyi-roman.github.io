# /author Command

Content creation workflow for Dykyi Roman's personal website.

## Usage

```
/author <type> -- <optional meta prompt>
```

**Parameters:**
- `<type>` (required): `article` | `book` | `principles` | `letter`
- `-- <meta prompt>` (optional): additional context, instructions, sections, topics, or any details to guide content generation

**Examples:**
```
/author article
/author book -- From Good to Great by Jim Collins. Focus on Hedgehog Concept and Confront the Brutal Facts
/author principles -- Job area, principle about continuous learning
/author letter -- Section: Travel, memories from Italy trip, lesson about curiosity
```

## Workflow

### Step 1: Parse Arguments

Extract `<type>` and optional `<meta prompt>` from the command arguments (`$ARGUMENTS`).

- If `<type>` is missing or invalid, show usage help and stop.
- If `-- <meta prompt>` is provided, use it as additional context for all subsequent steps (skip redundant questions that are already answered in the meta prompt).

### Step 2: Gather Information Based on Type

Use AskUserQuestion to collect any missing information not already provided in the meta prompt. **Skip questions that are clearly answered by the meta prompt.**

#### For `article`:
Collect (if not in meta prompt):
1. "What is the article topic?" (free text)
2. "What are the main sections/chapters?" (free text)
3. "What is the estimated reading time?" (options: "5 min", "10 min", "15 min", "20 min", "25 min", "30 min")
4. "What technologies/concepts should be covered?" (free text)

#### For `book`:
Collect (if not in meta prompt):
1. "What is the book title and author?" (free text)
2. "What are the main philosophical concepts?" (free text)
3. "What key characters should be analyzed?" (free text)
4. "What quotes should be included?" (free text)

#### For `principles`:
Collect (if not in meta prompt):
1. "What life area does this principle cover?" (options: "Practice", "Philosophy", "Friends", "Enemies", "Job", "Family", "Health", "Education", "Personality", "Ownership", "Church", "Pleasure", "Finance")
2. "What is the main principle statement?" (free text)
3. "What supporting points should be included?" (free text)

#### For `letter`:
Collect (if not in meta prompt):
1. "What section is this for?" (options: "Family", "Travel", "Birth", "Experience", "Personal", "Childhood", "Career", "Relationships", "Faith", "World", "Letters")
2. "What topic within the section?" (free text)
3. "What key memories/stories to include?" (free text)
4. "What life lessons should be conveyed?" (free text)

### Step 3: Invoke Appropriate Agent

Spawn the appropriate agent using the Task tool, passing all gathered information + meta prompt:

- **article**: Use `article-writer` agent
- **book**: Use `book-reviewer` agent
- **principles**: Use `principles-builder` agent
- **letter**: Use `letter-writer` agent

### Step 4: Generate HTML

The agent will generate HTML content following the appropriate template from skills.

### Step 5: Propose Save Location

After content is generated, propose the file path:

- **article**: `/Users/dykyi/projects/dykyi-roman.github.io/articles/{next_number}.html`
- **book**: `/Users/dykyi/projects/dykyi-roman.github.io/book/{book_name_slug}.html`
- **principles**: Append to `/Users/dykyi/projects/dykyi-roman.github.io/principles.html`
- **letter**: Append to `/Users/dykyi/projects/dykyi-roman.github.io/letter_to_daughter.html`

Ask the user to confirm before saving.

## Important Notes

- Articles and Book Reviews are written in **English**
- Principles and Letters are written in **Russian**
- Always use the exact HTML structure and CSS classes from the templates
- For articles, determine the next available number by checking existing files
- All content should match the style and tone of existing content on the website