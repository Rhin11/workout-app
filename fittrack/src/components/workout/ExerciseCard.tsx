import { useState } from 'react';
import {
  DEFAULT_REST_SECONDS,
  MAX_REST_SECONDS,
  MIN_REST_SECONDS,
  type Exercise,
} from '../../store/workoutStore';
import { useRestTimer } from '../../store/restTimerStore';
import { formatMMSS } from '../../utils/time';
import AskCoachButton from './AskCoachButton';
import ExerciseInfoButton from './ExerciseInfoButton';
import SetRow from './SetRow';

interface Props {
  exercise: Exercise;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateSet: (
    setId: string,
    updates: Partial<{ reps: number; weight: number; unit: 'lbs' | 'kg'; completed: boolean }>,
  ) => void;
  onRemoveSet: (setId: string) => void;
  onChangeRest: (restSeconds: number) => void;
  // Superset grouping
  selecting?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
  onStartGrouping?: () => void;
  availableGroups?: { id: string; label: string }[];
  onAddToGroup?: (supersetId: string) => void;
}

const REST_STEP = 15;

export default function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveExercise,
  onUpdateNotes,
  onUpdateSet,
  onRemoveSet,
  onChangeRest,
  selecting = false,
  selected = false,
  onToggleSelected,
  onStartGrouping,
  availableGroups = [],
  onAddToGroup,
}: Props) {
  const hasNotes = Boolean(exercise.notes?.trim());
  const [showNotes, setShowNotes] = useState(hasNotes);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  const restSeconds = exercise.restSeconds ?? DEFAULT_REST_SECONDS;
  const startRest = useRestTimer((s) => s.start);

  const beginRest = () => {
    if (restSeconds > 0) startRest(exercise.id, exercise.name, restSeconds);
  };

  const handleAddSet = () => {
    onAddSet();
  };

  const handleUpdateSet: Props['onUpdateSet'] = (setId, updates) => {
    onUpdateSet(setId, updates);
    if (updates.completed === true) beginRest();
  };

  const totalVolume = exercise.sets.reduce(
    (sum, s) => sum + (s.completed ? s.reps * s.weight : 0),
    0,
  );

  return (
    <div
      className={`rounded-xl border bg-gray-900 p-4 transition-colors ${
        selected ? 'border-[#6C63FF] ring-1 ring-[#6C63FF]' : 'border-gray-800'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-100">{exercise.name}</h3>
            <ExerciseInfoButton exerciseName={exercise.name} size="sm" />
          </div>
          {totalVolume > 0 && (
            <p className="mt-0.5 text-xs text-gray-500">
              {exercise.sets.filter((s) => s.completed).length} sets · {totalVolume.toLocaleString()}{' '}
              {exercise.sets[0]?.unit ?? 'lbs'} volume
            </p>
          )}
          {showNotes ? (
            <div className="mt-2">
              <textarea
                value={exercise.notes ?? ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Notes — tempo, RPE, form cues..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-indigo-500"
              />
              {!exercise.notes?.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNotes('');
                    setShowNotes(false);
                  }}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="mt-2 text-xs text-gray-500 hover:text-indigo-400"
            >
              + Add note
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selecting ? (
            <button
              type="button"
              onClick={onToggleSelected}
              className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                selected
                  ? 'border-[#6C63FF] bg-[#6C63FF]/15 text-[#6C63FF]'
                  : 'border-[#2A2A2A] text-gray-400 hover:text-white'
              }`}
            >
              <span>{selected ? '☑' : '☐'}</span>
              {selected ? 'Selected' : 'Select'}
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (availableGroups.length === 0) {
                    onStartGrouping?.();
                  } else {
                    setGroupMenuOpen((o) => !o);
                  }
                }}
                className="text-sm text-gray-500 hover:text-[#6C63FF]"
              >
                Superset
              </button>
              {groupMenuOpen && availableGroups.length > 0 && (
                <div className="absolute right-0 top-6 z-10 w-44 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414] py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMenuOpen(false);
                      onStartGrouping?.();
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800"
                  >
                    New superset…
                  </button>
                  {availableGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGroupMenuOpen(false);
                        onAddToGroup?.(g.id);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800"
                    >
                      Add to {g.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <AskCoachButton exerciseName={exercise.name} />
          <button
            type="button"
            onClick={onRemoveExercise}
            className="text-sm text-gray-500 hover:text-red-400"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-[2.5rem_1fr_1fr_2.5rem_2rem] gap-2 px-0 text-xs font-medium uppercase tracking-wide text-gray-500">
        <span className="text-center">Set</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>

      {exercise.sets.map((s, i) => (
        <SetRow
          key={s.id}
          setNumber={i + 1}
          set={s}
          onUpdate={(updates) => handleUpdateSet(s.id, updates)}
          onRemove={() => onRemoveSet(s.id)}
          canRemove={exercise.sets.length > 1}
        />
      ))}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAddSet}
          className="flex-1 rounded-lg border border-dashed border-gray-700 py-2 text-sm text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
        >
          + Add Set
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#141414] px-1.5 py-1">
          <span className="px-1 text-xs uppercase tracking-wide text-gray-500">Rest</span>
          <button
            type="button"
            onClick={() => onChangeRest(Math.max(MIN_REST_SECONDS, restSeconds - REST_STEP))}
            disabled={restSeconds <= MIN_REST_SECONDS}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-30"
            aria-label="Decrease rest time"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-medium tabular-nums text-gray-100">
            {formatMMSS(restSeconds)}
          </span>
          <button
            type="button"
            onClick={() => onChangeRest(Math.min(MAX_REST_SECONDS, restSeconds + REST_STEP))}
            disabled={restSeconds >= MAX_REST_SECONDS}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-30"
            aria-label="Increase rest time"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
