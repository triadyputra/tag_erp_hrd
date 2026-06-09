import dayjs from 'dayjs'
import { fetchBerita } from '@/services/berita/berita.service'
import { fetchAprovalEvaluasiList } from '@/services/hrd/aproval-evaluasi.service'
import { fetchCutiKaryawan } from '@/services/hrd/cuti-karyawan.service'
import { fetchKaryawanTetapList } from '@/services/hrd/karyawan-tetap.service'
import { fetchKontrakPkwt } from '@/services/hrd/kontrak-pkwt.service'
import { fetchKontrakAktif } from '@/services/hrd/kontrak.service'
import { fetchSaldoCutiKaryawan } from '@/services/hrd/monitoring-cuti.service'

export function pickTotal(json: any): number {
  if (!json) return 0
  return (
    json?.TotalCount ??
    json?.totalCount ??
    json?.Data?.TotalCount ??
    json?.data?.TotalCount ??
    json?.data?.Total ??
    json?.Data?.Total ??
    json?.data?.total ??
    json?.Data?.total ??
    0
  )
}

export function pickList(json: any): any[] {
  if (!json) return []
  const raw =
    json?.Data ??
    json?.data ??
    json?.data?.Data ??
    json?.Data?.data ??
    json?.data?.data ??
    json?.Data?.Data
  return Array.isArray(raw) ? raw : []
}

type Settled<T> = { ok: true; data: T } | { ok: false; error: string }

export type DashboardAccess = {
  kontrak: boolean
  pkwt: boolean
  tetap: boolean
  evaluasi: boolean
  cuti: boolean
  monitorCuti: boolean
  berita: boolean
}

const EMPTY_COUNT: Settled<number> = { ok: true, data: 0 }
const EMPTY_LIST: Settled<any[]> = { ok: true, data: [] }

/** Pastikan baris list sesuai cabang login (jika API mengembalikan data campuran). */
export function filterRowsByCabang(rows: any[], cabang: string): any[] {
  const cab = cabang?.trim()
  if (!cab) return rows
  return rows.filter((row) => {
    const kdc = row?.KdCabang ?? row?.KDCABANG ?? row?.kdcabang ?? ''
    if (!kdc) return true
    return String(kdc).trim() === cab
  })
}

async function settle<T>(fn: () => Promise<T>): Promise<Settled<T>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (e: any) {
    if (e?.message === 'Forbidden' || e?.message?.includes?.('403')) {
      return { ok: false, error: 'Tidak punya akses' }
    }
    return { ok: false, error: e?.message ?? 'Gagal memuat data' }
  }
}

async function settleIf<T>(
  allowed: boolean,
  fn: () => Promise<T>,
  empty: Settled<T>
): Promise<Settled<T>> {
  if (!allowed) return empty
  return settle(fn)
}

function buildChartSettled(
  labels: string[],
  parts: Settled<number>[],
  fallbackError: string
): Settled<ChartSeriesData> {
  const series = parts.map((p) => (p.ok ? p.data : 0))
  const anyOk = parts.some((p) => p.ok)
  if (!anyOk) {
    const firstErr = parts.find((p): p is { ok: false; error: string } => !p.ok)
    return { ok: false, error: firstErr?.error ?? fallbackError }
  }
  return { ok: true, data: { labels, series } }
}

export interface ChartSeriesData {
  labels: string[]
  series: number[]
}

export interface DashboardSummary {
  cabang: string
  cabangLocked: boolean
  charts: {
    evaluasiKeputusan: Settled<ChartSeriesData>
    kontrakSisa: Settled<ChartSeriesData>
    cutiTrend: Settled<ChartSeriesData>
  }
  counts: {
    kontrakAktif: Settled<number>
    kontrakPkwt: Settled<number>
    karyawanTetap: Settled<number>
    evaluasiMenunggu: Settled<number>
    cutiBulanIni: Settled<number>
    monitoringCuti: Settled<number>
  }
  recentEvaluasi: Settled<any[]>
  recentKontrakExpiring: Settled<any[]>
  recentBerita: Settled<any[]>
}

export async function fetchDashboardSummary(
  cabang = '',
  options?: { cabangLocked?: boolean; access?: DashboardAccess }
): Promise<DashboardSummary> {
  const cab = cabang?.trim() ?? ''
  const cabangLocked = Boolean(options?.cabangLocked ?? cab.length > 0)
  const access = options?.access ?? {
    kontrak: true,
    pkwt: true,
    tetap: true,
    evaluasi: true,
    cuti: true,
    monitorCuti: true,
    berita: false,
  }

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD')
  const evalAwal = dayjs().subtract(90, 'day').format('YYYY-MM-DD')
  const evalAkhir = dayjs().format('YYYY-MM-DD')
  const tahun = dayjs().year()

  const cutiMonths = Array.from({ length: 6 }, (_, i) => {
    const d = dayjs().subtract(5 - i, 'month')
    return {
      label: d.format('MMM YY'),
      awal: d.startOf('month').format('YYYY-MM-DD'),
      akhir: d.endOf('month').format('YYYY-MM-DD'),
    }
  })

  const [
    kontrakAktifRes,
    kontrakPkwtRes,
    karyawanTetapRes,
    evalCountRes,
    cutiRes,
    monitorRes,
    evalListRes,
    kontrakListRes,
    beritaRes,
    evalMenungguChartRes,
    evalPerpanjangChartRes,
    evalTidakChartRes,
    kontrakKritisRes,
    kontrakMenipisRes,
    kontrakAmanRes,
    kontrakExpiredRes,
    ...cutiMonthRes
  ] = await Promise.all([
    settleIf(access.kontrak, async () =>
      pickTotal(await fetchKontrakAktif({ cabang: cab, page: 1, pageSize: 1 })),
      EMPTY_COUNT
    ),
    settleIf(access.pkwt, async () =>
      pickTotal(await fetchKontrakPkwt({ cabang: cab, page: 1, pageSize: 1 })),
      EMPTY_COUNT
    ),
    settleIf(access.tetap, async () =>
      pickTotal(await fetchKaryawanTetapList({ cabang: cab, page: 1, pageSize: 1 })),
      EMPTY_COUNT
    ),
    settleIf(access.evaluasi, async () =>
      pickTotal(
        await fetchAprovalEvaluasiList({
          cabang: cab,
          tglAwal: evalAwal,
          tglAkhir: evalAkhir,
          keputusan: 'MENUNGGU',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.cuti, async () =>
      pickTotal(
        await fetchCutiKaryawan({
          cabang: cab,
          tglAwal: monthStart,
          tglAkhir: monthEnd,
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.monitorCuti, async () =>
      pickTotal(
        await fetchSaldoCutiKaryawan({
          cabang: cab,
          tahun,
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.evaluasi, async () =>
      pickList(
        await fetchAprovalEvaluasiList({
          cabang: cab,
          tglAwal: evalAwal,
          tglAkhir: evalAkhir,
          keputusan: 'MENUNGGU',
          page: 1,
          pageSize: 5,
        })
      ),
      EMPTY_LIST
    ),
    settleIf(access.kontrak, async () =>
      pickList(
        await fetchKontrakAktif({
          cabang: cab,
          sisaKontrak: 'MENIPIS',
          page: 1,
          pageSize: 5,
        })
      ),
      EMPTY_LIST
    ),
    settleIf(access.berita, async () => {
      const json = await fetchBerita({ page: 1, pageSize: 5 })
      const list =
        json?.data?.Data ??
        json?.Data?.data ??
        json?.data?.data ??
        json?.Data?.Data ??
        []
      return Array.isArray(list) ? list : []
    }, EMPTY_LIST),
    settleIf(access.evaluasi, async () =>
      pickTotal(
        await fetchAprovalEvaluasiList({
          cabang: cab,
          tglAwal: evalAwal,
          tglAkhir: evalAkhir,
          keputusan: 'MENUNGGU',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.evaluasi, async () =>
      pickTotal(
        await fetchAprovalEvaluasiList({
          cabang: cab,
          tglAwal: evalAwal,
          tglAkhir: evalAkhir,
          keputusan: 'PERPANJANG',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.evaluasi, async () =>
      pickTotal(
        await fetchAprovalEvaluasiList({
          cabang: cab,
          tglAwal: evalAwal,
          tglAkhir: evalAkhir,
          keputusan: 'TIDAK PERPANJANG',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.kontrak, async () =>
      pickTotal(
        await fetchKontrakAktif({
          cabang: cab,
          sisaKontrak: 'KRITIS',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.kontrak, async () =>
      pickTotal(
        await fetchKontrakAktif({
          cabang: cab,
          sisaKontrak: 'MENIPIS',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.kontrak, async () =>
      pickTotal(
        await fetchKontrakAktif({
          cabang: cab,
          sisaKontrak: 'AMAN',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    settleIf(access.kontrak, async () =>
      pickTotal(
        await fetchKontrakAktif({
          cabang: cab,
          sisaKontrak: 'EXPIRED',
          page: 1,
          pageSize: 1,
        })
      ),
      EMPTY_COUNT
    ),
    ...cutiMonths.map((m) =>
      settleIf(access.cuti, async () =>
        pickTotal(
          await fetchCutiKaryawan({
            cabang: cab,
            tglAwal: m.awal,
            tglAkhir: m.akhir,
            page: 1,
            pageSize: 1,
          })
        ),
        EMPTY_COUNT
      )
    ),
  ])

  const evaluasiKeputusan = access.evaluasi
    ? buildChartSettled(
        ['Menunggu', 'Perpanjang', 'Tidak Perpanjang'],
        [evalMenungguChartRes, evalPerpanjangChartRes, evalTidakChartRes],
        'Gagal memuat grafik evaluasi'
      )
    : { ok: true as const, data: { labels: [], series: [] } }

  const kontrakSisa = access.kontrak
    ? buildChartSettled(
        ['Kritis ≤7 hr', 'Menipis ≤30 hr', 'Aman', 'Expired'],
        [kontrakKritisRes, kontrakMenipisRes, kontrakAmanRes, kontrakExpiredRes],
        'Gagal memuat grafik kontrak'
      )
    : { ok: true as const, data: { labels: [], series: [] } }

  const cutiTrend = access.cuti
    ? buildChartSettled(
        cutiMonths.map((m) => m.label),
        cutiMonthRes,
        'Gagal memuat grafik cuti'
      )
    : { ok: true as const, data: { labels: [], series: [] } }

  const evalRows = evalListRes.ok ? filterRowsByCabang(evalListRes.data, cab) : []
  const kontrakRows = kontrakListRes.ok
    ? filterRowsByCabang(kontrakListRes.data, cab)
    : []

  return {
    cabang: cab,
    cabangLocked,
    charts: {
      evaluasiKeputusan,
      kontrakSisa,
      cutiTrend,
    },
    counts: {
      kontrakAktif: kontrakAktifRes,
      kontrakPkwt: kontrakPkwtRes,
      karyawanTetap: karyawanTetapRes,
      evaluasiMenunggu: evalCountRes,
      cutiBulanIni: cutiRes,
      monitoringCuti: monitorRes,
    },
    recentEvaluasi: evalListRes.ok
      ? { ok: true as const, data: evalRows }
      : evalListRes,
    recentKontrakExpiring: kontrakListRes.ok
      ? { ok: true as const, data: kontrakRows }
      : kontrakListRes,
    recentBerita: beritaRes,
  }
}
