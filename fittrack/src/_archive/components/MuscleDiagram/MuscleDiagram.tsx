import { useCallback, useMemo, useState } from 'react';
import BackBodySvg from './BackBodySvg';
import FrontBodySvg from './FrontBodySvg';
import HowToPerformCard from './HowToPerformCard';
import InvolvedMuscleChips from './InvolvedMuscleChips';
import MuscleLegend from './MuscleLegend';
import MuscleTooltip from './MuscleTooltip';
import { muscleAnchors } from './muscleAnchors';
import {
  darkenColor,
  DIAGRAM_BG,
  getSoftColor,
  MUSCLE_FILL_DEFAULT,
  MUSCLE_STROKE,
  muscleColors,
  roleColors,
} from './muscleColors';
import { expandMuscleId } from './muscleEquivalents';
import { muscleMetadata } from './muscleMetadata';
import { FIGURE_H, FIGURE_W } from './muscleAnchors';
import styles from './MuscleDiagram.module.css';
import type { MuscleDiagramProps, MuscleId, MuscleRole } from './types';

function useCoarsePointer(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);
}

function orderInvolvedMuscles(
  primary: MuscleId[],
  secondary: MuscleId[],
  stabilizer: MuscleId[],
): MuscleId[] {
  const ordered = [...primary, ...secondary, ...stabilizer];
  const unique = [...new Set(ordered)];
  return unique.filter((id) => !(id === 'obliques' && unique.includes('abs')));
}

export default function MuscleDiagram({
  exerciseName,
  primaryMuscles = [],
  secondaryMuscles = [],
  stabilizerMuscles = [],
  instructions,
  colorMode = 'byRole',
  viewMode = 'front-back',
  showLegend = true,
  showInvolvedMuscles = true,
  showTooltip = true,
  showInstructions = true,
  interactive = true,
  defaultHighlight = false,
  initialActiveMuscle = null,
  className,
}: MuscleDiagramProps) {
  const isCoarsePointer = useCoarsePointer();
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleId | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(
    initialActiveMuscle,
  );
  const [hoveredRole, setHoveredRole] = useState<MuscleRole | null>(null);

  const activeMuscle = hoveredMuscle ?? selectedMuscle;
  const hasExerciseData =
    primaryMuscles.length > 0 ||
    secondaryMuscles.length > 0 ||
    stabilizerMuscles.length > 0;

  const involvedMuscles = useMemo(
    () => orderInvolvedMuscles(primaryMuscles, secondaryMuscles, stabilizerMuscles),
    [primaryMuscles, secondaryMuscles, stabilizerMuscles],
  );

  const getMuscleRole = useCallback(
    (muscleId: MuscleId): MuscleRole => {
      if (primaryMuscles.includes(muscleId)) return 'primary';
      if (secondaryMuscles.includes(muscleId)) return 'secondary';
      if (stabilizerMuscles.includes(muscleId)) return 'stabilizer';
      return 'inactive';
    },
    [primaryMuscles, secondaryMuscles, stabilizerMuscles],
  );

  const getMuscleColor = useCallback(
    (muscleId: MuscleId): string => {
      if (colorMode === 'byRole') {
        return roleColors[getMuscleRole(muscleId)];
      }
      return muscleColors[muscleId];
    },
    [colorMode, getMuscleRole],
  );

  const shouldHighlightMuscle = useCallback(
    (muscleId: MuscleId): boolean => {
      const role = getMuscleRole(muscleId);

      if (activeMuscle && expandMuscleId(activeMuscle).includes(muscleId)) return true;
      if (hoveredRole && role === hoveredRole) return true;
      if (defaultHighlight && role !== 'inactive') return true;

      return false;
    },
    [activeMuscle, hoveredRole, defaultHighlight, getMuscleRole],
  );

  const isMuscleHighlighted = useCallback(
    (muscleId: MuscleId) => shouldHighlightMuscle(muscleId),
    [shouldHighlightMuscle],
  );

  const getMuscleFill = useCallback(
    (muscleId: MuscleId): string => {
      if (shouldHighlightMuscle(muscleId)) {
        const colorId =
          activeMuscle && expandMuscleId(activeMuscle).includes(muscleId)
            ? activeMuscle
            : muscleId;
        if (hoveredRole && !activeMuscle) {
          return getSoftColor(getMuscleColor(muscleId), 0.55);
        }
        return getMuscleColor(colorId);
      }
      return MUSCLE_FILL_DEFAULT;
    },
    [shouldHighlightMuscle, activeMuscle, hoveredRole, getMuscleColor],
  );

  const getMuscleStroke = useCallback(
    (muscleId: MuscleId): string => {
      if (shouldHighlightMuscle(muscleId)) {
        return darkenColor(getMuscleColor(muscleId), 0.2);
      }
      return MUSCLE_STROKE;
    },
    [shouldHighlightMuscle, getMuscleColor],
  );

  const getMuscleOpacity = useCallback(
    (muscleId: MuscleId): number => {
      const role = getMuscleRole(muscleId);
      if (activeMuscle && !expandMuscleId(activeMuscle).includes(muscleId)) {
        return role === 'inactive' ? 0.55 : 0.75;
      }
      return 1;
    },
    [activeMuscle, getMuscleRole],
  );

  const handleMuscleEnter = useCallback(
    (muscleId: MuscleId) => {
      if (!interactive || isCoarsePointer) return;
      setHoveredMuscle(muscleId);
      setHoveredRole(null);
    },
    [interactive, isCoarsePointer],
  );

  const handleMuscleLeave = useCallback(() => {
    if (!interactive || isCoarsePointer) return;
    setHoveredMuscle(null);
  }, [interactive, isCoarsePointer]);

  const handleMuscleClick = useCallback(
    (muscleId: MuscleId) => {
      if (!interactive) return;
      setSelectedMuscle((prev) => (prev === muscleId ? null : muscleId));
      setHoveredMuscle(null);
      setHoveredRole(null);
    },
    [interactive],
  );

  const handleMuscleFocus = useCallback(
    (muscleId: MuscleId) => {
      if (!interactive) return;
      setHoveredMuscle(muscleId);
    },
    [interactive],
  );

  const handleMuscleBlur = useCallback(() => {
    if (!interactive) return;
    setHoveredMuscle(null);
  }, [interactive]);

  const bodyProps = {
    activeMuscle,
    hoveredRole,
    selectedMuscle,
    getMuscleFill,
    getMuscleStroke,
    getMuscleOpacity,
    getMuscleRole,
    isMuscleHighlighted,
    interactive,
    onMuscleEnter: handleMuscleEnter,
    onMuscleLeave: handleMuscleLeave,
    onMuscleClick: handleMuscleClick,
    onMuscleFocus: handleMuscleFocus,
    onMuscleBlur: handleMuscleBlur,
  };

  const ariaLabel = exerciseName
    ? `Muscle diagram for ${exerciseName}`
    : 'Interactive muscle anatomy diagram';

  const tooltipMuscle = activeMuscle;
  const tooltipAnchor = tooltipMuscle ? muscleAnchors[tooltipMuscle] : null;
  const showSvgTooltip =
    showTooltip && tooltipMuscle && tooltipAnchor && !isCoarsePointer;
  const showMobileTooltip = showTooltip && tooltipMuscle && isCoarsePointer;

  const showFront = viewMode === 'front' || viewMode === 'front-back';
  const showBack = viewMode === 'back' || viewMode === 'front-back';

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <h2 className={styles.title}>Interactive Muscle Diagram</h2>
      {exerciseName && <p className={styles.exerciseSubtitle}>{exerciseName}</p>}

      <div
        className={styles.canvasWrap}
        style={{ aspectRatio: `${FIGURE_W} / ${FIGURE_H}` }}
      >
        <svg
          viewBox={`0 0 ${FIGURE_W} ${FIGURE_H}`}
          className={styles.canvasSvg}
          shapeRendering="geometricPrecision"
          role="img"
          aria-label={ariaLabel}
        >
          <rect width={FIGURE_W} height={FIGURE_H} className={styles.diagramBg} fill={DIAGRAM_BG} />

          {showBack && <BackBodySvg {...bodyProps} />}
          {showFront && <FrontBodySvg {...bodyProps} />}

          {showSvgTooltip && tooltipMuscle && tooltipAnchor && (
            <MuscleTooltip
              label={muscleMetadata[tooltipMuscle].label}
              role={getMuscleRole(tooltipMuscle)}
              description={muscleMetadata[tooltipMuscle].description}
              color={getMuscleColor(tooltipMuscle)}
              anchorX={tooltipAnchor.x}
              anchorY={tooltipAnchor.y}
              containerWidth={FIGURE_W}
              containerHeight={FIGURE_H}
              showRole={hasExerciseData}
            />
          )}
        </svg>
      </div>

      {showMobileTooltip && tooltipMuscle && (
        <div className={styles.mobileTooltip} role="status">
          <p className={styles.tooltipTitle}>{muscleMetadata[tooltipMuscle].label}</p>
          {hasExerciseData && getMuscleRole(tooltipMuscle) !== 'inactive' && (
            <p
              className={styles.tooltipRole}
              style={{ color: roleColors[getMuscleRole(tooltipMuscle)] }}
            >
              {getMuscleRole(tooltipMuscle) === 'primary'
                ? 'Primary Muscle'
                : getMuscleRole(tooltipMuscle) === 'secondary'
                  ? 'Secondary Muscle'
                  : 'Stabilizer Muscle'}
            </p>
          )}
          <p className={styles.tooltipDesc}>{muscleMetadata[tooltipMuscle].description}</p>
        </div>
      )}

      {showLegend && hasExerciseData && (
        <MuscleLegend hoveredRole={hoveredRole} onRoleHover={setHoveredRole} />
      )}

      {showInvolvedMuscles && hasExerciseData && (
        <InvolvedMuscleChips
          muscles={involvedMuscles}
          activeMuscle={activeMuscle}
          selectedMuscle={selectedMuscle}
          getMuscleColor={getMuscleColor}
          onMuscleHover={(id) => {
            setHoveredMuscle(id);
            if (id) setHoveredRole(null);
          }}
          onMuscleSelect={handleMuscleClick}
        />
      )}

      {showInstructions && instructions && (
        <HowToPerformCard instructions={instructions} />
      )}
    </div>
  );
}
