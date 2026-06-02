/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
  Button,
} from '@mui/material'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { getCabang } from '@/helpers/auth.helper'
import { fetchAprovalEvaluasiList, updateAprovalEvaluasi } from '@/services/hrd/aproval-evaluasi.service'
import { formatDate, formatNumber } from '@/utils/format'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { IconEdit } from '@tabler/icons-react'
import FormAprovalEvaluasi from './FormAprovalEvaluasi'
import AccessButton from '@/app/components/buttons/AccessButton'

function normalizeKeputusan(raw?: string | null) {
  const text = String(raw ?? '').trim()
  if (!text) return 'MENUNGGU'

  const norm = text.toUpperCase()
  if (norm.includes('MENUNGGU')) return 'MENUNGGU'
  if (norm.includes('TIDAK PERPANJANG') || norm.includes('TIDAK')) return 'TIDAK PERPANJANG'
  if (norm.includes('PERPANJANG')) return 'PERPANJANG'
  return text
}

function KeputusanBadge({ raw }: { raw?: string | null }) {
  const text = String(raw ?? '').trim()
  if (!text) {
    // Backend kadang mengirim null/empty → default MENUNGGU
    return (
      <Chip
        label="MENUNGGU"
        size="small"
        sx={{
          bgcolor: '#fef9c3',
          color: '#854d0e',
          height: 'auto',
          minHeight: 26,
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 11,
          '& .MuiChip-label': { px: 1.25, py: 0.35, whiteSpace: 'normal', lineHeight: 1.2 },
        }}
      />
    )
  }

  const norm = text.toUpperCase()

  // Normalisasi nilai keputusan → 3 opsi tampilan
  const normalized = normalizeKeputusan(text)

  // Warna soft/pastel
  const map: Record<string, { bg: string; fg: string }> = {
    MENUNGGU: { bg: '#fef9c3', fg: '#854d0e' },
    PERPANJANG: { bg: '#d1fae5', fg: '#047857' },
    'TIDAK PERPANJANG': { bg: '#fee2e2', fg: '#b91c1c' },
  }

  const { bg, fg } = map[normalized] ?? { bg: '#f1f5f9', fg: '#64748b' }

  return (
    <Chip
      label={normalized}
      size="small"
      sx={{
        bgcolor: bg,
        color: fg,
        height: 'auto',
        minHeight: 26,
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 11,
        '& .MuiChip-label': { px: 1.25, py: 0.35, whiteSpace: 'normal', lineHeight: 1.2 },
      }}
    />
  )
}

const AprovalEvaluasiListComponent = () => {
  const { showSnackbar } = useSnackbar()
  const today = dayjs().format('YYYY-MM-DD')
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD')

  const keputusanOptions = [
    { value: 'MENUNGGU', title: 'MENUNGGU' },
    { value: 'PERPANJANG', title: 'PERPANJANG' },
    { value: 'TIDAK PERPANJANG', title: 'TIDAK PERPANJANG' },
  ]

  // INPUT
  const [inputNama, setInputNama] = useState('')
  const [inputCabang, setInputCabang] = useState('')
  const [inputTglAwal, setInputTglAwal] = useState<string | null>(thirtyDaysAgo)
  const [inputTglAkhir, setInputTglAkhir] = useState<string | null>(today)
  const [inputKeputusan, setInputKeputusan] = useState<string[]>([])

  // FILTER
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterTglAwal, setFilterTglAwal] = useState<string | null>(thirtyDaysAgo)
  const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today)
  const [filterKeputusan, setFilterKeputusan] = useState<string[]>([])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openForm, setOpenForm] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)

  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const { data, isLoading, mutate } = useSWR(
    [
      'aproval-evaluasi',
      filterNama,
      filterCabang,
      filterTglAwal,
      filterTglAkhir,
      filterKeputusan.join('|'),
      page,
      pageSize,
    ],
    () =>
      fetchAprovalEvaluasiList({
        namaKaryawan: filterNama,
        cabang: filterCabang,
        tglAwal: filterTglAwal ?? '',
        tglAkhir: filterTglAkhir ?? '',
        keputusan: filterKeputusan.join(','),
        page,
        pageSize,
      }),
    {
      onError: (err: any) => {
        showSnackbar(err?.message || 'Gagal mengambil data', 'error')
      },
    }
  )

  const list = data?.Data ?? data?.data ?? []
  const listFiltered = (Array.isArray(list) ? list : []).filter((item: any) => {
    const keputusan = normalizeKeputusan(item?.Keputusan)
    // Jika combo keputusan belum dipilih (null/empty) → tidak filter berdasarkan keputusan
    if (!filterKeputusan?.length) return true
    const allowed = new Set(filterKeputusan.map((x) => x))
    return allowed.has(keputusan)
  })
  const total = data?.TotalCount ?? data?.totalCount ?? 0
  const loading = isLoading && !data

  const headerStyle = (theme: any) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.palette.divider}`,
  })

  const handleSearch = () => {
    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setFilterTglAwal(inputTglAwal)
    setFilterTglAkhir(inputTglAkhir)
    setFilterKeputusan(inputKeputusan)
    setPage(1)
  }

  const periodLabel = (item: any) => {
    const aw = formatDate(item.PAwal)
    const ak = formatDate(item.PAkhir)
    return `${aw} - ${ak}`
  }

  const colSpan = 11

  return (
    <Box>
      {/* ================= FILTER ================= */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.2}
        mb={3}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            placeholder="Nama Karyawan"
            size="small"
            value={inputNama}
            onChange={(e) => setInputNama(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            sx={{ minWidth: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { height: 36 } }}
          />

          <Autocomplete
            options={cabangOptions ?? []}
            loading={cabangLoading}
            getOptionLabel={(o) => o.title ?? ''}
            value={cabangOptions?.find((x) => x.value === inputCabang) ?? null}
            onChange={(_, v) => {
              const val = v?.value ?? ''
              setInputCabang(val)
              setFilterCabang(val)
              setPage(1)
            }}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Cabang" InputLabelProps={{ shrink: true }} />
            )}
          />

          <Autocomplete
            multiple
            options={keputusanOptions}
            getOptionLabel={(o) => o?.title ?? ''}
            value={keputusanOptions.filter((x) => inputKeputusan.includes(x.value))}
            onChange={(_, v) => {
              const next = (v ?? []).map((x) => x.value)
              setInputKeputusan(next)
              setFilterKeputusan(next)
              setPage(1)
            }}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Keputusan"
                InputLabelProps={{ shrink: true }}
                placeholder="Pilih..."
              />
            )}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Tgl Awal"
              format="DD-MM-YYYY"
              value={inputTglAwal ? dayjs(inputTglAwal) : null}
              onChange={(v) => {
                const val = v ? v.format('YYYY-MM-DD') : null
                setInputTglAwal(val)
                setFilterTglAwal(val)
                setPage(1)
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    minWidth: { xs: '100%', sm: 200 },
                    '& .MuiInputLabel-root': { whiteSpace: 'nowrap' },
                  },
                },
              }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Tgl Akhir"
              format="DD-MM-YYYY"
              value={inputTglAkhir ? dayjs(inputTglAkhir) : null}
              onChange={(v) => {
                const val = v ? v.format('YYYY-MM-DD') : null
                setInputTglAkhir(val)
                setFilterTglAkhir(val)
                setPage(1)
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    minWidth: { xs: '100%', sm: 200 },
                    '& .MuiInputLabel-root': { whiteSpace: 'nowrap' },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ height: 36, minWidth: 120 }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Cari'}
          </Button>
        </Stack>
      </Stack>

      {/* ================= TABLE ================= */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                No Transaksi / No Kontrak
              </TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                NIK • Nama
              </TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Divisi / Bagian / Jabatan
              </TableCell>
              <TableCell sx={headerStyle}>Atasan</TableCell>
              <TableCell sx={headerStyle}>Periode</TableCell>
              <TableCell sx={headerStyle} align="right">
                Nilai
              </TableCell>
              <TableCell sx={headerStyle}>Rekomendasi</TableCell>
              <TableCell sx={headerStyle}>Alasan</TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Catatan HRD
              </TableCell>
              <TableCell sx={headerStyle}>Keputusan</TableCell>
              <TableCell sx={headerStyle} align="center">
                Aksi
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={22} />
                  <Typography fontSize={12} mt={1} color="text.secondary">
                    Memuat data approval evaluasi...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : listFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                  <Typography fontSize={13} color="text.secondary">
                    Tidak ada data.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              listFiltered.map((item: any, idx: number) => (
                <TableRow key={item.NoTran ?? idx} hover>
                  <TableCell sx={{ py: 2, maxWidth: 220 }}>
                    <Typography
                      fontSize={12.5}
                      fontWeight={800}
                      color="text.primary"
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.NoTran ?? '-'}
                    </Typography>
                    <Typography
                      fontSize={12}
                      color="text.secondary"
                      sx={{ mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.NoKontrak ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 260 }}>
                    <Typography
                      fontSize={13}
                      lineHeight={1.3}
                      color="text.primary"
                      fontWeight={800}
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.NmKaryawan ?? '-'}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.25} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.Nip ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 320 }}>
                    <Typography fontSize={13} lineHeight={1.35} color="text.primary">
                      {item.NmDivisi ?? '-'}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.25} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.NmBagian ?? '-'} • {item.NmJabatan ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NmAtasan ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 190 }}>
                    <Typography fontSize={12.5} fontWeight={700} lineHeight={1.25} color="text.primary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatDate(item.PAwal)}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.2} color="text.secondary" sx={{ mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatDate(item.PAkhir)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }} align="right">
                    {formatNumber(Number(item.Nilai ?? 0))}
                  </TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 220 }}>{item.Rekomendasi ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 220 }}>{item.Catatan ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 340 }}>
                    <Box>
                      {item.CatatanHrd ? (
                        <Typography
                          fontSize={12}
                          lineHeight={1.2}
                          color="text.secondary"
                          sx={{
                            mt: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.CatatanHrd}
                        </Typography>
                      ) : null}
                      {!item.CatatanHrd && (
                        <Typography fontSize={13} color="text.secondary">
                          -
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <KeputusanBadge raw={item.Keputusan} />
                  </TableCell>
                  <TableCell sx={{ py: 2 }} align="center">
                    <AccessButton
                      access={{ subject: 'AprovalEvaluasi', action: 'UpdateEvaluasi' }}
                      size="small"
                      variant="text"
                      onClick={() => {
                        setSelectedRow(item)
                        setOpenForm(true)
                      }}
                      startIcon={<IconEdit size={16} />}
                    >
                      Approval
                    </AccessButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= PAGINATION ================= */}
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10))
          setPage(1)
        }}
      />

      <FormAprovalEvaluasi
        open={openForm}
        row={selectedRow}
        onClose={() => {
          setOpenForm(false)
          setSelectedRow(null)
        }}
        onSubmit={async (payload) => {
          const res = await updateAprovalEvaluasi(payload)
          showSnackbar(
            res?.Metadata?.Message || res?.metadata?.message || 'Approval evaluasi berhasil disimpan',
            'success'
          )
          setOpenForm(false)
          setSelectedRow(null)
          await mutate()
        }}
      />
    </Box>
  )
}

export default AprovalEvaluasiListComponent

