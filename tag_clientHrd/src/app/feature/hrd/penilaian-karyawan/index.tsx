/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  TableContainer,
  Paper,
  Button,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
} from '@mui/material'
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { formatDate } from '@/utils/format'
import {
  deletePenilaianKaryawan,
  fetchPenilaianKaryawanList,
  savePenilaianKaryawan,
} from '@/services/hrd/penilaian-karyawan.service'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import FormPenilaianKaryawan from './FormPenilaianKaryawan'

/** Badge pill seperti kartu status: warna mengikuti jenis rekomendasi */
function RekomendasiBadge({ raw }: { raw?: string | null }) {
  const text = String(raw ?? '').trim()
  if (!text)
    return (
      <Typography component="span" fontSize={13} color="text.secondary">
        —
      </Typography>
    )

  const norm = text.toUpperCase()
  const map: Record<string, { bg: string; fg: string }> = {
    PPK: { bg: '#ccfbf1', fg: '#0d9488' },
    PKWT: { bg: '#d1fae5', fg: '#047857' },
    ADDENDUM: { bg: '#e0f2fe', fg: '#0369a1' },
    FREELANCE: { bg: '#ede9fe', fg: '#6d28d9' },
    'KONTRAK TIDAK DIPERPANJANG': { bg: '#fee2e2', fg: '#b91c1c' },
  }
  const { bg, fg } = map[norm] ?? { bg: '#f1f5f9', fg: '#64748b' }

  return (
    <Chip
      label={text}
      size="small"
      sx={{
        height: 'auto',
        minHeight: 26,
        maxWidth: '100%',
        borderRadius: 999,
        bgcolor: bg,
        color: fg,
        fontWeight: 500,
        fontSize: 11,
        letterSpacing: '0.02em',
        '& .MuiChip-label': {
          px: 1.25,
          py: 0.35,
          display: 'block',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: 1.25,
        },
      }}
    />
  )
}

const PenilaianKaryawanListComponent = () => {
  const { showSnackbar } = useSnackbar()
  const today = dayjs().format('YYYY-MM-DD')
  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [openForm, setOpenForm] = useState(false)
  const [selectedNotran, setSelectedNotran] = useState<string | null>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<{ NOTRAN: string } | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  // INPUT
  const [inputNik, setInputNik] = useState('')
  const [inputNama, setInputNama] = useState('')
  const [inputCabang, setInputCabang] = useState('')
  const [inputTglAwal, setInputTglAwal] = useState<string | null>(today)
  const [inputTglAkhir, setInputTglAkhir] = useState<string | null>(today)

  // FILTER
  const [filterNik, setFilterNik] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterTglAwal, setFilterTglAwal] = useState<string | null>(today)
  const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, mutate } = useSWR(
    ['penilaian-karyawan', filterNik, filterNama, filterCabang, filterTglAwal, filterTglAkhir, page, pageSize],
    () =>
      fetchPenilaianKaryawanList({
        nik: filterNik,
        namaKaryawan: filterNama,
        cabang: filterCabang,
        tglAwal: filterTglAwal ?? '',
        tglAkhir: filterTglAkhir ?? '',
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
  const total = data?.TotalCount ?? data?.totalCount ?? 0
  const loading = isLoading && !data

  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const handleSearch = () => {
    setFilterNik(inputNik)
    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setFilterTglAwal(inputTglAwal)
    setFilterTglAkhir(inputTglAkhir)
    setPage(1)
  }

  const headerStyle = (theme: any) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.palette.divider}`,
  })

  const handleConfirmDelete = async () => {
    if (!selectedDelete?.NOTRAN) return

    try {
      setLoadingDelete(true)
      await deletePenilaianKaryawan(selectedDelete.NOTRAN)
      await mutate()
      setOpenDeleteDialog(false)
      setSelectedDelete(null)
      showSnackbar('Data penilaian berhasil dihapus', 'success')
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal menghapus data', 'error')
    } finally {
      setLoadingDelete(false)
    }
  }

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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            placeholder="NIK"
            size="small"
            value={inputNik}
            onChange={(e) => setInputNik(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiOutlinedInput-root': { height: 36 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={handleSearch}>
                  <IconSearch size={16} />
                </InputAdornment>
              ),
            }}
          />

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
              setFilterCabang(val) // auto search
              setPage(1)
            }}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Cabang"
                InputLabelProps={{ shrink: true }}
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
                setFilterTglAwal(val) // auto search
                setPage(1)
              }}
              slotProps={{
                textField: { size: 'small', sx: { minWidth: { xs: '100%', sm: 160 } } },
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
                setFilterTglAkhir(val) // auto search
                setPage(1)
              }}
              slotProps={{
                textField: { size: 'small', sx: { minWidth: { xs: '100%', sm: 160 } } },
              }}
            />
          </LocalizationProvider>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{ height: 36, minWidth: 120 }}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Cari'}
          </Button>
          <AccessButton
            access={{ subject: 'PenilaianKaryawan', action: 'SavePenilaianKaryawan' }}
            color="primary"
            variant="contained"
            onClick={() => {
              setSelectedNotran(null)
              setOpenForm(true)
            }}
            startIcon={<AddRounded />}
          >
            Tambah
          </AccessButton>
        </Stack>
      </Stack>

      {/* ================= TABLE ================= */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headerStyle}>No Transaksi</TableCell>
              <TableCell sx={headerStyle}>NIK</TableCell>
              <TableCell sx={headerStyle}>Nama</TableCell>
              <TableCell sx={headerStyle}>Divisi</TableCell>
              <TableCell sx={headerStyle}>Bagian</TableCell>
              <TableCell sx={headerStyle}>Jabatan</TableCell>
              <TableCell sx={headerStyle}>Atasan</TableCell>
              <TableCell sx={headerStyle}>Tgl Nilai</TableCell>
              <TableCell sx={headerStyle}>Rekomendasi</TableCell>
              <TableCell sx={headerStyle}>Valid User</TableCell>
              <TableCell sx={headerStyle}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={22} />
                  <Typography fontSize={12} mt={1} color="text.secondary">
                    Memuat data penilaian...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <Typography fontSize={13} color="text.secondary">
                    Tidak ada data.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, idx: number) => (
                <TableRow key={item.NOTRAN ?? idx} hover>
                  <TableCell sx={{ py: 2 }}>{item.NOTRAN ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NIP ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NMKARYAWAN ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NMDIVISI ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NMBAGIAN ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NMJABATAN ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.NMATASAN ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>{item.TGLNILAI ? formatDate(item.TGLNILAI) : '-'}</TableCell>
                  <TableCell sx={{ py: 2, maxWidth: 200 }}>
                    <RekomendasiBadge raw={item.REKOMENDASI} />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>{item.VALIDUSER ?? '-'}</TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" gap={0.5}>
                      <AccessButton
                        access={{ subject: 'PenilaianKaryawan', action: 'GetDetailPenilaianKaryawan' }}
                        color="success"
                        type="icon"
                        onClick={() => {
                          setSelectedNotran(item.NOTRAN ?? null)
                          setOpenForm(true)
                        }}
                      >
                        <IconEdit width={18} />
                      </AccessButton>
                      <AccessButton
                        access={{ subject: 'PenilaianKaryawan', action: 'DeletePenilaianKaryawan' }}
                        color="error"
                        type="icon"
                        onClick={() => {
                          setSelectedDelete({ NOTRAN: item.NOTRAN })
                          setOpenDeleteDialog(true)
                        }}
                      >
                        <IconTrash width={18} />
                      </AccessButton>
                    </Box>
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

      {openForm && (
        <FormPenilaianKaryawan
          noTran={selectedNotran}
          onClose={() => {
            setOpenForm(false)
            setSelectedNotran(null)
          }}
          onSubmit={async (payload) => {
            try {
              const res = await savePenilaianKaryawan(payload)
              showSnackbar(res?.Metadata?.Message || 'Berhasil menyimpan penilaian', 'success')
              await mutate()
              setOpenForm(false)
              setSelectedNotran(null)
            } catch (err: any) {
              showSnackbar(err?.message || 'Gagal menyimpan data', 'error')
            }
          }}
        />
      )}

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menghapus penilaian dengan No.{' '}
          <strong>{selectedDelete?.NOTRAN ?? '-'}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={loadingDelete}>
            {loadingDelete ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PenilaianKaryawanListComponent

