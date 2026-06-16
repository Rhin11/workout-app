import { useState } from 'react';
import CircuitBuilder from '../components/conditioning/CircuitBuilder';
import IntervalRunner from '../components/conditioning/IntervalRunner';
import { useConditioningStore, type Phase } from '../store/conditioningStore';

export default function ConditioningPage() {
  const draft = useConditioningStore((s) => s.draft);
  const [run, setRun] = useState<{ phases: Phase[]; rounds: number } | null>(null);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <CircuitBuilder
        onStart={() =>
          setRun({ phases: draft.phases.map((p) => ({ ...p })), rounds: draft.rounds })
        }
      />
      {run && (
        <IntervalRunner phases={run.phases} rounds={run.rounds} onExit={() => setRun(null)} />
      )}
    </div>
  );
}
