import { useCallback, useEffect, useRef, useState } from 'react';
import { classroomMedia, STUDENTS } from './classroomMedia';

/** Environment only: no inspection state, dialogue, hotspots or progression. */
export default function ClassroomAmbient({ active, onReady }: { active: boolean; onReady: (ready: boolean) => void }) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const attemptVideo = classroomMedia.mode !== 'static' && !!classroomMedia.videoUrl && !videoFailed;
  const staticReady = loaded.length === 4;
  const markLoaded = useCallback((id: string) => setLoaded(previous => previous.includes(id) ? previous : [...previous, id]), []);

  useEffect(() => { onReady(attemptVideo ? playing : staticReady); }, [attemptVideo, playing, staticReady, onReady]);
  useEffect(() => {
    const element = video.current;
    if (!active || !attemptVideo || !element) {
      element?.pause(); setPlaying(false); return;
    }
    element.muted = true;
    void element.play().catch(() => setVideoFailed(true));
    // A blocked, corrupt or stalled clip must not trap the player in darkness.
    const timeout = window.setTimeout(() => {
      if (element.paused || element.readyState < 2) setVideoFailed(true);
    }, 4000);
    return () => { window.clearTimeout(timeout); element.pause(); };
  }, [active, attemptVideo]);

  const showVideo = attemptVideo && playing;
  return (
    <div className="classroom-ambient" data-source={showVideo ? 'video' : 'static'}>
      <div className="classroom-static" style={{ opacity: showVideo ? 0 : 1 }} aria-hidden="true">
        <img className="classroom-background" src={classroomMedia.background} alt="" onLoad={() => markLoaded('background')} onError={() => setImageError(true)} />
        {STUDENTS.map(student => <img key={student.id} className={`student-art student-${student.id}`} src={student.image} alt="" draggable={false} onLoad={() => markLoaded(student.id)} onError={() => setImageError(true)} />)}
      </div>
      {attemptVideo && <video ref={video} className="classroom-video" src={classroomMedia.videoUrl} muted loop playsInline preload="metadata" aria-hidden="true" style={{ opacity: showVideo ? 1 : 0 }} onPlaying={() => setPlaying(true)} onError={() => setVideoFailed(true)} onLoadedMetadata={event => {
        const media = event.currentTarget;
        if (!media.videoHeight || Math.abs(media.videoWidth / media.videoHeight - 16 / 9) > 0.03) setVideoFailed(true);
      }} />}
      {active && imageError && !showVideo && <p className="load-status" role="alert">A classroom image could not load. Please refresh to try again.</p>}
    </div>
  );
}
