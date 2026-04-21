import type { DieState } from '../../game/types'
import { cn } from '../../lib/utils'
import { formatModEffect, modById } from './format'

type DieTileProps = {
  die: DieState
  selected: boolean
  onSelect: () => void
}

export function DieTile({ die, selected, onSelect }: DieTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex aspect-square min-h-0 flex-col items-center justify-between overflow-hidden rounded-[0.9rem] border px-2.5 py-2 text-center transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)]',
        selected
          ? 'border-amber-300/55 bg-[linear-gradient(180deg,#f4efe1,#ddd5c1)] text-stone-950 shadow-[0_16px_38px_rgba(245,204,92,0.12)]'
          : 'border-stone-700/70 bg-[linear-gradient(180deg,#d9d2c2,#c9c0ad)] text-stone-950',
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-stone-600">
        <span className="truncate">{die.name}</span>
        <span>{selected ? 'on' : 'view'}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-1">
        <div className="text-[2.6rem] font-semibold leading-none tracking-[-0.12em] text-stone-950 md:text-[3.15rem]">
          {die.currentFace ?? '?'}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-stone-600">
          <span>d{die.faceCap}</span>
          <span>P{die.prestige}</span>
        </div>
      </div>

      <div className="flex w-full flex-wrap justify-center gap-1">
        <span className="rounded-[0.4rem] border border-stone-950/10 bg-stone-950 px-1.5 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-stone-50">
          mult x{die.dieMult.toFixed(2)}
        </span>

        {die.mods.map((mod) => (
          <span
            className="flex max-w-full flex-col rounded-[0.5rem] border border-emerald-950/10 bg-emerald-100 px-1.5 py-1 text-left text-[0.5rem] font-semibold uppercase tracking-[0.06em] text-emerald-950"
            key={`${die.id}-${mod.effectId}`}
          >
            {modById[mod.effectId].name}
            <em className="mt-0.5 text-[0.48rem] not-italic tracking-[0.04em] text-emerald-900/75">
              {formatModEffect(mod.rank, mod.effectId)}
            </em>
          </span>
        ))}

        {die.mods.length < die.slotsUnlocked ? (
          <span className="rounded-[0.5rem] border border-dashed border-stone-500/60 bg-stone-200/70 px-1.5 py-1 text-[0.48rem] font-semibold uppercase tracking-[0.08em] text-stone-600">
            open · {die.slotsUnlocked - die.mods.length}
          </span>
        ) : null}
      </div>
    </button>
  )
}
