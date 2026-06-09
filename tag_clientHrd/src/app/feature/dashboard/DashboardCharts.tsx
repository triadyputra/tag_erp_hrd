'use client'

import dynamic from 'next/dynamic'
import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ApexOptions } from 'apexcharts'
import type { ChartSeriesData } from '@/services/dashboard/dashboard.service'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type ChartBlockProps = {
  title: string
  subtitle?: string
  loading?: boolean
  error?: string | null
  options: ApexOptions
  series: ApexOptions['series']
  type: 'bar' | 'donut' | 'area'
  height?: number
}

function ChartBlock({
  title,
  subtitle,
  loading,
  error,
  options,
  series,
  type,
  height = 280,
}: ChartBlockProps) {
  const theme = useTheme()

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography fontWeight={700} fontSize={14}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          flex: 1,
          px: 1,
          py: 1,
          minHeight: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={28} />
        ) : error ? (
          <Typography fontSize={12} color="error.main" sx={{ px: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        ) : (
          <Chart options={options} series={series} type={type} height={height} width="100%" />
        )}
      </Box>
    </Paper>
  )
}

function useBaseChartOptions(): Pick<ApexOptions, 'chart' | 'dataLabels' | 'grid' | 'legend' | 'tooltip'> {
  const theme = useTheme()
  return {
    chart: {
      fontFamily: theme.typography.fontFamily,
      foreColor: theme.palette.text.secondary,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: alpha(theme.palette.divider, 0.8),
      strokeDashArray: 3,
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: theme.palette.text.secondary },
    },
    tooltip: { theme: theme.palette.mode },
  }
}

type Props = {
  loading?: boolean
  cabangLabel?: string
  cabangLocked?: boolean
  /** KPI bar chart */
  overview?: { labels: string[]; series: number[] }
  evaluasiKeputusan?: ChartSeriesData | null
  evaluasiError?: string | null
  kontrakSisa?: ChartSeriesData | null
  kontrakError?: string | null
  cutiTrend?: ChartSeriesData | null
  cutiError?: string | null
  showEvaluasi?: boolean
  showKontrak?: boolean
  showCuti?: boolean
}

export default function DashboardCharts({
  loading,
  cabangLabel,
  cabangLocked,
  overview,
  evaluasiKeputusan,
  evaluasiError,
  kontrakSisa,
  kontrakError,
  cutiTrend,
  cutiError,
  showEvaluasi = true,
  showKontrak = true,
  showCuti = true,
}: Props) {
  const theme = useTheme()
  const base = useBaseChartOptions()

  const primary = theme.palette.primary.main
  const secondary = theme.palette.secondary.main
  const warning = theme.palette.warning.main
  const errorColor = theme.palette.error.main
  const info = theme.palette.info.main
  const success = theme.palette.success.main

  const scopeNote = cabangLocked
    ? `Data cabang ${cabangLabel ?? ''}`
    : 'Semua cabang'

  const overviewOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '52%',
        distributed: true,
      },
    },
    colors: [primary, secondary, info, warning, success, theme.palette.grey[500]],
    xaxis: {
      categories: overview?.labels ?? [],
      labels: { rotate: -25, style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (v) => Math.round(Number(v)).toString(),
      },
    },
    legend: { show: false },
  }

  const overviewSeries = [{ name: 'Jumlah', data: overview?.series ?? [] }]

  const donutColors = [warning, success, errorColor]
  const evaluasiOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'donut' },
    labels: evaluasiKeputusan?.labels ?? [],
    colors: donutColors,
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                )
                return String(sum)
              },
            },
          },
        },
      },
    },
  }
  const evaluasiSeries = evaluasiKeputusan?.series ?? []

  const kontrakOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '68%',
        distributed: true,
      },
    },
    colors: [errorColor, warning, success, theme.palette.grey[500]],
    xaxis: {
      categories: kontrakSisa?.labels ?? [],
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: { style: { fontSize: '11px' } },
    },
    legend: { show: false },
  }
  const kontrakSeries = [{ name: 'Kontrak', data: kontrakSisa?.series ?? [] }]

  const cutiOptions: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'area', sparkline: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.4,
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    colors: [primary],
    xaxis: {
      categories: cutiTrend?.labels ?? [],
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        formatter: (v) => Math.round(Number(v)).toString(),
      },
    },
    legend: { show: false },
  }
  const cutiSeries = [{ name: 'Pengajuan cuti', data: cutiTrend?.series ?? [] }]

  const hasOverview = (overview?.series?.length ?? 0) > 0
  const showOverview = hasOverview

  if (!showOverview && !showEvaluasi && !showKontrak && !showCuti) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography fontWeight={700} fontSize={15} sx={{ mb: 0.5 }}>
        Grafik Ringkasan
      </Typography>
      <Typography fontSize={12} color="text.secondary" sx={{ mb: 2 }}>
        {scopeNote} · 90 hari terakhir (evaluasi)
      </Typography>

      <Grid container spacing={2}>
        {showOverview ? (
          <Grid size={{ xs: 12, lg: 8 }}>
            <ChartBlock
              title="Ringkasan Modul HRD"
              subtitle="Perbandingan jumlah data utama"
              loading={loading}
              options={overviewOptions}
              series={overviewSeries}
              type="bar"
              height={300}
            />
          </Grid>
        ) : null}

        {showEvaluasi ? (
          <Grid size={{ xs: 12, lg: showOverview ? 4 : 6 }}>
            <ChartBlock
              title="Status Evaluasi"
              subtitle="90 hari terakhir"
              loading={loading}
              error={evaluasiError}
              options={evaluasiOptions}
              series={evaluasiSeries}
              type="donut"
              height={showOverview ? 300 : 280}
            />
          </Grid>
        ) : null}

        {showKontrak ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartBlock
              title="Kontrak Aktif per Sisa Masa"
              subtitle="Klasifikasi masa berakhir"
              loading={loading}
              error={kontrakError}
              options={kontrakOptions}
              series={kontrakSeries}
              type="bar"
              height={280}
            />
          </Grid>
        ) : null}

        {showCuti ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartBlock
              title="Tren Pengajuan Cuti"
              subtitle="6 bulan terakhir"
              loading={loading}
              error={cutiError}
              options={cutiOptions}
              series={cutiSeries}
              type="area"
              height={280}
            />
          </Grid>
        ) : null}
      </Grid>
    </Box>
  )
}
