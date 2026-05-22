import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}Berita`

interface FetchBeritaParams {
  judul?: string
  isPinned?: boolean
  page: number
  pageSize: number
}

export async function fetchBerita(params: FetchBeritaParams) {
  const query = new URLSearchParams({
    judul: params.judul ?? '',
    isPinned: params.isPinned !== undefined ? params.isPinned.toString() : '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${BASE_URL}/GetListBerita?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data berita'
    )
  }

  return json
}

export async function fetchDetailBerita(id: number) {
  if (!id) {
    throw new Error('ID berita wajib diisi')
  }

  const res = await authFetch(`${BASE_URL}/GetDetailBerita/${id}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil detail berita'
    )
  }

  return json?.data ?? json
}

export async function saveBerita(payload: any) {
  const res = await authFetch(`${BASE_URL}/SaveBerita`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal menyimpan data berita'
    )
  }

  return json?.data ?? json
}

export async function deleteBerita(id: number) {
  if (!id) {
    throw new Error('ID berita wajib diisi')
  }

  const res = await authFetch(`${BASE_URL}/DeleteBerita/${id}`, {
    method: 'DELETE',
  })

  const json = await res.json()

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal menghapus data berita'
    )
  }

  return json?.data ?? json
}
