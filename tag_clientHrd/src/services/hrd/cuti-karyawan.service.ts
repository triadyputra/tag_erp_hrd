//import { DetailCutiDto } from '@/app/(DashboardLayout)/types/hrd/CutiKaryawan'
import { DetailCutiResponse } from '@/app/(DashboardLayout)/types/hrd/CutiKaryawan'
import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}CutiKaryawan`
const LIST_URL = `${BASE_URL}/GetListCutiKaryawan`
const DETAIL_URL = `${BASE_URL}/GetDetailCuti`
const DELETE_URL = `${BASE_URL}/DeleteCuti`

// ===============================
// PARAM TYPE - LIST
// ===============================
interface FetchCutiParams {
  tglAwal?: string
  tglAkhir?: string
  cabang?: string
  namaKaryawan?: string
  page: number
  pageSize: number
}

// ===============================
// GET LIST (PAGING)
// ===============================
export async function fetchCutiKaryawan(
  params: FetchCutiParams
) {
  const query = new URLSearchParams({
    tglAwal: params.tglAwal ?? '',
    tglAkhir: params.tglAkhir ?? '',
    cabang: params.cabang ?? '',
    namaKaryawan: params.namaKaryawan ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data cuti karyawan'
    )
  }

  return json
}

// ===============================
// GET DETAIL
// ===============================
export async function fetchDetailCuti(noCuti: string) {
  if (!noCuti) {
    throw new Error('No cuti wajib diisi')
  }

  const res = await authFetch(`${DETAIL_URL}/${noCuti}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil detail cuti'
    )
  }

  return json?.data ?? json
}

// ===============================
// SAVE / EDIT
// ===============================
export async function saveCutiKaryawan(payload: any) {
  const res = await authFetch(`${BASE_URL}/SaveEditCutiKaryawan`, {
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
      'Gagal menyimpan data cuti'
    )
  }

  return json?.data ?? json
}

// ===============================
// DELETE CUTI
// ===============================
export async function deleteCutiKaryawan(noCuti: string) {
  if (!noCuti) {
    throw new Error('No cuti wajib diisi')
  }

  const res = await authFetch(`${DELETE_URL}/${noCuti}`, {
    method: 'DELETE',
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal menghapus data cuti'
    )
  }

  return json?.data ?? json
}


// ==============================
// GET DETAIL CUTI
// ==============================
export async function getDetailCutiKaryawan(
  noktp: string,
  tahun?: number
): Promise<DetailCutiResponse> {
  try {
    const params = new URLSearchParams({
      noktp,
      ...(tahun ? { tahun: tahun.toString() } : {}),
    })

    const res = await authFetch(
      `${API_BASE_URL}MobileHr/GetDetailCuti?${params.toString()}`,
      {
        method: 'GET',
      }
    )

    const json = await res.json()

    if (!res.ok || json?.Metadata?.Code !== '200') {
      throw new Error(json?.Metadata?.Message || 'Gagal ambil saldo cuti')
    }

    return json.Data
  } catch (err: any) {
    throw new Error(err.message || 'Error getDetailCutiKaryawan')
  }
}