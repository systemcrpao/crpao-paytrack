import { normalizeUsers } from '../utils/apiHelpers';
import { isValidGasWebAppUrl, resolveGasUrl } from './gasConfig';

/** @deprecated ใช้ resolveGasUrl() — ค่านี้อาจว่างบน GitHub Pages ถ้าไม่ได้ build ด้วย VITE_GAS_URL */
export const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();

const GAS_ACCESS_DENIED_ERROR =
  'Google ตอบ 401/403 — ไปที่ Apps Script → Deploy → แอปเว็บ ตั้ง "ผู้ที่มีสิทธิ์เข้าถึง" เป็น **ทุกคน (Anyone)** แล้วกด Deploy เวอร์ชันใหม่ (หรือสร้าง deployment ใหม่) จากนั้นอัปเดต URL /exec';

const GAS_HTML_RESPONSE_ERROR =
  'ได้รับหน้า HTML แทน JSON จาก Google — ตรวจ URL แอปเว็บ (/exec ไม่ใช่ URL ไลบรารี) และตั้งค่า VITE_GAS_URL หรือ public/config.json บน GitHub Pages';

const GAS_LARGE_RESPONSE_ERROR =
  'Google ตอบ 404 หลัง redirect (JSON ใหญ่เกินไป) — คัดลอก GAS/gas.md ไป Code.gs แล้ว Deploy เวอร์ชันใหม่ (Anyone) ให้รองรับ getDikaChunk';

const DIKA_CHUNK_SIZE = 15;
const USER_CHUNK_SIZE = 10;
const CHUNK_FETCH_CONCURRENCY = 3;

const GAS_CHUNK_ACTION_REQUIRED =
  'ฝั่ง Google Apps Script ยังไม่รองรับการโหลดแบบแยกส่วน — คัดลอก GAS/gas.md ไป Code.gs แล้ว Deploy เวอร์ชันใหม่ (Anyone)';

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
    if (response.status === 404) {
      throw new Error(GAS_LARGE_RESPONSE_ERROR);
    }
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

/** เรียก GAS ด้วย POST เท่านั้น — GET มัก 404 ที่ script.googleusercontent.com เมื่อ JSON ใหญ่ */
async function gasRequest(action, payload = {}, options = {}) {
  const gasUrl = await resolveGasUrl();
  const response = await gasFetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, payload }),
  });
  return handleResponse(response, options);
}

export async function gasGet(action, params = {}) {
  return gasRequest(action, params);
}

export async function gasPost(action, payload = {}) {
  return gasRequest(action, payload);
}

export async function login(username, password) {
  try {
    return await gasRequest('login', { username, password }, { throwOnFailure: false });
  } catch (err) {
    return { success: false, message: err.message || 'เข้าสู่ระบบไม่สำเร็จ' };
  }
}

export async function getDika() {
  return gasRequest('getDika');
}

function normalizeBootstrapResult(result) {
  return {
    success: true,
    data: Array.isArray(result?.data) ? result.data : [],
    users: normalizeUsers({ data: result?.users || [] }),
  };
}

function isInvalidActionError(err) {
  const message = String(err?.message || '');
  return message.includes('Invalid action') || message.includes('ไม่รองรับการโหลดแบบแยกส่วน');
}

async function fetchAllChunks(action, chunkSize) {
  const first = await gasRequest(action, { offset: 0, limit: chunkSize });
  const total = Number(first?.total) || 0;
  let items = Array.isArray(first?.data) ? [...first.data] : [];

  if (items.length >= total || total === 0) {
    return items;
  }

  const offsets = [];
  for (let offset = chunkSize; offset < total; offset += chunkSize) {
    offsets.push(offset);
  }

  for (let i = 0; i < offsets.length; i += CHUNK_FETCH_CONCURRENCY) {
    const batch = offsets.slice(i, i + CHUNK_FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map((offset) => gasRequest(action, { offset, limit: chunkSize })),
    );

    for (const result of results) {
      items = items.concat(Array.isArray(result?.data) ? result.data : []);
    }
  }

  return items;
}

async function fetchBootstrapViaChunks() {
  let users;
  let data;

  try {
    [users, data] = await Promise.all([
      fetchAllChunks('getUsersChunk', USER_CHUNK_SIZE),
      fetchAllChunks('getDikaChunk', DIKA_CHUNK_SIZE),
    ]);
  } catch (err) {
    if (isInvalidActionError(err)) {
      throw new Error(GAS_CHUNK_ACTION_REQUIRED);
    }
    throw err;
  }

  return normalizeBootstrapResult({ success: true, data, users });
}

export async function getBootstrap() {
  return fetchBootstrapViaChunks();
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
  try {
    const data = await fetchAllChunks('getUsersChunk', USER_CHUNK_SIZE);
    return {
      success: true,
      data: normalizeUsers({ data }),
    };
  } catch (err) {
    if (isInvalidActionError(err)) {
      throw new Error(GAS_CHUNK_ACTION_REQUIRED);
    }
    throw err;
  }
}
