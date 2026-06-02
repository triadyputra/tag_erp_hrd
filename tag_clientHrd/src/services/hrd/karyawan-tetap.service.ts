import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const LIST_URL = `${API_BASE_URL}KaryawanTetap/ListKaryawanTetap`

export interface FetchKaryawanTetapParams {
  noKtp?: string
  namaLengkap?: string
  cabang?: string
  page: number
  pageSize: number
}

export async function fetchKaryawanTetapList(params: FetchKaryawanTetapParams) {
  const query = new URLSearchParams({
    noKtp: params.noKtp ?? '',
    namaLengkap: params.namaLengkap ?? '',
    cabang: params.cabang ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal mengambil data karyawan tetap'
    )
  }

  return json
}

export async function fetchDetailKaryawanTetap(noktp: string) {
  if (!noktp?.trim()) {
    throw new Error('No KTP wajib diisi')
  }

  const res = await authFetch(
    `${API_BASE_URL}KaryawanTetap/GetDetailKaryawanTetap/${encodeURIComponent(noktp.trim())}`
  )
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal mengambil detail karyawan tetap'
    )
  }

  return json?.data ?? json?.Data ?? json
}
