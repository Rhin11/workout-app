import {
  MAX_REST_SECONDS,
  MIN_REST_SECONDS,
  type Exercise,
  type SupersetGroup,
} from '../../store/workoutStore';
import { useRestTimer } from '../../store/restTimerStore';
import { formatMMSS } from '../../utils/time';
import RestToggle from './RestToggle';
import SetRow from './SetRow';

interface Props {
  label: string;
  group: SupersetGroup;
  exercises: Exercise[];
  onUpdateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<{ reps: number; weight: number; unit: 'lbs' | 'kg'; completed: boolean }>,
  ) => void;
  onAddRound: () => void;
  onRemoveRound: (roundIndex: number) => void;
  onChangeRest: (restSeconds: number) => void;
  onToggleRest: (enabled: boolean) => void;
  onUnlink: (exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onAddExercise: () => void;
}

const REST_STEP = 15;

export default function SupersetGroupCard({
  label,
  group,
  exercises,
  onUpdateSet,
  onAddRound,
  onRemoveRound,
  onChangeRest,
  onToggleRest,
  onUnlink,
  onRemoveExercise,
  onAddExercise,
}: Props) {
  const restSeconds = group.restSeconds;
  const restEnabled = group.restEnabled ?? true;
  const startRest = useRestTimer((s) => s.start);
  const lastExerciseId = exercises[exercises.length - 1]?.id;
  const rounds = exercises.reduce((max, e) => Math.max(max, e.sets.length), 0);

  const handleUpdateSet: Props['onUpdateSet'] = (exerciseId, setId, updates) => {
    onUpdateSet(exerciseId, setId, updates);
    // Rest fires only after the LAST exercise in the round is completed.
    if (
      updates.completed === true &&
      exerciseId === lastExerciseId &&
      restEnabled &&
      restSeconds > 0
    ) {
      startRest(group.id, label, restSeconds);
    }
  };

  return (
    <div className="rounded-xl border border-[#2A2A2A] border-l-4 border-l-[#6C63FF] bg-[#141414] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: '#6C63FF' }}
          >
            {label}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {exercises.map((e) => (
              <span key={e.id} className="flex items-center gap-1 text-sm text-gray-200">
                {e.name}
                <button
                  type="button"
                  onClick={() => onUnlink(e.id)}
                  className="text-xs text-gray-500 hover:text-indigo-400"
                  title="Remove from superset"
                >
                  unlink
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveExercise(e.id)}
                  className="text-gray-600 hover:text-red-400"
                  title="Delete exercise"
                  aria-label={`Delete ${e.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onAddExercise}
          className="shrink-0 rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-white"
        >
          + Add exercise
        </button>
      </div>

      {/* Column header */}
      <div
        className="mb-1 grid gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"
        style={{ gridTemplateColumns: '6rem 1fr 1fr 2.5rem 2rem' }}
      >
        <span className="pl-1">Lift</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rounds }, (_, r) => (
          <div key={r}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Round {r + 1}</span>
              {rounds > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveRound(r)}
                  className="text-xs text-gray-600 hover:text-red-400"
                >
                  remove round
                </button>
              )}
            </div>
            {exercises.map((e) => {
              const s = e.sets[r];
              if (!s) return null;
              return (
                <SetRow
                  key={e.id}
                  setNumber={r + 1}
                  leadingLabel={e.name}
                  set={s}
                  onUpdate={(updates) => handleUpdateSet(e.id, s.id, updates)}
                  onRemove={() => {}}
                  canRemove={false}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAddRound}
          className="flex-1 rounded-lg border border-dashed border-gray-700 py-2 text-sm text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
        >
          + Add Round
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-1.5 py-1">
          <RestToggle enabled={restEnabled} onToggle={onToggleRest} />
          <span className="px-1 text-xs uppercase tracking-wide text-gray-500">Rest</span>
          <button
            type="button"
            onClick={() => onChangeRest(Math.max(MIN_REST_SECONDS, restSeconds - REST_STEP))}
            disabled={!restEnabled || restSeconds <= MIN_REST_SECONDS}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-30"
            aria-label="Decrease rest time"
          >
            −
          </button>
          <span
            className={`w-12 text-center text-sm font-medium tabular-nums ${
              restEnabled ? 'text-gray-100' : 'text-gray-600'
            }`}
          >
            {formatMMSS(restSeconds)}
          </span>
          <button
            type="button"
            onClick={() => onChangeRest(Math.min(MAX_REST_SECONDS, restSeconds + REST_STEP))}
            disabled={!restEnabled || restSeconds >= MAX_REST_SECONDS}
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
