import { authFetch } from '@/utils/fetcher';

const getAuthApiBase = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL_AUT;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL_AUT belum diset');
  }
  return url.endsWith('/') ? url : `${url}/`;
};

const AUTH_API = getAuthApiBase();
const AKUN_URL = `${AUTH_API}Akun`;
const AKUN_LIST_URL = `${AUTH_API}Akun/GetListAkun`;

interface FetchAkunParams {
  filter?: string;
  page: number;
  pageSize: number;
}

export async function fetchAkun(params: FetchAkunParams) {
  const query = new URLSearchParams({
    filter: params.filter ?? '',
    idModul: 'HRD',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString();

  const res = await authFetch(`${AKUN_LIST_URL}?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Gagal mengambil data akun');
  }

  return json;
}

export async function saveAkun(payload: Record<string, unknown>) {
  const isEdit = Boolean(payload.Id);

  const res = await authFetch(
    isEdit ? `${AKUN_URL}/${payload.Id}` : AKUN_URL,
    {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || 'Gagal menyimpan akun');
  }

  return json;
}

export async function deleteAkun(id: string) {
  const res = await authFetch(`${AKUN_URL}/${id}`, {
    method: 'DELETE',
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message || 'Gagal menghapus akun');
  }

  return json;
}
