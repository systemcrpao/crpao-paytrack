import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import SystemOverview from '../components/dashboard/SystemOverview';
import DashboardChartPanel from '../components/dashboard/DashboardChartPanel';
import FiscalYearSelect from '../components/dika/FiscalYearSelect';
import { useAuth } from '../context/AuthContext';
import { useDikaData } from '../hooks/useDikaData';
import { ROLES, ROLE_LABELS } from '../constants';
import {
  computeSystemOverviewMetrics,
  computeDashboardChartMetrics,
  filterDikaByRole,
  filterDikaByFiscalYear,
  extractFiscalYears,
  getCurrentFiscalYear,
} from '../utils/workflow';
import { isRole } from '../utils/apiHelpers';

function getOverviewSubtitle(role) {
  if (isRole(role, ROLES.USER)) {
    return 'สรุปเรื่องเบิกจ่ายที่คุณรับผิดชอบ';
  }
  if (isRole(role, ROLES.MANAGER)) {
    return 'สรุปเรื่องเบิกจ่ายในขั้นตอนที่ผู้บริหารดูแล';
  }
  return 'สรุปสถานะเรื่องเบิกจ่ายทั้งหมดในระบบ';
}

function getChartScopeDescription(role) {
  if (isRole(role, ROLES.USER)) {
    return 'เปรียบเทียบจำนวนเรื่องที่คุณรับผิดชอบ';
  }
  if (isRole(role, ROLES.MANAGER)) {
    return 'เปรียบเทียบจำนวนเรื่องในขั้นตอนที่ผู้บริหารดูแล';
  }
  return 'เปรียบเทียบจำนวนเรื่องตามสถานะทั้งหมดในระบบ';
}

export default function OverviewPage() {
  const { user } = useAuth();
  const { allItems, users, loading, error, refresh } = useDikaData();
  const [fiscalYear, setFiscalYear] = useState(() => String(getCurrentFiscalYear()));

  const visibleItems = useMemo(
    () => filterDikaByRole(allItems, user, users),
    [allItems, user, users],
  );

  const fiscalYearOptions = useMemo(() => {
    const yearSource = isRole(user?.role, ROLES.ADMIN) ? allItems : visibleItems;
    return extractFiscalYears(yearSource);
  }, [allItems, visibleItems, user?.role]);

  const fiscalFilteredItems = useMemo(
    () => filterDikaByFiscalYear(visibleItems, fiscalYear),
    [visibleItems, fiscalYear],
  );

  const metrics = useMemo(
    () => computeSystemOverviewMetrics(fiscalFilteredItems),
    [fiscalFilteredItems],
  );

  const chartMetrics = useMemo(
    () => computeDashboardChartMetrics(fiscalFilteredItems),
    [fiscalFilteredItems],
  );

  const pageSubtitle = getOverviewSubtitle(user?.role);
  const chartScopeDescription = useMemo(() => {
    const base = getChartScopeDescription(user?.role);
    if (fiscalYear === 'all') {
      return `${base} (ทุกปีงบประมาณ)`;
    }
    return `${base} (ปีงบประมาณ ${fiscalYear})`;
  }, [user?.role, fiscalYear]);

  const showEmptyFiscalYear =
    !loading &&
    visibleItems.length > 0 &&
    fiscalFilteredItems.length === 0 &&
    fiscalYear !== 'all';

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">ภาพรวมระบบ</h2>
          <p className="text-sm text-warm-gray/70">
            {ROLE_LABELS[user?.role]} — {pageSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiscalYearSelect
            value={fiscalYear}
            onChange={setFiscalYear}
            years={fiscalYearOptions}
          />
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DashboardChartPanel
        metrics={chartMetrics}
        loading={loading && allItems.length === 0}
        scopeDescription={chartScopeDescription}
      />

      {loading && allItems.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/70 p-12 text-center backdrop-blur-md">
          <p className="text-warm-gray/70">กำลังโหลดข้อมูล...</p>
        </div>
      ) : showEmptyFiscalYear ? (
        <div className="rounded-2xl border border-white/60 bg-white/70 p-12 text-center backdrop-blur-md">
          <p className="text-warm-gray/70">
            ไม่พบข้อมูลในปีงบประมาณ {fiscalYear}
          </p>
        </div>
      ) : (
        <SystemOverview metrics={metrics} />
      )}
    </MainLayout>
  );
}
