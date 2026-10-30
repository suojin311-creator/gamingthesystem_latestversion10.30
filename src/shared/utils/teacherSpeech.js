/** Imported films use the same impersonal teacher address as the workbench. */
export function teacherSpeech(text) {
  const stripped = text.replace(/^Alex[,，:]\s*/iu, '').replace(/,\s*Alex(?=[.!?…])/giu, '');
  return stripped === text ? text : stripped.replace(/^\p{Ll}/u, letter => letter.toUpperCase());
}
