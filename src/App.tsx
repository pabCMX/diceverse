import { startTransition, useEffect, useState } from 'react'
import {
  assignMod,
  buyDie,
  canAssignMod,
  canBuyDie,
  canLevelDie,
  canPrestigeDie,
  getBuyDieCost,
  levelDie,
  prestigeDie,
} from './game/actions'
import { getNextTrickUnlock, getXpThresholdForLevel } from './game/bootstrap'
import { resolveTurn } from './game/resolve'
import {
  clearPersistedSave,
  loadSave,
  persistSave,
  resetRunOnly,
  wipeAllProgress,
} from './game/storage'
import { DieTile } from './components/diceverse/die-tile'
import { GameHeader } from './components/diceverse/game-header'
import { OperatorDock, type OperatorTab } from './components/diceverse/operator-dock'

function createInitialAppState() {
  const save = loadSave()

  return {
    save,
    selectedDieId: save.run.dice[0]?.id ?? '',
  }
}

function App() {
  const [{ save: initialSave, selectedDieId: initialSelectedDieId }] = useState(
    createInitialAppState,
  )
  const [save, setSave] = useState(initialSave)
  const [selectedDieId, setSelectedDieId] = useState(initialSelectedDieId)
  const [activeTab, setActiveTab] = useState<OperatorTab>('shop')

  const nextLevelXp = getXpThresholdForLevel(save.progress.playerLevel)
  const nextTrick = getNextTrickUnlock(save.progress.playerLevel)
  const selectedDie = save.run.dice.find((die) => die.id === selectedDieId) ?? save.run.dice[0]
  const canAssignSelectedDie = selectedDie ? canAssignMod(save, selectedDie.id) : false
  const canLevelSelectedDie = selectedDie ? canLevelDie(save, selectedDie.id) : false
  const canPrestigeSelectedDie = selectedDie ? canPrestigeDie(save, selectedDie.id) : false

  useEffect(() => {
    persistSave(save)
  }, [save])

  useEffect(() => {
    if (!selectedDieId || save.run.dice.some((die) => die.id === selectedDieId)) {
      return
    }

    setSelectedDieId(save.run.dice[0]?.id ?? '')
  }, [save.run.dice, selectedDieId])

  const handleRoll = () => {
    startTransition(() => {
      setSave((current) => resolveTurn(current))
    })
  }

  const handleBuyDie = () => {
    startTransition(() => {
      setSave((current) => {
        const next = buyDie(current)
        const newestDie = next.run.dice[next.run.dice.length - 1]

        if (newestDie) {
          setSelectedDieId(newestDie.id)
        }

        return next
      })
    })
  }

  const handleResetRun = () => {
    startTransition(() => {
      setSave((current) => {
        const next = resetRunOnly(current)
        setSelectedDieId(next.run.dice[0]?.id ?? '')
        return next
      })
    })
  }

  const handleFullWipe = () => {
    startTransition(() => {
      clearPersistedSave()
      const next = wipeAllProgress()
      setSelectedDieId(next.run.dice[0]?.id ?? '')
      setSave(next)
    })
  }

  const handleLevelDie = () => {
    if (!selectedDie) {
      return
    }

    startTransition(() => {
      setSave((current) => levelDie(current, selectedDie.id))
    })
  }

  const handlePrestigeDie = () => {
    if (!selectedDie) {
      return
    }

    startTransition(() => {
      setSave((current) => prestigeDie(current, selectedDie.id))
    })
  }

  const handleAssignMod = (effectId: Parameters<typeof assignMod>[2]) => {
    if (!selectedDie) {
      return
    }

    startTransition(() => {
      setSave((current) => assignMod(current, selectedDie.id, effectId))
    })
  }

  return (
    <main className="grid h-screen w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <GameHeader />

      <div className="grid min-h-0 gap-2 px-2 pb-2 pt-1.5 md:px-3 md:pb-3 md:pt-2 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-h-0 overflow-y-auto rounded-[1rem] border border-stone-700/75 bg-[linear-gradient(180deg,rgba(28,29,27,0.96),rgba(18,19,18,0.96))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.32)] md:p-3.5">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Run Board
              </p>
              <h2 className="mt-1 text-[1.4rem] font-semibold uppercase tracking-[0.08em] text-stone-100 md:text-[1.55rem]">
                Dice Field
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-[0.45rem] border border-stone-700/75 bg-stone-900/90 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-stone-300">
                {save.run.dice.length} die{save.run.dice.length === 1 ? '' : 's'}
              </span>
              <span className="rounded-[0.45rem] border border-stone-700/75 bg-stone-900/90 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-stone-300">
                {selectedDie ? selectedDie.name : 'No die selected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(2,minmax(8.4rem,8.4rem))] justify-center gap-2 sm:grid-cols-[repeat(3,minmax(8.4rem,8.4rem))] xl:grid-cols-[repeat(4,minmax(8.4rem,8.4rem))] xl:justify-start">
            {save.run.dice.map((die) => (
              <DieTile
                key={die.id}
                die={die}
                selected={selectedDie?.id === die.id}
                onSelect={() => setSelectedDieId(die.id)}
              />
            ))}
          </div>
        </section>

        <OperatorDock
          activeTab={activeTab}
          onTabChange={setActiveTab}
          save={save}
          selectedDie={selectedDie}
          nextLevelXp={nextLevelXp}
          nextTrick={nextTrick}
          onBuyDie={handleBuyDie}
          onResetRun={handleResetRun}
          onFullWipe={handleFullWipe}
          onRoll={handleRoll}
          onLevelDie={handleLevelDie}
          onPrestigeDie={handlePrestigeDie}
          onAssignMod={handleAssignMod}
          rollDisabled={save.run.phase === 'runOver'}
          canBuy={canBuyDie(save)}
          canLevel={canLevelSelectedDie}
          canPrestige={canPrestigeSelectedDie}
          canAssign={canAssignSelectedDie}
          buyCost={getBuyDieCost(save)}
        />
      </div>
    </main>
  )
}

export default App
