import { useEffect, useState } from 'react';
import {
  MIN_PHASE_SECONDS,
  MIN_ROUNDS,
  PHASE_STEP,
  useConditioningStore,
  type Phase,
} from '../../store/conditioningStore';
import { totalSessionMs } from '../../utils/intervalSchedule';
import { formatMMSS } from '../../utils/time';

interface Props {
  onStart: () => void;
}

const stepBtn =
  'flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-30';

function PhaseRow({
  phase,
  index,
  count,
}: {
  phase: Phase;
  index: number;
  count: number;
}) {
  const { updatePhase, removePhase, movePhase } = useConditioningStore();
  const isWork = phase.type === 'work';

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={phase.name}
          onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
          placeholder="Phase name"
          className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
        />
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A]">
          <button
            type="button"
            onClick={() => updatePhase(phase.id, { type: 'work' })}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isWork ? 'bg-[#6C63FF] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Work
          </button>
          <button
            type="button"
            onClick={() => updatePhase(phase.id, { type: 'rest' })}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !isWork ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Rest
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#141414] px-1.5 py-1">
          <button
            type="button"
            onClick={() => updatePhase(phase.id, { durationSec: phase.durationSec - PHASE_STEP })}
            disabled={phase.durationSec <= MIN_PHASE_SECONDS}
            className={stepBtn}
            aria-label="Decrease duration"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums text-gray-100">
            {formatMMSS(phase.durationSec)}
          </span>
          <button
            type="button"
            onClick={() => updatePhase(phase.id, { durationSec: phase.durationSec + PHASE_STEP })}
            className={stepBtn}
            aria-label="Increase duration"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => movePhase(phase.id, 'up')}
            disabled={index === 0}
            className={stepBtn}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => movePhase(phase.id, 'down')}
            disabled={index === count - 1}
            className={stepBtn}
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => removePhase(phase.id)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-800 hover:text-red-400"
            aria-label="Delete phase"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CircuitBuilder({ onStart }: Props) {
  const {
    draft,
    addPhase,
    setRounds,
    saveCircuit,
    savedCircuits,
    loadCircuit,
    startEditCircuit,
    cancelEdit,
    deleteCircuit,
    editingCircuitId,
  } = useConditioningStore();
  const [saveName, setSaveName] = useState('');

  const { phases, rounds } = draft;
  const total = totalSessionMs(phases, rounds);
  const canStart = phases.length > 0;
  const editingCircuit = editingCircuitId
    ? savedCircuits.find((c) => c.id === editingCircuitId)
    : undefined;
  const isEditing = Boolean(editingCircuitId);

  useEffect(() => {
    if (!editingCircuitId) return;
    const circuit = savedCircuits.find((c) => c.id === editingCircuitId);
    if (circuit) setSaveName(circuit.name);
  }, [editingCircuitId, savedCircuits]);

  const handleSave = () => {
    const name = saveName.trim() || editingCircuit?.name.trim() || '';
    if (!name || phases.length === 0) return;
    saveCircuit(name);
    if (!isEditing) setSaveName('');
  };

  const handleCancelEdit = () => {
    cancelEdit();
    setSaveName('');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Conditioning</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? `Editing "${editingCircuit?.name}"` : 'Build an interval circuit'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
          <p className="text-xl font-semibold tabular-nums text-[#6C63FF]">{formatMMSS(total / 1000)}</p>
        </div>
      </header>

      {isEditing && (
        <section className="rounded-xl border border-[#6C63FF]/50 bg-[#6C63FF]/10 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="Circuit name"
              className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
            />
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={phases.length === 0}
              className="rounded-lg bg-[#6C63FF] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </section>
      )}

      {/* Phases */}
      <section className="space-y-2">
        {phases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2A2A2A] py-10 text-center text-sm text-gray-500">
            No phases yet — add one to start building.
          </div>
        ) : (
          phases.map((p, i) => (
            <PhaseRow key={p.id} phase={p} index={i} count={phases.length} />
          ))
        )}
        <button
          type="button"
          onClick={addPhase}
          className="w-full rounded-lg border border-dashed border-[#2A2A2A] py-2 text-sm text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
        >
          + Add phase
        </button>
      </section>

      {/* Rounds + Start */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">Rounds</span>
          <div className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-1.5 py-1">
            <button
              type="button"
              onClick={() => setRounds(rounds - 1)}
              disabled={rounds <= MIN_ROUNDS}
              className={stepBtn}
              aria-label="Fewer rounds"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums text-gray-100">
              {rounds}
            </span>
            <button
              type="button"
              onClick={() => setRounds(rounds + 1)}
              className={stepBtn}
              aria-label="More rounds"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="rounded-xl bg-[#6C63FF] px-8 py-2.5 font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40"
        >
          Start
        </button>
      </section>

      {/* Save new / saved list */}
      <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-4">
        {!isEditing && (
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="Name this circuit to save it"
              className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!saveName.trim() || phases.length === 0}
              className="shrink-0 rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}

        {savedCircuits.length > 0 && (
          <ul className={isEditing ? 'space-y-1.5' : 'mt-3 space-y-1.5'}>
            {savedCircuits.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  c.id === editingCircuitId
                    ? 'border-[#6C63FF]/50 bg-[#6C63FF]/10'
                    : 'border-[#2A2A2A] bg-[#0F0F0F]'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.phases.length} phases · {c.rounds} rounds ·{' '}
                    {formatMMSS(totalSessionMs(c.phases, c.rounds) / 1000)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditCircuit(c.id)}
                    className="rounded-lg border border-[#2A2A2A] px-3 py-1 text-xs text-gray-300 hover:border-[#6C63FF] hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => loadCircuit(c.id)}
                    className="rounded-lg border border-[#2A2A2A] px-3 py-1 text-xs text-gray-300 hover:border-[#6C63FF] hover:text-white"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCircuit(c.id)}
                    className="text-gray-500 hover:text-red-400"
                    aria-label={`Delete ${c.name}`}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
