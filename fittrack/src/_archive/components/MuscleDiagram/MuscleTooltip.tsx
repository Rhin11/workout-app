import { roleColors } from './muscleColors';
import styles from './MuscleDiagram.module.css';
import type { MuscleRole } from './types';

const ROLE_LABELS: Record<MuscleRole, string> = {
  primary: 'Primary Muscle',
  secondary: 'Secondary Muscle',
  stabilizer: 'Stabilizer Muscle',
  inactive: 'Muscle',
};

interface MuscleTooltipProps {
  label: string;
  role: MuscleRole;
  description: string;
  color: string;
  anchorX: number;
  anchorY: number;
  containerWidth: number;
  containerHeight: number;
  showRole: boolean;
}

const TOOLTIP_W = 176;
const TOOLTIP_H = 88;

export default function MuscleTooltip({
  label,
  role,
  description,
  color,
  anchorX,
  anchorY,
  containerWidth,
  containerHeight,
  showRole,
}: MuscleTooltipProps) {
  let tipX = anchorX + 48;
  let tipY = anchorY - TOOLTIP_H / 2;

  if (tipX + TOOLTIP_W > containerWidth - 16) {
    tipX = anchorX - TOOLTIP_W - 48;
  }
  if (tipY < 16) tipY = 16;
  if (tipY + TOOLTIP_H > containerHeight - 16) {
    tipY = containerHeight - TOOLTIP_H - 16;
  }

  const lineEndX = tipX < anchorX ? tipX + TOOLTIP_W : tipX;
  const lineEndY = tipY + TOOLTIP_H / 2;
  const ctrl1X = anchorX + (lineEndX - anchorX) * 0.45;
  const ctrl1Y = anchorY;
  const ctrl2X = anchorX + (lineEndX - anchorX) * 0.75;
  const ctrl2Y = lineEndY;

  return (
    <g className={styles.tooltipLayer} pointerEvents="none">
      <path
        d={`M ${anchorX} ${anchorY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${lineEndX} ${lineEndY}`}
        className={styles.calloutLine}
      />
      <circle
        cx={anchorX}
        cy={anchorY}
        r={4}
        className={styles.calloutDot}
        fill="#ffffff"
        stroke={color}
        strokeWidth={2}
      />
      <foreignObject x={tipX} y={tipY} width={TOOLTIP_W} height={TOOLTIP_H}>
        <div className={styles.tooltip}>
          <p className={styles.tooltipTitle}>{label}</p>
          {showRole && role !== 'inactive' && (
            <p className={styles.tooltipRole} style={{ color: roleColors[role] }}>
              {ROLE_LABELS[role]}
            </p>
          )}
          <p className={styles.tooltipDesc}>{description}</p>
        </div>
      </foreignObject>
    </g>
  );
}
