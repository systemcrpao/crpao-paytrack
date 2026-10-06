import { normalizeUsers } from '../utils/apiHelpers';
import { isValidGasWebAppUrl, resolveGasUrl } from './gasConfig';

/** @deprecated ใช้ resolveGasUrl() — ค่านี้อาจว่างบน GitHub Pages ถ้าไม่ได้ build ด้วย VITE_GAS_URL */
export const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();

const GAS_ACCESS_DENIED_ERROR =
  'Google ตอบ 401/403 — ไปที่ Apps Script → Deploy → แอปเว็บ ตั้ง "ผู้ที่มีสิทธิ์เข้าถึง" เป็น **ทุกคน (Anyone)** แล้วกด Deploy เวอร์ชันใหม่ (หรือสร้าง deployment ใหม่) จากนั้นอัปเดต URL /exec';

const GAS_HTML_RESPONSE_ERROR =
  'ได้รับหน้า HTML แทน JSON จาก Google — ตรวจ URL แอปเว็บ (/exec ไม่ใช่ URL ไลบรารี) และตั้งค่า VITE_GAS_URL หรือ public/config.json บน GitHub Pages';

function isHtmlResponse(text) {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

async function parseResponseBody(response) {
  if (response.status === 401 || response.status === 403) {
    throw new Error(GAS_ACCESS_DENIED_ERROR);
  }

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

async function gasFetch(url, options = {}) {
  return fetch(url, {
    redirect: 'follow',
    credentials: 'omit',
    cache: 'no-store',
    ...options,
  });
}

export function assertGasConfigured() {
  if (isValidGasWebAppUrl(GAS_URL)) {
    return;
  }
}

export async function gasGet(action, params = {}) {
  const gasUrl = await resolveGasUrl();
  const search = new URLSearchParams({ action, ...params });
  const response = await gasFetch(`${gasUrl}?${search.toString()}`);
  return handleResponse(response);
}

export async function gasPost(action, payload = {}) {
  const gasUrl = await resolveGasUrl();
  const response = await gasFetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, payload }),
  });
  return handleResponse(response);
}

export async function login(username, password) {
  const gasUrl = await resolveGasUrl();
  const response = await gasFetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action: 'login', payload: { username, password } }),
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

function normalizeBootstrapResult(result) {
  return {
    success: true,
    data: Array.isArray(result?.data) ? result.data : [],
    users: normalizeUsers({ data: result?.users || [] }),
  };
}

function shouldUseLegacyBootstrapFallback(errorMessage) {
  const message = String(errorMessage || '');
  return (
    message === 'Invalid action' ||
    /HTTP 404/i.test(message) ||
    /Failed to fetch|NetworkError|Load failed/i.test(message)
  );
}

export async function getBootstrap() {
  try {
    const result = await gasGet('getBootstrap');

    if (result?.success === false) {
      if (shouldUseLegacyBootstrapFallback(result.message)) {
        return fetchBootstrapFallback();
      }
      throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
    }

    return normalizeBootstrapResult(result);
  } catch (err) {
    if (shouldUseLegacyBootstrapFallback(err.message)) {
      return fetchBootstrapFallback();
    }
    throw err;
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
