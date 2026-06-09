import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}PenilaianKaryawan`
const COMBO_ASPEK_URL = `${API_BASE_URL}Combo/GetAspekPenilaian`
const LIST_URL = `${BASE_URL}/GetListPenilaianKaryawan`
const DETAIL_URL = `${BASE_URL}/GetDetailPenilaianKaryawan`
const SAVE_URL = `${BASE_URL}/SavePenilaianKaryawan`
const DELETE_URL = `${BASE_URL}/DeletePenilaianKaryawan`
const KONTRAK_MAU_HABIS_URL = `${BASE_URL}/GetListKontrakMauHabis`

export interface FetchPenilaianKaryawanParams {
  nik?: string
  namaKaryawan?: string
  cabang?: string
  tglAwal?: string
  tglAkhir?: string
  page: number
  pageSize: number
}

export interface KontrakMauHabisRow {
  NoKtp?: string
  NikSistag?: string
  NmKaryawan?: string
  Kelamin?: string
  NmDivisi?: string
  NmBagian?: string
  NmJabatan?: string
}

export interface FetchKontrakMauHabisParams {
  cabang?: string
  bulan: string
  tahun: number
}

export interface PenilaianKaryawanRow {
  NOTRAN?: string
  NIP?: string
  NMKARYAWAN?: string
  NMDIVISI?: string
  NMBAGIAN?: string
  NMJABATAN?: string
  NMATASAN?: string
  REKOMENDASI?: string
  VALIDUSER?: string
  TGLNILAI?: string
}

/** Payload mengikuti backend `FormEvaluasiKontrakDto` */
export interface FormEvaluasiKontrakDetailPayload {
  GrupAspek?: string
  KdAspek?: string
  Nilai: number
}

/** Baris master `TBL_ASPEKPENILAIAN` — Combo/GetAspekPenilaian */
export interface ViewAspekPenilaianDto {
  Id?: number
  Grp?: string | null
  NmGrp?: string | null
  NoUrut?: number
  KdAspek?: string | null
  NmAspek?: string | null
}

export interface FormEvaluasiKontrakPayload {
  NoTran?: string | null
  Nip?: string | null
  Nik?: string | null
  NoKontrak?: string | null
  NamaKaryawan?: string | null
  TglLahir?: string | null
  Usia?: string | null
  KdDepartemen?: string | null
  KdBagian?: string | null
  KdJabatan?: string | null
  TglMasuk?: string | null
  TglHabisKontrak?: string | null
  NikAtasan?: string | null
  NamaAtasan?: string | null
  TglNilai?: string | null
  PAwal?: string | null
  PAkhir?: string | null
  Nilai?: number
  Rekomendasi?: string | null
  Catatan?: string | null
  ValidUser?: string | null
  KdCabang?: string | null
  Details: FormEvaluasiKontrakDetailPayload[]
}

export async function fetchPenilaianKaryawanList(params: FetchPenilaianKaryawanParams) {
  const query = new URLSearchParams({
    nik: params.nik ?? '',
    namaKaryawan: params.namaKaryawan ?? '',
    cabang: params.cabang ?? '',
    tglAwal: params.tglAwal ?? '',
    tglAkhir: params.tglAkhir ?? '',
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
        'Gagal mengambil data penilaian karyawan'
    )
  }

  return json
}

export async function fetchDetailPenilaianKaryawan(noTran: string) {
  if (!noTran) throw new Error('No transaksi wajib diisi')

  const query = new URLSearchParams({ noTran }).toString()
  const res = await authFetch(`${DETAIL_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal mengambil detail penilaian'
    )
  }

  return json?.Data ?? json?.data ?? json
}

export async function fetchAspekPenilaian(): Promise<ViewAspekPenilaianDto[]> {
  const res = await authFetch(COMBO_ASPEK_URL)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal mengambil master aspek penilaian'
    )
  }

  const list = json?.Data ?? json?.data ?? json
  return Array.isArray(list) ? list : []
}

export async function savePenilaianKaryawan(payload: FormEvaluasiKontrakPayload) {
  const res = await authFetch(SAVE_URL, {
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
        'Gagal menyimpan penilaian karyawan'
    )
  }

  return json
}

export async function fetchListKontrakMauHabis(params: FetchKontrakMauHabisParams) {
  const query = new URLSearchParams({
    cabang: params.cabang ?? '',
    bulan: params.bulan,
    tahun: String(params.tahun),
  }).toString()

  const res = await authFetch(`${KONTRAK_MAU_HABIS_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal mengambil data kontrak mau habis'
    )
  }

  const list = json?.Data ?? json?.data ?? json
  return Array.isArray(list) ? (list as KontrakMauHabisRow[]) : []
}

export async function deletePenilaianKaryawan(noTran: string) {
  if (!noTran) throw new Error('No transaksi wajib diisi')

  const query = new URLSearchParams({ noTran }).toString()
  const res = await authFetch(`${DELETE_URL}?${query}`, { method: 'DELETE' })
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal menghapus penilaian karyawan'
    )
  }

  return json
}

