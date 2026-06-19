import { useMemo, useState } from 'react';
import { useBarbellStore, type BarbellSession } from '../../store/barbellStore';
import { exercisesByRecency, groupByExercise, sessionDate } from '../../utils/barbellTrends';
import LiftTrend from './LiftTrend';
import TagAnalysisModal from './TagAnalysisModal';
import type { AnalysisTag } from './TagForm';

interface Props {
  onSelect: (session: BarbellSession) => void;
  activeId: string | null;
}

const ALL = '__all__';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWeight(session: BarbellSession): string | null {
  if (session.weight == null) return null;
  return `${session.weight} ${session.weightUnit ?? 'lbs'}`;
}

function SessionCard({
  session,
  active,
  onSelect,
  onDelete,
  onTag,
}: {
  session: BarbellSession;
  active: boolean;
  onSelect: (s: BarbellSession) => void;
  onDelete: (id: string) => void;
  onTag: (s: BarbellSession) => void;
}) {
  const weight = formatWeight(session);
  const tagged = Boolean(session.exerciseName);
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-[#0F0F0F] transition-colors ${
        active ? 'border-[#6C63FF]' : 'border-[#2A2A2A] hover:border-[#6C63FF]/60'
      }`}
    >
      <button type="button" onClick={() => onSelect(session)} className="block w-full text-left">
        <div className="aspect-[3/4] w-full bg-black">
          {session.thumbnail ? (
            <img src={session.thumbnail} alt="Lift thumbnail" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">🏋️</div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-sm font-medium text-gray-100">{formatDate(sessionDate(session))}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {session.analysis.rep_count} rep{session.analysis.rep_count === 1 ? '' : 's'}
            {weight ? ` · ${weight}` : ''}
          </p>
        </div>
      </button>

      {/* Tag control — sibling of the main button (no nested buttons). */}
      {tagged ? (
        <div className="flex justify-end border-t border-[#1f1f1f] px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => onTag(session)}
            className="text-xs font-medium text-gray-500 transition-colors hover:text-[#6C63FF]"
          >
            Edit tag
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onTag(session)}
          className="block w-full border-t border-[#6C63FF]/40 bg-[#6C63FF]/10 px-2.5 py-2 text-center text-xs font-semibold text-[#6C63FF] transition-colors hover:bg-[#6C63FF]/20"
        >
          Tag this lift
        </button>
      )}

      <button
        type="button"
        onClick={() => onDelete(session.id)}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-gray-300 opacity-0 transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100"
        aria-label="Delete analysis"
      >
        ×
      </button>
    </div>
  );
}

export default function AnalysisHistory({ onSelect, activeId }: Props) {
  const sessions = useBarbellStore((s) => s.sessions);
  const removeSession = useBarbellStore((s) => s.removeSession);
  const updateSession = useBarbellStore((s) => s.updateSession);

  const groups = useMemo(() => groupByExercise(sessions), [sessions]);
  const exerciseNames = useMemo(() => exercisesByRecency(sessions), [sessions]);

  // Default to the most-recently-active lift so the trend is visible immediately.
  const [filter, setFilter] = useState<string>(() => exerciseNames[0] ?? ALL);
  const [taggingSession, setTaggingSession] = useState<BarbellSession | null>(null);

  if (sessions.length === 0) return null;

  const handleTagSave = (tag: AnalysisTag) => {
    if (taggingSession) updateSession(taggingSession.id, tag);
    setTaggingSession(null);
  };

  // Keep "All" as-is; fall back to the most recent lift only when the selected
  // lift no longer exists (e.g. its last session was deleted).
  const activeFilter =
    filter === ALL || groups.has(filter) ? filter : (exerciseNames[0] ?? ALL);

  const sortByRecent = (list: BarbellSession[]) =>
    [...list].sort((a, b) => new Date(sessionDate(b)).getTime() - new Date(sessionDate(a)).getTime());

  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-100">Past analyses</h2>

      {/* Per-exercise filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="All" active={activeFilter === ALL} onClick={() => setFilter(ALL)} />
        {exerciseNames.map((name) => (
          <FilterChip
            key={name}
            label={`${name} · ${groups.get(name)!.length}`}
            active={activeFilter === name}
            onClick={() => setFilter(name)}
          />
        ))}
      </div>

      {activeFilter === ALL ? (
        <div className="space-y-5">
          {exerciseNames.map((name) => (
            <div key={name}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {name}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sortByRecent(groups.get(name)!).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    active={session.id === activeId}
                    onSelect={onSelect}
                    onDelete={removeSession}
                    onTag={setTaggingSession}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <LiftTrend exerciseName={activeFilter} sessions={groups.get(activeFilter)!} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sortByRecent(groups.get(activeFilter)!).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                active={session.id === activeId}
                onSelect={onSelect}
                onDelete={removeSession}
                onTag={setTaggingSession}
              />
            ))}
          </div>
        </>
      )}

      {taggingSession && (
        <TagAnalysisModal
          initial={{
            exerciseName: taggingSession.exerciseName,
            date: taggingSession.date ?? taggingSession.createdAt,
            weight: taggingSession.weight,
            weightUnit: taggingSession.weightUnit,
          }}
          isEdit={Boolean(taggingSession.exerciseName)}
          onSave={handleTagSave}
          onClose={() => setTaggingSession(null)}
        />
      )}
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-[#6C63FF] text-white'
          : 'border border-[#2A2A2A] text-gray-400 hover:border-[#6C63FF]/60 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
