/** A visible target marker; the surrounding native button owns interaction. */
export default function InteractionCue({ className = '' }: { className?: string }) {
  return <span className={`opening-interaction-cue ${className}`} aria-hidden="true">
    <svg viewBox="0 0 36 36" fill="none">
      <path d="M18 5v25M8 20l10 10 10-10" />
    </svg>
  </span>;
}
