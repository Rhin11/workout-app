import { useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import PRCard from './PRCard';
import type { PersonalRecord } from '../../utils/prs';

interface Props {
  prs: PersonalRecord[];
  mainLifts: string[];
  onClose: () => void;
}

/**
 * Full PR list across every logged exercise — main lifts first, then the rest,
 * each group sorted by estimated 1RM (heaviest first).
 */
export default function AllPRsModal({ prs, mainLifts, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const ordered = useMemo(() => {
    const mainSet = new Set(mainLifts.map((l) => l.trim().toLowerCase()));
    const isMain = (pr: PersonalRecord) => mainSet.has(pr.exercise.trim().toLowerCase());
    const byE1rm = (a: PersonalRecord, b: PersonalRecord) => b.e1rm - a.e1rm;
    const main = prs.filter(isMain).sort(byE1rm);
    const rest = prs.filter((pr) => !isMain(pr)).sort(byE1rm);
    return [...main, ...rest];
  }, [prs, mainLifts]);

  return (
    <ModalShell title="All personal records" onClose={onClose}>
      {ordered.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No PRs logged yet.</p>
      ) : (
        <div className="space-y-2">
          {ordered.map((pr) => (
            <PRCard
              key={pr.exercise}
              pr={pr}
              isOpen={expanded === pr.exercise}
              onToggle={() => setExpanded(expanded === pr.exercise ? null : pr.exercise)}
            />
          ))}
        </div>
      )}
    </ModalShell>
  );
}
