import VisitsTimeline from './VisitsTimeline';

export default function CaseTimelineTab({ caseId, redFlags }) {
  return (
    <div>
      <VisitsTimeline caseId={caseId} redFlags={redFlags} />
    </div>
  );
}

