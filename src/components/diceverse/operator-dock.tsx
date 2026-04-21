import type { ReactNode } from 'react'
import { getLevelUpCost } from '../../game/actions'
import { SAVE_VERSION } from '../../game/bootstrap'
import { MVP_MOD_POOL, MVP_TRICKS } from '../../game/content'
import type { DiceverseSave, DieState, TrickDefinition } from '../../game/types'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { formatCurrency, formatModEffect, formatNumber, formatPercent } from './format'

const tabs = [
  { id: 'shop', label: 'Shop' },
  { id: 'unlocks', label: 'Unlocks' },
  { id: 'turn', label: 'Turn' },
  { id: 'info', label: 'Info' },
] as const

export type OperatorTab = (typeof tabs)[number]['id']

type OperatorDockProps = {
  activeTab: OperatorTab
  onTabChange: (tab: OperatorTab) => void
  save: DiceverseSave
  selectedDie: DieState | undefined
  nextLevelXp: number
  nextTrick: TrickDefinition | null
  onBuyDie: () => void
  onResetRun: () => void
  onFullWipe: () => void
  onRoll: () => void
  onLevelDie: () => void
  onPrestigeDie: () => void
  onAssignMod: (effectId: (typeof MVP_MOD_POOL)[number]['id']) => void
  rollDisabled: boolean
  canBuy: boolean
  canLevel: boolean
  canPrestige: boolean
  canAssign: boolean
  buyCost: number
}

function PanelSection({
  kicker,
  title,
  badge,
  children,
}: {
  kicker: string
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[0.75rem] border border-stone-700/70 bg-stone-900/82 p-2">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
            {kicker}
          </p>
          <h3 className="mt-1 text-[0.86rem] font-semibold uppercase tracking-[0.08em] text-stone-100">
            {title}
          </h3>
        </div>
        {badge ? (
          <span className="rounded-[0.4rem] border border-stone-700/75 bg-stone-950/90 px-1.5 py-1 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-stone-300">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <article className="rounded-[0.6rem] border border-stone-700/65 bg-stone-950/85 px-2 py-1.5">
      <p className="text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
      <strong className="mt-1 block text-[0.82rem] font-semibold text-stone-100">{value}</strong>
      {detail ? <span className="mt-0.5 block text-[0.56rem] text-stone-500">{detail}</span> : null}
    </article>
  )
}

function ActionRow({
  label,
  detail,
  value,
  onClick,
  disabled,
  destructive = false,
}: {
  label: string
  detail: string
  value: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <Button
      variant={destructive ? 'destructive' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-auto w-full min-w-0 justify-between rounded-[0.65rem] border px-2 py-2 text-left',
        destructive
          ? 'border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/16'
          : 'border-stone-700/75 bg-stone-950/90 text-stone-100 hover:bg-stone-900',
      )}
    >
      <span className="flex min-w-0 flex-col items-start pr-2">
        <strong className="text-[0.68rem] uppercase tracking-[0.12em]">{label}</strong>
        <small
          className={cn(
            'mt-0.5 text-[0.6rem] leading-[1rem]',
            destructive ? 'text-red-100/70' : 'text-stone-400',
          )}
        >
          {detail}
        </small>
      </span>
      <span
        className={cn(
          'shrink-0 text-[0.56rem] font-semibold uppercase tracking-[0.14em]',
          destructive ? 'text-red-100/80' : 'text-stone-400',
        )}
      >
        {value}
      </span>
    </Button>
  )
}

function LineItem({
  title,
  detail,
  meta,
  live = false,
}: {
  title: string
  detail: string
  meta: string[]
  live?: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-[0.65rem] border px-2 py-2',
        live ? 'border-emerald-500/20 bg-emerald-500/8' : 'border-stone-700/65 bg-stone-950/70',
      )}
    >
      <strong className="block text-[0.7rem] text-stone-100">{title}</strong>
      <p className="mt-1 text-[0.64rem] leading-[1.1rem] text-stone-300/80">{detail}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {meta.map((item) => (
          <span
            className="rounded-[0.35rem] border border-stone-700/75 bg-stone-950/90 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-stone-300"
            key={`${title}-${item}`}
          >
            {item}
          </span>
        ))}
      </div>
    </article>
  )
}

function ModAction({
  label,
  effect,
  onClick,
  disabled,
}: {
  label: string
  effect: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-auto min-w-0 rounded-[0.6rem] border-stone-700/75 bg-stone-950/90 px-2 py-2 text-left text-stone-100 hover:bg-stone-900"
    >
      <span className="flex min-w-0 flex-col items-start">
        <strong className="w-full truncate text-[0.65rem] uppercase tracking-[0.1em]">{label}</strong>
        <span className="mt-0.5 text-[0.56rem] leading-[1rem] text-stone-400">{effect}</span>
      </span>
    </Button>
  )
}

export function OperatorDock({
  activeTab,
  onTabChange,
  save,
  selectedDie,
  nextLevelXp,
  nextTrick,
  onBuyDie,
  onResetRun,
  onFullWipe,
  onRoll,
  onLevelDie,
  onPrestigeDie,
  onAssignMod,
  rollDisabled,
  canBuy,
  canLevel,
  canPrestige,
  canAssign,
  buyCost,
}: OperatorDockProps) {
  const lastTurn = save.run.lastResolvedTurn
  const unlockedTricks = MVP_TRICKS.filter((trick) =>
    save.progress.unlockedTrickIds.includes(trick.id),
  )
  const openSlots = selectedDie ? selectedDie.slotsUnlocked - selectedDie.mods.length : 0
  const runStats = [
    { label: 'Turns', value: String(save.run.turnsRemaining), detail: `T${save.run.turn}` },
    { label: 'Cash', value: formatCurrency(save.run.money), detail: 'run' },
    {
      label: 'XP',
      value: formatNumber(save.progress.playerXp),
      detail: `L${save.progress.playerLevel}`,
    },
    {
      label: 'TP',
      value: formatNumber(save.run.turnPoints),
      detail: `/${save.run.nextTurnThreshold}`,
    },
  ]

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col rounded-[1rem] border border-stone-700/80 bg-[linear-gradient(180deg,rgba(17,18,17,0.98),rgba(11,12,11,0.98))] p-2 shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
      <div className="grid gap-2">
        <section className="rounded-[0.75rem] border border-stone-700/75 bg-stone-900/82 p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Run Snapshot
            </p>
            <span className="rounded-[0.4rem] border border-stone-700/75 bg-stone-950/90 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-stone-300">
              {save.run.phase}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {runStats.map((stat) => (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                detail={stat.detail}
              />
            ))}
          </div>
          <Button
            size="lg"
            onClick={onRoll}
            disabled={rollDisabled}
            className="mt-2 h-auto w-full rounded-[0.7rem] border border-amber-300/40 bg-[linear-gradient(180deg,#efc35f,#d59d2d)] px-2.5 py-2.5 text-left text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[linear-gradient(180deg,#f4cc74,#ddb047)]"
          >
            <span className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="min-w-0">
                <span className="block text-[0.54rem] font-semibold uppercase tracking-[0.22em]">
                  Resolve
                </span>
                <strong className="mt-0.5 block text-[0.92rem] uppercase tracking-[0.08em]">
                  Roll Turn
                </strong>
              </span>
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em]">
                -1 turn
              </span>
            </span>
          </Button>
        </section>

        <section className="rounded-[0.75rem] border border-stone-700/75 bg-stone-900/82 p-2">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Quick Ops
              </p>
              <h3 className="mt-1 truncate text-[0.86rem] font-semibold uppercase tracking-[0.08em] text-stone-100">
                {selectedDie?.name ?? 'No die selected'}
              </h3>
            </div>
            {selectedDie ? (
              <span className="rounded-[0.4rem] border border-stone-700/75 bg-stone-950/90 px-1.5 py-1 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-stone-300">
                d{selectedDie.faceCap} / P{selectedDie.prestige}
              </span>
            ) : null}
          </div>

          {selectedDie ? (
            <div className="grid gap-2">
              <div className="grid grid-cols-3 gap-1.5">
                <MetricCard label="Face" value={selectedDie.currentFace?.toString() ?? '?'} />
                <MetricCard label="Next" value={formatCurrency(getLevelUpCost(selectedDie))} />
                <MetricCard label="Slots" value={`${openSlots} open`} />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <ActionRow
                  label="Level"
                  detail={`Advance to d${selectedDie.faceCap + 1}`}
                  value="grow"
                  onClick={onLevelDie}
                  disabled={!canLevel}
                />
                <ActionRow
                  label="Prestige"
                  detail={`Reset to P${selectedDie.prestige + 1}`}
                  value="ascend"
                  onClick={onPrestigeDie}
                  disabled={!canPrestige}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {MVP_MOD_POOL.map((mod) => (
                  <ModAction
                    key={mod.id}
                    label={mod.name}
                    effect={formatModEffect(1, mod.id)}
                    onClick={() => onAssignMod(mod.id)}
                    disabled={!canAssign}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[0.66rem] leading-[1.1rem] text-stone-300/78">
              Select a die to keep level, prestige, and perk actions within reach.
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-1 rounded-[0.75rem] border border-stone-700/75 bg-stone-900/82 p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'min-w-0 rounded-[0.55rem] px-1.5 py-1.5 text-[0.54rem] font-semibold uppercase tracking-[0.14em]',
                activeTab === tab.id
                  ? 'bg-amber-300 text-stone-950 hover:bg-amber-200'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100',
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'shop' && (
          <div className="grid gap-2">
            <PanelSection kicker="Run Actions" title="Economy" badge={formatCurrency(save.run.money)}>
              <div className="grid gap-1.5">
                <ActionRow
                  label="Buy Die"
                  detail="Add another die to the field"
                  value={formatCurrency(buyCost)}
                  onClick={onBuyDie}
                  disabled={!canBuy}
                />
                <ActionRow
                  label="Reset Run"
                  detail="Keep meta progress, restart the run"
                  value="manual"
                  onClick={onResetRun}
                />
              </div>
            </PanelSection>
          </div>
        )}

        {activeTab === 'unlocks' && (
          <div className="grid gap-2">
            <PanelSection
              kicker="Progression"
              title="Next unlock"
              badge={`${formatNumber(save.progress.playerXp)} / ${nextLevelXp} XP`}
            >
              <LineItem
                title={
                  nextTrick
                    ? `${nextTrick.name} at level ${nextTrick.unlockLevel}`
                    : 'All current tricks unlocked'
                }
                detail={`Early ladder: ${MVP_TRICKS.slice(0, 5)
                  .map((trick) => trick.name)
                  .join(', ')}.`}
                meta={[`${unlockedTricks.length} live`, `${MVP_TRICKS.length} total`]}
                live
              />
            </PanelSection>

            <PanelSection
              kicker="Tricks"
              title="Mastery ladder"
              badge={`${unlockedTricks.length} / ${MVP_TRICKS.length} live`}
            >
              <div className="grid gap-1.5">
                {MVP_TRICKS.map((trick) => {
                  const progress = save.progress.trickProgress[trick.id]
                  const unlocked = progress?.unlocked ?? false

                  return (
                    <LineItem
                      key={trick.id}
                      title={trick.name}
                      detail={trick.summary}
                      meta={[
                        `x${trick.baseMultiplier.toFixed(2)}`,
                        `${progress?.uses ?? 0}/${trick.masteryUses}`,
                        progress?.mastered ? 'mastered' : unlocked ? 'live' : `L${trick.unlockLevel}`,
                      ]}
                      live={unlocked}
                    />
                  )
                })}
              </div>
            </PanelSection>

            <PanelSection kicker="Perks" title="Base values">
              <div className="grid gap-1.5">
                {MVP_MOD_POOL.map((mod) => (
                  <LineItem
                    key={mod.id}
                    title={mod.name}
                    detail={mod.summary}
                    meta={[
                      mod.isPerTurnStacking
                        ? `${formatPercent(mod.baseValue)} / turn`
                        : `${formatPercent(mod.baseValue)} face`,
                    ]}
                    live
                  />
                ))}
              </div>
            </PanelSection>
          </div>
        )}

        {activeTab === 'turn' && (
          <div className="grid gap-2">
            <PanelSection kicker="Turn Data" title="Latest resolution" badge={`Save v${SAVE_VERSION}`}>
              {lastTurn ? (
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <MetricCard label="Rolled" value={lastTurn.rolledFaces.join(' · ')} />
                    <MetricCard label="Base" value={formatCurrency(lastTurn.baseReward.money)} />
                    <MetricCard label="Tricks" value={formatCurrency(lastTurn.trickReward.money)} />
                    <MetricCard
                      label="Extra"
                      value={`${formatNumber(lastTurn.extraReward.turnPoints)} TP`}
                    />
                  </div>

                  <LineItem
                    title={`Total ${formatCurrency(lastTurn.totalReward.money)} and ${formatNumber(lastTurn.totalReward.xp)} XP`}
                    detail={
                      lastTurn.trickLines.length > 0
                        ? lastTurn.trickLines
                            .map(
                              (line) =>
                                `${line.trickName} x${line.multiplier.toFixed(2)} on ${line.faces.join(', ')}`,
                            )
                            .join(' | ')
                        : 'No trick lines this turn. Base payouts carried it.'
                    }
                    meta={[`T${lastTurn.turnNumber}`, `${lastTurn.extraTurnsAwarded} extra turns`]}
                    live
                  />
                </div>
              ) : (
                <p className="text-[0.66rem] leading-[1.1rem] text-stone-300/78">
                  No resolved turn yet. Roll once to populate the feed.
                </p>
              )}
            </PanelSection>

            <PanelSection kicker="Feed" title="Recent events">
              <div className="grid gap-1.5">
                {save.run.log.map((entry) => (
                  <LineItem
                    key={entry.id}
                    title={entry.title}
                    detail={entry.detail}
                    meta={[`T${entry.turnNumber}`]}
                    live
                  />
                ))}
              </div>
            </PanelSection>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="grid gap-2">
            <PanelSection
              kicker="Session"
              title="Local save"
              badge={new Date(save.meta.updatedAt).toLocaleTimeString()}
            >
              <div className="grid gap-1.5">
                <LineItem
                  title="Current alpha slice"
                  detail="Local-first SPA with deterministic turn resolution, die growth, trick unlocks, and one persistent browser save slot."
                  meta={[
                    `${unlockedTricks.length} tricks`,
                    `${save.run.dice.length} dice`,
                    save.run.phase,
                  ]}
                  live
                />

                <ActionRow
                  label="Full Save Wipe"
                  detail="Clear run state and permanent progress"
                  value="delete"
                  onClick={onFullWipe}
                  destructive
                />
              </div>
            </PanelSection>

            <PanelSection kicker="Notes" title="Current rules">
              <div className="grid gap-1.5">
                <LineItem
                  title="Extra resource perks"
                  detail="Rank 1 starts at +100% of face and scales upward by full-face increments."
                  meta={['live']}
                  live
                />
                <LineItem
                  title="Money formatting"
                  detail="Costs and payouts are shown as cents-rounded currency."
                  meta={['ui cleanup']}
                  live
                />
                <LineItem
                  title="Reset boundary"
                  detail="Run reset keeps meta progress. Full wipe clears everything."
                  meta={['local-first']}
                  live
                />
              </div>
            </PanelSection>
          </div>
        )}
      </div>
    </aside>
  )
}
