export const PRODUCTION_AUTH_API_URL = 'https://apisistag.tag.co.id/erp-konfigurasi/api';
export const PRODUCTION_HRD_API_URL = 'https://apisistag.tag.co.id/erp-hrd/api';

export const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL belum diset');
  }
  return url.endsWith('/') ? url : `${url}/`;
})();

export type ApiEnvironmentStatus = 'production' | 'dummy';

function normalizeApiUrl(url?: string | null) {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  }
}

function isProductionApiUrl(url: string | null | undefined, productionUrl: string) {
  if (!url) return false;
  return normalizeApiUrl(url) === normalizeApiUrl(productionUrl);
}

function resolveAuthApiEnvironmentStatus(url?: string | null): ApiEnvironmentStatus {
  return isProductionApiUrl(url, PRODUCTION_AUTH_API_URL) ? 'production' : 'dummy';
}

function resolveHrdApiEnvironmentStatus(url?: string | null): ApiEnvironmentStatus {
  return isProductionApiUrl(url, PRODUCTION_HRD_API_URL) ? 'production' : 'dummy';
}

export function getApiEnvironmentStatuses() {
  return {
    auth: resolveAuthApiEnvironmentStatus(process.env.NEXT_PUBLIC_API_BASE_URL_AUT),
    hrd: resolveHrdApiEnvironmentStatus(process.env.NEXT_PUBLIC_API_BASE_URL),
  };
}

export function getApiEnvironmentStatus(): ApiEnvironmentStatus {
  const { auth, hrd } = getApiEnvironmentStatuses();
  return auth === 'production' || hrd === 'production' ? 'production' : 'dummy';
}

export function getApiEnvironmentLabel(status: ApiEnvironmentStatus) {
  return status === 'production' ? 'Production' : 'Dummy';
}