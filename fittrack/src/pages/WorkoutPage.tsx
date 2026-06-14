import { useState } from 'react';
import ExerciseCard from '../components/workout/ExerciseCard';
import ExercisePicker from '../components/workout/ExercisePicker';
import WorkoutHistory from '../components/workout/WorkoutHistory';
import WorkoutSummary from '../components/workout/WorkoutSummary';
import { useWorkoutStore } from '../store/workoutStore';

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
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    updateExerciseNotes,
  } = useWorkoutStore();

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);
  const pastWorkouts = workouts.filter((w) => w.finishedAt !== null);
  const addedExercises = activeWorkout?.exercises.map((e) => e.name) ?? [];
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const handleAddExercise = (name: string) => {
    addExercise(name);
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

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-800 bg-gray-900 lg:w-80">
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

          {activeWorkout.exercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
              <p className="text-gray-400">Select a lift from the sidebar to get started</p>
              <p className="mt-1 text-sm text-gray-600">Search or browse by muscle and equipment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeWorkout.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onAddSet={() => addSet(exercise.id)}
                  onRemoveExercise={() => removeExercise(exercise.id)}
                  onUpdateNotes={(notes) => updateExerciseNotes(exercise.id, notes)}
                  onUpdateSet={(setId, updates) => updateSet(exercise.id, setId, updates)}
                  onRemoveSet={(setId) => removeSet(exercise.id, setId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
