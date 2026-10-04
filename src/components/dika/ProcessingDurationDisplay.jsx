import { getProcessingDurationParts } from '../../utils/workflow';

export default function ProcessingDurationDisplay({
  timestamp,
  finishtime,
  className = '',
  ongoingClassName = 'text-xs text-warm-gray/70 sm:text-sm',
}) {
  const parts = getProcessingDurationParts(timestamp, finishtime);

  if (!parts) {
    return <span className={className}>-</span>;
  }

  return (
    <div className={`leading-snug ${className}`}>
      <div>{parts.days} วัน</div>
      {parts.ongoing && <div className={ongoingClassName}>(ยังดำเนินการ)</div>}
    </div>
  );
}
