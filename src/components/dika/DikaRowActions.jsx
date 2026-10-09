import { useState } from 'react';
import { CheckCircle, Eye, Pencil } from 'lucide-react';
import { ROLES } from '../../constants';
import { isRole } from '../../utils/apiHelpers';
import {
  canStaffAcknowledge,
  canManagerAcknowledge,
  canStaffManage,
  canManagerManage,
  canAdminEditReturned,
  getAckTargetStatus,
} from '../../utils/workflow';

export default function DikaRowActions({
  item,
  userRole,
  onAcknowledge,
  onStatusEdit,
  onEditItem,
  onViewDetail,
}) {
  const [updating, setUpdating] = useState(false);

  const isUser = isRole(userRole, ROLES.USER);
  const isManager = isRole(userRole, ROLES.MANAGER);
  const isAdmin = isRole(userRole, ROLES.ADMIN);

  const showStaffAck = isUser && canStaffAcknowledge(item.status);
  const showManagerAck = isManager && canManagerAcknowledge(item.status);
  const showStaffManage = isUser && canStaffManage(item.status);
  const showManagerManage = isManager && canManagerManage(item.status);
  const showAdminEdit = isAdmin && canAdminEditReturned(item.status);

  const handleAcknowledge = async () => {
    setUpdating(true);
    try {
      const targetStatus = getAckTargetStatus(userRole);
      await onAcknowledge(item.id, targetStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onViewDetail(item)}
        title="ดูรายละเอียด"
        aria-label="ดูรายละเอียด"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-warm-gray transition hover:bg-gray-50 hover:text-primary"
      >
        <Eye className="h-4 w-4" />
      </button>

      {(showStaffAck || showManagerAck) && (
        <button
          type="button"
          disabled={updating}
          onClick={handleAcknowledge}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-primary disabled:opacity-60"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          รับเรื่อง
        </button>
      )}

      {(showStaffManage || showManagerManage) && (
        <button
          type="button"
          disabled={updating}
          onClick={() => onStatusEdit(item)}
          title="แก้ไขสถานะ"
          aria-label="แก้ไขสถานะ"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-white/80 text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {showAdminEdit && (
        <button
          type="button"
          onClick={() => onEditItem(item)}
          title="แก้ไขเรื่อง"
          aria-label="แก้ไขเรื่อง"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-white/80 text-primary transition hover:bg-primary/5"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
