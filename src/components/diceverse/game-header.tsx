export function GameHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-700/75 bg-[linear-gradient(180deg,rgba(15,16,15,0.96),rgba(10,11,10,0.9))] backdrop-blur">
      <div className="flex min-h-12 items-center justify-between gap-3 px-2 py-2 md:px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="text-[1rem] font-semibold uppercase tracking-[0.18em] text-stone-100 md:text-[1.06rem]">
            Diceverse
          </h1>
          <span className="rounded-[0.35rem] border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-amber-100/85">
            v0.0.1a
          </span>
          <span className="hidden text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-stone-500 sm:inline">
            local-first incremental dice board
          </span>
        </div>

        <nav className="flex shrink-0 flex-wrap items-center gap-1 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-stone-400">
          <span className="rounded-[0.35rem] border border-stone-700/75 bg-stone-900/80 px-1.5 py-0.5">
            Control Surface
          </span>
          <span className="rounded-[0.35rem] border border-stone-700/75 bg-stone-900/80 px-1.5 py-0.5">
            Reactive SPA
          </span>
        </nav>
      </div>
    </header>
  )
}
