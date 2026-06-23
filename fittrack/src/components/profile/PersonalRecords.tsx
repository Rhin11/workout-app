import { useMemo, useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { computePRs, type PersonalRecord } from '../../utils/prs';
import type { Workout } from '../../store/workoutStore';
import PRCard from './PRCard';
import MainLiftsModal from './MainLiftsModal';
import AllPRsModal from './AllPRsModal';

const card = 'rounded-xl border border-[#2A2A2A] bg-[#141414] p-4';

interface Props {
  workouts: Workout[];
}

/**
 * Personal Records section: featured "main lifts" (user-editable, persisted) at
 * the top, with a "See all PRs" view for every logged exercise including
 * accessories. PR math + the card UI are unchanged — this only controls which
 * PRs are featured vs. tucked into "see all".
 */
export default function PersonalRecords({ workouts }: Props) {
  const { mainLifts, setMainLifts } = useProfileStore();
  const prs = useMemo(() => computePRs(workouts), [workouts]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  // Featured cards follow the user's main-lifts order; match PRs case-insensitively.
  const featured = useMemo(() => {
    const byName = new Map<string, PersonalRecord>();
    for (const pr of prs) byName.set(pr.exercise.trim().toLowerCase(), pr);
    return mainLifts.map((name) => ({ name, pr: byName.get(name.trim().toLowerCase()) ?? null }));
  }, [prs, mainLifts]);

  const loggedExercises = useMemo(() => prs.map((pr) => pr.exercise), [prs]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-100">Personal Records</h2>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
          aria-label="Edit main lifts"
          title="Edit main lifts"
        >
          {/* pencil */}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.506l-3.2.914a.5.5 0 01-.618-.618l.914-3.2a2 2 0 01.506-.878l8.5-8.5z" />
          </svg>
          Edit main lifts
        </button>
      </div>

      {/* Featured main lifts */}
      <div className="space-y-2">
        {featured.length === 0 ? (
          <div className={`${card} text-center text-sm text-gray-500`}>
            No main lifts selected. Tap “Edit main lifts” to choose some.
          </div>
        ) : (
          featured.map(({ name, pr }) =>
            pr ? (
              <PRCard
                key={name}
                pr={pr}
                isOpen={expanded === pr.exercise}
                onToggle={() => setExpanded(expanded === pr.exercise ? null : pr.exercise)}
              />
            ) : (
              <div key={name} className={`${card} flex items-center justify-between gap-3`}>
                <p className="truncate font-semibold text-gray-400">{name}</p>
                <p className="shrink-0 text-xs text-gray-600">No PR yet</p>
              </div>
            ),
          )
        )}
      </div>

      {/* See all PRs */}
      {prs.length > 0 && (
        <button
          type="button"
          onClick={() => setAllOpen(true)}
          className="mt-3 w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
        >
          See all PRs ({prs.length})
        </button>
      )}

      {editOpen && (
        <MainLiftsModal
          mainLifts={mainLifts}
          loggedExercises={loggedExercises}
          onChange={setMainLifts}
          onClose={() => setEditOpen(false)}
        />
      )}
      {allOpen && (
        <AllPRsModal prs={prs} mainLifts={mainLifts} onClose={() => setAllOpen(false)} />
      )}
    </section>
  );
}
