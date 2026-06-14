import { roleColors } from './muscleColors';
import styles from './MuscleDiagram.module.css';
import type { MuscleRole } from './types';

interface MuscleLegendProps {
  hoveredRole: MuscleRole | null;
  onRoleHover: (role: MuscleRole | null) => void;
}

const ROLE_ITEMS: { role: Exclude<MuscleRole, 'inactive'>; label: string }[] = [
  { role: 'primary', label: 'Primary' },
  { role: 'secondary', label: 'Secondary' },
  { role: 'stabilizer', label: 'Stabilizer' },
];

export default function MuscleLegend({ hoveredRole, onRoleHover }: MuscleLegendProps) {
  return (
    <div className={styles.legend}>
      <div className={styles.legendRow}>
        {ROLE_ITEMS.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            className={`${styles.legendItem} ${hoveredRole === role ? styles.legendItemActive : ''}`}
            onMouseEnter={() => onRoleHover(role)}
            onMouseLeave={() => onRoleHover(null)}
            onFocus={() => onRoleHover(role)}
            onBlur={() => onRoleHover(null)}
          >
            <span
              className={styles.legendDot}
              style={{ backgroundColor: roleColors[role] }}
              aria-hidden
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
