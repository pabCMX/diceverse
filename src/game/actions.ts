import { createInitialRunState, createStartingDie } from "./bootstrap";
import { MVP_MOD_POOL } from "./content";
import type {
  DiceverseSave,
  DieState,
  ModEffectId,
  TurnLogEntry,
} from "./types";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number) {
  return `$${round(value).toFixed(2)}`;
}

function getRewardAmount(
  save: DiceverseSave,
  rewardId: DiceverseSave["progress"]["rewards"][number]["rewardId"],
) {
  return (
    save.progress.rewards.find((reward) => reward.rewardId === rewardId)
      ?.amount ?? 0
  );
}

function getPrestigeCap(prestige: number) {
  return 6 + prestige;
}

function prependLog(save: DiceverseSave, title: string, detail: string) {
  const entry: TurnLogEntry = {
    id: `log-action-${save.run.turn}-${save.run.log.length + 1}`,
    turnNumber: save.run.turn,
    title,
    detail,
  };

  return [entry, ...save.run.log].slice(0, 12);
}

function withMeta(save: DiceverseSave, run: DiceverseSave["run"]) {
  return {
    ...save,
    meta: {
      ...save.meta,
      updatedAt: new Date().toISOString(),
    },
    run,
  };
}

export function getBuyDieCost(save: DiceverseSave) {
  const purchasesSoFar = Math.max(0, save.run.dice.length - 1);
  return round(10 * 1.2 ** purchasesSoFar);
}

export function getLevelUpCost(die: DieState) {
  const withinTierStep = die.faceCap - 3;
  const baseCost = (die.prestige + 1) * 1.15 ** (withinTierStep + 1);
  return round(baseCost);
}

export function canBuyDie(save: DiceverseSave) {
  return (
    save.run.phase === "betweenTurns" && save.run.money >= getBuyDieCost(save)
  );
}

export function canLevelDie(save: DiceverseSave, dieId: string) {
  const die = save.run.dice.find((candidate) => candidate.id === dieId);

  return (
    save.run.phase === "betweenTurns" &&
    Boolean(die) &&
    die!.faceCap < getPrestigeCap(die!.prestige) &&
    save.run.money >= getLevelUpCost(die!)
  );
}

export function canPrestigeDie(save: DiceverseSave, dieId: string) {
  const die = save.run.dice.find((candidate) => candidate.id === dieId);

  return (
    save.run.phase === "betweenTurns" &&
    Boolean(die) &&
    die!.faceCap >= getPrestigeCap(die!.prestige) &&
    save.run.money >= getLevelUpCost(die!)
  );
}

export function canAssignMod(save: DiceverseSave, dieId: string) {
  const die = save.run.dice.find((candidate) => candidate.id === dieId);
  return (
    save.run.phase === "betweenTurns" &&
    Boolean(die) &&
    die!.mods.length < die!.slotsUnlocked
  );
}

export function buyDie(save: DiceverseSave) {
  if (!canBuyDie(save)) {
    return save;
  }

  const cost = getBuyDieCost(save);
  const startingProgress = getRewardAmount(save, "startingDieProgress");
  const startingMultiplier = getRewardAmount(save, "startingMultiplier");
  const dieIndex = save.run.dice.length;
  const die = createStartingDie(dieIndex, startingProgress);

  die.dieMult = round(die.dieMult + startingMultiplier);

  return withMeta(save, {
    ...save.run,
    money: round(save.run.money - cost),
    dice: [...save.run.dice, die],
    log: prependLog(
      save,
      "Bought die",
      `${die.name} joined the run for ${formatCurrency(cost)}.`,
    ),
  });
}

export function levelDie(save: DiceverseSave, dieId: string) {
  if (!canLevelDie(save, dieId)) {
    return save;
  }

  const target = save.run.dice.find((candidate) => candidate.id === dieId);

  if (!target) {
    return save;
  }

  const cost = getLevelUpCost(target);

  return withMeta(save, {
    ...save.run,
    money: round(save.run.money - cost),
    dice: save.run.dice.map((die) =>
      die.id === dieId
        ? {
            ...die,
            faceCap: die.faceCap + 1,
          }
        : die,
    ),
    log: prependLog(
      save,
      "Leveled die",
      `${target.name} advanced to d${target.faceCap + 1} for ${formatCurrency(cost)}.`,
    ),
  });
}

export function prestigeDie(save: DiceverseSave, dieId: string) {
  if (!canPrestigeDie(save, dieId)) {
    return save;
  }

  const target = save.run.dice.find((candidate) => candidate.id === dieId);

  if (!target) {
    return save;
  }

  const cost = getLevelUpCost(target);
  const nextPrestige = target.prestige + 1;

  return withMeta(save, {
    ...save.run,
    money: round(save.run.money - cost),
    dice: save.run.dice.map((die) =>
      die.id === dieId
        ? {
            ...die,
            prestige: nextPrestige,
            faceCap: 3,
            currentFace: null,
            slotsUnlocked: nextPrestige,
          }
        : die,
    ),
    log: prependLog(
      save,
      "Prestiged die",
      `${target.name} reached P${nextPrestige} for ${formatCurrency(cost)} and unlocked slot ${nextPrestige}.`,
    ),
  });
}

export function assignMod(
  save: DiceverseSave,
  dieId: string,
  effectId: ModEffectId,
) {
  if (!canAssignMod(save, dieId)) {
    return save;
  }

  const mod = MVP_MOD_POOL.find((candidate) => candidate.id === effectId);
  const target = save.run.dice.find((candidate) => candidate.id === dieId);

  if (!mod || !target) {
    return save;
  }

  return withMeta(save, {
    ...save.run,
    dice: save.run.dice.map((die) => {
      if (die.id !== dieId) {
        return die;
      }

      const existing = die.mods.find(
        (candidate) => candidate.effectId === effectId,
      );

      if (existing) {
        return {
          ...die,
          mods: die.mods.map((candidate) =>
            candidate.effectId === effectId
              ? { ...candidate, rank: candidate.rank + 1 }
              : candidate,
          ),
        };
      }

      return {
        ...die,
        mods: [...die.mods, { effectId, rank: 1 }],
      };
    }),
    log: prependLog(
      save,
      "Assigned slot",
      `${target.name} took ${mod.name}${target.mods.some((candidate) => candidate.effectId === effectId) ? " rank +1" : ""}.`,
    ),
  });
}

export function resetRun(save: DiceverseSave) {
  return withMeta(save, {
    ...createInitialRunState(save.progress),
    log: prependLog(
      save,
      "Run reset",
      "Started a fresh run while keeping permanent XP, tricks, and achievement progress.",
    ),
  });
}
