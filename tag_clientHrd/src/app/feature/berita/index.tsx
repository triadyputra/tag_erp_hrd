'use client'

import React, { useState } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import { deleteBerita, fetchBerita, saveBerita } from '@/services/berita/berita.service'
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { API_BASE_URL } from '@/config/api.config'
import FormBerita from './FormBerita'

const resolveImageUrl = (gambar: string): string => {
  if (!gambar) return ''
  if (gambar.startsWith('data:')) return gambar
  if (gambar.startsWith('http')) return gambar
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${baseUrl}${gambar}`
}

const BeritaListComponent = () => {
  const { showSnackbar } = useSnackbar()

  const [openForm, setOpenForm] = useState(false)

  const [inputJudul, setInputJudul] = useState('')
  const [inputIsPinned, setInputIsPinned] = useState<boolean | undefined>(undefined)

  const [filterJudul, setFilterJudul] = useState('')
  const [filterIsPinned, setFilterIsPinned] = useState<boolean | undefined>(undefined)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedRow, setSelectedRow] = useState<any>(null)
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedDelete, setSelectedDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  
  const { data, isLoading, mutate } = useSWR(
    ['berita', filterJudul, filterIsPinned, page, pageSize],
    () =>
      fetchBerita({
        judul: filterJudul,
        isPinned: filterIsPinned,
        page,
        pageSize,
      })
  )

  const listBerita = data?.data?.Data ?? data?.Data?.data ?? data?.data?.data ?? data?.Data?.Data ?? []
  const total = data?.data?.Total ?? data?.Data?.total ?? data?.data?.total ?? data?.Data?.Total ?? 0
  const loading = isLoading && !data

  const handleSearch = () => {
    setFilterJudul(inputJudul)
    setFilterIsPinned(inputIsPinned)
    setPage(1)
  }

  const handleConfirmDelete = async () => {
    if (!selectedDelete) return

    try {
      setLoadingDelete(true)

      await deleteBerita(selectedDelete.Id)

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
            placeholder="Cari Judul Berita"
            size="small"
            value={inputJudul}

            onChange={(e) => {
              setInputJudul(e.target.value)
            }}

            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilterJudul(inputJudul)
                setPage(1)
              }
            }}

            onBlur={() => {
              if (inputJudul !== filterJudul) {
                setFilterJudul(inputJudul)
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
                    setFilterJudul(inputJudul)
                    setPage(1)
                  }}
                >
                  <IconSearch size={16} />
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={inputIsPinned === true}
                onChange={(e) => {
                  setInputIsPinned(e.target.checked ? true : undefined)
                  setFilterIsPinned(e.target.checked ? true : undefined)
                  setPage(1)
                }}
              />
            }
            label="Hanya Pinned"
            sx={{ ml: 0 }}
          />
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
            access={{ subject: "Berita", action: "SaveBerita" }}
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
              <TableCell sx={headerStyle}>Gambar</TableCell>
              <TableCell sx={headerStyle}>Judul</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
              <TableCell sx={headerStyle}>Pinned</TableCell>
              <TableCell sx={headerStyle}>Tanggal</TableCell>
              <TableCell sx={headerStyle}>Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : listBerita.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              listBerita.map((item: any, index: number) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {item.Gambar ? (
                      <Box
                        component="img"
                        src={resolveImageUrl(item.Gambar)}
                        alt={item.Judul}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">No Img</Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={600} noWrap sx={{ maxWidth: 250 }}>
                      {item.Judul}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.Status === 1 ? (
                      <Chip label="Publish" color="success" size="small" />
                    ) : (
                      <Chip label="Draft" color="warning" variant="outlined" size="small" />
                    )}
                  </TableCell>

                  <TableCell>
                    {item.IsPinned ? (
                      <Chip label="Pinned" color="primary" size="small" variant="outlined" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {item.CreatedAt ? new Date(item.CreatedAt).toLocaleDateString('id-ID') : '-'}
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
                          access={{ subject: "Berita", action: "GetDetailBerita" }}
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
                          access={{ subject: "Berita", action: "DeleteBerita" }}
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
        <FormBerita
          id={selectedRow?.Id}
          onClose={() => {
            setOpenForm(false)
            setSelectedRow(null)
          }}

          onSubmit={async (payload, option?: { closeAfterSave?: boolean }) => {
            try {
              let gambarValue = payload.Gambar ?? ''

              if (gambarValue.startsWith('data:')) {
                gambarValue = gambarValue.split('base64,')[1]
              }

              const data = {
                ...payload,
                Gambar: gambarValue,
              }

              const res = await saveBerita(data)

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
      
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>Apakah Anda yakin ingin menghapus berita ini?</DialogContent>
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

export default BeritaListComponent
