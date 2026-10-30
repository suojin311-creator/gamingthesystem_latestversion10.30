import Icon from './Icon';
import '../styles/learning-risk.css';

/** Both levels show the observed behaviour first, followed by its learning risk. */
export default function LearningRisk({ behaviour }: { behaviour: string }) {
  return <>
    <p className="student-behaviour">{behaviour}</p>
    <div className="learning-risk"><Icon name="warning" /><strong>Learning at risk</strong></div>
  </>;
}
