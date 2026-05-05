// src/services/hrd/kontrak.service.ts
import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const URL = `${API_BASE_URL}KontrakKaryawan`
const LIST_URL = `${API_BASE_URL}KontrakKaryawan/GetListKontrakKaryawan`

// ===============================
// PARAM TYPE
// ===============================
interface FetchKontrakParams {
  noKontrak?: string
  namaKaryawan?: string
  jenisKontrak?: string
  cabang?: string
  sisaKontrak?: string // 🔥 TAMBAHAN
  page: number
  pageSize: number
}

// ===============================
// GET LIST (PAGING)
// ===============================
export async function fetchKontrakAktif(
  params: FetchKontrakParams
) {
  const query = new URLSearchParams({
    noKontrak: params.noKontrak ?? '',
    namaKaryawan: params.namaKaryawan ?? '',
    jenisKontrak: params.jenisKontrak ?? '',
    cabang: params.cabang ?? '',
    sisaKontrak: params.sisaKontrak ?? '', // 🔥 TAMBAHAN
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data kontrak karyawan'
    )
  }

  return json
}
