import { createInitialRunState, createInitialSave, SAVE_VERSION } from './bootstrap'
import type { DiceverseSave } from './types'

export const SAVE_STORAGE_KEY = 'diceverse.save.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSaveLike(value: unknown): value is DiceverseSave {
  if (!isRecord(value)) {
    return false
  }

  if (!isRecord(value.meta) || !isRecord(value.progress) || !isRecord(value.run)) {
    return false
  }

  return (
    typeof value.meta.version === 'number' &&
    typeof value.meta.updatedAt === 'string' &&
    typeof value.run.turn === 'number' &&
    typeof value.progress.playerXp === 'number'
  )
}

export function loadSave() {
  if (typeof window === 'undefined') {
    return createInitialSave()
  }

  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY)

    if (!raw) {
      return createInitialSave()
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isSaveLike(parsed) || parsed.meta.version !== SAVE_VERSION) {
      return createInitialSave()
    }

    return parsed
  } catch {
    return createInitialSave()
  }
}

export function persistSave(save: DiceverseSave) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save))
}

export function clearPersistedSave() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SAVE_STORAGE_KEY)
}

export function wipeAllProgress() {
  const fresh = createInitialSave()
  persistSave(fresh)
  return fresh
}

export function resetRunOnly(save: DiceverseSave) {
  return {
    ...save,
    meta: {
      ...save.meta,
      updatedAt: new Date().toISOString(),
    },
    run: createInitialRunState(save.progress),
  }
}
