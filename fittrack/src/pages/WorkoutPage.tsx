import { useState } from 'react';
import ExerciseCard from '../components/workout/ExerciseCard';
import ExercisePicker from '../components/workout/ExercisePicker';
import RestTimerBar from '../components/workout/RestTimerBar';
import SupersetGroupCard from '../components/workout/SupersetGroupCard';
import WorkoutHistory from '../components/workout/WorkoutHistory';
import WorkoutSummary from '../components/workout/WorkoutSummary';
import { useWorkoutStore, type Exercise, type Workout } from '../store/workoutStore';

type RenderItem =
  | { type: 'single'; exercise: Exercise }
  | { type: 'group'; groupId: string; label: string; exercises: Exercise[] };

/** Walk the (contiguous) exercise list into singles and superset blocks, labeling groups A, B, … */
function buildRenderItems(workout: Workout): RenderItem[] {
  const groups = workout.supersetGroups ?? [];
  const labelOrder: string[] = [];
  for (const e of workout.exercises) {
    if (e.supersetId && !labelOrder.includes(e.supersetId)) labelOrder.push(e.supersetId);
  }
  const labelFor = (id: string) => `Superset ${String.fromCharCode(65 + labelOrder.indexOf(id))}`;

  const items: RenderItem[] = [];
  let i = 0;
  while (i < workout.exercises.length) {
    const e = workout.exercises[i];
    const gid = e.supersetId;
    if (gid && groups.some((g) => g.id === gid)) {
      const members: Exercise[] = [];
      while (i < workout.exercises.length && workout.exercises[i].supersetId === gid) {
        members.push(workout.exercises[i]);
        i += 1;
      }
      items.push({ type: 'group', groupId: gid, label: labelFor(gid), exercises: members });
    } else {
      items.push({ type: 'single', exercise: e });
      i += 1;
    }
  }
  return items;
}

export default function WorkoutPage() {
  const {
    workouts,
    activeWorkoutId,
    startWorkout,
    finishWorkout,
    editWorkout,
    renameWorkout,
    deleteWorkout,
    addExercise,
    addExerciseToSuperset,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    updateExerciseNotes,
    setExerciseRest,
    createSuperset,
    addToSuperset,
    removeFromSuperset,
    setSupersetRest,
    addSupersetRound,
    removeSupersetRound,
  } = useWorkoutStore();

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);
  const pastWorkouts = workouts.filter((w) => w.finishedAt !== null);
  const addedExercises = activeWorkout?.exercises.map((e) => e.name) ?? [];
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // Superset grouping UI state.
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null); // null = not selecting
  const [addTargetGroup, setAddTargetGroup] = useState<string | null>(null);

  const handleAddExercise = (name: string) => {
    if (addTargetGroup) {
      addExerciseToSuperset(name, addTargetGroup);
    } else {
      addExercise(name);
    }
  };

  const startGrouping = (exerciseId: string) => setSelectedIds([exerciseId]);
  const toggleSelected = (exerciseId: string) =>
    setSelectedIds((prev) => {
      if (!prev) return prev;
      return prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId];
    });
  const cancelGrouping = () => setSelectedIds(null);
  const confirmGrouping = () => {
    if (selectedIds && selectedIds.length >= 2) createSuperset(selectedIds);
    setSelectedIds(null);
  };

  const beginNameEdit = () => {
    if (!activeWorkout) return;
    setNameDraft(activeWorkout.name);
    setEditingName(true);
  };

  const saveNameEdit = () => {
    if (!activeWorkout) return;
    renameWorkout(activeWorkout.id, nameDraft);
    setEditingName(false);
  };

  if (!activeWorkout) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-100">Workout</h1>
          <p className="mt-2 text-gray-500">Log your lifts, sets, and weights</p>
          <button
            type="button"
            onClick={() => startWorkout()}
            className="mt-6 rounded-xl bg-indigo-500 px-8 py-3 font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Start Workout
          </button>
        </div>

        {pastWorkouts.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-200">History</h2>
            <WorkoutHistory
              workouts={pastWorkouts}
              onDelete={deleteWorkout}
              onEdit={editWorkout}
              onRename={renameWorkout}
            />
          </section>
        )}
      </div>
    );
  }

  const renderItems = buildRenderItems(activeWorkout);
  const groupOptions = (activeWorkout.supersetGroups ?? []).map((g) => ({
    id: g.id,
    label: `Superset ${String.fromCharCode(
      65 +
        renderItems
          .filter((it) => it.type === 'group')
          .findIndex((it) => it.type === 'group' && it.groupId === g.id),
    )}`,
  }));
  const selecting = selectedIds !== null;
  const addTargetLabel = addTargetGroup
    ? groupOptions.find((g) => g.id === addTargetGroup)?.label
    : undefined;

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-800 bg-gray-900 lg:w-80">
        {addTargetLabel && (
          <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2A] bg-[#6C63FF]/10 px-3 py-2 text-xs text-gray-200">
            <span>
              Adding to <span className="font-semibold text-[#6C63FF]">{addTargetLabel}</span>
            </span>
            <button
              type="button"
              onClick={() => setAddTargetGroup(null)}
              className="text-gray-400 hover:text-white"
            >
              Done
            </button>
          </div>
        )}
        <ExercisePicker
          layout="sidebar"
          onSelect={handleAddExercise}
          addedExercises={addedExercises}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveNameEdit();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-xl font-bold text-gray-100 outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={saveNameEdit}
                    className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm text-white hover:bg-indigo-400"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={beginNameEdit}
                  className="text-left text-xl font-bold text-gray-100 hover:text-indigo-300"
                  title="Edit workout name"
                >
                  {activeWorkout.name}
                </button>
              )}
              <p className="text-sm text-gray-500">
                {new Date(activeWorkout.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={finishWorkout}
              className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
            >
              Save Workout
            </button>
          </div>

          <WorkoutSummary workout={activeWorkout} className="mb-6" />

          {selecting && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#6C63FF]/50 bg-[#6C63FF]/10 px-4 py-3">
              <p className="text-sm text-gray-200">
                Select 2+ exercises to superset
                <span className="ml-2 text-[#6C63FF]">{selectedIds?.length ?? 0} selected</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelGrouping}
                  className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmGrouping}
                  disabled={(selectedIds?.length ?? 0) < 2}
                  className="rounded-lg bg-[#6C63FF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5a52e0] disabled:opacity-40"
                >
                  Create superset
                </button>
              </div>
            </div>
          )}

          {activeWorkout.exercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
              <p className="text-gray-400">Select a lift from the sidebar to get started</p>
              <p className="mt-1 text-sm text-gray-600">Search or browse by muscle and equipment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderItems.map((item) =>
                item.type === 'group' ? (
                  <SupersetGroupCard
                    key={item.groupId}
                    label={item.label}
                    group={
                      (activeWorkout.supersetGroups ?? []).find((g) => g.id === item.groupId)!
                    }
                    exercises={item.exercises}
                    onUpdateSet={(exerciseId, setId, updates) =>
                      updateSet(exerciseId, setId, updates)
                    }
                    onAddRound={() => addSupersetRound(item.groupId)}
                    onRemoveRound={(roundIndex) => removeSupersetRound(item.groupId, roundIndex)}
                    onChangeRest={(seconds) => setSupersetRest(item.groupId, seconds)}
                    onUnlink={(exerciseId) => removeFromSuperset(exerciseId)}
                    onRemoveExercise={(exerciseId) => removeExercise(exerciseId)}
                    onAddExercise={() => setAddTargetGroup(item.groupId)}
                  />
                ) : (
                  <ExerciseCard
                    key={item.exercise.id}
                    exercise={item.exercise}
                    onAddSet={() => addSet(item.exercise.id)}
                    onRemoveExercise={() => removeExercise(item.exercise.id)}
                    onUpdateNotes={(notes) => updateExerciseNotes(item.exercise.id, notes)}
                    onUpdateSet={(setId, updates) => updateSet(item.exercise.id, setId, updates)}
                    onRemoveSet={(setId) => removeSet(item.exercise.id, setId)}
                    onChangeRest={(seconds) => setExerciseRest(item.exercise.id, seconds)}
                    selecting={selecting}
                    selected={selectedIds?.includes(item.exercise.id) ?? false}
                    onToggleSelected={() => toggleSelected(item.exercise.id)}
                    onStartGrouping={() => startGrouping(item.exercise.id)}
                    availableGroups={groupOptions}
                    onAddToGroup={(supersetId) => addToSuperset(item.exercise.id, supersetId)}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <RestTimerBar />
    </div>
  );
}
