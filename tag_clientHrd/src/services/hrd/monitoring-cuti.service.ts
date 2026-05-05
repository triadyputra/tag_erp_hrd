// src/services/hrd/saldo-cuti.service.ts
import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

// ===============================
// URL
// ===============================
const LIST_URL = `${API_BASE_URL}MonitoringCuti/GetListMonitoringCutiKaryawan`

// ===============================
// PARAM TYPE
// ===============================
interface FetchSaldoCutiParams {
  tahun?: number
  cabang?: string
  nama?: string
  page: number
  pageSize: number
}

// ===============================
// GET LIST (PAGING)
// ===============================
export async function fetchSaldoCutiKaryawan(
  params: FetchSaldoCutiParams
) {
  const query = new URLSearchParams({
    tahun: params.tahun?.toString() ?? '',
    cabang: params.cabang ?? '',
    nama: params.nama ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data saldo cuti karyawan'
    )
  }

  return json
}