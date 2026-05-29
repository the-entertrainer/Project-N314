# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Project**: Project-N314  
**Current State**: Early-stage repository with minimal initial structure  
**Primary Branch**: `main`  
**Development Branch**: Feature branches (e.g., `claude/*`)

This is a greenfield project. Currently, it contains only a basic `index.html` file. As features are added, this document should be updated to reflect the evolving architecture and development practices.

## Git Workflow

- **Development branches**: Use feature branches named `claude/*` or similar descriptors
- **Commit discipline**: Write clear, descriptive commit messages explaining the "why" and "what"
- **Branch strategy**: Work on designated feature branches as specified in your task instructions
- **Push to specified branches**: Always push to the branch explicitly designated in your task context (e.g., `claude/claude-md-docs-6aJsj`)

## Common Commands

As the project develops, add commonly-used commands here. For now:

```bash
# View git status
git status

# View commit history
git log --oneline -10

# Switch branches
git checkout <branch-name>

# Create and switch to a feature branch
git checkout -b claude/<feature-name>

# Stage and commit changes
git add .
git commit -m "Descriptive message"

# Push to the development branch
git push -u origin <branch-name>
```

## Project Structure

The project structure will be documented here as the codebase grows. Currently:

- `index.html` - Minimal entry point

## Development Practices

### Code Organization
- As features are added, establish clear module/component organization
- Document new directories and their purpose in this file

### Testing & Linting
- As testing and linting tools are added, document the commands and configuration here
- Example format: `npm test`, `npm run lint`, or equivalent

### Build & Run
- Document build commands, dev server setup, and how to run the application
- Include any environment setup requirements (e.g., dependencies, configuration files)

## Architecture Notes

- **Status**: To be defined as development progresses
- Future sections should cover:
  - High-level system architecture
  - Key components and their interactions
  - Data flow patterns
  - External integrations (if any)

## Important Files & Configuration

- `.git/` - Version control metadata
- `.gitignore` - (To be created as needed)

## Key Conventions

- Use git feature branches for all development
- Keep commits atomic and well-documented
- Update this CLAUDE.md as the codebase evolves and new patterns emerge

## Next Steps for Contributors

1. Create feature branches for new work
2. Document commands and architecture as features are added
3. Update this file regularly to reflect the current state of development
