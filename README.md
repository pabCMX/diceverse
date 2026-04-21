# Diceverse

Local-first dice-based incremental roguelite prototype.

`v0.0.1a` is the first playable alpha slice:

- one persistent local save slot
- deterministic turn resolution
- buy / level / prestige / slot assignment loop
- early trick ladder and mod pool surfaced in the UI

## Run

Requirements:

- Bun

Commands:

```bash
bun install
bun run dev
```

Build:

```bash
bun run build
```

Tests:

```bash
bun test
```

## Current MVP Slice

The current build supports:

- base payouts every turn
- unlocked trick scoring and trick XP tracking
- die mult growth from the first mod pool
- between-turn buying, leveling, prestiging, and slot assignment
- auto-save to `localStorage`
- run reset and full save wipe

## Manual QA Notes

Smoke-pass results for `v0.0.1a`:

- dead turns still pay via base money and XP as intended
- first trick unlock pacing starts immediately after early XP gain
- no runaway turn-loop bug was observed in the current extra-turn threshold conversion
- the economy is still placeholder-tuned and should be treated as alpha pacing, not balance

## Known Limitations

- no authored balancing pass yet beyond basic cost and pacing sanity
- no dedicated test coverage for UI interactions yet
- no localStorage migration path beyond version reset fallback
- no final content polish, animation pass, or onboarding copy

## Project Structure

- `src/game/bootstrap.ts`: starting constants and progression helpers
- `src/game/resolve.ts`: deterministic turn engine
- `src/game/actions.ts`: between-turn economy and run mutations
- `src/game/storage.ts`: local persistence helpers
- `docs/mvp-design.md`: design brief
- `docs/v0.0.1a-roadmap.md`: milestone tracker
