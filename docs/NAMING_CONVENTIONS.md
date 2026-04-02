# BirthHub360 Naming Conventions

This repository adheres to strict naming conventions to prevent structural regression.

## Python Modules and Directories
- Python package directories and modules **MUST** use `snake_case`. (e.g., `agents/pos_venda`, `account_manager`).
- Rationale: `kebab-case` directories violate standard Python imports and require brittle hacks (`importlib.util`). To ensure static analysis (mypy), test discovery (pytest), and IDE functionality work reliably, we enforce standard Python naming rules for backend directories.

## Frontend and TypeScript Packages
- Applications and libraries in TS/JS (`apps/`, `packages/`) **MUST** use `kebab-case` for folder names.
- File names (e.g., `service.ts`, `controller.ts`, `repository.ts`) must be consistently named using `camelCase` or `kebab-case` as configured.

## Git Branches
- Follow standard branch prefixes: `feat/`, `fix/`, `refactor/`, `chore/`.
