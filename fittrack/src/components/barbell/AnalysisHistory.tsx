import { useBarbellStore, type BarbellSession } from '../../store/barbellStore';

interface Props {
  onSelect: (session: BarbellSession) => void;
  activeId: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AnalysisHistory({ onSelect, activeId }: Props) {
  const sessions = useBarbellStore((s) => s.sessions);
  const removeSession = useBarbellStore((s) => s.removeSession);

  if (sessions.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-100">Past analyses</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sessions.map((session) => {
          const active = session.id === activeId;
          return (
            <div
              key={session.id}
              className={`group relative overflow-hidden rounded-lg border bg-[#0F0F0F] transition-colors ${
                active ? 'border-[#6C63FF]' : 'border-[#2A2A2A] hover:border-[#6C63FF]/60'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(session)}
                className="block w-full text-left"
              >
                <div className="aspect-[3/4] w-full bg-black">
                  {session.thumbnail ? (
                    <img
                      src={session.thumbnail}
                      alt="Lift thumbnail"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🏋️</div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium text-gray-100">
                    {session.analysis.rep_count} rep{session.analysis.rep_count === 1 ? '' : 's'}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(session.createdAt)}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => removeSession(session.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-gray-300 opacity-0 transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100"
                aria-label="Delete analysis"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
