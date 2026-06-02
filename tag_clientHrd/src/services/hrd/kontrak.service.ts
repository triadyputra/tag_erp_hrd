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
  sisaKontrak?: string
  tglBerakhirAwal?: string
  tglBerakhirAkhir?: string
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
    sisaKontrak: params.sisaKontrak ?? '',
    tglBerakhirAwal: params.tglBerakhirAwal ?? '',
    tglBerakhirAkhir: params.tglBerakhirAkhir ?? '',
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

// ===============================
// PRINT DATA KARYAWAN (PDF / EXCEL)
// ===============================
export async function printDataKaryawan(params: {
  noKontrak?: string
  namaKaryawan?: string
  jenisKontrak?: string
  cabang?: string
  sisaKontrak?: string
  tglBerakhirAwal?: string
  tglBerakhirAkhir?: string
  format?: 'pdf' | 'xlsx'
}) {
  const query = new URLSearchParams({
    noKontrak: params.noKontrak ?? '',
    namaKaryawan: params.namaKaryawan ?? '',
    jenisKontrak: params.jenisKontrak ?? '',
    cabang: params.cabang ?? '',
    sisaKontrak: params.sisaKontrak ?? '',
    tglBerakhirAwal: params.tglBerakhirAwal ?? '',
    tglBerakhirAkhir: params.tglBerakhirAkhir ?? '',
    format: params.format ?? 'pdf',
  }).toString()

  const res = await authFetch(
    `${URL}/PrintDataKaryawan?${query}`,
    {
      method: 'GET',
    }
  )

  const json = await res.json()

  if (!res.ok || json?.metadata?.code !== '200') {
    throw new Error(
      json?.metadata?.message || 'Gagal mencetak data karyawan'
    )
  }

  return json as {
    response: string
    metadata: {
      message: string
      code: string
      format: string
    }
  }
}