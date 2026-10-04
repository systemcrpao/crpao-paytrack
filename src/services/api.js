import { normalizeUsers } from '../utils/apiHelpers';

/** ตั้งค่าใน `.env.local` (local) หรือ GitHub Secret `VITE_GAS_URL` (Pages) — ห้าม commit URL จริง */
export const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();

export function assertGasConfigured() {
  if (!GAS_URL) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า VITE_GAS_URL สำหรับ Google Apps Script — ดู README.md ส่วนการตั้งค่า',
    );
  }
}

const GAS_ACCESS_ERROR =
  'ไม่สามารถเชื่อมต่อ Google Apps Script ได้ กรุณาตรวจสอบว่า Deploy แล้วและเลือก "Anyone (ทุกคน)"';

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
    throw new Error(GAS_ACCESS_ERROR);
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
