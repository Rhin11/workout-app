import styles from './MuscleDiagram.module.css';

interface HowToPerformCardProps {
  instructions: string;
}

export default function HowToPerformCard({ instructions }: HowToPerformCardProps) {
  if (!instructions) return null;

  return (
    <div className={styles.instructionsCard}>
      <div className={styles.instructionsIcon} aria-hidden>
        i
      </div>
      <div className={styles.instructionsContent}>
        <h3 className={styles.instructionsTitle}>How to perform</h3>
        <p className={styles.instructionsText}>{instructions}</p>
      </div>
    </div>
  );
}
