import { muscleMetadata } from './muscleMetadata';
import { musclesMatch } from './muscleEquivalents';
import styles from './MuscleDiagram.module.css';
import type { MuscleId } from './types';

interface InvolvedMuscleChipsProps {
  muscles: MuscleId[];
  activeMuscle: MuscleId | null;
  selectedMuscle: MuscleId | null;
  getMuscleColor: (muscleId: MuscleId) => string;
  onMuscleHover: (muscleId: MuscleId | null) => void;
  onMuscleSelect: (muscleId: MuscleId) => void;
}

function isChipActive(
  muscleId: MuscleId,
  activeMuscle: MuscleId | null,
  selectedMuscle: MuscleId | null,
): boolean {
  if (activeMuscle && musclesMatch(muscleId, activeMuscle)) return true;
  if (selectedMuscle && musclesMatch(muscleId, selectedMuscle)) return true;
  return false;
}

export default function InvolvedMuscleChips({
  muscles,
  activeMuscle,
  selectedMuscle,
  getMuscleColor,
  onMuscleHover,
  onMuscleSelect,
}: InvolvedMuscleChipsProps) {
  if (muscles.length === 0) return null;

  return (
    <div className={styles.involvedSection}>
      <p className={styles.involvedHeading}>Involved Muscles</p>
      <div className={styles.chipRow}>
        {muscles.map((muscleId) => {
          const active = isChipActive(muscleId, activeMuscle, selectedMuscle);
          const color = getMuscleColor(muscleId);
          const label = muscleMetadata[muscleId].shortLabel ?? muscleMetadata[muscleId].label;

          return (
            <button
              key={muscleId}
              type="button"
              className={`${styles.muscleChip} ${active ? styles.muscleChipActive : ''}`}
              style={{ backgroundColor: color }}
              onMouseEnter={() => onMuscleHover(muscleId)}
              onMouseLeave={() => onMuscleHover(null)}
              onFocus={() => onMuscleHover(muscleId)}
              onBlur={() => onMuscleHover(null)}
              onClick={() => onMuscleSelect(muscleId)}
              aria-label={`${label} muscle`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
