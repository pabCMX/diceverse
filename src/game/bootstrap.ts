import { MVP_TRICKS } from "./content";
import type {
  DiceverseSave,
  DieState,
  MetaRewardState,
  PersistentProgressState,
  RunState,
  TrickId,
  TrickProgressState,
} from "./types";

export const SAVE_VERSION = 1;
export const STARTING_TURNS = 10;
export const STARTING_TURN_THRESHOLD = 10;
export const STARTING_DIE_FACE = 3;

const STARTING_REWARDS: MetaRewardState[] = [
  { rewardId: "startingDie", amount: 1 },
  { rewardId: "startingCash", amount: 0 },
  { rewardId: "startingDieProgress", amount: 0 },
  { rewardId: "startingMultiplier", amount: 0 },
  { rewardId: "bonusMoneyRate", amount: 0 },
  { rewardId: "bonusXpRate", amount: 0 },
  { rewardId: "bonusTurnPointRate", amount: 0 },
  { rewardId: "bonusMultRate", amount: 0 },
];

const STARTING_ACHIEVEMENTS = [
  {
    id: "diceRolled",
    name: "Dice Rolled",
    progress: 0,
    rewardId: "startingDie" as const,
  },
  {
    id: "moneyEarned",
    name: "Money Earned",
    progress: 0,
    rewardId: "startingCash" as const,
  },
  {
    id: "bonusMoneyEarned",
    name: "Bonus Money Earned",
    progress: 0,
    rewardId: "bonusMoneyRate" as const,
  },
  {
    id: "bonusXpEarned",
    name: "Bonus XP Earned",
    progress: 0,
    rewardId: "bonusXpRate" as const,
  },
  {
    id: "turnPointsEarned",
    name: "Turn Points Earned",
    progress: 0,
    rewardId: "bonusTurnPointRate" as const,
  },
  {
    id: "multGained",
    name: "Mult Gained",
    progress: 0,
    rewardId: "bonusMultRate" as const,
  },
];

export function getPlayerLevel(playerXp: number) {
  if (playerXp <= 0) {
    return 0;
  }

  return Math.floor(Math.log2(playerXp)) + 1;
}

export function getXpThresholdForLevel(level: number) {
  if (level <= 0) {
    return 1;
  }

  return 10 ** level;
}

export function getUnlockedTrickIds(playerLevel: number) {
  return MVP_TRICKS.filter((trick) => trick.unlockLevel <= playerLevel).map(
    (trick) => trick.id,
  );
}

export function getNextTrickUnlock(playerLevel: number) {
  return MVP_TRICKS.find((trick) => trick.unlockLevel > playerLevel) ?? null;
}

export function getFaceCapForLadder(prestige: number, progress: number) {
  const baseCap = STARTING_DIE_FACE + prestige;
  return Math.min(baseCap + progress, 6 + prestige);
}

export function getSlotCapacity(prestige: number) {
  return prestige;
}

function buildTrickProgress(unlockedTrickIds: TrickId[]) {
  return Object.fromEntries(
    MVP_TRICKS.map((trick) => [
      trick.id,
      {
        trickId: trick.id,
        unlocked: unlockedTrickIds.includes(trick.id),
        uses: 0,
        mastered: false,
      } satisfies TrickProgressState,
    ]),
  ) as Record<TrickId, TrickProgressState>;
}

export function createStartingDie(index = 0, ladderProgress = 0): DieState {
  const prestige = 0;
  const faceCap = getFaceCapForLadder(prestige, ladderProgress);

  return {
    id: `die-${index + 1}`,
    name: `Die ${index + 1}`,
    prestige,
    faceCap,
    currentFace: null,
    dieMult: 1,
    slotsUnlocked: getSlotCapacity(prestige),
    mods: [],
  };
}

export function createInitialProgressState(): PersistentProgressState {
  const playerXp = 0;
  const playerLevel = getPlayerLevel(playerXp);
  const unlockedTrickIds = getUnlockedTrickIds(playerLevel);

  return {
    playerXp,
    playerLevel,
    unlockedTrickIds,
    trickProgress: buildTrickProgress(unlockedTrickIds),
    achievements: STARTING_ACHIEVEMENTS,
    rewards: STARTING_REWARDS,
  };
}

export function createInitialRunState(
  progress: PersistentProgressState,
): RunState {
  const startingDieReward =
    progress.rewards.find((reward) => reward.rewardId === "startingDie")
      ?.amount ?? 1;
  const startingCash =
    progress.rewards.find((reward) => reward.rewardId === "startingCash")
      ?.amount ?? 0;
  const startingProgress =
    progress.rewards.find((reward) => reward.rewardId === "startingDieProgress")
      ?.amount ?? 0;

  return {
    turn: 0,
    phase: "betweenTurns",
    turnsRemaining: STARTING_TURNS,
    money: startingCash,
    turnPoints: 0,
    nextTurnThreshold: STARTING_TURN_THRESHOLD,
    rngSeed: 123456789,
    dice: Array.from({ length: startingDieReward }, (_, index) =>
      createStartingDie(index, startingProgress),
    ),
    lastResolvedTurn: null,
    log: [
      {
        id: "log-0",
        turnNumber: 0,
        title: "Run created",
        detail: `Started with ${startingDieReward} die and ${STARTING_TURNS} turns.`,
      },
      {
        id: "log-1",
        turnNumber: 0,
        title: "State scaffolded",
        detail: "Milestone 2 now drives the shell from typed bootstrap data.",
      },
    ],
  };
}

export function createInitialSave(): DiceverseSave {
  const progress = createInitialProgressState();

  return {
    meta: {
      version: SAVE_VERSION,
      updatedAt: new Date().toISOString(),
    },
    progress,
    run: createInitialRunState(progress),
  };
}
