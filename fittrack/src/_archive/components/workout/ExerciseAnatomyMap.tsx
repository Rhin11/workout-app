import { useMemo } from 'react';
import { CHART_COLORS } from './anatomy/chartLayout';
import { FIGURE_H, FIGURE_W, FIGURES } from './anatomyFigure';
import { pathIdsForMuscleNames } from './muscleDiagramMap';
import type { MusclePath } from './anatomy/types';

interface Props {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  className?: string;
}

function muscleStyle(pathId: string, primary: Set<string>, secondary: Set<string>) {
  if (primary.has(pathId)) {
    return { fill: CHART_COLORS.primaryFill, stroke: CHART_COLORS.primaryStroke, strokeWidth: 0.6 };
  }
  if (secondary.has(pathId)) {
    return { fill: CHART_COLORS.secondaryFill, stroke: CHART_COLORS.secondaryStroke, strokeWidth: 0.5 };
  }
  return { fill: 'url(#muscle-gradient)', stroke: CHART_COLORS.muscleStroke, strokeWidth: 0.35 };
}

function renderMuscle(path: MusclePath, primary: Set<string>, secondary: Set<string>) {
  const style = muscleStyle(path.id, primary, secondary);
  return (
    <path
      key={path.id}
      d={path.d}
      fill={style.fill}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export default function ExerciseAnatomyMap({ primaryMuscles, secondaryMuscles, className }: Props) {
  const primary = useMemo(() => pathIdsForMuscleNames(primaryMuscles), [primaryMuscles]);
  const secondary = useMemo(() => {
    const ids = pathIdsForMuscleNames(secondaryMuscles);
    for (const id of primary) ids.delete(id);
    return ids;
  }, [secondaryMuscles, primary]);

  const hasHighlight = primary.size > 0 || secondary.size > 0;

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-lg border border-gray-700 bg-[#fafafa]"
        style={{ aspectRatio: `${FIGURE_W} / ${FIGURE_H}` }}
      >
        <svg
          viewBox={`0 0 ${FIGURE_W} ${FIGURE_H}`}
          className="h-full w-full"
          shapeRendering="geometricPrecision"
          aria-label="Muscle anatomy map"
          role="img"
        >
          <defs>
            <linearGradient id="muscle-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.muscleLight} />
              <stop offset="100%" stopColor={CHART_COLORS.muscle} />
            </linearGradient>
          </defs>

          <rect width={FIGURE_W} height={FIGURE_H} fill={CHART_COLORS.bg} />

          {/* Center divider */}
          <line
            x1={FIGURE_W / 2}
            y1={12}
            x2={FIGURE_W / 2}
            y2={FIGURE_H - 8}
            stroke="#e8e4e8"
            strokeWidth={0.5}
          />

          {FIGURES.map((figure) => (
            <g key={figure.key} transform={`translate(${figure.translate[0]}, ${figure.translate[1]})`}>
              {/* Muscle layer */}
              {figure.muscles.map((m) => renderMuscle(m, primary, secondary))}

              {/* Fascia separations */}
              {figure.wireLines.map((d, i) => (
                <path
                  key={`fascia-${i}`}
                  d={d}
                  fill="none"
                  stroke={CHART_COLORS.fascia}
                  strokeWidth={1}
                  strokeLinecap="round"
                />
              ))}

              {/* Skin — head, hands, feet */}
              {figure.bodyParts.map((part) => (
                <path
                  key={part.id}
                  d={part.d}
                  fill={CHART_COLORS.skin}
                  stroke={CHART_COLORS.skinStroke}
                  strokeWidth={0.45}
                  strokeLinejoin="round"
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      {hasHighlight && (
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
            Primary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Secondary
          </span>
        </div>
      )}
    </div>
  );
}
