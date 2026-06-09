import { authFetch } from '@/utils/fetcher';
import { GroupList } from '@/app/(DashboardLayout)/types/feature/konfigurasi/group';

const getAuthApiBase = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL_AUT;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL_AUT belum diset');
  }
  return url.endsWith('/') ? url : `${url}/`;
};

const AUTH_API = getAuthApiBase();
const ROLE_URL = `${AUTH_API}Role`;
const ACCESS_ROLE_URL = `${AUTH_API}Role/accesRole?modul=HRD`;
const ROLE_LIST_URL = `${AUTH_API}Role/GetListRole`;

interface FetchGroupParams {
  filter?: string;
  page: number;
  pageSize: number;
}

export async function fetchGroups(params: FetchGroupParams) {
  const query = new URLSearchParams({
    filter: params.filter ?? '',
    idModul: 'HRD',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString();

  const res = await authFetch(`${ROLE_LIST_URL}?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Gagal mengambil data group');
  }

  return json;
}

export async function fetchAccessRoles() {
  const res = await authFetch(ACCESS_ROLE_URL);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Gagal mengambil access role');
  }

  return json;
}

export async function saveGroup(payload: GroupList) {
  const isEdit = Boolean(payload.Id);

  const res = await authFetch(
    isEdit ? `${ROLE_URL}/${payload.Id}` : ROLE_URL,
    {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || 'Gagal menyimpan group');
  }

  return json;
}

export async function deleteGroup(id: string) {
  const res = await authFetch(`${ROLE_URL}/${id}`, {
    method: 'DELETE',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || 'Gagal menghapus group');
  }

  return json;
}
