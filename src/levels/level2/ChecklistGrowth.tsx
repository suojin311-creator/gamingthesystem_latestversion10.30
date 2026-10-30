import CharacterPortrait from '../../shared/components/CharacterPortrait';

const CAPTIONS = { 10: 'Checking each box.', 25: 'One answer. Several boxes.', 100: 'Just enough for every tick.' };

export default function ChecklistGrowth({ count, beat }: { count: 10 | 25 | 100; beat: number }) {
  return <figure className="l2-growth-action" data-growth={count} data-beat={beat} aria-label={`Alex: ${CAPTIONS[count]}`}>
    <span className="l2-growth-portrait" aria-hidden="true"><CharacterPortrait role="student" /></span>
    <svg viewBox="0 0 300 128" fill="none" aria-hidden="true">
      <ellipse cx="154" cy="117" rx="130" ry="5" fill="#b7a17c" opacity=".16" />
      {Array.from({ length: count === 10 ? 1 : count === 25 ? 3 : 6 }, (_, index) => <rect key={index} x={97 + index * 4} y={15 + index * 3} width="100" height="95" rx="2" fill="#f5ecd8" stroke="#baa682" />)}
      <rect x="91" y="10" width="100" height="95" rx="2" fill="#fffbef" stroke="#b49d72" strokeWidth="1.5" />
      {[0, 1, 2].map(index => <g key={index}>
        <rect x="105" y={29 + index * 23} width="12" height="12" rx="1" stroke="#a49471" />
        <path d={`M125 ${35 + index * 23}h48`} stroke="#d1c5a8" strokeWidth="2" />
        {index < beat && <path className="l2-growth-mark" d={`m107 ${35 + index * 23} 4 4 8-9`} stroke="#7a8e60" strokeWidth="2.5" strokeLinecap="round" />}
      </g>)}
      {count > 10 && <><path d="M32 42h37v43H32Z" fill="#ece3ce" stroke="#b5a17e" /><path d="M40 52h20M40 60h20M40 68h13" stroke="#b5a17e" strokeWidth="2" /><path className="l2-reuse-arrow" d="M70 59h26m-6-5 6 5-6 5" stroke="#b07550" strokeWidth="2" /></>}
      {count === 100 && <><path d="M217 67h31v13h-31Z" fill="#b57555" /><path d="M226 66V51h13v15" stroke="#946b4b" strokeWidth="5" /><path d="M212 87h41" stroke="#87976e" strokeWidth="4" /></>}
    </svg>
    <figcaption>{CAPTIONS[count]}</figcaption>

  </figure>;
}
