import { useEffect, useState } from 'react';
import type { MuscleGroupFilter } from '../../constants/exercises';
import { ALL_MUSCLES, COLORS, FIGURE_H, FIGURE_W, FIGURES } from './anatomyFigure';
import { activePathIds } from './muscleDiagramMap';
import type { MusclePath } from './anatomy/types';

interface Props {
  muscles: MuscleGroupFilter[];
}

const ALL_PATH_IDS = ALL_MUSCLES.map((m) => m.id);

function muscleStyle(active: boolean, fullBody: boolean) {
  if (active) {
    return {
      fill: fullBody ? COLORS.activeBright : COLORS.activeFill,
      stroke: COLORS.activeStroke,
      strokeWidth: 1.1,
    };
  }
  return {
    fill: COLORS.muscleFill,
    stroke: COLORS.muscleStroke,
    strokeWidth: 1,
  };
}

function renderMuscle(path: MusclePath, highlighted: Set<string>, fullBody: boolean) {
  const active = highlighted.has(path.id);
  const style = muscleStyle(active, fullBody);
  return (
    <path
      key={path.id}
      d={path.d}
      fill={style.fill}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeLinejoin="miter"
      strokeLinecap="square"
    />
  );
}

function AnatomyFigure({
  highlighted,
  className,
  fullBody,
}: {
  highlighted: Set<string>;
  className?: string;
  fullBody: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-300 bg-white ${className ?? ''}`}
      style={{ aspectRatio: `${FIGURE_W} / ${FIGURE_H}` }}
    >
      <svg
        viewBox={`0 0 ${FIGURE_W} ${FIGURE_H}`}
        className="h-full w-full"
        aria-label="Anatomical muscle diagram"
        role="img"
      >
        <rect width={FIGURE_W} height={FIGURE_H} fill={COLORS.bg} />

        {FIGURES.map((figure) => (
          <g key={figure.key} transform={`translate(${figure.translate[0]}, ${figure.translate[1]})`}>
            {/* Muscle segments */}
            {figure.muscles.map((m) => renderMuscle(m, highlighted, fullBody))}

            {/* Internal wireframe lines */}
            {figure.wireLines.map((d, i) => (
              <path
                key={`${figure.key}-wire-${i}`}
                d={d}
                fill="none"
                stroke={COLORS.line}
                strokeWidth={0.9}
                strokeLinecap="square"
              />
            ))}

            {/* Head, hands, feet — outline only */}
            {figure.bodyParts.map((part) => (
              <path
                key={part.id}
                d={part.d}
                fill={COLORS.bodyFill}
                stroke={COLORS.line}
                strokeWidth={1}
                strokeLinejoin="miter"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function MuscleBodyDiagram({ muscles }: Props) {
  const [expanded, setExpanded] = useState(false);
  const highlighted = activePathIds(muscles, ALL_PATH_IDS);
  const isFullBody =
    muscles.includes('Full Body') && muscles.filter((m) => m !== 'Full Body').length === 0;
  const displayMuscles = muscles.filter((m) => m !== 'Full Body');

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group shrink-0 cursor-zoom-in rounded-lg border border-gray-600 bg-white p-1 transition-colors hover:border-indigo-500/50"
          aria-label="Enlarge muscle diagram"
        >
          <AnatomyFigure highlighted={highlighted} fullBody={isFullBody} className="w-36 border-0" />
          <p className="mt-1 text-center text-[10px] text-gray-600 group-hover:text-indigo-400">
            Click to enlarge
          </p>
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Muscles hit</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {displayMuscles.length > 0 ? (
              displayMuscles.map((muscle) => (
                <span
                  key={muscle}
                  className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300"
                >
                  {muscle}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                Full Body
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Muscle diagram enlarged"
        >
          <div className="relative max-h-[90vh] max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 shadow-lg transition-colors hover:bg-gray-700 hover:text-white"
              aria-label="Close"
            >
              ×
            </button>
            <AnatomyFigure highlighted={highlighted} fullBody={isFullBody} className="w-full max-w-lg" />
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {displayMuscles.length > 0 ? (
                displayMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="rounded-full bg-indigo-500/30 px-3 py-1 text-sm font-medium text-indigo-200"
                  >
                    {muscle}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-indigo-500/30 px-3 py-1 text-sm font-medium text-indigo-200">
                  Full Body
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
