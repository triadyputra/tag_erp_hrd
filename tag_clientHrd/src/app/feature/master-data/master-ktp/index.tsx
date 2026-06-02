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
  Autocomplete,
  Typography,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { IconEdit, IconId, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { deleteMasterKtp, fetchMasterKtp, saveMasterKtp } from '@/services/master-data/master-ktp.service'
import DialogUpdateNomorKtp from './DialogUpdateNomorKtp'
import { getCabang } from '@/helpers/auth.helper'
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import { useSnackbar } from '@/app/context/SnackbarContext'
import FormMasterKtp from './FormKtp'

const MasterKtpListComponent = () => {
  const { showSnackbar } = useSnackbar()

  const [openForm, setOpenForm] = useState(false)

  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [userCabang, setUserCabang] = useState<string | null>(null)

  const [inputNama, setInputNama] = useState('')
  const [inputNoktp, setInputNoktp] = useState('')
  const [inputCabang, setInputCabang] = useState('')

  const [filterNama, setFilterNama] = useState('')
  const [filterNoktp, setFilterNoktp] = useState('')
  const [filterCabang, setFilterCabang] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedRow, setSelectedRow] = useState<any>(null)
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const [openUpdateNomorDialog, setOpenUpdateNomorDialog] = useState(false)
  const [selectedUpdateNomor, setSelectedUpdateNomor] = useState<any>(null)
  
  const { data, isLoading, mutate } = useSWR(
    ['master-ktp', filterNoktp, filterNama, filterCabang, page, pageSize],
    () =>
      fetchMasterKtp({
        noktp: filterNoktp,
        namaLengkap: filterNama,
        kdCabang: filterCabang,
        page,
        pageSize,
      })
  )

  const listMasterKtp = data?.data?.Data ?? data?.Data?.data ?? data?.data?.data ?? data?.Data?.Data ?? []
  const total = data?.data?.Total ?? data?.Data?.total ?? data?.data?.total ?? data?.Data?.Total ?? 0
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
    setFilterNama(inputNama)
    setFilterNoktp(inputNoktp)
    setPage(1)
  }

  const handleConfirmDelete = async () => {
    if (!selectedDelete) return

    try {
      setLoadingDelete(true)

      await deleteMasterKtp(selectedDelete.Noktp, selectedDelete.KdCabang ?? '')

      await mutate()

      setOpenDeleteDialog(false)
      setSelectedDelete(null)

    } catch (err: any) {
      showSnackbar(err.message || 'Gagal menghapus data', 'error')
    } finally {
      setLoadingDelete(false)
    }
  }
  
  const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    fontWeight: 700,
  })

  return (
    <Box>
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
            placeholder="Cari Nama"
            size="small"
            value={inputNama}

            onChange={(e) => {
              setInputNama(e.target.value)
            }}

            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              "& .MuiOutlinedInput-root": { height: 36 },
            }}

            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{ cursor: "pointer" }}
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
        
          <TextField
            placeholder="Cari No KTP"
            size="small"
            value={inputNoktp}

            onChange={(e) => {
              setInputNoktp(e.target.value)
            }}

            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilterNoktp(inputNoktp)
                setPage(1)
              }
            }}

            onBlur={() => {
              if (inputNoktp !== filterNoktp) {
                setFilterNoktp(inputNoktp)
                setPage(1)
              }
            }}

            fullWidth
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              "& .MuiOutlinedInput-root": { height: 36 },
            }}

            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    setFilterNoktp(inputNoktp)
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
              value={
                cabangOptions?.find((c) => c.value === inputCabang) ?? null
              }
              onChange={(_, v) => {
                const val = v?.value ?? ''

                setInputCabang(val)
                setFilterCabang(val)
                setPage(1)
              }}
              fullWidth
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
              renderInput={(params) => (
                <TextField {...params} size="small" placeholder="Cabang" />
              )}
            />
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
          }}
        >
          <AccessButton
            access={{ subject: "MasterKtp", action: "SaveDataKtp" }}
            color="primary"
            variant="contained"
            onClick={() => setOpenForm(true)}
            startIcon={<AddRounded />}
          >
            Tambah
          </AccessButton>
        </Stack>

      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: "70vh", borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
              sx={(theme) => ({
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "#1e293b"
                    : "#f3f4f6",

                "& th": {
                  fontWeight: 600,
                  fontSize: 13,
                  color:
                    theme.palette.mode === "dark"
                      ? "#e2e8f0"
                      : "#374151",
                },
              })}
            >
              <TableCell sx={headerStyle}>No KTP</TableCell>
              <TableCell sx={headerStyle}>Nama Lengkap</TableCell>
              <TableCell sx={headerStyle}>Jenis Kelamin</TableCell>
              <TableCell sx={headerStyle}>Tempat, Tgl Lahir</TableCell>
              <TableCell sx={headerStyle}>Alamat</TableCell>
              <TableCell sx={headerStyle}>Cabang</TableCell>
              <TableCell sx={headerStyle}>Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : listMasterKtp.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              listMasterKtp.map((item: any, index: number) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {item.Noktp}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography>{item.NamaLengkap}</Typography>
                  </TableCell>

                  <TableCell>
                    {item.Kelamin === 'L' ? 'Laki-laki' : item.Kelamin === 'P' ? 'Perempuan' : item.Kelamin || '-'}
                  </TableCell>

                  <TableCell>
                    {item.TempatLahir}, {item.TglLahir ? new Date(item.TglLahir).toLocaleDateString('id-ID') : '-'}
                  </TableCell>

                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 250 }}>
                      {item.Alamat}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.NmCabang || item.KdCabang || '-'}
                  </TableCell>

                  <TableCell>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={0.5}
                    >

                      <Box display="flex" gap={0.5}>
                        <AccessButton
                          access={{ subject: "MasterKtp", action: "GetDetailDataKtp" }}
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
                          access={{ subject: "MasterKtp", action: "UpdateNomorKtp" }}
                          color="warning"
                          type="icon"
                          onClick={() => {
                            setSelectedUpdateNomor(item)
                            setOpenUpdateNomorDialog(true)
                          }}
                        >
                          <IconId width={18} />
                        </AccessButton>

                        <AccessButton
                          access={{ subject: "MasterKtp", action: "DeleteDataKtp" }}
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
        <FormMasterKtp
          noktp={selectedRow?.Noktp}
          onClose={() => {
            setOpenForm(false)
            setSelectedRow(null)
          }}

          onSubmit={async (payload, option?: { closeAfterSave?: boolean }) => {
            try {
              let fotoValue = payload.Foto ?? ''
              if (fotoValue && fotoValue.includes('base64,')) {
                fotoValue = fotoValue.split('base64,')[1]
              }

              const data = {
                ...payload,
                Foto: fotoValue,
              }

              const res = await saveMasterKtp(data)

              showSnackbar(res?.Metadata?.Message || 'Berhasil simpan data', 'success')

              await mutate()

              if (option?.closeAfterSave) {
                setOpenForm(false)
                setSelectedRow(null)
              }

            } catch (err: any) {
              showSnackbar(err.message || 'Gagal menyimpan data', 'error')
            }
          }}
        />
      )}
      
      <DialogUpdateNomorKtp
        open={openUpdateNomorDialog}
        row={selectedUpdateNomor}
        onClose={() => {
          setOpenUpdateNomorDialog(false)
          setSelectedUpdateNomor(null)
        }}
        onSuccess={async () => {
          showSnackbar('Nomor KTP berhasil diperbarui', 'success')
          await mutate()
        }}
      />

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

export default MasterKtpListComponent
