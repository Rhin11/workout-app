import { useMemo, useState } from 'react';
import {
  EXERCISE_CATEGORIES,
  EXERCISE_COUNT,
  MUSCLE_GROUPS,
  POPULAR_LIFTS,
  searchExercises,
  type ExerciseCategory,
  type ExerciseDefinition,
  type MuscleGroup,
} from '../../constants/exercises';
import ExerciseInfoButton from './ExerciseInfoButton';

interface Props {
  onSelect: (name: string) => void;
  addedExercises?: string[];
  layout?: 'inline' | 'sidebar';
}

type FilterMode = 'type' | 'muscle';

function groupByKey(exercises: ExerciseDefinition[], key: 'category' | 'muscles') {
  const groups = new Map<string, ExerciseDefinition[]>();
  for (const exercise of exercises) {
    const keys = key === 'category' ? [exercise.category] : exercise.muscles;
    for (const groupKey of keys) {
      const list = groups.get(groupKey) ?? [];
      if (!list.some((e) => e.name === exercise.name)) list.push(exercise);
      groups.set(groupKey, list);
    }
  }
  return groups;
}

const MUSCLE_GROUP_ORDER = MUSCLE_GROUPS.filter((m) => m !== 'All');

export default function ExercisePicker({
  onSelect,
  addedExercises = [],
  layout = 'inline',
}: Props) {
  const isSidebar = layout === 'sidebar';
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('type');
  const [category, setCategory] = useState<ExerciseCategory>('All');
  const [muscle, setMuscle] = useState<MuscleGroup>('All');
  const [expanded, setExpanded] = useState(isSidebar);

  const trimmedQuery = query.trim();

  const results = useMemo(
    () =>
      searchExercises(query, {
        category: filterMode === 'type' ? category : 'All',
        muscle: filterMode === 'muscle' ? muscle : 'All',
      }),
    [query, filterMode, category, muscle],
  );

  const groupedByType = useMemo(() => groupByKey(results, 'category'), [results]);
  const groupedByMuscle = useMemo(() => groupByKey(results, 'muscles'), [results]);

  const exactMatch = results.some((e) => e.name.toLowerCase() === trimmedQuery.toLowerCase());
  const topResult = results[0];
  const showSearchDropdown = trimmedQuery.length > 0;
  const showGroupedBrowse =
    !trimmedQuery &&
    (isSidebar || expanded) &&
    ((filterMode === 'type' && category === 'All') ||
      (filterMode === 'muscle' && muscle === 'All'));

  const handleSelect = (name: string) => {
    onSelect(name);
    setQuery('');
    setExpanded(false);
  };

  const handleSubmit = () => {
    if (!trimmedQuery) return;
    if (topResult) {
      handleSelect(topResult.name);
      return;
    }
    handleSelect(trimmedQuery);
  };

  const switchMode = (mode: FilterMode) => {
    setFilterMode(mode);
    setCategory('All');
    setMuscle('All');
  };

  const showBrowsePanel = isSidebar ? !showSearchDropdown : expanded && !showSearchDropdown;

  return (
    <div
      className={
        isSidebar
          ? 'flex h-full flex-col bg-gray-900'
          : 'rounded-xl border border-gray-800 bg-gray-900'
      }
    >
      <div className={isSidebar ? 'border-b border-gray-800 p-4' : 'p-4'}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-100">Lifts</h3>
            <p className="text-xs text-gray-500">
              {EXERCISE_COUNT}+ exercises · search or browse
            </p>
          </div>
          {!isSidebar && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-indigo-500 hover:text-indigo-400"
            >
              {expanded ? 'Close' : 'Browse'}
            </button>
          )}
        </div>

        <div className="relative mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isSidebar) setExpanded(true);
              }}
              onFocus={() => {
                if (!isSidebar) setExpanded(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === 'Escape') {
                  setQuery('');
                  if (!isSidebar) setExpanded(false);
                }
              }}
              placeholder="Search lifts..."
              className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!trimmedQuery}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {showSearchDropdown && (
            <div
              className={`${
                isSidebar ? 'relative mt-2' : 'absolute left-0 right-0 z-20 mt-1'
              } max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-950 shadow-xl`}
            >
              {results.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-500">No lifts found</p>
                  {!exactMatch && (
                    <button
                      type="button"
                      onClick={() => handleSelect(trimmedQuery)}
                      className="mt-2 w-full rounded-lg border border-dashed border-indigo-500/50 bg-indigo-500/10 px-3 py-2 text-left text-sm text-indigo-300 hover:bg-indigo-500/20"
                    >
                      Add custom: <span className="font-medium">{trimmedQuery}</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {results.slice(0, 12).map((exercise) => (
                    <SearchResultRow
                      key={exercise.name}
                      exercise={exercise}
                      disabled={addedExercises.includes(exercise.name)}
                      onSelect={handleSelect}
                    />
                  ))}
                  {results.length > 12 && (
                    <p className="border-t border-gray-800 px-4 py-2 text-xs text-gray-500">
                      +{results.length - 12} more — keep typing to narrow down
                    </p>
                  )}
                  {!exactMatch && (
                    <button
                      type="button"
                      onClick={() => handleSelect(trimmedQuery)}
                      className="w-full border-t border-gray-800 px-4 py-2.5 text-left text-sm text-indigo-300 hover:bg-gray-900"
                    >
                      Add custom: <span className="font-medium">{trimmedQuery}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {!isSidebar && (
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_LIFTS.map((lift) => (
              <span key={lift} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelect(lift)}
                  disabled={addedExercises.includes(lift)}
                  className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {lift}
                </button>
                <ExerciseInfoButton exerciseName={lift} />
              </span>
            ))}
          </div>
        )}
      </div>

      {showBrowsePanel && (
        <div className={`flex min-h-0 flex-1 flex-col ${isSidebar ? '' : 'border-t border-gray-800'}`}>
          <div className="flex gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={() => switchMode('type')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMode === 'type'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              By Equipment
            </button>
            <button
              type="button"
              onClick={() => switchMode('muscle')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMode === 'muscle'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              By Muscle
            </button>
          </div>

          <div className={`flex flex-wrap gap-2 px-4 py-3 ${isSidebar ? '' : 'overflow-x-auto'}`}>
            {filterMode === 'type'
              ? EXERCISE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-indigo-500 text-white'
                        : 'border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))
              : MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMuscle(m)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      muscle === m
                        ? 'bg-indigo-500 text-white'
                        : 'border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto px-4 pb-4 ${isSidebar ? 'max-h-none' : 'max-h-72'}`}>
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No lifts in this category</p>
            ) : showGroupedBrowse ? (
              <div className="space-y-4">
                {(filterMode === 'type'
                  ? [...groupedByType.entries()]
                  : MUSCLE_GROUP_ORDER.map((m) => [m, groupedByMuscle.get(m) ?? []] as const).filter(
                      ([, items]) => items.length > 0,
                    )
                ).map(([group, exercises]) => (
                  <div key={group}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {group}
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {exercises.map((exercise) => (
                        <ExerciseButton
                          key={`${group}-${exercise.name}`}
                          exercise={exercise}
                          disabled={addedExercises.includes(exercise.name)}
                          onSelect={handleSelect}
                          compact={isSidebar}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {results.map((exercise) => (
                  <ExerciseButton
                    key={exercise.name}
                    exercise={exercise}
                    disabled={addedExercises.includes(exercise.name)}
                    onSelect={handleSelect}
                    compact={isSidebar}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  exercise,
  disabled,
  onSelect,
}: {
  exercise: ExerciseDefinition;
  disabled: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-800/80 px-3 py-1">
      <button
        type="button"
        onClick={() => onSelect(exercise.name)}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1.5 text-left transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-100">{exercise.name}</p>
          <p className="truncate text-xs text-gray-500">
            {exercise.category} · {exercise.muscles.slice(0, 3).join(', ')}
          </p>
        </div>
        {disabled ? (
          <span className="shrink-0 text-xs text-gray-600">Added</span>
        ) : (
          <span className="shrink-0 text-xs text-indigo-400">Select</span>
        )}
      </button>
      <ExerciseInfoButton exerciseName={exercise.name} />
    </div>
  );
}

function ExerciseButton({
  exercise,
  disabled,
  onSelect,
  compact = false,
}: {
  exercise: ExerciseDefinition;
  disabled: boolean;
  onSelect: (name: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${compact ? 'px-1' : 'px-0.5'}`}>
      <button
        type="button"
        onClick={() => onSelect(exercise.name)}
        disabled={disabled}
        className={`min-w-0 flex-1 rounded-lg text-left transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? 'flex items-center justify-between gap-2 px-2 py-2' : 'px-3 py-2'
        }`}
      >
        <span className="block truncate text-sm text-gray-300 hover:text-gray-100">{exercise.name}</span>
        <span className={`block text-xs text-gray-600 ${compact ? 'shrink-0' : ''}`}>
          {exercise.category}
        </span>
      </button>
      <ExerciseInfoButton exerciseName={exercise.name} />
    </div>
  );
}
