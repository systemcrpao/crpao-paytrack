const GAS_URL_HINT =
  'ใส่ URL แอปเว็บ (/exec) ใน GitHub Secret VITE_GAS_URL หรือไฟล์ public/config.json แล้ว deploy ใหม่';

let cachedGasUrl = null;
let resolveInFlight = null;

export function isValidGasWebAppUrl(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/(exec|dev)(\?.*)?$/.test(
    String(url || '').trim(),
  );
}

function readEnvGasUrl() {
  return (import.meta.env.VITE_GAS_URL || '').trim();
}

async function readConfigGasUrl() {
  const configPath = `${import.meta.env.BASE_URL}config.json`;
  const response = await fetch(configPath, { cache: 'no-store' });

  if (!response.ok) {
    return '';
  }

  const data = await response.json();
  return String(data?.gasUrl || '').trim();
}

export async function resolveGasUrl() {
  if (cachedGasUrl) {
    return cachedGasUrl;
  }

  if (resolveInFlight) {
    return resolveInFlight;
  }

  resolveInFlight = (async () => {
    const envUrl = readEnvGasUrl();
    if (isValidGasWebAppUrl(envUrl)) {
      cachedGasUrl = envUrl;
      return cachedGasUrl;
    }

    const configUrl = await readConfigGasUrl();
    if (isValidGasWebAppUrl(configUrl)) {
      cachedGasUrl = configUrl;
      return cachedGasUrl;
    }

    throw new Error(`ยังไม่ได้ตั้งค่า URL ของ Google Apps Script — ${GAS_URL_HINT}`);
  })().finally(() => {
    resolveInFlight = null;
  });

  return resolveInFlight;
}

export function resetGasUrlCache() {
  cachedGasUrl = null;
}
