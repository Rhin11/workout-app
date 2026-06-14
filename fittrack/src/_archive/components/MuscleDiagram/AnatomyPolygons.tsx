import type { ReactNode } from 'react';
import styles from './MuscleDiagram.module.css';

interface AnatomyPolygonsProps {
  polygons: string[];
  className?: string;
}

/** Renders polygon shapes that inherit fill/stroke from the parent muscle group. */
export function AnatomyPolygons({ polygons, className }: AnatomyPolygonsProps) {
  return (
    <>
      {polygons.map((points, index) => (
        <polygon key={index} points={points} className={className} />
      ))}
    </>
  );
}

interface StaticPolygonsProps {
  polygons: string[];
}

/** Non-interactive head, neck, knees, feet — white fill with outline. */
export function StaticAnatomyPolygons({ polygons }: StaticPolygonsProps) {
  return (
    <>
      {polygons.map((points, index) => (
        <polygon key={index} points={points} className={styles.bodyPart} />
      ))}
    </>
  );
}

interface FigureTransformProps {
  children: ReactNode;
}

/** Scales licensed anatomy artwork into the diagram viewBox. */
export function AnatomyFigureTransform({ children }: FigureTransformProps) {
  const transform = 'translate(17, 0) scale(2.86)';

  return <g transform={transform}>{children}</g>;
}
