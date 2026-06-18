import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useProfileStore, type Units } from '../store/profileStore';
import { computePRs } from '../utils/prs';
import BodyweightChart from '../components/profile/BodyweightChart';
import MacroCalculator from '../components/profile/MacroCalculator';

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Downscale a picked image to a small JPEG data URL so it fits in localStorage. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas context'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const card = 'rounded-xl border border-[#2A2A2A] bg-[#141414] p-4';

export default function ProfilePage() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const {
    displayName,
    photoDataUrl,
    units,
    bodyweights,
    setDisplayName,
    setPhoto,
    setUnits,
    addBodyweight,
    removeBodyweight,
  } = useProfileStore();

  const prs = useMemo(() => computePRs(workouts), [workouts]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [macroCalcOpen, setMacroCalcOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [bwInput, setBwInput] = useState('');
  const [bwDate, setBwDate] = useState(todayKey());

  const latestBw = bodyweights[bodyweights.length - 1] ?? null;

  useEffect(() => {
    if (window.location.hash === '#macro-calculator') {
      setMacroCalcOpen(true);
      requestAnimationFrame(() => {
        document.getElementById('macro-calculator')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await resizeImage(file));
    } catch {
      /* ignore unreadable images */
    }
  };

  const onLogWeight = () => {
    const w = Number(bwInput);
    if (!(w > 0)) return;
    addBodyweight(bwDate, w);
    setBwInput('');
  };

  const name = displayName.trim() || 'Athlete';

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-y-auto px-4 py-8">
      {/* SECTION 1 — Header */}
      <section className={card}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#0F0F0F]"
            title="Change photo"
          >
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#6C63FF]">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPickPhoto(e.target.files?.[0])}
          />

          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Athlete"
              aria-label="Display name"
              className="w-full bg-transparent text-xl font-bold text-gray-100 outline-none placeholder:text-gray-600"
            />
            {photoDataUrl && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="mt-0.5 text-xs text-gray-500 hover:text-red-400"
              >
                Remove photo
              </button>
            )}
          </div>

          <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A]">
            {(['lbs', 'kg'] as Units[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  units === u ? 'bg-[#6C63FF] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION — Macro calculator */}
      <section id="macro-calculator">
        <div className={card}>
          <button
            type="button"
            onClick={() => setMacroCalcOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={macroCalcOpen}
          >
            <div className="min-w-0">
              <p className="font-semibold text-gray-100">Macro calculator</p>
              <p className="text-xs text-gray-500">
                Estimate daily calories and macros from your stats and goal.
              </p>
            </div>
            <span className="shrink-0 text-gray-500">{macroCalcOpen ? '▴' : '▾'}</span>
          </button>

          {macroCalcOpen && (
            <div className="mt-3 border-t border-[#2A2A2A] pt-3">
              <MacroCalculator hideIntro />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2 — Personal Records */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-100">Personal Records</h2>
        {prs.length === 0 ? (
          <div className={`${card} text-center text-sm text-gray-500`}>
            Log some workouts to start tracking PRs.
          </div>
        ) : (
          <div className="space-y-2">
            {prs.map((pr) => {
              const isOpen = expanded === pr.exercise;
              return (
                <div key={pr.exercise} className={card}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : pr.exercise)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-100">{pr.exercise}</p>
                      <p className="text-xs text-gray-500">
                        {pr.weight} {pr.unit} × {pr.reps} · {formatDate(pr.date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-right">
                      <div>
                        <p className="text-sm font-bold text-[#6C63FF]">
                          {Math.round(pr.e1rm)} {pr.unit}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">est. 1RM</p>
                      </div>
                      <span className="text-gray-500">{isOpen ? '▴' : '▾'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 border-t border-[#2A2A2A] pt-3">
                      {pr.history.length <= 1 ? (
                        <p className="text-xs text-gray-500">No earlier attempts logged yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {pr.history.map((h, i) => (
                            <li
                              key={`${h.date}-${i}`}
                              className="flex items-center justify-between text-xs text-gray-400"
                            >
                              <span>{formatDate(h.date)}</span>
                              <span>
                                {h.weight} {h.unit} × {h.reps}
                                <span className="ml-2 text-gray-600">
                                  ~{Math.round(h.e1rm)} {h.unit}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3 — Bodyweight */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-100">Bodyweight</h2>
        <div className={`${card} space-y-4`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Current</p>
              {latestBw ? (
                <p className="text-2xl font-bold text-gray-100">
                  {latestBw.weight}{' '}
                  <span className="text-base font-medium text-gray-500">{latestBw.unit}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">No entries yet</p>
              )}
            </div>
            {latestBw && (
              <p className="text-xs text-gray-500">as of {formatDate(latestBw.date)}</p>
            )}
          </div>

          {bodyweights.length >= 2 && <BodyweightChart entries={bodyweights} />}

          {/* + Log weight */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              step="0.1"
              value={bwInput}
              onChange={(e) => setBwInput(e.target.value)}
              placeholder={`Weight (${units})`}
              className="w-28 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
            />
            <input
              type="date"
              value={bwDate}
              onChange={(e) => setBwDate(e.target.value)}
              className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
            />
            <button
              type="button"
              onClick={onLogWeight}
              disabled={!(Number(bwInput) > 0)}
              className="rounded-lg bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40"
            >
              + Log weight
            </button>
          </div>

          {bodyweights.length > 0 && (
            <ul className="space-y-1">
              {[...bodyweights].reverse().map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>{formatDate(b.date)}</span>
                  <span className="flex items-center gap-3">
                    {b.weight} {b.unit}
                    <button
                      type="button"
                      onClick={() => removeBodyweight(b.id)}
                      className="text-gray-600 hover:text-red-400"
                      aria-label="Delete entry"
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
