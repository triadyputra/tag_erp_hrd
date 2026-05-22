import { API_BASE_URL } from '@/config/api.config'
import { authFetch } from '@/utils/fetcher'

const BASE_URL = `${API_BASE_URL}MasterKtp`
const LIST_URL = `${BASE_URL}`
const DETAIL_URL = `${BASE_URL}`
const DELETE_URL = `${BASE_URL}`

interface FetchMasterKtpParams {
  noktp?: string
  namaLengkap?: string
  kdCabang?: string
  page: number
  pageSize: number
}

export async function fetchMasterKtp(params: FetchMasterKtpParams) {
  const query = new URLSearchParams({
    noktp: params.noktp ?? '',
    namaLengkap: params.namaLengkap ?? '',
    kdCabang: params.kdCabang ?? '',
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  }).toString()

  const res = await authFetch(`${LIST_URL}?${query}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil data master KTP'
    )
  }

  return json
}

export async function fetchDetailMasterKtp(noktp: string) {
  if (!noktp) {
    throw new Error('No KTP wajib diisi')
  }

  const res = await authFetch(`${DETAIL_URL}/${noktp}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal mengambil detail KTP'
    )
  }

  return json?.data ?? json
}

export async function saveMasterKtp(payload: any) {
  const res = await authFetch(`${BASE_URL}`, {
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
      'Gagal menyimpan data KTP'
    )
  }

  return json?.data ?? json
}

export interface FaktaIntegritasResponse {
  Exists: boolean
  Base64?: string | null
  FileName?: string
}

function parseApiData<T>(json: any): T {
  return json?.data ?? json?.Data ?? json
}

export async function checkFaktaIntegritasExists(noktp: string): Promise<boolean> {
  if (!noktp?.trim()) {
    return false
  }

  const res = await authFetch(
    `${BASE_URL}/${encodeURIComponent(noktp.trim())}/fakta-integritas/exists`
  )
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal memeriksa dokumen fakta integritas'
    )
  }

  const data = parseApiData<{ Exists?: boolean; exists?: boolean }>(json)
  return !!(data?.Exists ?? data?.exists)
}

export async function fetchFaktaIntegritas(
  noktp: string
): Promise<FaktaIntegritasResponse> {
  if (!noktp?.trim()) {
    throw new Error('No KTP wajib diisi')
  }

  const res = await authFetch(
    `${BASE_URL}/${encodeURIComponent(noktp.trim())}/fakta-integritas`
  )
  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal mengambil dokumen fakta integritas'
    )
  }

  return parseApiData<FaktaIntegritasResponse>(json)
}

export async function uploadFaktaIntegritas(noktp: string, file: File) {
  if (!noktp?.trim()) {
    throw new Error('No KTP wajib diisi')
  }

  const form = new FormData()
  form.append('file', file)

  const res = await authFetch(
    `${BASE_URL}/${encodeURIComponent(noktp.trim())}/fakta-integritas`,
    {
      method: 'POST',
      body: form,
    }
  )

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal mengupload dokumen fakta integritas'
    )
  }

  return json
}

export async function deleteFaktaIntegritas(noktp: string) {
  if (!noktp?.trim()) {
    throw new Error('No KTP wajib diisi')
  }

  const res = await authFetch(
    `${BASE_URL}/${encodeURIComponent(noktp.trim())}/fakta-integritas`,
    { method: 'DELETE' }
  )

  const json = await res.json()

  if (!res.ok) {
    throw new Error(
      json?.Metadata?.Message ||
        json?.message ||
        'Gagal menghapus dokumen fakta integritas'
    )
  }

  return json
}

export async function deleteMasterKtp(noktp: string, kdcabang: string) {
  if (!noktp) {
    throw new Error('No KTP wajib diisi')
  }

  const query = new URLSearchParams({
    kdcabang: kdcabang ?? '',
  }).toString()

  const res = await authFetch(`${DELETE_URL}/${noktp}?${query}`, {
    method: 'DELETE',
  })

  const json = await res.json()

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(
      json?.Metadata?.Message ||
      json?.message ||
      'Gagal menghapus data KTP'
    )
  }

  return json?.data ?? json
}
