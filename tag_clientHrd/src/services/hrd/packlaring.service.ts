import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}Packlaring`
const LIST_URL = `${BASE_URL}/GetListPacklaring`
const DETAIL_URL = `${BASE_URL}/GetDetailPacklaring`
const DELETE_URL = `${BASE_URL}/DeletePacklaring`
const SAVE_URL = `${BASE_URL}/SavePacklaring`

interface FetchPacklaringParams {
  nomor?: string
  nama?: string
  jenis?: string
  cabang?: string
  tglAwal?: string
  tglAkhir?: string
  page: number
  pageSize: number
}

export async function fetchPacklaringList(params: FetchPacklaringParams) {
  const query = new URLSearchParams({
    nomor: params.nomor ?? '',
    nama: params.nama ?? '',
    jenis: params.jenis ?? '',
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
        'Gagal mengambil data packlaring'
    )
  }

  return json
}

export async function fetchDetailPacklaring(id: string) {
  if (!id) throw new Error('Id wajib diisi')

  const query = new URLSearchParams({ id }).toString()
  const res = await authFetch(`${DETAIL_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal mengambil detail packlaring'
    )
  }

  // backend: ApiResponse.Success(data)
  return json?.Data ?? json?.data ?? json
}

export async function savePacklaring(payload: any) {
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
        'Gagal menyimpan packlaring'
    )
  }

  return json
}

export async function deletePacklaring(id: string) {
  if (!id) throw new Error('Id wajib diisi')

  const query = new URLSearchParams({ id }).toString()
  const res = await authFetch(`${DELETE_URL}?${query}`, { method: 'DELETE' })
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.metadata?.message ||
        json?.message ||
        'Gagal menghapus packlaring'
    )
  }

  return json
}

export async function printPacklaring(id: string) {
  if (!id) {
    throw new Error('Id wajib diisi')
  }

  const res = await authFetch(`${BASE_URL}/PrintPacklaring`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(id), // backend: [FromBody] string id
  })

  const json = await res.json()

  if (!res.ok || json?.metadata?.code !== '200') {
    throw new Error(json?.metadata?.message || 'Gagal mencetak packlaring')
  }

  return json as {
    response: string
    metadata: {
      message: string
      code: string
      format?: string
    }
  }
}

