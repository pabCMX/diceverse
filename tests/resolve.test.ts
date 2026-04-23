import { describe, expect, test } from "bun:test";

import {
  createInitialSave,
  getUnlockedTrickIds,
} from "../src/game/bootstrap.ts";
import { resolveTurn } from "../src/game/resolve.ts";
import type { DiceverseSave } from "../src/game/types.ts";

function createFixedRandom(...values: number[]) {
  let index = 0;

  return {
    nextFloat() {
      const value = values[Math.min(index, values.length - 1)] ?? 0;
      index += 1;
      return value;
    },
    snapshot() {
      return 424242 + index;
    },
  };
}

function unlockToLevel(save: DiceverseSave, level: number) {
  const unlockedTrickIds = getUnlockedTrickIds(level);

  return {
    ...save,
    progress: {
      ...save.progress,
      playerLevel: level,
      unlockedTrickIds,
      trickProgress: Object.fromEntries(
        Object.entries(save.progress.trickProgress).map(
          ([trickId, progress]) => [
            trickId,
            {
              ...progress,
              unlocked: unlockedTrickIds.includes(progress.trickId),
            },
          ],
        ),
      ) as DiceverseSave["progress"]["trickProgress"],
    },
  };
}

describe("resolveTurn", () => {
  test("always grants base payouts on a dead turn", () => {
    const save = createInitialSave();
    const next = resolveTurn(save, createFixedRandom(0.95));

    expect(next.run.turn).toBe(1);
    expect(next.run.money).toBe(3);
    expect(next.progress.playerXp).toBe(3);
    expect(next.run.turnsRemaining).toBe(9);
    expect(next.run.lastResolvedTurn?.trickLines).toHaveLength(0);
  });

  test("scores unlocked pair tricks once per turn", () => {
    const save = unlockToLevel(createInitialSave(), 3);
    const pairSave: DiceverseSave = {
      ...save,
      run: {
        ...save.run,
        dice: [
          { ...save.run.dice[0], id: "die-a", name: "Die A" },
          { ...save.run.dice[0], id: "die-b", name: "Die B" },
        ],
      },
    };

    const next = resolveTurn(pairSave, createFixedRandom(0.4, 0.4));

    expect(next.run.lastResolvedTurn?.rolledFaces).toEqual([2, 2]);
    expect(next.run.lastResolvedTurn?.trickLines).toHaveLength(1);
    expect(next.run.lastResolvedTurn?.trickLines[0]?.trickId).toBe("pair");
    expect(next.run.lastResolvedTurn?.trickLines[0]?.reward.money).toBe(2.5);
    expect(next.run.money).toBe(6.5);
  });

  test("converts earned turn points into extra turns", () => {
    const save = createInitialSave();
    const boosted: DiceverseSave = {
      ...save,
      run: {
        ...save.run,
        turnPoints: 99,
        dice: [
          {
            ...save.run.dice[0],
            mods: [{ effectId: "extraTurnPoints", rank: 1 }],
          },
        ],
      },
    };

    const next = resolveTurn(boosted, createFixedRandom(0.95));

    expect(next.run.lastResolvedTurn?.extraTurnsAwarded).toBe(1);
    expect(next.run.turnsRemaining).toBe(10);
    expect(next.run.nextTurnThreshold).toBe(12);
    expect(next.run.turnPoints).toBe(2);
  });
});
