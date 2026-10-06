import {
  createAdminClient,
  loadEnvLocal,
  upsertDika,
  upsertUsers,
} from './migrate-shared.mjs';

loadEnvLocal();

const GAS_URL = String(process.env.VITE_GAS_URL || '').trim();
const DIKA_CHUNK = 15;
const USER_CHUNK = 10;

async function gasRequest(action, payload = {}) {
  if (!GAS_URL) {
    throw new Error('ตั้ง VITE_GAS_URL ใน .env.local เพื่อดึงข้อมูลจาก Google Sheets');
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }),
  });

  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith('<!')) {
    throw new Error(`GAS ${action} ล้มเหลว (HTTP ${response.status})`);
  }

  const result = JSON.parse(text);
  if (result?.success === false) {
    throw new Error(result.message || `GAS ${action} ไม่สำเร็จ`);
  }

  return result;
}

async function fetchAllChunks(action, chunkSize) {
  const first = await gasRequest(action, { offset: 0, limit: chunkSize });
  const total = Number(first.total) || 0;
  let items = Array.isArray(first.data) ? [...first.data] : [];

  for (let offset = chunkSize; offset < total; offset += chunkSize) {
    const chunk = await gasRequest(action, { offset, limit: chunkSize });
    items = items.concat(Array.isArray(chunk.data) ? chunk.data : []);
  }

  return items;
}

async function fetchLegacyBootstrap() {
  const result = await gasRequest('getBootstrap');
  return {
    users: Array.isArray(result.users) ? result.users : [],
    dika: Array.isArray(result.data) ? result.data : [],
  };
}

async function fetchFromGas() {
  try {
    const [users, dika] = await Promise.all([
      fetchAllChunks('getUsersChunk', USER_CHUNK),
      fetchAllChunks('getDikaChunk', DIKA_CHUNK),
    ]);
    return { users, dika };
  } catch {
    console.warn('chunk API ไม่พร้อม — ลอง getBootstrap แบบเดิม');
    return fetchLegacyBootstrap();
  }
}

async function main() {
  console.log('ดึงข้อมูลจาก GAS...');
  const { users, dika } = await fetchFromGas();
  console.log(`พบผู้ใช้ ${users.length} คน, เรื่องเบิกจ่าย ${dika.length} รายการ`);

  const admin = createAdminClient();
  console.log('โอนผู้ใช้ → Supabase Auth + profiles...');
  const userStats = await upsertUsers(admin, users);
  console.log(`ผู้ใช้: สร้างใหม่ ${userStats.created}, อัปเดต ${userStats.updated}`);

  console.log('โอนข้อมูล dika...');
  const dikaCount = await upsertDika(admin, dika);
  console.log(`dika: upsert ${dikaCount} แถว`);
  console.log('เสร็จสิ้น');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
