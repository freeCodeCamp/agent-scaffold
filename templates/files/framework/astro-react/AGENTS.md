# {{name}}

## Rules

- Do not read or traverse `node_modules/`, `dist/`, or `.git/`.
- Prefer the simplest change that works. Follow the existing patterns.
- Follow `.claude/REPO_CONVENTIONS.md`.

## Commands

- Use the package manager that the lockfile names. Run the scripts in `package.json`.
- Run `docker compose up --watch` to start the project in a container.

## Skills

The skills for this project are in `.agents/skills/`. Load a skill before work in its area.

- UI and design work: load the `command-line-chic` skill.
- Astro work: load the `astro` skill.
- Accessibility: load the `web-accessibility` skill.
- New curriculum task types: load the `task-extender` skill.
