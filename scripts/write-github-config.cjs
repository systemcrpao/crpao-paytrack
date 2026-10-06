const fs = require('fs');
const path = require('path');

const gasUrl = String(process.env.GAS_URL || '').trim();
const target = path.join(process.cwd(), 'public', 'config.json');

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify({ gasUrl }, null, 2)}\n`, 'utf8');
