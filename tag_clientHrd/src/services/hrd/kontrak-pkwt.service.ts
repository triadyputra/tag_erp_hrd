// src/services/hrd/kontrak-pkwt.service.ts
import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}KontrakPkwt`
const LIST_URL = `${BASE_URL}/GetListKontrakPkwt`
const DETAIL_URL = `${BASE_URL}/GetDetailKontrakPkwt`
const DELETE_URL = `${BASE_URL}/DeleteKontrakPkwt`

// ===============================
// PARAM TYPE - LIST
// ===============================
interface FetchKontrakPkwtParams {
  tglAwal?: string
  tglAkhir?: string
  cabang?: string
  namaKaryawan?: string
  perusahaan?: string
  page: number
  pageSize: number
}

// ===============================
// GET LIST (PAGING)
// ===============================
export async function fetchKontrakPkwt(
  params: FetchKontrakPkwtParams
) {
  const query = new URLSearchParams({
    tglAwal: params.tglAwal ?? '',
    tglAkhir: params.tglAkhir ?? '',
    cabang: params.cabang ?? '',
    namaKaryawan: params.namaKaryawan ?? '',
    perusahaan: params.perusahaan ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data kontrak PKWT'
    )
  }

  return json
}

// ===============================
// GET DETAIL
// ===============================
export async function fetchDetailKontrakPkwt(noKontrak: string) {
  if (!noKontrak) {
    throw new Error('No kontrak wajib diisi')
  }

  const query = new URLSearchParams({
    noKontrak,
  }).toString()

  const res = await authFetch(`${DETAIL_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil detail kontrak'
    )
  }

  // karena API pakai ApiResponse.Success(data)
  return json?.data ?? json
}

// ===============================
// SAVE / EDIT
// ===============================
export async function saveKontrakPkwt(payload: any) {
  const res = await authFetch(`${BASE_URL}/SaveEditKontrakPkwt`, {
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
      'Gagal menyimpan kontrak'
    )
  }

  return json?.data ?? json
}

// ===============================
// DELETE KONTRAK
// ===============================
export async function deleteKontrakPkwt(
  noKontrak: string,
  noKtp: string
) {
  if (!noKontrak || !noKtp) {
    throw new Error("No kontrak dan No KTP wajib diisi")
  }

  const query = new URLSearchParams({
    noKontrak,
    noKtp,
  }).toString()

  const res = await authFetch(`${DELETE_URL}?${query}`, {
    method: "DELETE",
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      "Gagal menghapus kontrak"
    )
  }

  return json?.data ?? json
}

// ===============================
// PRINT KONTRAK
// ===============================
export async function printKontrakPkwt(
  noKontrak: string
) {
  const res = await authFetch(`${BASE_URL}/PrintKontrak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(noKontrak), // 🔥 sesuai backend kamu sekarang
  });

  const json = await res.json();

  // ❗ pakai metadata.code seperti RPL
  if (!res.ok || json?.metadata?.code !== '200') {
    throw new Error(
      json?.metadata?.message || 'Gagal mencetak kontrak'
    );
  }

  return json as {
    response: string; // base64 PDF
    metadata: {
      message: string;
      code: string;
      format: string;
    };
  };
}