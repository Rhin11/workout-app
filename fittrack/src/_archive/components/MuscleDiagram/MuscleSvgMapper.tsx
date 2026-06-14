import type { KeyboardEvent, ReactNode } from 'react';
import styles from './MuscleDiagram.module.css';
import { muscleMetadata } from './muscleMetadata';
import type { MuscleId, MuscleRole } from './types';

export interface MuscleSvgMapperProps {
  muscleId: MuscleId;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  highlighted: boolean;
  interactive: boolean;
  role: MuscleRole;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
  children?: ReactNode;
}

/**
 * Wraps imported professional SVG paths with interaction, accessibility, and
 * dynamic fill/stroke from MuscleDiagram state. Paste path elements as children.
 */
export default function MuscleSvgMapper({
  muscleId,
  fill,
  stroke,
  strokeWidth,
  opacity,
  highlighted,
  interactive,
  role,
  onEnter,
  onLeave,
  onClick,
  onFocus,
  onBlur,
  children,
}: MuscleSvgMapperProps) {
  const label = muscleMetadata[muscleId].label;
  const ariaLabel =
    role !== 'inactive' ? `${label}, ${role} muscle` : `${label} muscle`;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (!interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <g
      data-muscle={muscleId}
      className={`${styles.muscleGroup} ${highlighted ? styles.muscleGroupHighlighted : ''}`}
      style={{
        fill,
        stroke,
        opacity,
        ['--muscle-stroke-width' as string]: `${strokeWidth}px`,
      }}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={ariaLabel}
      onMouseEnter={interactive ? onEnter : undefined}
      onMouseLeave={interactive ? onLeave : undefined}
      onFocus={interactive ? onFocus : undefined}
      onBlur={interactive ? onBlur : undefined}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {children}
    </g>
  );
}
