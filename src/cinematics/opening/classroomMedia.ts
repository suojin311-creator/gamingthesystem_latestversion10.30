import background from './assets/backgrounds/BG-002 — Classroom First-Person Background.png';
import sleeping from './assets/characters/CHAR-001 — Sleeping Student Idle.png';
import phone from './assets/characters/CHAR-003 — Phone Student Idle.png';
import unprepared from './assets/characters/CHAR-005 — Unprepared Student Idle.png';

// Add ONE approved ambient clip here; auto selects it without changing interactions.
const videos = import.meta.glob('./assets/videos/VID_ClassroomAmbient_v01.{mp4,webm}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export const classroomMedia: { mode: 'auto' | 'static' | 'video'; videoUrl?: string; background: string } = {
  mode: 'auto',
  videoUrl: videos['./assets/videos/VID_ClassroomAmbient_v01.mp4'] ?? videos['./assets/videos/VID_ClassroomAmbient_v01.webm'],
  background,
};

// Percentages refer to a fixed 16:9 composition. Calibrate after reviewing a real clip.
export const STUDENTS = [
  { id: 'sleeping', label: 'Inspect sleeping student', image: sleeping, dialogue: 'Zzz...', camera: { scale: 1.28, x: '14%', y: '-3%' }, hotspot: { left: '8%', top: '47%', width: '22%', height: '24%' } },
  { id: 'phone', label: 'Inspect phone student', image: phone, dialogue: 'Just one more message...', camera: { scale: 1.28, x: '0%', y: '-3%' }, hotspot: { left: '39%', top: '42%', width: '23%', height: '30%' } },
  { id: 'unprepared', label: 'Inspect unprepared student', image: unprepared, dialogue: "I don't know where to start.", camera: { scale: 1.28, x: '-14%', y: '-3%' }, hotspot: { left: '73%', top: '46%', width: '24%', height: '28%' } },
] as const;
