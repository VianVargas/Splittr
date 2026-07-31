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

## Contract Deployment

The Soroban `Split` contract lives in `contracts/split/`. The frontend expects the deployed contract ID in `NEXT_PUBLIC_SPLIT_CONTRACT_ID` and the deployment ledger in `NEXT_PUBLIC_CONTRACT_START_LEDGER` inside `.env.local`. The deployment ledger is used by the `EventFeed` component to backfill historical contract events on first load.

### Prerequisites

- Rust toolchain with `cargo`
- `wasm32v1-none` target:
  `rustup target add wasm32v1-none`
- A funded Stellar Testnet account (the deployer), or let the script fund a new one via Friendbot

### Deploy

1. Set the deployer secret key in `.env.local` or as an environment variable:

   ```bash
   export DEPLOYER_SECRET_KEY="S..."
   ```

2. Build and deploy the contract:

   ```bash
   pnpm build:contract
   pnpm deploy:contract
   ```

   The script will compile the contract, upload the WASM, deploy an instance to Testnet, and write the resulting contract ID and deployment ledger to `.env.local`. If the deployer account is unfunded, it is automatically funded via Friendbot.

3. To overwrite an existing contract ID, pass `--force`:

   ```bash
   pnpm deploy:contract -- --force
   ```

4. Restart the Next.js dev server so the new `NEXT_PUBLIC_SPLIT_CONTRACT_ID` and `NEXT_PUBLIC_CONTRACT_START_LEDGER` are loaded.

Note: the deployer is a separate admin account. End users connect their own wallets (Freighter/Rabet) to call the deployed contract.
