import fs from 'node:fs';
import path from 'node:path';
import {
  createAdminClient,
  loadEnvLocal,
  parseCsv,
  upsertDika,
  upsertUsers,
} from './migrate-shared.mjs';

loadEnvLocal();

const exportDir = path.join(process.cwd(), 'scripts', 'sheet-export');

function readCsvSheet(filename) {
  const filePath = path.join(exportDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์ ${filePath} — export ชีต User/Data เป็น CSV แล้ววางในโฟลเดอร์นี้`);
  }

  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function mapUserRows(rows) {
  if (rows.length <= 1) return [];

  const header = rows[0].map((cell) => String(cell || '').trim().toLowerCase());
  const hasHeader =
    header.includes('username') ||
    header[0] === 'username' ||
    header[0] === 'ชื่อผู้ใช้';

  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => ({
    username: row[0],
    password: row[1],
    name: row[2],
    role: row[3],
  }));
}

function mapDikaRows(rows) {
  if (rows.length <= 1) return [];

  const dataRows = rows.slice(1);

  return dataRows.map((row) => ({
    id: row[0],
    dikaNo: row[1],
    date: row[2],
    subject: row[3],
    amount: row[4],
    payee: row[5],
    department: row[6],
    assignee: row[7],
    status: row[8],
    timestamp: row[9],
    finishtime: row[10],
    notes: row[11],
  }));
}

async function main() {
  const users = mapUserRows(readCsvSheet('User.csv'));
  const dika = mapDikaRows(readCsvSheet('Data.csv'));

  console.log(`จาก CSV: ผู้ใช้ ${users.length}, dika ${dika.length}`);

  const admin = createAdminClient();
  const userStats = await upsertUsers(admin, users);
  console.log(`ผู้ใช้: สร้างใหม่ ${userStats.created}, อัปเดต ${userStats.updated}`);

  const dikaCount = await upsertDika(admin, dika);
  console.log(`dika: upsert ${dikaCount} แถว`);
  console.log('เสร็จสิ้น');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
