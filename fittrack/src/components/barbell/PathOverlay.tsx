interface PathPoint {
  x: number;
  y: number;
  frame: number;
  time_ms: number;
}

interface StickingPoint {
  frame: number;
  time_ms: number;
  y: number;
}

interface Props {
  path: PathPoint[];
  stickingPoints: StickingPoint[];
}

export default function PathOverlay({ path, stickingPoints }: Props) {
  void path;
  void stickingPoints;
  return (
    <div className="flex items-center justify-center rounded-xl bg-gray-900 p-8">
      <p className="text-gray-500">Path overlay — Phase 5</p>
    </div>
  );
}
