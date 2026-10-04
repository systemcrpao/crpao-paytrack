import { NavLink } from 'react-router-dom';
import { LogOut, FileText, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants';

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-white/30 text-white'
      : 'text-white/80 hover:bg-white/20 hover:text-white'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/30 bg-primary/90 backdrop-blur-md shadow-lg">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white sm:text-xl">
                ระบบบริหารจัดการเรื่องเบิกจ่าย
              </h1>
              <p className="hidden text-xs text-white/80 sm:block">
                องค์การบริหารส่วนจังหวัดเชียงราย
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>งานของฉัน</span>
            </NavLink>
            <NavLink to="/overview" className={navLinkClass}>
              <BarChart3 className="h-4 w-4" />
              <span>ภาพรวมระบบ</span>
            </NavLink>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              ชื่อผู้ใช้งาน: {user?.name}
            </p>
            <p className="text-xs text-white/80">
              บทบาท: {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30 backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
