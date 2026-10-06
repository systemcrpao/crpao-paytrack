import { normalizeUsers } from '../utils/apiHelpers';

/** ตั้งค่าใน `.env.local` (local) หรือ GitHub Secret `VITE_GAS_URL` (Pages) — ห้าม commit URL จริง */
export const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();

const GAS_URL_HINT =
  'ใช้ URL จาก Deploy → แอปเว็บ (ลงท้าย /exec) ไม่ใช่ URL ไลบรารี — ตั้งใน .env.local หรือ GitHub Secret VITE_GAS_URL';

export function assertGasConfigured() {
  if (!GAS_URL) {
    throw new Error(`ยังไม่ได้ตั้งค่า VITE_GAS_URL — ${GAS_URL_HINT}`);
  }

  const validWebApp =
    /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/(exec|dev)(\?.*)?$/.test(
      GAS_URL,
    );

  if (!validWebApp) {
    throw new Error(
      `VITE_GAS_URL ไม่ถูกต้อง (ต้องเป็นแอปเว็บ script.google.com/macros/s/.../exec) — ${GAS_URL_HINT}`,
    );
  }
}

const GAS_HTML_RESPONSE_ERROR =
  'ได้รับหน้า HTML แทน JSON จาก Google — มักเกิดจาก URL ผิด (เช่น คัดลอก URL ไลบรารีแทนแอปเว็บ) หรือยังไม่ได้ตั้ง VITE_GAS_URL ตอน build GitHub Pages — ตรวจ Deploy แอปเว็บว่าเลือก "Anyone (ทุกคน)" แล้วคัดลอก URL /exec';

function isHtmlResponse(text) {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error('เซิร์ฟเวอร์ไม่ส่งข้อมูลกลับมา');
  }

  if (isHtmlResponse(text)) {
    throw new Error(GAS_HTML_RESPONSE_ERROR);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? 'ได้รับข้อมูลจากเซิร์ฟเวอร์ในรูปแบบที่ไม่ถูกต้อง'
        : `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (HTTP ${response.status})`,
    );
  }
}

async function handleResponse(response, { throwOnFailure = true } = {}) {
  const result = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(result?.message || `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (HTTP ${response.status})`);
  }

  if (throwOnFailure && result?.success === false) {
    throw new Error(result.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
  }

  return result;
}

export async function gasGet(action, params = {}) {
  assertGasConfigured();
  const search = new URLSearchParams({ action, ...params });
  const response = await fetch(`${GAS_URL}?${search.toString()}`, {
    redirect: 'follow',
  });
  return handleResponse(response);
}

export async function gasPost(action, payload = {}) {
  assertGasConfigured();
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, payload }),
    redirect: 'follow',
  });
  return handleResponse(response);
}

export async function login(username, password) {
  assertGasConfigured();
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action: 'login', payload: { username, password } }),
    redirect: 'follow',
  });
  return handleResponse(response, { throwOnFailure: false });
}

export async function getDika() {
  return gasGet('getDika');
}

async function fetchBootstrapFallback() {
  const [dikaResult, usersResult] = await Promise.all([
    getDika(),
    getUsers().catch(() => ({ data: [] })),
  ]);

  const items = dikaResult?.data || dikaResult || [];

  return {
    success: true,
    data: Array.isArray(items) ? items : [],
    users: normalizeUsers(usersResult),
  };
}

export async function getBootstrap() {
  try {
    const result = await gasGet('getBootstrap');

    if (result?.success === false) {
      return fetchBootstrapFallback();
    }

    return {
      success: true,
      data: Array.isArray(result?.data) ? result.data : [],
      users: normalizeUsers({ data: result?.users || [] }),
    };
  } catch {
    return fetchBootstrapFallback();
  }
}

export async function addDika(data) {
  return gasPost('addDika', data);
}

export async function updateDika(id, data) {
  return gasPost('updateDika', { id, ...data });
}

export async function updateDikaStatus(id, status) {
  return gasPost('updateStatus', { id, status });
}

export async function getUsers() {
  const result = await gasGet('getUsers');

  if (result?.success === false) {
    throw new Error(result.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
  }

  return {
    ...result,
    data: normalizeUsers(result),
  };
}
