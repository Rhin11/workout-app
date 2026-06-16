import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { askLiftCoach } from '../../services/liftCoach';

const QUICK_QUESTIONS = [
  'Explain this lift',
  'What muscles does this work?',
  'Common mistakes?',
  'How do I improve form?',
] as const;

const UNAVAILABLE_MESSAGE = 'The coach is unavailable right now — try again in a moment.';

type Message = { role: 'user' | 'coach'; text: string };

interface Props {
  exerciseName: string;
}

export default function AskCoachButton({ exerciseName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
      setInput('');
      setError(null);
      setLoading(true);

      try {
        const reply = await askLiftCoach(exerciseName, trimmed);
        setMessages((prev) => [...prev, { role: 'coach', text: reply }]);
      } catch {
        setError(UNAVAILABLE_MESSAGE);
      } finally {
        setLoading(false);
      }
    },
    [exerciseName, loading],
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="shrink-0 rounded-lg border border-[#2A2A2A] px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
      >
        Ask the Coach
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-8"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Lift Coach for ${exerciseName}`}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#2A2A2A] bg-[#141414] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#2A2A2A] px-5 py-4">
                <h2 className="text-base font-semibold text-gray-100">
                  Lift Coach — <span className="text-[#6C63FF]">{exerciseName}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-[#1C1C1C] hover:text-gray-200"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages.length === 0 && !loading && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Ask anything about this lift — form, muscles, mistakes, or how to progress.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="rounded-full border border-[#2A2A2A] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'ml-6 bg-[#1C1C1C] text-gray-200'
                        : 'mr-2 border border-[#2A2A2A] bg-[#0A0A0A] text-gray-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}

                {loading && (
                  <p className="text-sm italic text-gray-500">Coach is thinking…</p>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>

              {messages.length > 0 && (
                <div className="border-t border-[#2A2A2A] px-5 py-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        disabled={loading}
                        onClick={() => send(q)}
                        className="rounded-full border border-[#2A2A2A] px-2.5 py-1 text-[11px] text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF] disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 border-t border-[#2A2A2A] px-5 py-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send(input);
                  }}
                  placeholder="Ask a follow-up…"
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-[#6C63FF] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="shrink-0 rounded-lg bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
