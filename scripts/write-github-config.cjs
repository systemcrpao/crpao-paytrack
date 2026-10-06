const fs = require('fs');
const path = require('path');

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
const target = path.join(process.cwd(), 'public', 'config.json');

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  `${JSON.stringify({ supabaseUrl, supabaseAnonKey }, null, 2)}\n`,
  'utf8',
);
