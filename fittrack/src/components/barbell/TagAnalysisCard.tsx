import TagForm, { type AnalysisTag } from './TagForm';

export type { AnalysisTag };

interface Props {
  onSave: (tag: AnalysisTag) => void;
}

/** The tagging step shown after a fresh analysis, before it's saved to history. */
export default function TagAnalysisCard({ onSave }: Props) {
  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <h2 className="text-sm font-semibold text-gray-100">Save this analysis</h2>
      <p className="mt-0.5 text-xs text-gray-500">Tag it to a lift to build a per-exercise history.</p>

      <div className="mt-4">
        <TagForm submitLabel="Save analysis" onSubmit={onSave} />
      </div>
    </section>
  );
}
