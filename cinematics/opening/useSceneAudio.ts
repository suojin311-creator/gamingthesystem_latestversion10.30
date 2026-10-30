import { useFeedback } from '../../shared/hooks/useFeedback';
import { audioDirector } from '../../audio/director';
const cues={notification:'notification',interaction:'tick',emailOpen:'paper',transition:'transition',studentInspect:'evidence'} as const;
export function useSceneAudio(){
 const feedback=useFeedback();
 return {...feedback,play:(cue:keyof typeof cues)=>audioDirector.cue(cues[cue]),startOffice:()=>{audioDirector.startMusic();feedback.unlock();audioDirector.setScene('office',.75);},startClassroom:()=>audioDirector.setScene('office',.48),fadeOfficeOut:()=>{},fadeClassroomOut:()=>{},reset:feedback.stop,toggleMuted:feedback.toggle};
}
