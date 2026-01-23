---
allowed-tools: Bash(git *), Read, Glob, Grep
---

# /commit-push Command

Commit all changes and push to remote repository in one command.

## Workflow

When the user invokes `/commit-push`, follow these steps:

### Step 1: Check Git Status

Run `git status` to see all changes (staged, unstaged, untracked files).

### Step 2: Show Changes Summary

Run `git diff --stat` to show a summary of what changed.

### Step 3: Stage All Changes

Run `git add -A` to stage all changes.

### Step 4: Generate Commit Message

Analyze the changes and generate a clear, concise commit message that:
- Summarizes the nature of changes (new feature, update, fix, etc.)
- Focuses on the "why" rather than the "what"
- Is written in English
- Is 1-2 sentences maximum

### Step 5: Create Commit

Create the commit with the generated message, ending with:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Step 6: Push to Remote

Run `git push` to push the commit to the remote repository.

### Step 7: Confirm Success

Show the user:
- The commit hash
- The commit message
- Confirmation that push was successful

## Important Notes

- Always use HEREDOC format for commit messages to ensure proper formatting
- Never force push
- If push fails, inform the user and suggest solutions