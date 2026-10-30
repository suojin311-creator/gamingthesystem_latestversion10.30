import '../styles/portraits.css';

/** Role-based portraits stay the same when the opening supplies a new name. */
export default function CharacterPortrait({ role }: { role: 'teacher' | 'student' }) {
  return <svg className={`character-portrait portrait-${role}`} data-character={role} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    {role === 'teacher' ? <>
      <path d="M8 34v-5c0-5 5-8 12-8s12 3 12 8v5" fill="currentColor" opacity=".14" />
      <path d="M8 33v-4c0-4 4-7 8-8m8 0c4 1 8 4 8 8v4M16 21l4 5 4-5M20 26v7" />
      <path d="M13 12c0-5 3-8 7-8s7 3 7 8v3c0 5-3 8-7 8s-7-3-7-8v-3Z" />
      <path d="M13 13c4 0 7-2 8-5 1 3 3 5 6 5" />
    </> : <>
      <path d="M9 34v-5c0-4 4-7 11-7s11 3 11 7v5" fill="currentColor" opacity=".14" />
      <path d="M9 33v-4c0-4 3-6 7-7l4 4 4-4c4 1 7 3 7 7v4M13 24v8m14-8v8" />
      <path d="M13 13c0-4 3-7 7-7s7 3 7 7v2c0 4-3 7-7 7s-7-3-7-7v-2Z" />
      <path d="m13 13 4-4 3 3 3-3 4 4" />
    </>}
  </svg>;
}
