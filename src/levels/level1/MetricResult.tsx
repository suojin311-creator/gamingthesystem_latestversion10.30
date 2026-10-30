import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import type {Metric} from './metrics';
import type {Cue} from '../../shared/hooks/useFeedback';
import {METRIC_CATALOG} from '../../shared/data/metrics';
import Icon from '../../shared/components/Icon';
import {useVisibleDelay} from '../../shared/hooks/useVisibleDelay';
import '../../shared/styles/metric-selection.css';
import './metric-result.css';
export default function MetricResult({metric,paused,onReport,onObserve,play,renderPerspectives}:{metric:Metric;paused:boolean;onReport:()=>void;onObserve:()=>void;play:(cue:Cue)=>void;renderPerspectives:(reported:boolean,complete:()=>void)=>ReactNode}){
 const [focused,setFocused]=useState(false),[checked,setChecked]=useState(false);
 const [reported,setReported]=useState(false),[enabled,setEnabled]=useState(false);
 const stage=useRef<HTMLDivElement>(null),slot=useRef<HTMLLIElement>(null);
 const [geometry,setGeometry]=useState<{from:{left:number,top:number,width:number,height:number},to:{left:number,top:number,width:number,height:number}}|null>(null);
 const [landed,setLanded]=useState(false),[managementDone,setManagementDone]=useState(false);
 const completed=useRef(false),focusedOnce=useRef(false);
 useLayoutEffect(()=>{
  const measure=()=>{if(!stage.current||!slot.current)return;
   const a=stage.current.getBoundingClientRect(),b=slot.current.getBoundingClientRect();
   const width=Math.min(390,stage.current.clientWidth-48),height=210;
   setGeometry({from:{left:b.left-a.left-stage.current.clientLeft,top:b.top-a.top-stage.current.clientTop,width:b.width,height:b.height},
    to:{left:(stage.current.clientWidth-width)/2,top:(stage.current.clientHeight-height)/2,width,height}});
  };measure();const resize=new ResizeObserver(measure);if(stage.current)resize.observe(stage.current);return()=>resize.disconnect();
 },[]);
 const focusComplete=()=>{
  if(!focused||focusedOnce.current)return;focusedOnce.current=true;
  setLanded(true);
 };
 useEffect(()=>{if(focused&&geometry&&matchMedia('(prefers-reduced-motion: reduce)').matches)focusComplete();},[focused,geometry]);
 const managementComplete=()=>{
  if(completed.current)return;completed.current=true;
  setManagementDone(true);
 };
 useVisibleDelay('metric-result-focus','.metric-stage',1100,!focused&&!paused,()=>setFocused(true));
 useVisibleDelay('metric-result-check','.metric-stage',180,landed&&!checked&&!paused,()=>{setChecked(true);play('tick');});
 useVisibleDelay('metric-result-report','.metric-stage',650,checked&&!reported&&!paused,()=>{setReported(true);onReport();});
 useVisibleDelay('metric-result-enable','.metric-stage',350,managementDone&&!enabled&&!paused,()=>setEnabled(true));
 return <div className="workbench-body metric-result" data-focused={focused} data-checked={checked}>
 <section className="decision-area">
 <div className="section-intro"><h2>{checked?'The target is met.':'Checking the metric.'}</h2></div>
 <div className="metric-choice single-metric-report"><div ref={stage} className="metric-stage" aria-label="Six metrics and your chosen metric">
 <ul className="choice-grid metric-grid metric-overview">{METRIC_CATALOG.map(m=><li key={m.id} ref={m.id===metric.id?slot:undefined} className={`choice-card metric-card metric-option ${m.id===metric.id?'selected-slot selected':''}`} data-metric={m.id} aria-hidden={m.id===metric.id||focused}>
 <span className="choice-card-mark" aria-hidden="true"/><span className="choice-card-art"><Icon name={m.id}/></span><h3>{m.shortName}</h3>
 </li>)}</ul>
 {geometry&&<div className="choice-card metric-card selected selected-metric-card" data-checked={checked} style={focused?geometry.to:geometry.from} onTransitionEnd={e=>{if(e.target===e.currentTarget&&e.propertyName==='width')focusComplete();}}>
 <span className="choice-card-mark" aria-hidden="true"><Icon name="check"/></span><span className="choice-card-art"><Icon name={metric.id}/></span><h3>{metric.shortName}</h3>
 <span className="l2-eval-result" aria-live="polite">{checked?<><Icon name="check"/>Target met</>:focused?<><i className="l2-checking"/>Checking</>:<span aria-hidden="true"/>}</span>
 </div>}
 </div></div>
 <div className="action-row"><button type="button" className="button primary-button" disabled={!enabled} onClick={onObserve}><Icon name="play"/>Observe the class</button></div>
 </section>{renderPerspectives(reported,managementComplete)}</div>;
}
