# Dice Throwing Incremental Roguelite MVP Design

## Summary

This game is a turn-based incremental dice builder with short finite runs, jackpot-style payout turns, and permanent meta progression.

The intended feel is:

- smooth and low-friction like a good incremental
- high-variance and exciting like a multi-line slot board
- strategic between turns, not stressful during turns
- capable of runaway turns and clutch survival when a build comes together

The MVP should prove the core loop first:

1. roll all dice
2. resolve base payouts and tricks
3. gain money, XP, and turn points
4. buy dice, level dice, and assign available slots
5. survive by generating enough turn points to extend the run

## Core Pillars

- Every turn should pay something, even on a bad roll.
- Tricks should feel like bonus overlays on top of base value, not replacements for base value.
- Builds should be defined by how the player distributes mod effects across dice.
- Permanent progression should matter immediately and also reshape future runs.
- The game should allow explosive turns instead of hard-capping fun for balance reasons.

## Run Structure

### Fresh Save Start

- Start with `1` die.
- That die starts as `P0 d3`.
- Start with `10` turns.
- Start with no slots filled.
- Start with no prestige-applied mods.
- Start with no unlocked tricks.
- Starting cash can remain `0` for the strict MVP baseline.
- A small onboarding grant like `$5` can be tested later as UX tuning.

### End Of Run

- A run ends automatically only after a full turn resolves and the player has no turns remaining.
- Turn resolution always completes before the end-of-run check.
- A final-turn jackpot can save the run if it generates enough turn points for extra turns.
- The player can manually reset at any time.

### What Resets

These are run-local and are lost on reset/end:

- money
- turn points
- owned dice
- die levels
- die prestige state
- empty slot capacity and chosen slot effects for the run
- die multipliers generated during the run

These are persistent:

- player XP and player level
- trick unlocks from player level
- trick XP and trick mastery
- achievement progress and achievement rewards

## Die Model

Each die has:

- a prestige tier `P0`, `P1`, `P2`, and so on
- a current face cap, starting at `d3`
- a level cap based on prestige tier
- a number of available mod slots
- zero or more chosen mod effects
- a current die multiplier

### Level And Prestige Ladder

Normal die growth follows one ladder:

`P0 d3 -> P0 d4 -> P0 d5 -> P0 d6 -> P1 d3 -> P1 d4 -> P1 d5 -> P1 d6 -> P1 d7 -> P2 d3 ...`

Rules:

- A normal level-up increases max face by `+1`.
- `P0` caps at `d6`, `P1` caps at `d7`, `P2` caps at `d8`, and so on.
- Prestige is just the capstone level-up at the current cap.
- Prestige resets that die back to `d3`, increases prestige by `+1`, raises the future cap by `+1`, and grants `+1` mod slot.

### Meta-Derived Starting Progress

Meta progression can grant starting die progress.

This applies immediately to all current and future dice:

- dice already in the run advance through the same ladder immediately
- if a die crosses a prestige boundary from a meta boost, it gains the new empty slot immediately
- newly bought dice also enter with the current meta-derived ladder progress

Important constraint:

- starting progress does not pre-fill slots
- it only creates empty slot capacity
- the player chooses whether to fill those slots

## Between-Turn Actions

After a turn fully resolves, the player may:

- buy a new die
- level a die
- prestige a die by buying the capstone level-up
- assign any empty slot on a die
- manually reset the run

These actions are only available between turns.

No spending or slot assignment happens during roll resolution.

## Turn Flow

Each turn:

1. spend one turn
2. roll all owned dice once
3. compute each die's current die multiplier
4. detect all scoreable tricks
5. award base payouts for every die
6. award trick payouts for every trick line
7. award extra money, extra XP, and extra turn points from die mods
8. apply player XP, trick XP, and achievement progress immediately
9. apply any newly earned meta unlocks immediately
10. convert turn points into as many extra turns as thresholds allow
11. open the between-turn phase
12. if the player has no turns left after resolution, the run ends

## Multiplier Model

### Die Mult

Each die has one combined `die mult` stat.

This is fed by:

- `Self Mult` on that die
- `All-Dice Mult` from all dice

For MVP, these are the only stacking-by-turn effects.

### Per-Turn Stacking Rules

`Self Mult` and `All-Dice Mult` stack additively into the die's persistent run multiplier.

Initial base values:

- `Self Mult`: `+25%` per rank per turn
- `All-Dice Mult`: `+1%` per rank per turn

Interpretation:

- a rank-1 self mult effect adds `+0.25` to that die over time
- a rank-1 all-dice mult effect adds `+0.01` per turn to all dice over time

These values reset when the run ends.

### Trick Multipliers

Tricks do not chain into one giant combined combo multiplier.

Instead:

- compute the die's current base value with die mult first
- then each trick pays its own separate line using that already-multiplied die value

Example:

- die face = `5`
- die mult = `x1.26`
- `3-Kind x2` line pays `5 * 1.26 * 2 = 12.6`
- `Streak x3` line pays `5 * 1.26 * 3 = 18.9`

Base payout still happens separately.

### What Multipliers Affect

Multipliers affect all outputs generated by the involved die:

- base money
- base XP
- trick money
- trick XP
- extra money
- extra XP
- extra turn points

## Base Payouts

Every die always pays a base line, even on a dead turn.

Base payout for one die:

- money = `face * die mult`
- XP = `face * die mult`

This is the run's guaranteed floor and the game's "base salary" feel.

## Trick System

In the MVP, `trick` and `combo` mean the same thing.

### Trick Families

- singles and matching values
- sets
- streaks

### Overlap Rule

Dice can contribute to multiple trick families in one roll.

Within a family, only the highest achieved tier scores once per turn.

Examples:

- `4-Kind` scores instead of both `Pair` and `3-Kind`
- `Streak 4` scores instead of both `Streak 3` and `Streak 4`
- a single roll can still score one matching-values trick and one streak trick

### Current MVP Trick Catalog

Ordered early unlock ladder:

1. `Ace`
2. `Pair`
3. `3-Kind`
4. `Streak 3`
5. `Two Pair`
6. `Full House`
7. `4-Kind`
8. `Streak 4`

Additional higher tiers can exist in the underlying scoring table even if they unlock later.

### Trick Definitions

- `Ace`: each die showing `1` scores one extra line at `x1`
- `Pair`: best pair result in the roll
- `3-Kind`: best three-of-a-kind result in the roll
- `4-Kind`: best four-of-a-kind result in the roll
- `5-Kind+`: best five-or-more-of-a-kind result in the roll
- `Two Pair`: any two distinct face values with at least two matches each
- `Full House`: one triple and one pair
- `Streak 3`: a run of three unique consecutive values
- `Streak 4`: a run of four unique consecutive values
- `Streak 5+`: a run of five or more unique consecutive values

### Streak Detection

- Streaks use unique rolled face values, sorted ascending.
- Duplicate values are ignored for streak detection.
- Example: `1,2,2,3` counts as `1,2,3` and scores `Streak 3`.

### Streak Payout Values

- Streak payout uses only the unique faces in the streak.
- Example: `1,2,2,3` pays from `1+2+3`, not `1+2+2+3`.

### Base Trick Multipliers

Initial placeholder values for MVP:

- `Ace`: `x1.0`
- `Pair`: `x1.25`
- `3-Kind`: `x2.0`
- `4-Kind`: `x3.5`
- `5-Kind+`: `x5.5`, then `+1.5` per extra matching die
- `Two Pair`: `x1.75`
- `Full House`: `x3.0`
- `Streak 3`: `x1.5`
- `Streak 4`: `x2.5`
- `Streak 5+`: `x4.0`, then `+1.0` per extra streak length

### Trick XP And Mastery

- A trick gains `+1 trick XP` each time it scores on a turn.
- Trick XP is usage-based only.
- Trick payout size does not affect trick XP.
- Every trick masters at `25` uses in the MVP.
- Mastery doubles that trick's base multiplier.

## Mod Slot System

Prestige grants slots.

Each new slot can:

- add a new effect to that die
- or level an existing effect already on that die

Slot choices are permanent for the run once assigned.

The player may leave a slot empty intentionally.

### MVP Mod Pool

All mod choices are always available when choosing a slot effect:

- `Self Mult`
- `All-Dice Mult`
- `Extra Money`
- `Extra XP`
- `Extra Turn Points`

### MVP Mod Base Values

Initial placeholder values:

- `Self Mult`: `+25%` per rank per turn
- `All-Dice Mult`: `+1%` per rank per turn
- `Extra Money`: `+5% of face` per rank
- `Extra XP`: `+5% of face` per rank
- `Extra Turn Points`: `+5% of face` per rank

For the three resource mods:

- they are flat per roll, not per-turn stacking
- they are still affected by die mult
- they are still affected by trick multipliers when the die is involved in that trick

Achievement progression can increase these base values later.

## Economy

### Money

Money is earned from:

- base die payouts
- trick payouts
- `Extra Money` mod output

Money is spent on:

- buying new dice
- leveling dice
- prestiging dice through the level-up ladder

Money resets each run.

### XP

XP is earned from:

- base die payouts
- trick payouts
- `Extra XP` mod output

Player XP persists permanently.

### Turn Points

Turn points are earned only from:

- `Extra Turn Points` mod output

Turn points reset each run.

Turn thresholds for extra turns:

- first extra turn: `100`
- second: `200`
- third: `400`
- fourth: `800`
- continue doubling each time

One resolution can award multiple extra turns if multiple thresholds are crossed.

## Shop Costs

### Buy New Die

New die cost scales globally by number of die purchases this run.

Initial placeholder curve:

- buy #1: `25`
- buy #2: `50`
- buy #3: `100`
- buy #4: `200`
- buy #5: `400`

This resets each run.

### Level-Up Cost

Level-up cost scales per die, not globally across the run.

This supports both:

- tall builds focused on one die
- wide builds using more total dice

The exact cost curve is still a tuning item, but it should be:

- exponential
- gentler than new-die cost
- consistent across all dice

Prestige uses the same level-up purchase flow at the die's current cap.

## Meta Progression

### Player XP Levels

Player levels use powers-of-two thresholds.

Examples:

- level 1 at `1 XP`
- level 2 at `2 XP`
- level 3 at `4 XP`
- level 4 at `8 XP`

Reward philosophy:

- early levels alternate trick unlocks and small account boosts
- odd levels should usually unlock a trick
- even levels should usually give a boost
- after the earliest phase, bias roughly `3:2` toward tricks until about level `20`
- after around level `20`, new trick unlocks slow to roughly one every `3-4` levels

Player XP primarily unlocks:

- tricks
- occasional starting die level/progress boosts
- occasional starting multiplier boosts

### Achievement Tracks

Achievements are programmatic milestone tracks with discrete rewards.

Current intended track families:

- `Dice Rolled` -> grants free starting dice
- `Money Earned` -> grants starting cash
- `Bonus Money Earned` -> improves `Extra Money` base value
- `Bonus XP Earned` -> improves `Extra XP` base value
- `Turn Points Earned` -> improves `Extra Turn Points` base value
- `Mult Gained` -> improves mult-related base values

All unlocks apply immediately when earned and also persist for future runs.

### Immediate Unlock Application

If the player earns an account-level reward mid-run, it applies immediately to current run artifacts and future runs.

Examples:

- `+1 starting die` grants a die immediately
- `+starting cash` grants cash immediately
- `+starting die progress` advances all current dice immediately through the full ladder
- newly unlocked tricks can begin scoring immediately
- newly improved mod baselines affect current and future runs immediately

This is intentional. Mid-run unlock spikes are part of the game's appeal.

## UI Requirements

### MVP Play Screen

The MVP should support:

- a clear roll button
- visible turn counter
- visible money, XP, and turn point totals
- a board/list of current dice with face, prestige tier, cap, slots, and current die mult
- a between-turn shop/actions panel

### Trick Feedback

The MVP should include:

- a simple trick popup when a trick scores
- a persistent trick log

Each log entry should show at least:

- trick name
- payout amount
- XP gained
- multiplier applied

This log is important because jackpot turns are intentionally noisy.

### Mod Assignment UI

The player must be able to:

- see empty slots on each die
- choose from the full mod pool
- choose an existing mod again to level it
- leave a slot empty

### Readability Goals

- resolution should feel automatic and fast
- the player should never need to manually parse every die to know whether the turn was good
- logs and highlights should explain the turn after the fact

## Out Of Scope For MVP

These are valid future additions, but should not block v1:

- authored novelty tricks like `777`, `42069`, `8008135`, pi sequences, prime streaks, or Fibonacci patterns
- challenge modes that lock dice or force empty slots
- multiple mastery levels beyond `known` and `mastered`
- rerolls, consumables, or active abilities
- trick drafting or player choice between multiple trick unlocks
- alternative currencies beyond money, XP, and turn points
- content-heavy perk trees
- balance for true infinite play

## Tuning Placeholders

The following are intentionally unresolved and should be tuned through playtests:

- exact per-die level-up cost curve
- exact player-level reward table beyond the early unlock order
- exact achievement milestone thresholds
- whether the game wants a small starting-cash onboarding grant
- exact base values for achievement reward increments
- whether common tricks like `Ace` and `Pair` need different post-MVP mastery pacing

## MVP Success Criteria

The MVP is successful if it proves all of the following:

- rolling always feels rewarding because base salary exists
- the first trick unlock is a visible power spike
- spreading mods across dice creates distinct builds
- extra-turn builds can meaningfully extend runs
- mid-run meta unlocks create exciting clutch swings
- trick logs make large turns understandable
- the run-reset loop feels motivating rather than punishing
