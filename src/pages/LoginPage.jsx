import { useState } from 'react';
import { LogIn, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import { useDikaStore } from '../store/dikaStore';

function formatLoginError(message) {
  if (!message) return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';

  if (message.includes('<!DOCTYPE') || message.includes('<html')) {
    return 'ได้รับหน้า HTML แทน JSON — ตรวจ URL แอปเว็บ (/exec) ใน VITE_GAS_URL และว่า Deploy เลือก "Anyone (ทุกคน)" แล้ว';
  }

  return message.length > 200 ? `${message.slice(0, 200)}...` : message;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiLogin(username, password);

      if (result.success && result.user) {
        login(result.user);
        void useDikaStore.getState().loadBootstrap({ force: true });
        navigate('/');
      } else {
        setError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError(formatLoginError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/60 bg-white/70 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/90 backdrop-blur-md">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            ระบบจัดการเรื่องเบิกจ่าย
          </h1>
          <p className="mt-1 text-sm text-warm-gray/70">เข้าสู่ระบบเพื่อดำเนินการ</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-gray">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/90 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-primary disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
