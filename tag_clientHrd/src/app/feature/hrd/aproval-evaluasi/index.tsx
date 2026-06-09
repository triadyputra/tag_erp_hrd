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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material'
import dayjs from 'dayjs'
import { useAccessGatedSWR } from '@/hooks/useAccessGatedSWR'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { getCabang } from '@/helpers/auth.helper'
import { fetchAprovalEvaluasiList, updateAprovalEvaluasi } from '@/services/hrd/aproval-evaluasi.service'
import { formatDate, formatNumber } from '@/utils/format'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { IconEdit, IconFilter, IconSearch } from '@tabler/icons-react'
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
  const [inputPAkhirAwal, setInputPAkhirAwal] = useState<string | null>(null)
  const [inputPAkhirAkhir, setInputPAkhirAkhir] = useState<string | null>(null)
  const [inputKeputusan, setInputKeputusan] = useState<string[]>([])

  // FILTER
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterTglAwal, setFilterTglAwal] = useState<string | null>(thirtyDaysAgo)
  const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today)
  const [filterPAkhirAwal, setFilterPAkhirAwal] = useState<string | null>(null)
  const [filterPAkhirAkhir, setFilterPAkhirAkhir] = useState<string | null>(null)
  const [filterKeputusan, setFilterKeputusan] = useState<string[]>([])

  const [userCabang, setUserCabang] = useState<string | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openForm, setOpenForm] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)

  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      setUserCabang(cab)
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const { data, isLoading, mutate } = useAccessGatedSWR(
    { subject: 'AprovalEvaluasi', any: true },
    [
      'aproval-evaluasi',
      filterNama,
      filterCabang,
      filterTglAwal,
      filterTglAkhir,
      filterPAkhirAwal,
      filterPAkhirAkhir,
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
        pAkhirAwal: filterPAkhirAwal ?? '',
        pAkhirAkhir: filterPAkhirAkhir ?? '',
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

  const applyAllFilters = () => {
    if (
      inputPAkhirAwal &&
      inputPAkhirAkhir &&
      dayjs(inputPAkhirAwal).isAfter(dayjs(inputPAkhirAkhir), 'day')
    ) {
      showSnackbar('PAkhir awal tidak boleh lebih besar dari PAkhir akhir', 'error')
      return false
    }

    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setFilterTglAwal(inputTglAwal)
    setFilterTglAkhir(inputTglAkhir)
    setFilterPAkhirAwal(inputPAkhirAwal)
    setFilterPAkhirAkhir(inputPAkhirAkhir)
    setFilterKeputusan(inputKeputusan)
    setPage(1)
    return true
  }

  const resetDialogFilters = () => {
    setInputKeputusan([])
    setInputPAkhirAwal(null)
    setInputPAkhirAkhir(null)
  }

  const resetAllFilters = () => {
    const cab = userCabang ?? ''

    setInputNama('')
    setInputCabang(cab)
    setInputTglAwal(thirtyDaysAgo)
    setInputTglAkhir(today)
    setInputKeputusan([])
    setInputPAkhirAwal(null)
    setInputPAkhirAkhir(null)

    setFilterNama('')
    setFilterCabang(cab)
    setFilterTglAwal(thirtyDaysAgo)
    setFilterTglAkhir(today)
    setFilterKeputusan([])
    setFilterPAkhirAwal(null)
    setFilterPAkhirAkhir(null)
    setPage(1)
  }

  const advancedFilterCount =
    (filterKeputusan.length > 0 ? 1 : 0) +
    (filterPAkhirAwal ? 1 : 0) +
    (filterPAkhirAkhir ? 1 : 0)

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
        alignItems={{ xs: 'stretch', sm: 'flex-end' }}
        justifyContent="space-between"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            placeholder="Cari Nama Karyawan"
            size="small"
            value={inputNama}
            onChange={(e) => setInputNama(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setFilterNama(inputNama)
                setPage(1)
              }
            }}
            onBlur={() => {
              if (inputNama !== filterNama) {
                setFilterNama(inputNama)
                setPage(1)
              }
            }}
            fullWidth
            sx={{ minWidth: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { height: 36 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setFilterNama(inputNama)
                    setPage(1)
                  }}
                >
                  <IconSearch size={16} />
                </InputAdornment>
              ),
            }}
          />

          {!userCabang && (
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
              fullWidth
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
              renderInput={(params) => (
                <TextField {...params} size="small" placeholder="Cabang" />
              )}
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <DatePicker
                format="DD-MM-YYYY"
                value={inputTglAwal ? dayjs(inputTglAwal) : null}
                onChange={(v) => {
                  const val = v ? v.format('YYYY-MM-DD') : null
                  setInputTglAwal(val)
                  setFilterTglAwal(val)
                  setPage(1)
                }}
                slotProps={{
                  textField: (params) => ({
                    ...params,
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'Tgl Nilai Awal',
                    sx: {
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': { height: 36 },
                    },
                    InputProps: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {inputTglAwal && (
                            <InputAdornment
                              position="end"
                              sx={{ cursor: 'pointer', mr: 0.5 }}
                              onClick={() => {
                                setInputTglAwal(null)
                                setFilterTglAwal(null)
                                setPage(1)
                              }}
                            >
                              ✕
                            </InputAdornment>
                          )}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }),
                  actionBar: { actions: ['clear', 'today'] },
                }}
              />

              <DatePicker
                format="DD-MM-YYYY"
                value={inputTglAkhir ? dayjs(inputTglAkhir) : null}
                onChange={(v) => {
                  const val = v ? v.format('YYYY-MM-DD') : null
                  setInputTglAkhir(val)
                  setFilterTglAkhir(val)
                  setPage(1)
                }}
                slotProps={{
                  textField: (params) => ({
                    ...params,
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'Tgl Nilai Akhir',
                    sx: {
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': { height: 36 },
                    },
                    InputProps: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {inputTglAkhir && (
                            <InputAdornment
                              position="end"
                              sx={{ cursor: 'pointer', mr: 0.5 }}
                              onClick={() => {
                                setInputTglAkhir(null)
                                setFilterTglAkhir(null)
                                setPage(1)
                              }}
                            >
                              ✕
                            </InputAdornment>
                          )}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }),
                  actionBar: { actions: ['clear', 'today'] },
                }}
              />
            </Stack>
          </LocalizationProvider>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
          }}
        >
          <Badge color="primary" badgeContent={advancedFilterCount} invisible={advancedFilterCount === 0}>
            <Button
              variant="outlined"
              startIcon={<IconFilter size={18} />}
              onClick={() => setFilterModalOpen(true)}
              sx={{ height: 36, whiteSpace: 'nowrap' }}
            >
              Filter
            </Button>
          </Badge>
        </Stack>
      </Stack>

      <Dialog open={filterModalOpen} onClose={() => setFilterModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Filter Lanjutan</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={0.5}>
            <Autocomplete
              multiple
              options={keputusanOptions}
              getOptionLabel={(o) => o?.title ?? ''}
              value={keputusanOptions.filter((x) => inputKeputusan.includes(x.value))}
              onChange={(_, v) => setInputKeputusan((v ?? []).map((x) => x.value))}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Keputusan"
                  placeholder="Pilih keputusan..."
                />
              )}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <DatePicker
                  label="PAkhir Awal"
                  format="DD-MM-YYYY"
                  value={inputPAkhirAwal ? dayjs(inputPAkhirAwal) : null}
                  onChange={(v) => setInputPAkhirAwal(v ? v.format('YYYY-MM-DD') : null)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                    actionBar: { actions: ['clear', 'today'] },
                  }}
                />
                <DatePicker
                  label="PAkhir Akhir"
                  format="DD-MM-YYYY"
                  value={inputPAkhirAkhir ? dayjs(inputPAkhirAkhir) : null}
                  onChange={(v) => setInputPAkhirAkhir(v ? v.format('YYYY-MM-DD') : null)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                    actionBar: { actions: ['clear', 'today'] },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button color="inherit" onClick={resetDialogFilters}>
            Reset Filter
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => {
              resetAllFilters()
              setFilterModalOpen(false)
            }}
          >
            Reset Semua
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setFilterModalOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (applyAllFilters()) setFilterModalOpen(false)
            }}
          >
            Terapkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= TABLE ================= */}
      <Box
        sx={{
          width: 0,
          minWidth: '100%',
          maxWidth: '100%',
          minHeight: 0,
        }}
      >
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            maxHeight: '70vh',
            borderRadius: 2,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Table stickyHeader size="small" sx={{ width: 'max-content', minWidth: '100%', tableLayout: 'auto' }}>
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
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Atasan
              </TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Periode
              </TableCell>
              <TableCell sx={headerStyle} align="right" style={{ whiteSpace: 'nowrap' }}>
                Nilai
              </TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Rekomendasi
              </TableCell>
              <TableCell
                sx={headerStyle}
                style={{ whiteSpace: 'nowrap', maxWidth: 220, width: 220 }}
              >
                Alasan
              </TableCell>
              <TableCell
                sx={headerStyle}
                style={{ whiteSpace: 'nowrap', maxWidth: 220, width: 220 }}
              >
                Catatan HRD
              </TableCell>
              <TableCell sx={headerStyle} style={{ whiteSpace: 'nowrap' }}>
                Keputusan
              </TableCell>
              <TableCell sx={headerStyle} align="center" style={{ whiteSpace: 'nowrap' }}>
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
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                    <Typography fontSize={12.5} fontWeight={800} color="text.primary">
                      {item.NoTran ?? '-'}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.NoKontrak ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                    <Typography
                      fontSize={13}
                      lineHeight={1.3}
                      color="text.primary"
                      fontWeight={800}
                    >
                      {item.NmKaryawan ?? '-'}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.25} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.Nip ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                    <Typography fontSize={13} lineHeight={1.35} color="text.primary">
                      {item.NmDivisi ?? '-'}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.25} color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.NmBagian ?? '-'} • {item.NmJabatan ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>{item.NmAtasan ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                    <Typography fontSize={12.5} fontWeight={700} lineHeight={1.25} color="text.primary">
                      {formatDate(item.PAwal)}
                    </Typography>
                    <Typography fontSize={12} lineHeight={1.2} color="text.secondary" sx={{ mt: 0.25 }}>
                      {formatDate(item.PAkhir)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }} align="right">
                    {formatNumber(Number(item.Nilai ?? 0))}
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>{item.Rekomendasi ?? '-'}</TableCell>
                  <TableCell
                    sx={{
                      py: 2,
                      maxWidth: 220,
                      width: 220,
                      minWidth: 120,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      verticalAlign: 'top',
                    }}
                  >
                    <Typography fontSize={12.5} lineHeight={1.35} color="text.primary">
                      {item.Catatan ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 2,
                      maxWidth: 220,
                      width: 220,
                      minWidth: 120,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      verticalAlign: 'top',
                    }}
                  >
                    <Typography fontSize={12.5} lineHeight={1.35} color="text.primary">
                      {item.CatatanHrd ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                    <KeputusanBadge raw={item.Keputusan} />
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }} align="center">
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
      </Box>

      {/* ================= PAGINATION ================= */}
      <TablePagination
        component="div"
        sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
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

