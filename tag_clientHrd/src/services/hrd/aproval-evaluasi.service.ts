import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}AprovalEvaluasi`
const LIST_URL = `${BASE_URL}/GetListAprovalEvaluasi`
const UPDATE_URL = `${BASE_URL}/UpdateEvaluasi`

export interface FetchAprovalEvaluasiParams {
  namaKaryawan?: string
  cabang?: string
  tglAwal?: string
  tglAkhir?: string
  pAkhirAwal?: string
  pAkhirAkhir?: string
  keputusan?: string
  page: number
  pageSize: number
}

export interface AprovalEvaluasiRow {
  KdCabang?: string
  NmCabang?: string
  NoTran?: string
  NoKontrak?: string
  Nip?: string
  NmKaryawan?: string
  NmDivisi?: string
  NmBagian?: string
  NmJabatan?: string
  TglMasuk?: string
  TglNilai?: string
  PAwal?: string
  PAkhir?: string
  Nilai?: number
  Rekomendasi?: string
  Catatan?: string
  NmAtasan?: string
  CatatanHrd?: string
  NikHrdStaff?: string
  NmHrdStaff?: string
  ValidUser?: string
  Keputusan?: string
}

export async function fetchAprovalEvaluasiList(params: FetchAprovalEvaluasiParams) {
  const query = new URLSearchParams({
    namaKaryawan: params.namaKaryawan ?? '',
    cabang: params.cabang ?? '',
    tglAwal: params.tglAwal ?? '',
    tglAkhir: params.tglAkhir ?? '',
    pAkhirAwal: params.pAkhirAwal ?? '',
    pAkhirAkhir: params.pAkhirAkhir ?? '',
    keputusan: params.keputusan ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal mengambil data approval evaluasi'
    )
  }

  return json
}

export interface UpdateAprovalEvaluasiPayload {
  NoTran: string
  CatatanHrd?: string | null
  NikHrdStaff?: string | null
  NmHrdStaff?: string | null
  Keputusan: string
  ValidUser?: string | null
}

export async function updateAprovalEvaluasi(payload: UpdateAprovalEvaluasiPayload) {
  if (!payload?.NoTran) throw new Error('No transaksi wajib diisi')
  if (!payload?.Keputusan) throw new Error('Keputusan wajib diisi')

  const res = await authFetch(UPDATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal menyimpan approval evaluasi'
    )
  }

  return json
}

