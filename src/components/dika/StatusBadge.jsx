import { STATUS } from '../../constants';
import { normalizeStatusLabel } from '../../utils/workflow';

const statusStyles = {
  [STATUS.FORWARD_TO_STAFF]: 'bg-blue-100 text-blue-800',
  [STATUS.REVIEW]: 'bg-indigo-100 text-indigo-800',
  [STATUS.PROPOSE]: 'bg-purple-100 text-purple-800',
  [STATUS.PENDING_APPROVAL]: 'bg-orange-100 text-orange-800',
  [STATUS.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [STATUS.RETURNED]: 'bg-amber-100 text-amber-800',
  [STATUS.CANCELLED]: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
  const displayStatus = normalizeStatusLabel(status);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[displayStatus] || 'bg-gray-100 text-gray-700'}`}
    >
      {displayStatus}
    </span>
  );
}
