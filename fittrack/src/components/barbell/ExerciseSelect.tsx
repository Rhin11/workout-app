import { useEffect, useRef, useState } from 'react';
import { searchExercises } from '../../constants/exercises';

interface Props {
  value: string;
  onChange: (name: string) => void;
}

/**
 * Lightweight searchable single-select for tagging an analysis with a lift. Uses
 * the same exercise library/search as the Workout logger so tagging is
 * consistent across the app. Allows a free-text custom name as a fallback.
 */
export default function ExerciseSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trimmed = query.trim();
  // React Compiler memoizes this automatically; no manual useMemo needed.
  const results = searchExercises(query).slice(0, 10);
  const exactMatch = results.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const select = (name: string) => {
    onChange(name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setQuery('');
          }}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-left text-sm text-gray-100 transition-colors hover:border-[#6C63FF]"
        >
          <span className="font-medium">{value}</span>
          <span className="text-xs text-[#6C63FF]">Change</span>
        </button>
      ) : (
        <input
          type="text"
          autoFocus={open}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search lifts…"
          className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-[#6C63FF]"
        />
      )}

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] shadow-xl">
          {results.map((exercise) => (
            <button
              key={exercise.name}
              type="button"
              onClick={() => select(exercise.name)}
              className="flex w-full items-center justify-between gap-3 border-b border-[#1f1f1f] px-3 py-2 text-left transition-colors last:border-0 hover:bg-[#1a1a1a]"
            >
              <span className="truncate text-sm text-gray-100">{exercise.name}</span>
              <span className="shrink-0 text-xs text-gray-500">{exercise.category}</span>
            </button>
          ))}
          {trimmed && !exactMatch && (
            <button
              type="button"
              onClick={() => select(trimmed)}
              className="w-full border-t border-[#2A2A2A] px-3 py-2 text-left text-sm text-[#6C63FF] hover:bg-[#1a1a1a]"
            >
              Use “{trimmed}”
            </button>
          )}
          {results.length === 0 && !trimmed && (
            <p className="px-3 py-2 text-sm text-gray-500">Type to search lifts…</p>
          )}
        </div>
      )}
    </div>
  );
}
