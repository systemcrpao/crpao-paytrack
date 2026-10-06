import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function cleanEnvValue(key, rawValue) {
  let value = String(rawValue || '').trim();

  const hashIndex = value.indexOf('#');
  if (hashIndex >= 0) {
    value = value.slice(0, hashIndex).trim();
  }

  value = value.replace(/\uFEFF/g, '');
  value = value.replace(/[\u2010-\u2015\u2212\uFF0D]/g, '-');

  if (/KEY/i.test(key)) {
    const jwtStart = value.indexOf('eyJ');
    if (jwtStart >= 0) {
      value = value.slice(jwtStart);
    }

    const jwtMatch = value.match(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) {
      value = jwtMatch[0];
    }
  }

  if (/URL/i.test(key)) {
    value = value.replace(/\s+/g, '');
  }

  return value;
}

export function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const text = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = cleanEnvValue(key, trimmed.slice(eq + 1));
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function usernameToAuthEmail(username) {
  return `${String(username || '').trim().toLowerCase()}@paytrack.crpao.app`;
}

export function createAdminClient() {
  const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceKey) {
    throw new Error(
      'ต้องตั้ง VITE_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local',
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapDikaItemToRow(item) {
  return {
    id: String(item.id || '').trim(),
    dika_no: String(item.dikaNo ?? item.dika_no ?? '').trim(),
    date: String(item.date || '').trim(),
    subject: String(item.subject || '').trim(),
    amount: item.amount === '' || item.amount == null ? null : Number(item.amount),
    payee: String(item.payee || '').trim(),
    department: String(item.department || '').trim(),
    assignee: String(item.assignee || '').trim(),
    status: String(item.status || 'ส่งต่อเจ้าหน้าที่').trim(),
    created_at_display: String(item.timestamp ?? item.created_at_display ?? '').trim(),
    finishtime: String(item.finishtime || '').trim(),
    notes: String(item.notes || '').trim(),
  };
}

export async function upsertUsers(admin, users) {
  let created = 0;
  let updated = 0;

  for (const raw of users) {
    const username = String(raw.username || raw[0] || '').trim();
    const password = String(raw.password || raw[1] || '').trim();
    const name = String(raw.name || raw[2] || username).trim();
    const role = String(raw.role || raw[3] || 'User').trim();

    if (!username || !password) {
      continue;
    }

    if (password.length < 6) {
      throw new Error(
        `ผู้ใช้ ${username}: รหัสผ่านต้องอย่างน้อย 6 ตัว (Supabase Auth) — แก้ใน CSV หรือ Authentication → Password ใน Dashboard`,
      );
    }

    const email = usernameToAuthEmail(username);
    let userId = null;

    const createResult = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, name, role },
    });

    if (createResult.error) {
      const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list.data?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );

      if (!existing) {
        throw new Error(`สร้างผู้ใช้ ${username} ไม่สำเร็จ: ${createResult.error.message}`);
      }

      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { username, name, role },
      });
      updated += 1;
    } else {
      userId = createResult.data.user.id;
      created += 1;
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        username,
        name,
        role,
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      throw new Error(`บันทึก profiles ${username}: ${profileError.message}`);
    }
  }

  return { created, updated };
}

export async function upsertDika(admin, items) {
  const rows = items
    .map(mapDikaItemToRow)
    .filter((row) => row.id);

  if (rows.length === 0) {
    return 0;
  }

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await admin.from('dika').upsert(chunk, { onConflict: 'id' });
    if (error) {
      throw new Error(`บันทึก dika ไม่สำเร็จ: ${error.message}`);
    }
  }

  return rows.length;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => String(cell || '').trim()));
}
