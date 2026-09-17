import { useState } from 'react';
import { colors } from '../../constants/theme';
import {
  addPlate,
  barWeight,
  loadPerSide,
  platesForUnit,
  removePlate,
  type PlateDef,
} from '../../utils/barbellPlates';

interface Props {
  weight: number;
  unit: 'lbs' | 'kg';
  onChange: (weight: number) => void;
}

function plateHeight(weight: number, max: number): number {
  const minH = 28;
  const maxH = 72;
  return minH + ((weight / max) * (maxH - minH));
}

function plateWidth(weight: number, max: number): number {
  const minW = 8;
  const maxW = 16;
  return minW + ((weight / max) * (maxW - minW));
}

function PlateDisc({
  plate,
  max,
  onClick,
  title,
}: {
  plate: PlateDef;
  max: number;
  onClick: () => void;
  title: string;
}) {
  const h = plateHeight(plate.weight, max);
  const w = plateWidth(plate.weight, max);
  const needsOutline = plate.color === colors.plateWhite || plate.color === colors.plateBlack;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="shrink-0 rounded-[3px] transition-transform hover:scale-105"
      style={{
        width: w,
        height: h,
        backgroundColor: plate.color,
        boxShadow: needsOutline ? `inset 0 0 0 1px ${colors.border}` : undefined,
      }}
    />
  );
}

function Sleeve({
  plates,
  max,
  side,
  onRemove,
}: {
  plates: PlateDef[];
  max: number;
  side: 'left' | 'right';
  onRemove: (plate: PlateDef) => void;
}) {
  const ordered = side === 'left' ? [...plates].reverse() : plates;
  return (
    <div className="flex h-[80px] min-w-[4.5rem] items-center justify-center gap-px">
      {ordered.length === 0 ? (
        <div className="h-2 w-10 rounded-sm" style={{ backgroundColor: colors.barSteel }} />
      ) : (
        ordered.map((plate, i) => (
          <PlateDisc
            key={`${side}-${plate.weight}-${i}`}
            plate={plate}
            max={max}
            onClick={() => onRemove(plate)}
            title={`Remove ${plate.label} ${side === 'left' ? 'left' : 'right'}`}
          />
        ))
      )}
    </div>
  );
}

export default function BarbellCalculator({ weight, unit, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const defs = platesForUnit(unit);
  const max = defs[0]?.weight ?? 45;
  const bar = barWeight(unit);
  const { plates, remainder } = loadPerSide(weight, unit);
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';
  const summary = weight > 0 ? `${weight} ${unit}` : `Bar ${bar} ${unitLabel}`;

  return (
    <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1 text-left"
        aria-expanded={open}
        aria-label={open ? 'Collapse plate calculator' : 'Expand plate calculator'}
      >
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-500" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Plate calculator
          </span>
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-100">{summary}</span>
      </button>

      {open && (
      <div className="mt-2">
      <div className="flex items-center justify-center gap-0 overflow-x-auto py-1">
        <Sleeve plates={plates} max={max} side="left" onRemove={(p) => onChange(removePlate(weight, unit, p.weight))} />
        <div
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: colors.barSteel }}
          title="Collar"
        />
        <button
          type="button"
          onClick={() => onChange(bar)}
          className="h-2.5 w-28 shrink-0 rounded-sm transition-colors hover:brightness-125"
          style={{ backgroundColor: colors.barSteel }}
          title={`Load empty bar (${bar} ${unit})`}
          aria-label={`Load empty bar ${bar} ${unit}`}
        />
        <div
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: colors.barSteel }}
          title="Collar"
        />
        <Sleeve plates={plates} max={max} side="right" onRemove={(p) => onChange(removePlate(weight, unit, p.weight))} />
      </div>

      {remainder > 0 && weight >= bar && (
        <p className="mt-1 text-center text-[11px] text-amber-500/90">
          {remainder} {unit} per side not plated
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {defs.map((plate) => {
          const needsOutline = plate.color === colors.plateWhite || plate.color === colors.plateBlack;
          return (
            <button
              key={plate.weight}
              type="button"
              onClick={() => onChange(addPlate(weight, unit, plate.weight))}
              className="flex h-10 min-w-10 flex-col items-center justify-center rounded-full px-2 text-[11px] font-bold shadow-sm transition-transform hover:scale-105"
              style={{
                backgroundColor: plate.color,
                color: plate.textColor,
                boxShadow: needsOutline ? `inset 0 0 0 1px ${colors.border}` : undefined,
              }}
              aria-label={`Add ${plate.label} ${unit} plates`}
            >
              {plate.label}s
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="h-10 rounded-full border border-gray-700 px-3 text-[11px] font-medium text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
        >
          Clear
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-600">
        Tap a plate to add one per side · tap the bar to load {bar} {unitLabel} · tap loaded plates to
        remove
      </p>
      </div>
      )}
    </div>
  );
}
