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
  Avatar,
} from '@mui/material'
import { IconEye, IconSearch } from '@tabler/icons-react'
import { useAccessGatedSWR } from '@/hooks/useAccessGatedSWR'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import { fetchKaryawanTetapList } from '@/services/hrd/karyawan-tetap.service'
import AccessButton from '@/app/components/buttons/AccessButton'
import DialogDetailKaryawanTetap from './DialogDetailKaryawanTetap'

function parseListPayload(data: any) {
  const payload = data?.data ?? data?.Data ?? data
  const list =
    payload?.Data ??
    payload?.data ??
    payload?.data?.Data ??
    []
  const total =
    payload?.Total ??
    payload?.total ??
    payload?.TotalCount ??
    0
  return { list, total }
}

const KaryawanTetapListComponent = () => {
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

  const [openDetail, setOpenDetail] = useState(false)
  const [selectedNoktp, setSelectedNoktp] = useState<string | null>(null)

  const { data, isLoading } = useAccessGatedSWR(
    { subject: 'KaryawanTetap', any: true },
    ['karyawan-tetap', filterNoktp, filterNama, filterCabang, page, pageSize],
    () =>
      fetchKaryawanTetapList({
        noKtp: filterNoktp,
        namaLengkap: filterNama,
        cabang: filterCabang,
        page,
        pageSize,
      })
  )

  const { list, total } = parseListPayload(data)
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
    setFilterCabang(inputCabang)
    setPage(1)
  }

  const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    fontWeight: 700,
  })

  const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const d = new Date(value)
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('id-ID')
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.2}
        mb={3}
        flexWrap="wrap"
      >
        <TextField
          placeholder="Cari Nama"
          size="small"
          value={inputNama}
          onChange={(e) => setInputNama(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
          InputProps={{
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer' }}
                onClick={handleSearch}
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
          onChange={(e) => setInputNoktp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
          InputProps={{
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer' }}
                onClick={handleSearch}
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
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Cabang" />
            )}
          />
        )}
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: '70vh', borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
              sx={(theme) => ({
                '& th': {
                  fontWeight: 600,
                  fontSize: 13,
                  color:
                    theme.palette.mode === 'dark'
                      ? '#e2e8f0'
                      : '#374151',
                },
              })}
            >
              <TableCell sx={headerStyle}>No KTP</TableCell>
              <TableCell sx={headerStyle}>NIK Sistag</TableCell>
              <TableCell sx={headerStyle}>Nama Lengkap</TableCell>
              <TableCell sx={headerStyle}>Kelamin</TableCell>
              <TableCell sx={headerStyle}>Cabang</TableCell>
              <TableCell sx={headerStyle}>Divisi / Bagian</TableCell>
              <TableCell sx={headerStyle}>Jabatan</TableCell>
              <TableCell sx={headerStyle}>Tgl Masuk</TableCell>
              <TableCell sx={headerStyle}>No SK</TableCell>
              <TableCell sx={headerStyle} align="center">
                Aksi
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, index: number) => {
                const rowNoktp = item.Noktp ?? item.NOKTP ?? ''
                const thumbFoto =
                  item.FotoBase64 ?? item.fotoBase64 ?? item.FOTO_BASE64

                return (
                <TableRow key={`${rowNoktp}-${index}`} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={thumbFoto ?? undefined}
                        sx={{ width: 36, height: 36, fontSize: 14 }}
                      >
                        {(item.NamaLengkap ?? item.NAMALENGKAP ?? '?').charAt(0)}
                      </Avatar>
                      <Typography fontWeight={600}>
                        {rowNoktp || '-'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.NikSistag ?? item.NIKSISTAG ?? '-'}</TableCell>
                  <TableCell>{item.NamaLengkap ?? item.NAMALENGKAP ?? '-'}</TableCell>
                  <TableCell>
                    {item.Kelamin === 'L'
                      ? 'Laki-laki'
                      : item.Kelamin === 'P'
                        ? 'Perempuan'
                        : item.Kelamin ?? '-'}
                  </TableCell>
                  <TableCell>{item.NmCabang ?? item.NMCABANG ?? item.KdCabang ?? '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {[item.NmDivisi, item.NmBagian]
                        .filter(Boolean)
                        .join(' / ') || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.NmJabatan ?? item.NMJABATAN ?? '-'}</TableCell>
                  <TableCell>{formatDate(item.TglMasuk ?? item.TGLMASUK)}</TableCell>
                  <TableCell>{item.NoSk ?? item.NOSK ?? '-'}</TableCell>
                  <TableCell align="center">
                    <AccessButton
                      access={{
                        subject: 'KaryawanTetap',
                        action: 'GetDetailKaryawanTetap',
                      }}
                      color="info"
                      type="icon"
                      onClick={() => {
                        setSelectedNoktp(rowNoktp)
                        setOpenDetail(true)
                      }}
                    >
                      <IconEye width={18} />
                    </AccessButton>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DialogDetailKaryawanTetap
        open={openDetail}
        noktp={selectedNoktp}
        onClose={() => {
          setOpenDetail(false)
          setSelectedNoktp(null)
        }}
      />

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
    </Box>
  )
}

export default KaryawanTetapListComponent
