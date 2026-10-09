import { COMPLETED_STATUSES, STATUS } from '../constants';
import { normalizeUsers } from '../utils/apiHelpers';
import { getSupabaseClient, usernameToAuthEmail } from './supabaseClient';

function mapDikaRow(row) {
  if (!row) return null;

  return {
    id: String(row.id || ''),
    dikaNo: String(row.dika_no ?? row.dikaNo ?? ''),
    date: String(row.date || ''),
    subject: String(row.subject || ''),
    amount: row.amount,
    payee: String(row.payee || ''),
    department: String(row.department || ''),
    assignee: String(row.assignee || ''),
    status: String(row.status || ''),
    timestamp: String(row.created_at_display ?? row.timestamp ?? ''),
    finishtime: String(row.finishtime || ''),
    notes: String(row.notes || ''),
  };
}

function mapDikaToDb(data) {
  const payload = {};

  if (data.dikaNo !== undefined) payload.dika_no = data.dikaNo;
  if (data.date !== undefined) payload.date = data.date;
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.amount !== undefined) payload.amount = data.amount;
  if (data.payee !== undefined) payload.payee = data.payee;
  if (data.department !== undefined) payload.department = data.department;
  if (data.assignee !== undefined) payload.assignee = data.assignee;
  if (data.status !== undefined) payload.status = data.status;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.timestamp !== undefined) payload.created_at_display = data.timestamp;
  if (data.finishtime !== undefined) payload.finishtime = data.finishtime;

  return payload;
}

function formatBangkokDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function normalizeStatusValue(status) {
  const normalized = String(status || '').trim();
  if (normalized === 'อนุมัตแล้ว') {
    return STATUS.APPROVED;
  }
  return normalized;
}

function isCompletedStatus(status) {
  return COMPLETED_STATUSES.includes(normalizeStatusValue(status));
}

async function fetchProfileForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
  }

  if (!data?.username) {
    throw new Error('ไม่พบโปรไฟล์ผู้ใช้ในระบบ');
  }

  return {
    username: String(data.username).trim(),
    name: String(data.name || data.username).trim(),
    role: String(data.role || '').trim(),
  };
}

async function generateNextDikaId(supabase) {
  const { data, error } = await supabase
    .from('dika')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message || 'ไม่สามารถสร้างรหัสเรื่องได้');
  }

  const lastId = data?.[0]?.id;
  if (!lastId || String(lastId).indexOf('DK-') !== 0) {
    return 'DK-0001';
  }

  const num = parseInt(String(lastId).replace('DK-', ''), 10) + 1;
  return `DK-${String(num).padStart(4, '0')}`;
}

export async function login(username, password) {
  try {
    const supabase = await getSupabaseClient();
    const email = usernameToAuthEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: String(password || ''),
    });

    if (error) {
      return {
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      };
    }

    const user = await fetchProfileForUser(supabase, data.user.id);
    return { success: true, user };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'เข้าสู่ระบบไม่สำเร็จ',
    };
  }
}

export async function fetchSessionProfile() {
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  return fetchProfileForUser(supabase, session.user.id);
}

export async function signOut() {
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getBootstrap() {
  const supabase = await getSupabaseClient();

  const [dikaResult, profilesResult] = await Promise.all([
    supabase.from('dika').select('*').order('id', { ascending: true }),
    supabase.from('profiles').select('username, name, role').order('username'),
  ]);

  if (dikaResult.error) {
    throw new Error(dikaResult.error.message || 'ไม่สามารถโหลดข้อมูลเรื่องเบิกจ่ายได้');
  }

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
  }

  const data = (dikaResult.data || []).map(mapDikaRow).filter(Boolean);
  const users = normalizeUsers({ data: profilesResult.data || [] });

  return { success: true, data, users };
}

export async function getUsers() {
  const { users } = await getBootstrap();
  return { success: true, data: users };
}

export async function addDika(data) {
  const supabase = await getSupabaseClient();
  const newId = await generateNextDikaId(supabase);
  const defaultStatus = data.status || STATUS.FORWARD_TO_STAFF;
  const createdAt = formatBangkokDateTime(new Date());

  const row = {
    id: newId,
    dika_no: data.dikaNo,
    date: data.date,
    subject: data.subject,
    amount: data.amount,
    payee: data.payee,
    department: data.department,
    assignee: data.assignee,
    status: defaultStatus,
    created_at_display: createdAt,
    finishtime: '',
    notes: data.notes || '',
  };

  const { error } = await supabase.from('dika').insert(row);

  if (error) {
    throw new Error(error.message || 'บันทึกไม่สำเร็จ');
  }

  return { success: true, message: 'บันทึกสำเร็จ', id: newId };
}

export async function updateDika(id, data) {
  const supabase = await getSupabaseClient();
  const payload = mapDikaToDb(data);

  if (payload.status !== undefined) {
    payload.status = normalizeStatusValue(payload.status);
    if (isCompletedStatus(payload.status) && data.finishtime === undefined) {
      const { data: existing } = await supabase
        .from('dika')
        .select('finishtime')
        .eq('id', id)
        .maybeSingle();

      if (!String(existing?.finishtime || '').trim()) {
        payload.finishtime = formatBangkokDateTime(new Date());
      }
    }
  }

  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('dika').update(payload).eq('id', id);

  if (error) {
    throw new Error(error.message || 'แก้ไขข้อมูลไม่สำเร็จ');
  }

  return { success: true, message: 'แก้ไขข้อมูลสำเร็จ' };
}

export async function updateDikaStatus(id, status, { notes } = {}) {
  const supabase = await getSupabaseClient();
  const statusValue = normalizeStatusValue(status);
  const payload = {
    status: statusValue,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    payload.notes = notes;
  }

  if (isCompletedStatus(statusValue)) {
    const { data: existing } = await supabase
      .from('dika')
      .select('finishtime')
      .eq('id', id)
      .maybeSingle();

    if (!String(existing?.finishtime || '').trim()) {
      payload.finishtime = formatBangkokDateTime(new Date());
    }
  }

  const { error } = await supabase.from('dika').update(payload).eq('id', id);

  if (error) {
    throw new Error(error.message || 'อัปเดตสถานะไม่สำเร็จ');
  }

  return { success: true, message: 'อัปเดตสถานะสำเร็จ' };
}
