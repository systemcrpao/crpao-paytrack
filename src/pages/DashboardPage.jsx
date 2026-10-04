import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import SummaryDashboard from '../components/dashboard/SummaryDashboard';
import DikaTable from '../components/dika/DikaTable';
import DikaSearchBar from '../components/dika/DikaSearchBar';
import FiscalYearSelect from '../components/dika/FiscalYearSelect';
import DikaForm from '../components/dika/DikaForm';
import DikaStatusForm from '../components/dika/DikaStatusForm';
import DikaDetailModal from '../components/dika/DikaDetailModal';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS, STATUS } from '../constants';
import { addDika, updateDika, updateDikaStatus } from '../services/api';
import { useDikaData } from '../hooks/useDikaData';
import {
  filterDikaByRole,
  computeDashboardMetrics,
  searchDikaItems,
  sortDikaByDateDesc,
  isStatus,
  filterDikaByFiscalYear,
  extractFiscalYears,
  getCurrentFiscalYear,
} from '../utils/workflow';
import { getAssigneeUsers, isRole } from '../utils/apiHelpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { allItems, users, loading, error, refresh } = useDikaData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [statusEditingItem, setStatusEditingItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingApprovalOnly, setPendingApprovalOnly] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(() => String(getCurrentFiscalYear()));

  const isAdmin = isRole(user?.role, ROLES.ADMIN);
  const isManager = isRole(user?.role, ROLES.MANAGER);

  const usersError = useMemo(() => {
    if (!isAdmin || users.length > 0 || loading) return '';
    return error || 'ไม่สามารถโหลดรายชื่อผู้รับผิดชอบได้';
  }, [isAdmin, users.length, loading, error]);

  const visibleItems = useMemo(
    () => filterDikaByRole(allItems, user, users),
    [allItems, user, users],
  );

  const fiscalYearOptions = useMemo(
    () => extractFiscalYears(allItems),
    [allItems],
  );

  const fiscalFilteredItems = useMemo(
    () => filterDikaByFiscalYear(visibleItems, fiscalYear),
    [visibleItems, fiscalYear],
  );

  const searchedItems = useMemo(() => {
    let items = sortDikaByDateDesc(
      searchDikaItems(fiscalFilteredItems, searchQuery, users),
    );

    if (isRole(user?.role, ROLES.MANAGER) && pendingApprovalOnly) {
      items = items.filter((item) =>
        isStatus(item.status, STATUS.PENDING_APPROVAL),
      );
    }

    return items;
  }, [
    fiscalFilteredItems,
    searchQuery,
    users,
    user?.role,
    pendingApprovalOnly,
  ]);

  const tableEmptyMessage =
    visibleItems.length > 0 && searchedItems.length === 0
      ? pendingApprovalOnly
        ? 'ไม่พบเรื่องที่รออนุมัติ'
        : fiscalFilteredItems.length === 0 && fiscalYear !== 'all'
          ? `ไม่พบข้อมูลในปีงบประมาณ ${fiscalYear}`
          : 'ไม่พบข้อมูลที่ตรงกับการค้นหา'
      : 'ไม่พบข้อมูลเรื่องเบิกจ่าย';

  const metrics = useMemo(
    () => computeDashboardMetrics(fiscalFilteredItems, user?.role),
    [fiscalFilteredItems, user?.role],
  );

  const assigneeUsers = useMemo(
    () => getAssigneeUsers(users),
    [users],
  );

  const handleAdd = async (data) => {
    await addDika(data);
    await refresh();
  };

  const handleUpdate = async (data, id) => {
    await updateDika(id, data);
    await refresh();
  };

  const handleFormSubmit = async (data, id) => {
    if (id) {
      await handleUpdate(data, id);
    } else {
      await handleAdd(data);
    }
  };

  const handleAcknowledge = async (id, status) => {
    await updateDikaStatus(id, status);
    await refresh();
  };

  const handleOpenForm = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleStatusEdit = (item) => {
    setStatusEditingItem(item);
    setStatusFormOpen(true);
  };

  const handleViewDetail = (item) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  const handleCloseStatusForm = () => {
    setStatusFormOpen(false);
    setStatusEditingItem(null);
  };

  const handleStatusFormSubmit = async (id, status) => {
    if (!id) {
      throw new Error('ไม่พบรหัสรายการ');
    }
    await updateDikaStatus(id, status);
    await refresh();
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">บริหารจัดการการเบิกจ่าย</h2>
          <p className="text-sm text-warm-gray/70">
            {ROLE_LABELS[user?.role]} — ภาพรวมเรื่องเบิกจ่าย
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenForm}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-primary"
            >
              <Plus className="h-4 w-4" />
              เพิ่มเรื่องใหม่
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SummaryDashboard metrics={metrics} userRole={user?.role} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <DikaSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiscalYearSelect
            value={fiscalYear}
            onChange={setFiscalYear}
            years={fiscalYearOptions}
          />
          {isManager && (
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-warm-gray transition hover:bg-gray-50">
              <input
                type="checkbox"
                checked={pendingApprovalOnly}
                onChange={(e) => setPendingApprovalOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="font-medium">รออนุมัติ</span>
            </label>
          )}
        </div>
      </div>

      <DikaTable
        items={searchedItems}
        userRole={user?.role}
        users={users}
        onAcknowledge={handleAcknowledge}
        onStatusEdit={handleStatusEdit}
        onViewDetail={handleViewDetail}
        loading={loading && allItems.length === 0}
        emptyMessage={tableEmptyMessage}
      />

      <DikaForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        users={assigneeUsers}
        usersError={usersError}
      />

      <DikaStatusForm
        open={statusFormOpen}
        onClose={handleCloseStatusForm}
        item={statusEditingItem}
        users={users}
        userRole={user?.role}
        onSubmit={handleStatusFormSubmit}
      />

      <DikaDetailModal
        open={detailOpen}
        onClose={handleCloseDetail}
        item={detailItem}
        users={users}
      />
    </MainLayout>
  );
}
