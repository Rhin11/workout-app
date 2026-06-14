/**
 * BackBodySvg — back anatomy with interactive muscle groups.
 *
 * Artwork: react-body-highlighter polygons (MIT). Replace by pasting new paths
 * into anatomy/bodyHighlighterPaths.ts or src/assets/anatomy/anatomy-back.svg.
 */
import { AnatomyFigureTransform, AnatomyPolygons, StaticAnatomyPolygons } from './AnatomyPolygons';
import { BACK_ANATOMY, BACK_FOOT_HEEL_LINES } from './anatomy/bodyHighlighterPaths';
import MuscleSvgMapper from './MuscleSvgMapper';
import { FIGURE_TRANSFORMS } from './muscleAnchors';
import { BACK_INTERACTIVE_MUSCLES } from './musclePathMap';
import styles from './MuscleDiagram.module.css';
import type { BodySvgProps } from './types';

export default function BackBodySvg({
  getMuscleFill,
  getMuscleStroke,
  getMuscleOpacity,
  getMuscleRole,
  isMuscleHighlighted,
  interactive,
  onMuscleEnter,
  onMuscleLeave,
  onMuscleClick,
  onMuscleFocus,
  onMuscleBlur,
}: BodySvgProps) {
  const { x, y } = FIGURE_TRANSFORMS.back;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={styles.figureGroup}
      data-view="back"
      aria-hidden="true"
    >
      <AnatomyFigureTransform>
        <g className={styles.staticLayer} pointerEvents="none">
          <StaticAnatomyPolygons polygons={BACK_ANATOMY.static.polygons} />
          {BACK_FOOT_HEEL_LINES.map((d, index) => (
            <path key={`heel-${index}`} d={d} className={styles.fasciaLine} />
          ))}
        </g>

        {BACK_INTERACTIVE_MUSCLES.map((muscleId) => {
          const anatomy = BACK_ANATOMY[muscleId];
          if (!anatomy?.polygons.length) return null;

          const highlighted = isMuscleHighlighted(muscleId);
          return (
            <MuscleSvgMapper
              key={muscleId}
              muscleId={muscleId}
              fill={getMuscleFill(muscleId)}
              stroke={getMuscleStroke(muscleId)}
              strokeWidth={highlighted ? 1.25 : 1}
              opacity={getMuscleOpacity(muscleId)}
              highlighted={highlighted}
              interactive={interactive}
              role={getMuscleRole(muscleId)}
              onEnter={() => onMuscleEnter(muscleId)}
              onLeave={onMuscleLeave}
              onClick={() => onMuscleClick(muscleId)}
              onFocus={() => onMuscleFocus(muscleId)}
              onBlur={onMuscleBlur}
            >
              <AnatomyPolygons polygons={anatomy.polygons} />
            </MuscleSvgMapper>
          );
        })}
      </AnatomyFigureTransform>
    </g>
  );
}
