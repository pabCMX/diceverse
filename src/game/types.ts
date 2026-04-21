export type TrickId =
  | 'ace'
  | 'pair'
  | 'threeKind'
  | 'streak3'
  | 'twoPair'
  | 'fullHouse'
  | 'fourKind'
  | 'streak4'
  | 'fiveKindPlus'
  | 'streak5Plus'

export type TrickFamily = 'single' | 'match' | 'set' | 'streak'

export type ModEffectId =
  | 'selfMult'
  | 'allDiceMult'
  | 'extraMoney'
  | 'extraXp'
  | 'extraTurnPoints'

export type MetaRewardId =
  | 'unlockTrick'
  | 'startingDieProgress'
  | 'startingMultiplier'
  | 'startingDie'
  | 'startingCash'
  | 'bonusMoneyRate'
  | 'bonusXpRate'
  | 'bonusTurnPointRate'
  | 'bonusMultRate'

export type TurnPhase = 'betweenTurns' | 'resolving' | 'runOver'

export interface RewardLine {
  money: number
  xp: number
  turnPoints: number
}

export interface ResolvedDieState {
  dieId: string
  dieName: string
  face: number
  dieMult: number
  baseReward: RewardLine
  extraReward: RewardLine
}

export interface TriggeredTrickLine {
  trickId: TrickId
  trickName: string
  multiplier: number
  faces: number[]
  participatingDieIds: string[]
  reward: RewardLine
}

export interface ResolvedTurnSummary {
  turnNumber: number
  rolledFaces: number[]
  baseReward: RewardLine
  trickReward: RewardLine
  extraReward: RewardLine
  totalReward: RewardLine
  extraTurnsAwarded: number
  nextTurnThreshold: number
  newlyUnlockedTrickIds: TrickId[]
  dieResults: ResolvedDieState[]
  trickLines: TriggeredTrickLine[]
}

export interface TrickDefinition {
  id: TrickId
  name: string
  family: TrickFamily
  unlockLevel: number
  baseMultiplier: number
  masteryUses: number
  summary: string
}

export interface ModDefinition {
  id: ModEffectId
  name: string
  baseValue: number
  isPerTurnStacking: boolean
  summary: string
}

export interface DieModState {
  effectId: ModEffectId
  rank: number
}

export interface DieState {
  id: string
  name: string
  prestige: number
  faceCap: number
  currentFace: number | null
  dieMult: number
  slotsUnlocked: number
  mods: DieModState[]
}

export interface TrickProgressState {
  trickId: TrickId
  unlocked: boolean
  uses: number
  mastered: boolean
}

export interface AchievementTrackState {
  id: string
  name: string
  progress: number
  rewardId: MetaRewardId
}

export interface MetaRewardState {
  rewardId: MetaRewardId
  amount: number
}

export interface PersistentProgressState {
  playerXp: number
  playerLevel: number
  unlockedTrickIds: TrickId[]
  trickProgress: Record<TrickId, TrickProgressState>
  achievements: AchievementTrackState[]
  rewards: MetaRewardState[]
}

export interface TurnLogEntry {
  id: string
  turnNumber: number
  title: string
  detail: string
}

export interface RunState {
  turn: number
  phase: TurnPhase
  turnsRemaining: number
  money: number
  turnPoints: number
  nextTurnThreshold: number
  rngSeed: number
  dice: DieState[]
  lastResolvedTurn: ResolvedTurnSummary | null
  log: TurnLogEntry[]
}

export interface SaveMetadata {
  version: number
  updatedAt: string
}

export interface DiceverseSave {
  meta: SaveMetadata
  progress: PersistentProgressState
  run: RunState
}
