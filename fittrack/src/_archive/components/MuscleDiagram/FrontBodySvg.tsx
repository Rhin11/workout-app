/**
 * FrontBodySvg — front anatomy with interactive muscle groups.
 *
 * Artwork: react-body-highlighter polygons (MIT). Replace by pasting new paths
 * into anatomy/bodyHighlighterPaths.ts or src/assets/anatomy/anatomy-front.svg.
 */
import { AnatomyFigureTransform, AnatomyPolygons, StaticAnatomyPolygons } from './AnatomyPolygons';
import { FRONT_ANATOMY, FRONT_FOOT_TOE_LINES, FRONT_QUAD_FASCIA_LINES } from './anatomy/bodyHighlighterPaths';
import MuscleSvgMapper from './MuscleSvgMapper';
import { FIGURE_TRANSFORMS } from './muscleAnchors';
import { FRONT_INTERACTIVE_MUSCLES } from './musclePathMap';
import styles from './MuscleDiagram.module.css';
import type { BodySvgProps } from './types';

export default function FrontBodySvg({
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
  const { x, y } = FIGURE_TRANSFORMS.front;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={styles.figureGroup}
      data-view="front"
      aria-hidden="true"
    >
      <AnatomyFigureTransform>
        <g className={styles.staticLayer} pointerEvents="none">
          <StaticAnatomyPolygons polygons={FRONT_ANATOMY.static.polygons} />
          {FRONT_FOOT_TOE_LINES.map((d, index) => (
            <path key={`toe-${index}`} d={d} className={styles.fasciaLine} />
          ))}
        </g>

        {FRONT_INTERACTIVE_MUSCLES.map((muscleId) => {
          const anatomy = FRONT_ANATOMY[muscleId];
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

        <g className={styles.fasciaLayer} pointerEvents="none">
          {FRONT_QUAD_FASCIA_LINES.map((d, index) => (
            <path key={`quad-fascia-${index}`} d={d} className={styles.fasciaLine} />
          ))}
        </g>
      </AnatomyFigureTransform>
    </g>
  );
}
