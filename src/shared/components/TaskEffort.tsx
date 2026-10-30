import type { MetricId } from '../data/metrics';
import '../styles/task-effort.css';

/** Effort describes time and attention, not a measured learning outcome. */
export default function TaskEffort({ effort, metricId }: { effort: 'low' | 'medium' | 'high'; metricId: MetricId }) {
  const low = effort === 'low', high = effort === 'high';
  const talking = metricId === 'part' || metricId === 'discuss';
  return <svg className={`task-scene task-scene-${effort} task-scene-${metricId}`} data-task={metricId} viewBox="0 0 160 100" fill="none" aria-hidden="true">
    <ellipse cx="81" cy="90" rx="67" ry="5" fill="#b3a081" opacity=".14" />
    <path d="M12 79H148M23 80V90M139 80V90" stroke="#b59b73" strokeWidth="3" strokeLinecap="round" />
    {high && (metricId === 'prep' || metricId === 'reflect') && <g stroke="#b88b5d" strokeWidth="1.3"><path d="M16 76H44V70H16Z" fill="#e8d7b9" /><path d="M19 70H46V64H19Z" fill="#f6e5c9" /><path d="M22 64H48V58H22Z" fill="#fcf4e3" /></g>}
    {metricId === 'prep' && <g stroke="#b59d73" strokeWidth="1.5"><path d="M45 75V52Q56 47 67 54Q78 49 88 54V76Q77 71 67 76Q56 71 45 75Z" fill="#fffaf0" /><path d="M67 54v22M50 57l11 1M50 62l11 1M74 58h9M74 63h9" /></g>}
    {(metricId === 'focus' || metricId === 'peer') && <g stroke="#a79776" strokeWidth="1.5"><path d="M35 75l5-31h45l-2 31H35Z" fill="#f8f4e7" /><path d="M30 78h59" strokeWidth="3" />{metricId === 'peer' ? <><path d="M47 51h28v12H59l-6 6v-6h-6Z" fill="#e9eddf" /><path d="M52 55h18M52 59h11" /></> : <><path d="M46 52h27M45 58h20M44 64h15" />{low && <rect x="17" y="58" width="12" height="19" rx="2" fill="#d6d6c5" />}</>}</g>}
    {metricId === 'reflect' && <g stroke="#baa77f" strokeWidth="1.5"><path d="M48 75l11-29h31L80 75H48Z" fill="#fffcf2" /><path d="M63 52h18M61 58h16M58 64h14M55 70h13" /><path d="m74 67 3 3 7-8" stroke="#899672" /></g>}
    {talking && <g className="task-contribution" stroke="#a49672" strokeWidth="1.5"><path d="M24 20h53v25H54l-9 8v-8H24Z" fill="#f3eddb" />{metricId === 'discuss' ? <><path d="M34 29h32M34 36h20" /><path d="M15 55h27v14H29l-5 5v-5h-9Z" fill="#e8ecdf" /></> : <><path d="M36 29h27M36 36h17" />{high && <path d="m19 14-5-5M25 9V3M11 21H5" />}</>}</g>}
    <g className="task-person" transform={low ? 'translate(8 -1) rotate(9 110 65)' : high ? 'rotate(-7 111 66)' : undefined}>
      <path d="M99 51Q109 44 123 51L130 77H96Z" fill={high ? '#b66c50' : low ? '#b9a17b' : '#8c9e77'} />
      <path d="M106 44V51M118 44V51" stroke="#b88e66" strokeWidth="3" />
      <circle cx="112" cy="29" r="15" fill="#ead6b4" stroke="#ac8d65" strokeWidth="1.5" />
      <path d="M97 27Q97 8 113 12Q129 12 127 28L122 21L116 23L111 19L99 29" fill="#6d6450" />
      <path d={low ? 'M103 31H108M116 31H121' : 'M104 31H107M116 31H119'} stroke="#5d5e48" strokeWidth="1.7" strokeLinecap="round" />
      <path d={talking && !low ? 'M108 38Q113 43 118 38' : low ? 'M108 39Q113 42 118 38' : 'M109 39H116'} stroke="#9c704d" strokeWidth="1.4" strokeLinecap="round" />
      {low ? <path d="M101 56L116 66L126 54M125 59L114 71L101 65" stroke="#d1b38a" strokeWidth="6" strokeLinecap="round" /> : metricId === 'part' ? <g className="task-raised-hand"><path d="M104 55L92 43L90 19M121 57L125 73H102" stroke="#d1b38a" strokeWidth="6" strokeLinecap="round" /><path d="M87 20V11M90 20V9M93 21V12" stroke="#d1b38a" strokeWidth="2" strokeLinecap="round" /></g> : metricId === 'discuss' ? <path d="M103 55L88 65L78 57M121 57L125 73H103" stroke="#d1b38a" strokeWidth="6" strokeLinecap="round" /> : <g className="task-writing-hand"><path d="M102 55L94 66L78 67M121 57L125 73H95" stroke="#d1b38a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><path d="M78 64L71 73" stroke="#6b6b52" strokeWidth="2.5" strokeLinecap="round" /></g>}
    </g>
    {high && <g className="task-speed" stroke="#b98860" strokeWidth="2" strokeLinecap="round"><path d="M134 33L144 29M137 42H149M132 22L137 15" /></g>}
  </svg>;
}
