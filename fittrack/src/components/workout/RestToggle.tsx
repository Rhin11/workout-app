interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/** Small on/off switch for the rest timer, matching the dark theme. */
export default function RestToggle({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Turn rest timer off' : 'Turn rest timer on'}
      title={enabled ? 'Rest timer on' : 'Rest timer off'}
      onClick={() => onToggle(!enabled)}
      className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
        enabled ? 'bg-[#6C63FF]' : 'bg-[#2A2A2A]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
