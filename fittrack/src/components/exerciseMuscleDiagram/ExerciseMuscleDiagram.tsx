import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react';
import { MALE_BACK } from './assets/male-back';
import { MALE_FRONT } from './assets/male-front';
import type { BodyDiagram, MuscleGroup } from './assets/muscleMapTypes';
import styles from './ExerciseMuscleDiagram.module.css';
import { getMuscleGroupLabel } from './muscleLabels';
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
const TOOLTIP_OFFSET = 14;
const TOOLTIP_WIDTH = 168;

const ROLE_LABELS: Record<Exclude<MuscleRole, 'inactive'>, string> = {
  primary: 'Primary muscle',
  secondary: 'Secondary muscle',
};

type TooltipState = {
  group: MuscleGroup;
  role: MuscleRole;
  x: number;
  y: number;
};

function muscleClass(role: MuscleRole): string {
  if (role === 'primary') return styles.musclePrimary;
  if (role === 'secondary') return styles.muscleSecondary;
  return styles.muscle;
}

function muscleTooltipText(group: MuscleGroup, role: MuscleRole): string {
  const label = getMuscleGroupLabel(group);
  if (role === 'inactive') return label;
  return `${label} (${ROLE_LABELS[role]})`;
}

function MuscleFigure({
  diagram,
  x,
  groupRoles,
  onMuscleEnter,
  onMuscleMove,
  onMuscleLeave,
}: {
  diagram: BodyDiagram;
  x: number;
  groupRoles: Map<MuscleGroup, MuscleRole>;
  onMuscleEnter: (group: MuscleGroup, role: MuscleRole, event: MouseEvent<SVGPathElement>) => void;
  onMuscleMove: (event: MouseEvent<SVGPathElement>) => void;
  onMuscleLeave: () => void;
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
            onMouseEnter={(event) => onMuscleEnter(muscle.group, role, event)}
            onMouseMove={onMuscleMove}
            onMouseLeave={onMuscleLeave}
          >
            <title>{muscleTooltipText(muscle.group, role)}</title>
          </path>
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const roleMap = useMemo(
    () => buildMuscleRoleMap(primaryMuscles, secondaryMuscles),
    [primaryMuscles, secondaryMuscles],
  );

  const groupRoles = useMemo(() => buildGroupRoleMap(roleMap), [roleMap]);

  const hasHighlight = primaryMuscles.length > 0 || secondaryMuscles.length > 0;

  const updatePointer = useCallback((event: MouseEvent<SVGPathElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMuscleEnter = useCallback(
    (group: MuscleGroup, role: MuscleRole, event: MouseEvent<SVGPathElement>) => {
      const { x, y } = updatePointer(event);
      setTooltip({ group, role, x, y });
    },
    [updatePointer],
  );

  const handleMuscleMove = useCallback(
    (event: MouseEvent<SVGPathElement>) => {
      setTooltip((current) => {
        if (!current) return current;
        const { x, y } = updatePointer(event);
        return { ...current, x, y };
      });
    },
    [updatePointer],
  );

  const handleMuscleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const tooltipPosition = useMemo(() => {
    if (!tooltip) return null;

    const containerWidth = wrapRef.current?.offsetWidth ?? 620;
    const flipLeft = tooltip.x + TOOLTIP_OFFSET + TOOLTIP_WIDTH > containerWidth - 8;
    const left = flipLeft
      ? tooltip.x - TOOLTIP_OFFSET - TOOLTIP_WIDTH
      : tooltip.x + TOOLTIP_OFFSET;

    return {
      left: Math.max(8, left),
      top: tooltip.y,
    };
  }, [tooltip]);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ''}`}>
      <svg
        viewBox="0 0 620 440"
        className={styles.canvas}
        role="img"
        aria-label="Front and back muscle diagram"
      >
        <rect width={620} height={440} fill="#ffffff" />
        <MuscleFigure
          diagram={MALE_FRONT}
          x={16}
          groupRoles={groupRoles}
          onMuscleEnter={handleMuscleEnter}
          onMuscleMove={handleMuscleMove}
          onMuscleLeave={handleMuscleLeave}
        />
        <MuscleFigure
          diagram={MALE_BACK}
          x={318}
          groupRoles={groupRoles}
          onMuscleEnter={handleMuscleEnter}
          onMuscleMove={handleMuscleMove}
          onMuscleLeave={handleMuscleLeave}
        />
      </svg>

      {tooltip && tooltipPosition && (
        <div
          className={styles.tooltip}
          style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
          role="tooltip"
        >
          <p className={styles.tooltipName}>{getMuscleGroupLabel(tooltip.group)}</p>
          {tooltip.role !== 'inactive' && (
            <p
              className={
                tooltip.role === 'primary' ? styles.tooltipRolePrimary : styles.tooltipRoleSecondary
              }
            >
              {ROLE_LABELS[tooltip.role]}
            </p>
          )}
        </div>
      )}

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
