import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import TagForm, { type AnalysisTag } from './TagForm';

interface Props {
  /** Current tag values to prefill (omit/empty for a brand-new tag). */
  initial?: Partial<AnalysisTag>;
  /** Whether this is editing an existing tag (affects the title). */
  isEdit?: boolean;
  onSave: (tag: AnalysisTag) => void;
  onClose: () => void;
}

/** Portal dialog for tagging / re-tagging a saved analysis. */
export default function TagAnalysisModal({ initial, isEdit, onSave, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit tag' : 'Tag analysis'}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A] text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="pr-10 text-sm font-semibold text-gray-100">
          {isEdit ? 'Edit tag' : 'Tag analysis'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">Assign this analysis to a lift.</p>

        <div className="mt-4">
          <TagForm
            initial={initial}
            submitLabel="Save"
            onSubmit={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
