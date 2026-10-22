# Dependency update handoff

Updated on 2026-10-22 after the npm worm and Node.js security news. Every version is at least 3 days old, so no package published during an active attack got in. Node is now 24.22.1.

## Major updates
- `typescript` 6 -> 7
- `@babel/core` 7 -> 8, used through `@rolldown/plugin-babel`
- `@types/node` 24 -> 26
- `oxfmt` 0.46 -> 0.74

## Removed
- `tsc`. This npm package is a placeholder, not TypeScript. Its `tsc` command printed a warning and hid the real compiler, so `bun run build` always failed. Now the build passes.

I also regenerated `bun.lock`.

## Problems from before the update
- `bun run lint` calls `eslint`, but eslint is not installed. Install it, or change the script to `oxlint`.
- `tests/resolve.test.ts`, "converts earned turn points into extra turns", expects `1` and gets `5`. It failed the same way before the update, so it is a game logic or test problem.

## Status
The build passes. The test fails as above. One audit item is left: `braces` 3.0.3, from the `shadcn` CLI, with no fix yet.
