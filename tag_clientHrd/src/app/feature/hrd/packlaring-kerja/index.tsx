/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  Autocomplete,
  Typography,
  Chip,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import { deletePacklaring, fetchPacklaringList, savePacklaring } from '@/services/hrd/packlaring.service'
import { formatDate } from '@/utils/format'
import dayjs from 'dayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import { useSnackbar } from '@/app/context/SnackbarContext'
import FormPacklaring from './FormPacklaring'

const PacklaringListComponent = () => {
  const { showSnackbar } = useSnackbar()
  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const today = dayjs().format('YYYY-MM-DD')

  const [openForm, setOpenForm] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const [userCabang, setUserCabang] = useState<string | null>(null)

  // INPUT
  const [inputNomor, setInputNomor] = useState('')
  const [inputNama, setInputNama] = useState('')
  const [inputJenis, setInputJenis] = useState('')
  const [inputCabang, setInputCabang] = useState('')
  const [inputTglAwal, setInputTglAwal] = useState<string | null>(today)
  const [inputTglAkhir, setInputTglAkhir] = useState<string | null>(today)

  // FILTER
  const [filterNomor, setFilterNomor] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterTglAwal, setFilterTglAwal] = useState<string | null>(today)
  const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const jenisOptions = useMemo(
    () => [
      { title: 'Semua', value: '' },
      { title: 'BPJS', value: 'BPJS' },
      { title: 'KARYAWAN', value: 'KARYAWAN' },
      { title: 'LAINNYA', value: 'LAINNYA' },
    ],
    []
  )

  const { data, isLoading, mutate } = useSWR(
    [
      'packlaring',
      filterNomor,
      filterNama,
      filterJenis,
      filterCabang,
      filterTglAwal,
      filterTglAkhir,
      page,
      pageSize,
    ],
    () =>
      fetchPacklaringList({
        nomor: filterNomor,
        nama: filterNama,
        jenis: filterJenis,
        cabang: filterCabang,
        tglAwal: filterTglAwal ?? '',
        tglAkhir: filterTglAkhir ?? '',
        page,
        pageSize,
      })
  )

  const list = data?.Data ?? []
  const total = data?.TotalCount ?? 0
  const loading = isLoading && !data

  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      setUserCabang(cab)
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const handleSearch = () => {
    setFilterNomor(inputNomor)
    setFilterNama(inputNama)
    setFilterJenis(inputJenis)
    setFilterCabang(inputCabang)
    setFilterTglAwal(inputTglAwal)
    setFilterTglAkhir(inputTglAkhir)
    setPage(1)
  }

  const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.palette.divider}`,
  })

  const renderStatus = (status: any) => {
    const val = Number(status)
    const label = val === 1 ? 'Approval' : val === 0 ? 'Pengajuan' : 'Tolak'
    const color = val === 1 ? 'success' : val === 0 ? 'warning' : 'default'
    return <Chip label={label} size="small" color={color as any} />
  }

  const handleConfirmDelete = async () => {
    if (!selectedDelete) return

    try {
      setLoadingDelete(true)
      await deletePacklaring(selectedDelete.Id)
      await mutate()
      setOpenDeleteDialog(false)
      setSelectedDelete(null)
      showSnackbar('Data packlaring berhasil dihapus', 'success')
    } catch (err: any) {
      showSnackbar(err.message || 'Gagal menghapus data', 'error')
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            placeholder="Nomor"
            size="small"
            value={inputNomor}
            onChange={(e) => setInputNomor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            sx={{
              minWidth: { xs: '100%', sm: 180 },
              '& .MuiOutlinedInput-root': { height: 36 },
            }}
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
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              '& .MuiOutlinedInput-root': { height: 36 },
            }}
          />

          <Autocomplete
            options={jenisOptions}
            value={jenisOptions.find((c) => c.value === inputJenis) ?? null}
            isOptionEqualToValue={(opt, val) => opt.value === val.value}
            onChange={(_, v) => {
              const value = v?.value ?? ''
              setInputJenis(value)
              setFilterJenis(value)
              setPage(1)
            }}
            getOptionLabel={(o) => o.title ?? ''}
            fullWidth
            sx={{
              minWidth: { xs: '100%', sm: 180 },
              '& .MuiOutlinedInput-root': { height: 36 },
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Jenis" />
            )}
          />

          {!userCabang && (
            <Autocomplete
              options={cabangOptions ?? []}
              loading={cabangLoading}
              getOptionLabel={(o) => o.title ?? ''}
              value={cabangOptions?.find((c) => c.value === inputCabang) ?? null}
              onChange={(_, v) => {
                const val = v?.value ?? ''
                setInputCabang(val)
                setFilterCabang(val)
                setPage(1)
              }}
              fullWidth
              sx={{
                minWidth: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': { height: 36 },
              }}
              renderInput={(params) => (
                <TextField {...params} size="small" placeholder="Cabang" />
              )}
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
              <DatePicker
                format="DD-MM-YYYY"
                value={inputTglAwal ? dayjs(inputTglAwal) : null}
                onChange={(newValue) => {
                  const val = newValue ? newValue.format('YYYY-MM-DD') : null
                  setInputTglAwal(val)
                  setFilterTglAwal(val)
                  setPage(1)
                }}
                slotProps={{
                  textField: (params) => ({
                    ...params,
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'Tgl Awal',
                    sx: {
                      minWidth: 180,
                      '& .MuiOutlinedInput-root': { height: 36 },
                    },
                  }),
                  actionBar: { actions: ['clear', 'today'] },
                }}
              />

              <DatePicker
                format="DD-MM-YYYY"
                value={inputTglAkhir ? dayjs(inputTglAkhir) : null}
                onChange={(newValue) => {
                  const val = newValue ? newValue.format('YYYY-MM-DD') : null
                  setInputTglAkhir(val)
                  setFilterTglAkhir(val)
                  setPage(1)
                }}
                slotProps={{
                  textField: (params) => ({
                    ...params,
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'Tgl Akhir',
                    sx: {
                      minWidth: 180,
                      '& .MuiOutlinedInput-root': { height: 36 },
                    },
                  }),
                  actionBar: { actions: ['clear', 'today'] },
                }}
              />
            </Stack>
          </LocalizationProvider>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          
          <Button variant="outlined" onClick={handleSearch} sx={{ height: 36, px: 2, whiteSpace: 'nowrap' }}>
            Cari
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setInputNomor('')
              setInputNama('')
              setInputJenis('')
              setInputCabang(userCabang ?? '')
              setInputTglAwal(today)
              setInputTglAkhir(today)

              setFilterNomor('')
              setFilterNama('')
              setFilterJenis('')
              setFilterCabang(userCabang ?? '')
              setFilterTglAwal(today)
              setFilterTglAkhir(today)
              setPage(1)
            }}
            sx={{ height: 36, px: 2, whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
          <AccessButton
            access={{ subject: 'Packlaring', action: 'SavePacklaring' }}
            color="primary"
            variant="contained"
            onClick={() => {
              setSelectedRow(null)
              setOpenForm(true)
            }}
            startIcon={<AddRounded />}
          >
            Tambah
          </AccessButton>
        </Stack>
      </Stack>

      {/* ================= TABLE ================= */}
      <TableContainer component={Paper} sx={{ maxHeight: '70vh', borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
              sx={(theme) => ({
                backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f3f4f6',
                '& th': {
                  fontWeight: 600,
                  fontSize: 13,
                  color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#374151',
                },
              })}
            >
              <TableCell sx={headerStyle}>Nomor</TableCell>
              <TableCell sx={headerStyle}>Karyawan</TableCell>
              <TableCell sx={headerStyle}>Divisi</TableCell>
              <TableCell sx={headerStyle}>Cabang</TableCell>
              <TableCell sx={headerStyle}>Periode</TableCell>
              <TableCell sx={headerStyle}>Jenis</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
              <TableCell sx={headerStyle}>Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data packlaring...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">Data tidak ditemukan</Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, i: number) => (
                <TableRow
                  key={`${item.Id ?? i}-${i}`}
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid #f1f5f9',
                    '&:hover': { backgroundColor: '#f1f5f9' },
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack spacing={0.4}>
                      <Typography fontWeight={700}>{item.Nomor ?? '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tanggal: {formatDate(item.Tanggal)}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Stack spacing={0.3}>
                      <Typography fontWeight={600}>{item.NamaKaryawan ?? '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        NIK: {item.Nik ?? '-'} • KTP: {item.NoKtp ?? '-'}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Typography>{item.Divisi ?? '-'}</Typography>
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Stack spacing={0.2}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.NmCabang ?? '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.KdCabang ?? ''}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ py: 2, minWidth: 170 }}>
                    <Typography variant="body2">
                      {formatDate(item.Masuk)} - {formatDate(item.Keluar)}
                    </Typography>
                    {item.LamaKerjaHari !== undefined && item.LamaKerjaHari !== null && (
                      <Typography variant="caption" color="text.secondary">
                        Lama kerja: {item.LamaKerjaHari} hari
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Chip label={item.Jenis ?? '-'} size="small" variant="outlined" />
                  </TableCell>

                  <TableCell sx={{ py: 2 }}>{renderStatus(item.Status)}</TableCell>

                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" gap={0.5}>
                      <AccessButton
                        access={{ subject: 'Packlaring', action: 'GetDetailPacklaring' }}
                        color="success"
                        type="icon"
                        onClick={() => {
                          setSelectedRow(item)
                          setOpenForm(true)
                        }}
                      >
                        <IconEdit width={18} />
                      </AccessButton>
                      <AccessButton
                        access={{ subject: 'Packlaring', action: 'DeletePacklaring' }}
                        color="error"
                        type="icon"
                        onClick={() => {
                          setSelectedDelete(item)
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
        <FormPacklaring
          id={selectedRow?.Id}
          onClose={() => {
            setOpenForm(false)
            setSelectedRow(null)
          }}
          onSubmit={async (payload, option?: { closeAfterSave?: boolean }) => {
            try {
              const data = {
                ...payload,
                // backend pakai DateTime?
                Tanggal: payload.Tanggal ? dayjs(payload.Tanggal).format('YYYY-MM-DD') : null,
                Masuk: payload.Masuk ? dayjs(payload.Masuk).format('YYYY-MM-DD') : null,
                Keluar: payload.Keluar ? dayjs(payload.Keluar).format('YYYY-MM-DD') : null,
                Status: Number(payload.Status ?? 1),
              }

              const res = await savePacklaring(data)
              const savedId =
                res?.Data?.Id ??
                res?.data?.Id ??
                res?.Data?.id ??
                res?.data?.id ??
                res?.Id ??
                res?.id
              showSnackbar(res?.Metadata?.Message || 'Berhasil menyimpan packlaring', 'success')
              await mutate()

              if (option?.closeAfterSave) {
                setOpenForm(false)
                setSelectedRow(null)
              }

              return savedId
            } catch (err: any) {
              showSnackbar(err.message || 'Gagal menyimpan data', 'error')
            }
          }}
        />
      )}

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>Apakah Anda yakin ingin menghapus data yang dipilih?</DialogContent>
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

export default PacklaringListComponent

