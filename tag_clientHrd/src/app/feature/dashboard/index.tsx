'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, Grid, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import useSWR from 'swr'
import {
  IconCalendarEvent,
  IconClipboardCheck,
  IconFileCertificate,
  IconUserCheck,
  IconUsers,
} from '@tabler/icons-react'
import {
  getAuthAccess,
  getAuthUser,
  getCabangFilter,
  hasAccess,
  hasAnyAccess,
  isCabangScopeLocked,
} from '@/helpers/auth.helper'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { useTabWorkspace } from '@/app/context/tabWorkspaceContext'
import { fetchDashboardSummary } from '@/services/dashboard/dashboard.service'
import { formatDate, formatNumber } from '@/utils/format'
import DashboardStatCard from './DashboardStatCard'
import DashboardCharts from './DashboardCharts'
import DashboardRecentTable from './DashboardRecentTable'

function unwrapCount(
  settled: { ok: true; data: number } | { ok: false; error: string }
): { value: number; error: string | null } {
  if (settled.ok) return { value: settled.data, error: null }
  return { value: 0, error: settled.error }
}

function unwrapList(
  settled: { ok: true; data: any[] } | { ok: false; error: string }
): { rows: any[]; error: string | null } {
  if (settled.ok) return { rows: settled.data, error: null }
  return { rows: [], error: settled.error }
}

function useAuthCabangReady() {
  const [ready, setReady] = useState(false)
  const [cabangFilter, setCabangFilter] = useState('')

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      if (cancelled) return
      setCabangFilter(getCabangFilter())
      setReady(true)
    }

    const isAuthLoaded = () =>
      Boolean(getAuthUser()) && localStorage.getItem('auth_access') !== null

    if (isAuthLoaded()) {
      sync()
      return
    }

    const timer = setInterval(() => {
      if (isAuthLoaded()) {
        sync()
        clearInterval(timer)
      }
    }, 200)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { ready, cabangFilter, cabangLocked: isCabangScopeLocked() }
}

export default function DashboardFeature() {
  const theme = useTheme()
  const { openTab } = useTabWorkspace()
  const { ready: authReady, cabangFilter, cabangLocked } = useAuthCabangReady()
  const { cabang: cabangOptions } = useComboCabangWith()

  const user = getAuthUser()
  const todayLabel = dayjs().format('dddd, D MMMM YYYY')

  const cabangLabel = useMemo(() => {
    if (!cabangLocked) return 'Semua cabang'
    const found = cabangOptions?.find((o) => o.value === cabangFilter)
    return found?.title ?? cabangFilter
  }, [cabangFilter, cabangLocked, cabangOptions])

  const access = useMemo(
    () => ({
      kontrak: hasAnyAccess('KontrakKaryawan'),
      pkwt: hasAnyAccess('KontrakPkwt'),
      tetap: hasAnyAccess('KaryawanTetap'),
      evaluasi: hasAnyAccess('AprovalEvaluasi'),
      cuti: hasAnyAccess('CutiKaryawan'),
      monitorCuti: hasAnyAccess('MonitoringCuti'),
      berita: hasAccess('Berita', 'GetListBerita'),
    }),
    [authReady]
  )

  const accessKey = useMemo(
    () =>
      getAuthAccess()
        .map((a) => `${a.subject}:${a.action}`)
        .sort()
        .join('|'),
    [authReady]
  )

  const { data, isLoading, error, mutate } = useSWR(
    authReady
      ? ['dashboard-summary', cabangFilter, cabangLocked, accessKey]
      : null,
    () =>
      fetchDashboardSummary(cabangFilter, {
        cabangLocked,
        access,
      }),
    { revalidateOnFocus: false }
  )

  const loading = (isLoading && !data) || !authReady

  const kpiItems = useMemo(() => {
    if (!data) return []
    const items = []

    if (access.kontrak) {
      const c = unwrapCount(data.counts.kontrakAktif)
      items.push({
        key: 'kontrak',
        label: 'Kontrak Aktif',
        value: c.value,
        error: c.error,
        icon: <IconFileCertificate size={20} />,
        href: '/hrd/kontrak-karyawan',
        title: 'Kontrak Karyawan',
      })
    }
    if (access.pkwt) {
      const c = unwrapCount(data.counts.kontrakPkwt)
      items.push({
        key: 'pkwt',
        label: 'Kontrak PKWT',
        value: c.value,
        error: c.error,
        icon: <IconClipboardCheck size={20} />,
        href: '/hrd/kontrak-pkwt',
        title: 'Kontrak PKWT',
      })
    }
    if (access.tetap) {
      const c = unwrapCount(data.counts.karyawanTetap)
      items.push({
        key: 'tetap',
        label: 'Karyawan Tetap',
        value: c.value,
        error: c.error,
        icon: <IconUsers size={20} />,
        href: '/hrd/karyawan-tetap',
        title: 'Karyawan Tetap',
      })
    }
    if (access.evaluasi) {
      const c = unwrapCount(data.counts.evaluasiMenunggu)
      items.push({
        key: 'evaluasi',
        label: 'Evaluasi Menunggu',
        value: c.value,
        error: c.error,
        icon: <IconUserCheck size={20} />,
        href: '/hrd/aproval-evaluasi',
        title: 'Aproval Evaluasi',
      })
    }
    if (access.cuti) {
      const c = unwrapCount(data.counts.cutiBulanIni)
      items.push({
        key: 'cuti',
        label: 'Cuti Bulan Ini',
        value: c.value,
        error: c.error,
        icon: <IconCalendarEvent size={20} />,
        href: '/hrd/cuti-karyawan',
        title: 'Cuti Karyawan',
      })
    }
    if (access.monitorCuti) {
      const c = unwrapCount(data.counts.monitoringCuti)
      items.push({
        key: 'monitor',
        label: 'Monitoring Cuti',
        value: c.value,
        error: c.error,
        icon: <IconCalendarEvent size={20} />,
        href: '/hrd/monitoring-cuti-karyawan',
        title: 'Monitoring Cuti',
      })
    }

    return items
  }, [data, access])

  const evaluasiRecent = data ? unwrapList(data.recentEvaluasi) : { rows: [], error: null }
  const kontrakRecent = data ? unwrapList(data.recentKontrakExpiring) : { rows: [], error: null }
  const beritaRecent = data ? unwrapList(data.recentBerita) : { rows: [], error: null }

  const chartOverview = useMemo(() => {
    if (!kpiItems.length) return undefined
    return {
      labels: kpiItems.map((i) => i.label),
      series: kpiItems.map((i) => (typeof i.value === 'number' ? i.value : Number(i.value) || 0)),
    }
  }, [kpiItems])

  const evalChart = data?.charts?.evaluasiKeputusan
  const kontrakChart = data?.charts?.kontrakSisa
  const cutiChart = data?.charts?.cutiTrend

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography fontWeight={800} fontSize={18} letterSpacing="-0.02em">
            Selamat datang{user?.fullName ? `, ${user.fullName}` : ''}
          </Typography>
          <Chip
            size="small"
            label={cabangLocked ? `Cabang: ${cabangLabel}` : 'Semua cabang'}
            color={cabangLocked ? 'primary' : 'default'}
            variant={cabangLocked ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        </Box>
        <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.75 }}>
          {todayLabel}
          {cabangLocked
            ? ' · Ringkasan data difilter sesuai cabang akun Anda'
            : ' · Ringkasan data seluruh cabang'}
        </Typography>
      </Box>

      {error ? (
        <Typography color="error.main" fontSize={13} sx={{ mb: 2 }}>
          {error?.message ?? 'Gagal memuat ringkasan dashboard.'}{' '}
          <Typography
            component="button"
            type="button"
            onClick={() => mutate()}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            Coba lagi
          </Typography>
        </Typography>
      ) : null}

      {kpiItems.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpiItems.map((item) => (
            <Grid key={item.key} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <DashboardStatCard
                label={item.label}
                value={formatNumber(item.value)}
                icon={item.icon}
                loading={loading}
                error={item.error}
                onClick={() => openTab(item.href, item.title)}
              />
            </Grid>
          ))}
        </Grid>
      ) : !loading ? (
        <Typography fontSize={13} color="text.secondary" sx={{ mb: 3 }}>
          Tidak ada modul HRD yang dapat ditampilkan untuk akun ini.
        </Typography>
      ) : null}

      {(kpiItems.length > 0 || access.evaluasi || access.kontrak || access.cuti) && (
        <DashboardCharts
          loading={loading}
          cabangLabel={cabangLabel}
          cabangLocked={cabangLocked}
          overview={chartOverview}
          showEvaluasi={access.evaluasi}
          showKontrak={access.kontrak}
          showCuti={access.cuti}
          evaluasiKeputusan={evalChart?.ok ? evalChart.data : null}
          evaluasiError={evalChart && !evalChart.ok ? evalChart.error : null}
          kontrakSisa={kontrakChart?.ok ? kontrakChart.data : null}
          kontrakError={kontrakChart && !kontrakChart.ok ? kontrakChart.error : null}
          cutiTrend={cutiChart?.ok ? cutiChart.data : null}
          cutiError={cutiChart && !cutiChart.ok ? cutiChart.error : null}
        />
      )}

      <Grid container spacing={2}>
        {access.evaluasi ? (
          <Grid size={{ xs: 12, lg: 6 }}>
            <DashboardRecentTable
              title={
                cabangLocked
                  ? `Evaluasi Menunggu · ${cabangLabel}`
                  : 'Evaluasi Menunggu Approval'
              }
              loading={loading}
              error={evaluasiRecent.error}
              emptyMessage="Tidak ada evaluasi menunggu."
              onViewAll={() => openTab('/hrd/aproval-evaluasi', 'Aproval Evaluasi')}
              columns={[
                {
                  key: 'NmKaryawan',
                  label: 'Karyawan',
                  render: (r) => r.NmKaryawan ?? '—',
                },
                {
                  key: 'NmCabang',
                  label: 'Cabang',
                  render: (r) => r.NmCabang ?? r.KdCabang ?? '—',
                },
                {
                  key: 'periode',
                  label: 'Periode',
                  render: (r) =>
                    `${formatDate(r.PAwal)} – ${formatDate(r.PAkhir)}`,
                },
                {
                  key: 'Nilai',
                  label: 'Nilai',
                  align: 'right',
                  render: (r) => formatNumber(Number(r.Nilai ?? 0)),
                },
              ]}
              rows={evaluasiRecent.rows}
            />
          </Grid>
        ) : null}

        {access.kontrak ? (
          <Grid size={{ xs: 12, lg: 6 }}>
            <DashboardRecentTable
              title={
                cabangLocked
                  ? `Kontrak ≤ 30 hari · ${cabangLabel}`
                  : 'Kontrak Mendekati Berakhir (≤ 30 hari)'
              }
              loading={loading}
              error={kontrakRecent.error}
              emptyMessage="Tidak ada kontrak mendekati berakhir."
              onViewAll={() => openTab('/hrd/kontrak-karyawan', 'Kontrak Karyawan')}
              columns={[
                {
                  key: 'NmKaryawan',
                  label: 'Karyawan',
                  render: (r) => r.NmKaryawan ?? r.NamaKaryawan ?? '—',
                },
                {
                  key: 'NmCabang',
                  label: 'Cabang',
                  render: (r) => r.NmCabang ?? r.KDCABANG ?? '—',
                },
                {
                  key: 'NoKontrak',
                  label: 'No Kontrak',
                  render: (r) => (r.NoKontrak ?? '—').split('/')[0],
                },
                {
                  key: 'PAkhir',
                  label: 'Berakhir',
                  render: (r) => formatDate(r.PAkhir),
                },
              ]}
              rows={kontrakRecent.rows}
            />
          </Grid>
        ) : null}

        {access.berita ? (
          <Grid size={{ xs: 12, lg: access.evaluasi && access.kontrak ? 12 : 6 }}>
            <DashboardRecentTable
              title="Berita Terbaru"
              loading={loading}
              error={beritaRecent.error}
              emptyMessage="Belum ada berita."
              onViewAll={() => openTab('/berita', 'Berita')}
              columns={[
                {
                  key: 'Judul',
                  label: 'Judul',
                  render: (r) => r.Judul ?? '—',
                },
                {
                  key: 'IsPinned',
                  label: 'Pinned',
                  render: (r) => (r.IsPinned ? 'Ya' : 'Tidak'),
                },
                {
                  key: 'TglPublish',
                  label: 'Tanggal',
                  render: (r) => formatDate(r.TglPublish ?? r.CreatedAt),
                },
              ]}
              rows={beritaRecent.rows}
            />
          </Grid>
        ) : null}
      </Grid>
    </Box>
  )
}
