import { getPlayerLevel, getUnlockedTrickIds } from './bootstrap'
import { MVP_MOD_POOL, MVP_TRICKS } from './content'
import type {
  DiceverseSave,
  DieModState,
  DieState,
  RewardLine,
  ResolvedDieState,
  ResolvedTurnSummary,
  TriggeredTrickLine,
  TrickId,
  TrickProgressState,
} from './types'

export interface RandomSource {
  nextFloat: () => number
  snapshot: () => number
}

interface RolledDie extends ResolvedDieState {
  baseValue: number
  mods: DieModState[]
}

const trickById = Object.fromEntries(MVP_TRICKS.map((trick) => [trick.id, trick])) as Record<
  TrickId,
  (typeof MVP_TRICKS)[number]
>

const modById = Object.fromEntries(MVP_MOD_POOL.map((mod) => [mod.id, mod]))

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0

  if (state === 0) {
    state = 1
  }

  return {
    nextFloat() {
      state = (1664525 * state + 1013904223) >>> 0
      return state / 0x100000000
    },
    snapshot() {
      return state
    },
  }
}

function reward(money = 0, xp = 0, turnPoints = 0): RewardLine {
  return {
    money: round(money),
    xp: round(xp),
    turnPoints: round(turnPoints),
  }
}

function addReward(a: RewardLine, b: RewardLine): RewardLine {
  return reward(a.money + b.money, a.xp + b.xp, a.turnPoints + b.turnPoints)
}

function sumRewards(lines: RewardLine[]) {
  return lines.reduce((total, line) => addReward(total, line), reward())
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function averageBaseValue(dice: RolledDie[]) {
  return dice.reduce((sum, die) => sum + die.baseValue, 0) / dice.length
}

function buildFaceGroups(dice: RolledDie[]) {
  const groups = new Map<number, RolledDie[]>()

  for (const die of dice) {
    const current = groups.get(die.face) ?? []
    current.push(die)
    current.sort((left, right) => right.baseValue - left.baseValue)
    groups.set(die.face, current)
  }

  return groups
}

function getModRate(mods: DieModState[], effectId: keyof typeof modById) {
  return mods
    .filter((mod) => mod.effectId === effectId)
    .reduce((sum, mod) => sum + modById[effectId].baseValue * mod.rank, 0)
}

function getExtraReward(die: RolledDie, scale = 1) {
  const faceValue = die.face * die.dieMult * scale

  return reward(
    faceValue * getModRate(die.mods, 'extraMoney'),
    faceValue * getModRate(die.mods, 'extraXp'),
    faceValue * getModRate(die.mods, 'extraTurnPoints'),
  )
}

function getMultiplierGain(die: DieState, allDiceRate: number) {
  const selfRate = getModRate(die.mods, 'selfMult')
  return selfRate + allDiceRate
}

function buildRolledDice(save: DiceverseSave, rng: RandomSource) {
  const allDiceRate = save.run.dice.reduce(
    (sum, die) => sum + getModRate(die.mods, 'allDiceMult'),
    0,
  )

  return save.run.dice.map((die) => {
    const dieMult = round(die.dieMult + getMultiplierGain(die, allDiceRate))
    const face = Math.floor(rng.nextFloat() * die.faceCap) + 1
    const baseReward = reward(face * dieMult, face * dieMult, 0)

    return {
      dieId: die.id,
      dieName: die.name,
      face,
      dieMult,
      baseValue: round(face * dieMult),
      baseReward,
      extraReward: reward(),
      mods: die.mods,
    } satisfies RolledDie
  })
}

function createTrickLine(
  trickId: TrickId,
  groups: RolledDie[][],
  trickProgress: Record<TrickId, TrickProgressState>,
  extraMultiplier = 0,
): TriggeredTrickLine {
  const trick = trickById[trickId]
  const mastered = trickProgress[trickId]?.mastered ?? false
  const multiplier = round((trick.baseMultiplier + extraMultiplier) * (mastered ? 2 : 1))
  const baseValue = round(groups.reduce((sum, group) => sum + averageBaseValue(group), 0))
  const faces = groups.map((group) => group[0]?.face ?? 0)

  return {
    trickId,
    trickName: trick.name,
    multiplier,
    faces,
    participatingDieIds: groups.flatMap((group) => group.map((die) => die.dieId)),
    reward: reward(baseValue * multiplier, baseValue * multiplier, 0),
  }
}

function detectMatchFamily(
  unlockedTrickIds: TrickId[],
  faceGroups: Map<number, RolledDie[]>,
  trickProgress: Record<TrickId, TrickProgressState>,
) {
  const availablePairs = [...faceGroups.entries()]
    .filter(([, dice]) => dice.length >= 2)
    .sort((left, right) => right[0] - left[0])

  if (unlockedTrickIds.includes('twoPair') && availablePairs.length >= 2) {
    return [
      createTrickLine(
        'twoPair',
        [availablePairs[0][1].slice(0, 2), availablePairs[1][1].slice(0, 2)],
        trickProgress,
      ),
    ]
  }

  if (unlockedTrickIds.includes('pair') && availablePairs.length >= 1) {
    return [createTrickLine('pair', [availablePairs[0][1].slice(0, 2)], trickProgress)]
  }

  return []
}

function detectSetFamily(
  unlockedTrickIds: TrickId[],
  faceGroups: Map<number, RolledDie[]>,
  trickProgress: Record<TrickId, TrickProgressState>,
) {
  const orderedGroups = [...faceGroups.entries()].sort((left, right) => right[0] - left[0])

  if (unlockedTrickIds.includes('fiveKindPlus')) {
    const match = orderedGroups.find(([, dice]) => dice.length >= 5)

    if (match) {
      const extraMultiplier = 1.5 * (match[1].length - 5)
      return [
        createTrickLine(
          'fiveKindPlus',
          [match[1]],
          trickProgress,
          extraMultiplier,
        ),
      ]
    }
  }

  if (unlockedTrickIds.includes('fourKind')) {
    const match = orderedGroups.find(([, dice]) => dice.length >= 4)

    if (match) {
      return [createTrickLine('fourKind', [match[1].slice(0, 4)], trickProgress)]
    }
  }

  if (unlockedTrickIds.includes('fullHouse')) {
    const triple = orderedGroups.find(([, dice]) => dice.length >= 3)
    const pair = orderedGroups.find(
      ([face, dice]) => face !== triple?.[0] && dice.length >= 2,
    )

    if (triple && pair) {
      return [
        createTrickLine(
          'fullHouse',
          [triple[1].slice(0, 3), pair[1].slice(0, 2)],
          trickProgress,
        ),
      ]
    }
  }

  if (unlockedTrickIds.includes('threeKind')) {
    const match = orderedGroups.find(([, dice]) => dice.length >= 3)

    if (match) {
      return [createTrickLine('threeKind', [match[1].slice(0, 3)], trickProgress)]
    }
  }

  return []
}

function buildBestStreak(faceGroups: Map<number, RolledDie[]>) {
  const uniqueFaces = [...faceGroups.keys()].sort((left, right) => left - right)
  const streaks: number[][] = []
  let current: number[] = []

  for (const face of uniqueFaces) {
    if (current.length === 0 || face === current[current.length - 1] + 1) {
      current.push(face)
      continue
    }

    streaks.push(current)
    current = [face]
  }

  if (current.length > 0) {
    streaks.push(current)
  }

  return streaks.sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length
    }

    return right.reduce((sum, face) => sum + face, 0) - left.reduce((sum, face) => sum + face, 0)
  })[0] ?? []
}

function detectStreakFamily(
  unlockedTrickIds: TrickId[],
  faceGroups: Map<number, RolledDie[]>,
  trickProgress: Record<TrickId, TrickProgressState>,
) {
  const bestStreak = buildBestStreak(faceGroups)

  if (bestStreak.length === 0) {
    return []
  }

  if (unlockedTrickIds.includes('streak5Plus') && bestStreak.length >= 5) {
    return [
      createTrickLine(
        'streak5Plus',
        bestStreak.map((face) => faceGroups.get(face)!.slice(0, 1)),
        trickProgress,
        bestStreak.length - 5,
      ),
    ]
  }

  if (unlockedTrickIds.includes('streak4') && bestStreak.length >= 4) {
    const faces = bestStreak.slice(-4)
    return [
      createTrickLine(
        'streak4',
        faces.map((face) => faceGroups.get(face)!.slice(0, 1)),
        trickProgress,
      ),
    ]
  }

  if (unlockedTrickIds.includes('streak3') && bestStreak.length >= 3) {
    const faces = bestStreak.slice(-3)
    return [
      createTrickLine(
        'streak3',
        faces.map((face) => faceGroups.get(face)!.slice(0, 1)),
        trickProgress,
      ),
    ]
  }

  return []
}

function detectAceFamily(
  unlockedTrickIds: TrickId[],
  faceGroups: Map<number, RolledDie[]>,
  trickProgress: Record<TrickId, TrickProgressState>,
) {
  if (!unlockedTrickIds.includes('ace')) {
    return []
  }

  return (faceGroups.get(1) ?? []).map((die) =>
    createTrickLine('ace', [[die]], trickProgress),
  )
}

function detectTriggeredTricks(save: DiceverseSave, rolledDice: RolledDie[]) {
  const faceGroups = buildFaceGroups(rolledDice)
  const unlockedTrickIds = save.progress.unlockedTrickIds
  const trickProgress = save.progress.trickProgress

  return [
    ...detectAceFamily(unlockedTrickIds, faceGroups, trickProgress),
    ...detectMatchFamily(unlockedTrickIds, faceGroups, trickProgress),
    ...detectSetFamily(unlockedTrickIds, faceGroups, trickProgress),
    ...detectStreakFamily(unlockedTrickIds, faceGroups, trickProgress),
  ]
}

function updateTrickProgress(
  current: Record<TrickId, TrickProgressState>,
  triggeredTricks: TriggeredTrickLine[],
  unlockedTrickIds: TrickId[],
) {
  const triggeredIds = new Set(triggeredTricks.map((line) => line.trickId))
  const nextProgress = { ...current }

  for (const trickId of Object.keys(nextProgress) as TrickId[]) {
    const existing = nextProgress[trickId]
    const uses = existing.uses + (triggeredIds.has(trickId) ? 1 : 0)

    nextProgress[trickId] = {
      ...existing,
      unlocked: unlockedTrickIds.includes(trickId),
      uses,
      mastered: uses >= trickById[trickId].masteryUses,
    }
  }

  return nextProgress
}

function updateAchievements(save: DiceverseSave, totalReward: RewardLine, extraReward: RewardLine) {
  return save.progress.achievements.map((achievement) => {
    switch (achievement.id) {
      case 'diceRolled':
        return { ...achievement, progress: round(achievement.progress + save.run.dice.length) }
      case 'moneyEarned':
        return { ...achievement, progress: round(achievement.progress + totalReward.money) }
      case 'bonusMoneyEarned':
        return { ...achievement, progress: round(achievement.progress + extraReward.money) }
      case 'bonusXpEarned':
        return { ...achievement, progress: round(achievement.progress + extraReward.xp) }
      case 'turnPointsEarned':
        return { ...achievement, progress: round(achievement.progress + totalReward.turnPoints) }
      case 'multGained':
        return {
          ...achievement,
          progress: round(
            achievement.progress +
              save.run.dice.reduce(
                (sum, die) => sum + getMultiplierGain(die, 0),
                0,
              ),
          ),
        }
      default:
        return achievement
    }
  })
}

function buildLogEntries(
  summary: ResolvedTurnSummary,
  priorLogLength: number,
) {
  const entries = [
    {
      id: `log-${summary.turnNumber}-${priorLogLength}`,
      turnNumber: summary.turnNumber,
      title: `Turn ${summary.turnNumber}`,
      detail: `Rolled ${summary.rolledFaces.join(', ')}. +$${summary.totalReward.money.toFixed(2)}, +${summary.totalReward.xp.toFixed(2)} XP, +${summary.totalReward.turnPoints.toFixed(2)} TP.`,
    },
    {
      id: `log-${summary.turnNumber}-${priorLogLength + 1}`,
      turnNumber: summary.turnNumber,
      title: 'Tricks',
      detail:
        summary.trickLines.length > 0
          ? summary.trickLines
              .map(
                (line) =>
                  `${line.trickName} x${line.multiplier.toFixed(2)} for $${line.reward.money.toFixed(2)}`,
              )
              .join(' | ')
          : 'No unlocked tricks scored. Base payouts carried the turn.',
    },
  ]

  if (summary.newlyUnlockedTrickIds.length > 0) {
    entries.push({
      id: `log-${summary.turnNumber}-${priorLogLength + 2}`,
      turnNumber: summary.turnNumber,
      title: 'Unlocks',
      detail: `New tricks unlocked: ${summary.newlyUnlockedTrickIds
        .map((trickId) => trickById[trickId].name)
        .join(', ')}.`,
    })
  }

  if (summary.extraTurnsAwarded > 0) {
    entries.push({
      id: `log-${summary.turnNumber}-${priorLogLength + 3}`,
      turnNumber: summary.turnNumber,
      title: 'Extra turns',
      detail: `Converted turn points into ${summary.extraTurnsAwarded} extra turn${summary.extraTurnsAwarded === 1 ? '' : 's'}.`,
    })
  }

  return entries
}

export function resolveTurn(
  save: DiceverseSave,
  rng: RandomSource = createSeededRandom(save.run.rngSeed),
): DiceverseSave {
  if (save.run.phase === 'runOver' || save.run.turnsRemaining <= 0) {
    return save
  }

  const rolledDice = buildRolledDice(save, rng)
  const baseReward = sumRewards(rolledDice.map((die) => die.baseReward))
  const triggeredTricks = detectTriggeredTricks(save, rolledDice)
  const trickReward = sumRewards(triggeredTricks.map((line) => line.reward))

  const baseExtraReward = sumRewards(rolledDice.map((die) => getExtraReward(die)))
  const trickExtraReward = sumRewards(
    triggeredTricks.flatMap((line) =>
      line.participatingDieIds.map((dieId) => {
        const die = rolledDice.find((candidate) => candidate.dieId === dieId)
        return die ? getExtraReward(die, line.multiplier) : reward()
      }),
    ),
  )
  const extraReward = addReward(baseExtraReward, trickExtraReward)
  const totalReward = addReward(addReward(baseReward, trickReward), extraReward)

  let turnsRemaining = save.run.turnsRemaining - 1
  let turnPoints = round(save.run.turnPoints + totalReward.turnPoints)
  let nextTurnThreshold = save.run.nextTurnThreshold
  let extraTurnsAwarded = 0

  while (turnPoints >= nextTurnThreshold) {
    turnPoints = round(turnPoints - nextTurnThreshold)
    turnsRemaining += 1
    extraTurnsAwarded += 1
    nextTurnThreshold *= 2
  }

  const playerXp = round(save.progress.playerXp + totalReward.xp)
  const playerLevel = getPlayerLevel(playerXp)
  const unlockedTrickIds = getUnlockedTrickIds(playerLevel)
  const newlyUnlockedTrickIds = unlockedTrickIds.filter(
    (trickId) => !save.progress.unlockedTrickIds.includes(trickId),
  )

  const summary: ResolvedTurnSummary = {
    turnNumber: save.run.turn + 1,
    rolledFaces: rolledDice.map((die) => die.face),
    baseReward,
    trickReward,
    extraReward,
    totalReward,
    extraTurnsAwarded,
    nextTurnThreshold,
    newlyUnlockedTrickIds,
    dieResults: rolledDice,
    trickLines: triggeredTricks,
  }

  return {
    meta: {
      ...save.meta,
      updatedAt: new Date().toISOString(),
    },
    progress: {
      ...save.progress,
      playerXp,
      playerLevel,
      unlockedTrickIds,
      trickProgress: updateTrickProgress(
        save.progress.trickProgress,
        triggeredTricks,
        unlockedTrickIds,
      ),
      achievements: updateAchievements(save, totalReward, extraReward),
    },
    run: {
      ...save.run,
      turn: summary.turnNumber,
      phase: turnsRemaining > 0 ? 'betweenTurns' : 'runOver',
      turnsRemaining,
      money: round(save.run.money + totalReward.money),
      turnPoints,
      nextTurnThreshold,
      rngSeed: rng.snapshot(),
      dice: save.run.dice.map((die) => {
        const rolled = rolledDice.find((candidate) => candidate.dieId === die.id)

        if (!rolled) {
          return die
        }

        return {
          ...die,
          currentFace: rolled.face,
          dieMult: rolled.dieMult,
        }
      }),
      lastResolvedTurn: summary,
      log: [...buildLogEntries(summary, save.run.log.length), ...save.run.log].slice(0, 12),
    },
  }
}
