import { MVP_MOD_POOL } from '../../game/content'

export const modById = Object.fromEntries(MVP_MOD_POOL.map((mod) => [mod.id, mod])) as Record<
  (typeof MVP_MOD_POOL)[number]['id'],
  (typeof MVP_MOD_POOL)[number]
>

export function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

export function formatNumber(value: number) {
  return value.toFixed(2)
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function formatModEffect(rank: number, effectId: keyof typeof modById) {
  const mod = modById[effectId]
  const total = mod.baseValue * rank

  return mod.isPerTurnStacking
    ? `r${rank} +${formatPercent(total)}/turn`
    : `r${rank} +${formatPercent(total)} face`
}
