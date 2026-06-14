import { useMemo } from 'react';
import { MALE_BACK } from './assets/male-back';
import { MALE_FRONT } from './assets/male-front';
import type { BodyDiagram, MuscleGroup } from './assets/muscleMapTypes';
import styles from './ExerciseMuscleDiagram.module.css';
import {
  buildGroupRoleMap,
  expandMusclePath,
  expandOutlinePath,
  roleForMuscleGroup,
} from './muscleMapBridge';
import { buildMuscleRoleMap } from './muscleMapping';
import type { ExerciseMuscleDiagramProps, MuscleRole } from './types';

const FIGURE_WIDTH = 280;
const SOURCE_WIDTH = 1024;
const FIGURE_SCALE = FIGURE_WIDTH / SOURCE_WIDTH;

function muscleClass(role: MuscleRole): string {
  if (role === 'primary') return styles.musclePrimary;
  if (role === 'secondary') return styles.muscleSecondary;
  return styles.muscle;
}

function MuscleFigure({
  diagram,
  x,
  groupRoles,
}: {
  diagram: BodyDiagram;
  x: number;
  groupRoles: Map<MuscleGroup, MuscleRole>;
}) {
  const mirror = `matrix(-1 0 0 1 ${2 * diagram.centerX} 0)`;
  const outlinePaths = diagram.outline.flatMap(expandOutlinePath);
  const musclePaths = diagram.muscles.flatMap(expandMusclePath);

  return (
    <g transform={`translate(${x}, 8) scale(${FIGURE_SCALE})`}>
      {outlinePaths.map((part) => (
        <path
          key={part.key}
          d={part.d}
          transform={part.mirrored ? mirror : undefined}
          className={styles.bodyPart}
        />
      ))}

      {musclePaths.map((muscle) => {
        const role = roleForMuscleGroup(muscle.group, groupRoles);
        return (
          <path
            key={muscle.key}
            d={muscle.d}
            transform={muscle.mirrored ? mirror : undefined}
            className={muscleClass(role)}
            data-muscle={muscle.partId ?? muscle.group}
          />
        );
      })}
    </g>
  );
}

export default function ExerciseMuscleDiagram({
  primaryMuscles,
  secondaryMuscles,
  className,
}: ExerciseMuscleDiagramProps) {
  const roleMap = useMemo(
    () => buildMuscleRoleMap(primaryMuscles, secondaryMuscles),
    [primaryMuscles, secondaryMuscles],
  );

  const groupRoles = useMemo(() => buildGroupRoleMap(roleMap), [roleMap]);

  const hasHighlight = primaryMuscles.length > 0 || secondaryMuscles.length > 0;

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <svg
        viewBox="0 0 620 440"
        className={styles.canvas}
        role="img"
        aria-label="Front and back muscle diagram"
      >
        <rect width={620} height={440} fill="#ffffff" />
        <MuscleFigure diagram={MALE_FRONT} x={16} groupRoles={groupRoles} />
        <MuscleFigure diagram={MALE_BACK} x={318} groupRoles={groupRoles} />
      </svg>

      {hasHighlight && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendPrimary}`} />
            Primary
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendSecondary}`} />
            Secondary
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendInactive}`} />
            Other muscles
          </span>
        </div>
      )}
    </div>
  );
}
