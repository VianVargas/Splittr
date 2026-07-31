# Agent Instructions

Read this file, `docs/UI_SPEC.md` and `docs/FEATURES.md` before any planning or coding. The repository structure is scaffolded and the project is in active development.

## Primary Directives

- **Read `docs/UI_SPEC.md` and `docs/FEATURES.md` first.** Scope is strictly focused on a Web3 bill-splitting application (Splittr) built on Stellar. Ensure all user interface elements, wallet integrations, and transaction flows align with the UI/UX specifications.
- **Package manager is `pnpm`.** Do not use `npm`, `yarn`, or `bun`. Use `pnpm install` and `pnpm <script>`.
- **Verify before assuming structure.** The project layout (`src/app/`, `src/components/`) is present. If a file conflicts with these instructions, trust the executable source and update this file.

Run scripts directly via `pnpm dev`, `pnpm build`, or `pnpm lint`. Verify scripts in `package.json` before execution.

## Execution Workflow

1. Read this file and `docs/UI_SPEC.md`, `docs/FEATURES.md`.
2. State a brief plan before writing large code blocks.
3. Keep page files lean by delegating application logic to dedicated component boundaries in `src/components/`.
4. Verify by running `pnpm lint` and `pnpm build` to confirm static and interactive builds execute cleanly.

## Trust

If this file conflicts with the actual repo config, scripts, or lockfiles, trust the executable source and update this file.
