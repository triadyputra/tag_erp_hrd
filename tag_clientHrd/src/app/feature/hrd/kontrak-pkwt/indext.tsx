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
  Chip,
  TableContainer,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material'
import { IconCircleCheck, IconEdit, IconFilter, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import { useComboCabangWith, useComboVendorByNama } from '@/hooks/useComboGroup'
import { approveKontrakPkwt, deleteKontrakPkwt, fetchKontrakPkwt, saveKontrakPkwt } from '@/services/hrd/kontrak-pkwt.service'
import { formatDate } from '@/utils/format'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import FormKontrakKaryawan from './FormKontrakKaryawan'
import { getCabang } from '@/helpers/auth.helper'
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import { useSnackbar } from '@/app/context/SnackbarContext'

const KontrakPkwtListComponent = () => {
  const { showSnackbar } = useSnackbar();
  const { cabang: cabangOptions, loading: cabangLoading  } = useComboCabangWith()
  const { vendor: vendorOptions } = useComboVendorByNama()

  const today = dayjs().format('YYYY-MM-DD');

  const [openForm, setOpenForm] = useState(false)

  const [userCabang, setUserCabang] = useState<string | null>(null)

  // ================= INPUT =================
  const [inputNama, setInputNama] = useState('')
  const [inputCabang, setInputCabang] = useState('')
  const [inputPerusahaan, setInputPerusahaan] = useState('')
  const [inputStatusTtd, setInputStatusTtd] = useState('')
  const [inputTglAwal, setInputTglAwal] = useState<string | null>(today);
  const [inputTglAkhir, setInputTglAkhir] = useState<string | null>(today);

  // ================= FILTER =================
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterPerusahaan, setFilterPerusahaan] = useState('')
  const [filterStatusTtd, setFilterStatusTtd] = useState('')
  const [filterTglAwal, setFilterTglAwal] = useState<string | null>(today);
  const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today);
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedRow, setSelectedRow] = useState<any>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [selectedApprove, setSelectedApprove] = useState<any>(null);
  const [loadingApprove, setLoadingApprove] = useState(false);

  const parseStatusTtdFilter = (value: string): number | null => {
    if (value === '' || value === undefined) return null
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }

  const { data, isLoading, mutate } = useSWR(
    ['pkwt', filterNama, filterCabang, filterPerusahaan, filterStatusTtd, filterTglAwal, filterTglAkhir, page, pageSize],
    () =>
      fetchKontrakPkwt({
        namaKaryawan: filterNama,
        cabang: filterCabang,
        perusahaan: filterPerusahaan,
        statusTtd: parseStatusTtdFilter(filterStatusTtd),
        tglAwal: filterTglAwal ?? '',
        tglAkhir: filterTglAkhir ?? '',
        page,
        pageSize,
      })
  )

  const ttdStatusOptions = [
    { title: 'Semua', value: '' },
    { title: 'Draft', value: '0' },
    { title: 'TTD', value: '1' },
    { title: 'Approved', value: '2' },
  ]

  const list = data?.Data ?? []
  const total = data?.TotalCount ?? 0
  const loading = isLoading && !data

  useEffect(() => {
    const cab = getCabang()

    if (cab && cab.trim() !== "") {
      setUserCabang(cab)

      // 🔥 auto set filter
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const getTtdStatusLabel = (status?: number | null) => {
    if (status === 2) return { label: 'Approved', color: 'success' as const }
    if (status === 1) return { label: 'TTD', color: 'info' as const }
    // Draft: ttd = 0 atau NULL
    return { label: 'Draft', color: 'default' as const }
  }

  // ================= APPROVE =================
  const handleConfirmApprove = async () => {
    if (!selectedApprove?.NOKONTRAK) return

    try {
      setLoadingApprove(true)
      await approveKontrakPkwt(selectedApprove.NOKONTRAK)
      await mutate()
      showSnackbar('Kontrak berhasil di-approve', 'success')
      setOpenApproveDialog(false)
      setSelectedApprove(null)
    } catch (err: any) {
      showSnackbar(err.message || 'Gagal approve kontrak', 'error')
    } finally {
      setLoadingApprove(false)
    }
  }

  // ================= HAPUS =================
  const handleConfirmDelete = async () => {
    if (!selectedDelete) return;

    try {
      setLoadingDelete(true);

      await deleteKontrakPkwt(
        selectedDelete.NOKONTRAK,
        selectedDelete.NOKTP
      );

      // 🔥 refresh data
      await mutate();

      // 🔥 reset
      setOpenDeleteDialog(false);
      setSelectedDelete(null);

    } catch (err: any) {
      showSnackbar(err.message || 'Gagal menghapus data', 'error');
    } finally {
      setLoadingDelete(false);
    }
  };

  const applyAllFilters = () => {
    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setFilterPerusahaan(inputPerusahaan)
    setFilterStatusTtd(inputStatusTtd)
    setFilterTglAwal(inputTglAwal)
    setFilterTglAkhir(inputTglAkhir)
    setPage(1)
    return true
  }

  const resetAllFilters = () => {
    const cab = userCabang ?? ''

    setInputNama('')
    setInputCabang(cab)
    setInputPerusahaan('')
    setInputStatusTtd('')
    setInputTglAwal(today)
    setInputTglAkhir(today)

    setFilterNama('')
    setFilterCabang(cab)
    setFilterPerusahaan('')
    setFilterStatusTtd('')
    setFilterTglAwal(today)
    setFilterTglAkhir(today)
    setPage(1)
  }

  const advancedFilterCount = [filterPerusahaan, filterStatusTtd].filter(Boolean).length

  // ================= ACTION =================
  const handleSearch = () => {
    applyAllFilters()
  }

  const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.palette.divider}`
  })

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

        {/* ================= LEFT: FILTER ================= */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >

          {/* ================= NAMA ================= */}
          <TextField
            placeholder="Cari Nama Karyawan"
            size="small"
            value={inputNama}

            // ✅ update state saat ketik
            onChange={(e) => {
              setInputNama(e.target.value)
            }}

            // ✅ desktop (Enter)
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setFilterNama(inputNama)
                setPage(1)
              }
            }}

            // ✅ mobile (blur / selesai input)
            onBlur={() => {
              if (inputNama !== filterNama) { // 🔥 biar tidak double trigger
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

		      {/* ================= CABANG ================= */}
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
		  
          {/* ================= DATE RANGE ================= */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }} // ✅ mobile turun
              spacing={1}
              sx={{
                width: { xs: '100%', sm: 'auto' }, // 🔥 penting
              }}
            >

              {/* ================= TANGGAL AWAL ================= */}
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
                    placeholder: "Tanggal Awal",
                    sx: {
                      minWidth: 200, // 🔥 biar tidak kepotong
                      "& .MuiOutlinedInput-root": {
                        height: 36,
                      },
                    },

                    InputProps: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {/* CLEAR */}
                          {inputTglAwal && (
                            <InputAdornment
                              position="end"
                              sx={{ cursor: "pointer", mr: 0.5 }}
                              onClick={() => {
                                setInputTglAwal(null)
                                setFilterTglAwal(null)
                                setPage(1)
                              }}
                            >
                              ✕
                            </InputAdornment>
                          )}

                          {/* ICON CALENDAR */}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }),

                  actionBar: {
                    actions: ['clear', 'today'],
                  },
                }}
              />

              {/* ================= TANGGAL AKHIR ================= */}
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
                    placeholder: "Tanggal Akhir",
                    sx: {
                      minWidth: 200, // 🔥 samakan
                      "& .MuiOutlinedInput-root": {
                        height: 36,
                      },
                    },

                    InputProps: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {/* CLEAR */}
                          {inputTglAkhir && (
                            <InputAdornment
                              position="end"
                              sx={{ cursor: "pointer", mr: 0.5 }}
                              onClick={() => {
                                setInputTglAkhir(null)
                                setFilterTglAkhir(null)
                                setPage(1)
                              }}
                            >
                              ✕
                            </InputAdornment>
                          )}

                          {/* ICON CALENDAR */}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }),

                  actionBar: {
                    actions: ['clear', 'today'],
                  },
                }}
              />

            </Stack>
          </LocalizationProvider>

        </Stack>

        {/* ================= RIGHT: BUTTON ================= */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
          }}
        >
          <Badge
            color="primary"
            badgeContent={advancedFilterCount}
            invisible={advancedFilterCount === 0}
          >
            <Button
              variant="outlined"
              startIcon={<IconFilter size={18} />}
              onClick={() => setFilterModalOpen(true)}
              sx={{ height: 36, whiteSpace: 'nowrap' }}
            >
              Filter
            </Button>
          </Badge>

          <AccessButton
            access={{ subject: "KontrakPkwt", action: "SaveEditKontrakPkwt" }}
            color="primary"
            variant="contained"
            onClick={() => setOpenForm(true)}
            startIcon={<AddRounded />}
          >
            Tambah
          </AccessButton>
        </Stack>

      </Stack>

      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Filter Lanjutan</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={0.5}>
            <Autocomplete
              options={vendorOptions ?? []}
              getOptionLabel={(o) => o.title ?? ''}
              value={
                vendorOptions?.find((c) => c.value === inputPerusahaan) ?? null
              }
              isOptionEqualToValue={(o, v) => o.value === v.value}
              onChange={(_, v) => setInputPerusahaan(v?.value ?? '')}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Perusahaan" placeholder="Pilih perusahaan" />
              )}
            />

            <Autocomplete
              options={ttdStatusOptions}
              getOptionLabel={(o) => o.title}
              value={ttdStatusOptions.find((c) => c.value === inputStatusTtd) ?? ttdStatusOptions[0]}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              onChange={(_, v) => setInputStatusTtd(v?.value ?? '')}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Status TTD" />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button
            color="inherit"
            onClick={() => {
              setInputPerusahaan('')
              setInputStatusTtd('')
            }}
          >
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
              applyAllFilters()
              setFilterModalOpen(false)
            }}
          >
            Terapkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= TABLE ================= */}
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
              <TableCell sx={headerStyle}>Kontrak</TableCell>
              <TableCell sx={headerStyle}>Karyawan</TableCell>
              <TableCell sx={headerStyle}>Alamat</TableCell>
              <TableCell sx={headerStyle}>Divisi</TableCell>
              <TableCell sx={headerStyle}>Periode</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data kontrak PKWT...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, i: number) => {
                const sisaHari = item.PAKHIR
                  ? dayjs(item.PAKHIR).diff(dayjs(), 'day')
                  : null

                return (
                  <TableRow key={i} 
                    hover
										sx={{
											transition: "all 0.2s ease",
											borderBottom: "1px solid #f1f5f9",

											"&:hover": {
												backgroundColor: "#f1f5f9",
											},

											"&:nth-of-type(odd)": {
												backgroundColor: "rgba(0,0,0,0.02)",
											},
										}}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Stack spacing={0.5}>
                        
                        {/* NO KONTRAK */}
                        <Typography fontWeight={700} fontSize={13}>
                          {item.NOKONTRAK}
                        </Typography>

                        {/* META INFO */}
                        <Typography variant="caption" color="text.secondary">
                          Input: {formatDate(item.TGLINPUT)}
                        </Typography>

                        {/* VALID USER (dipisah & dirapikan) */}
                        {item.VALIDUSER && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>Valid:</span>

                            {/* USER */}
                            <span>{item.VALIDUSER.split(" ")[0]}</span>

                            {/* TANGGAL */}
                            <span>
                              {item.VALIDUSER.split(" ").slice(1).join(" ")}
                            </span>
                          </Typography>
                        )}

                      </Stack>
                    </TableCell>
                    
                    <TableCell sx={{ py: 2 }}>
                      <Stack spacing={0.4}>
                        
                        {/* NAMA */}
                        <Typography fontWeight={600}>
                          {item.NMKARYAWAN}
                        </Typography>

                        {/* IDENTITAS */}
                        <Typography variant="caption" color="text.secondary">
                          NIK: {item.NIKSISTAG} • KTP: {item.NOKTP}
                        </Typography>

                        {/* DATA PERSONAL */}
                        <Typography variant="caption" color="text.secondary">
                          {item.KELAMIN} • {item.TEMPATLAHIR}, {formatDate(item.TGLLAHIR)}
                        </Typography>

                      </Stack>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "text.secondary",
                        }}
                      >
                        {item.ALAMAT}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Stack spacing={0.3}>
                        
                        {/* DIVISI */}
                        <Typography fontWeight={600}>
                          {item.NMDIVISI}
                        </Typography>

                        {/* BAGIAN + JABATAN */}
                        <Typography variant="caption" color="text.secondary">
                          {item.NMBAGIAN} • {item.NMJABATAN}
                        </Typography>

                        {/* CABANG (baris baru & dibedakan sedikit) */}
                        <Box mt={1.5}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            {item.NMCABANG}
                          </Typography>
                        </Box>

                      </Stack>
                    </TableCell>

                   <TableCell sx={{ py: 2 }}>
                      <Stack spacing={0.3}>
                        
                        {/* PERIODE */}
                        <Typography variant="body2" fontWeight={500}>
                          {formatDate(item.PAWAL)} - {formatDate(item.PAKHIR)}
                        </Typography>

                        {/* INFO SISA HARI */}
                        {item.PAKHIR && (
                          <Typography
                            variant="caption"
                            sx={{
                              color:
                                dayjs(item.PAKHIR).diff(dayjs(), "day") < 0
                                  ? "error.main"
                                  : dayjs(item.PAKHIR).diff(dayjs(), "day") <= 30
                                  ? "warning.main"
                                  : "text.secondary",
                              fontWeight: 500,
                            }}
                          >
                            {(() => {
                              const sisa = dayjs(item.PAKHIR).diff(dayjs(), "day")
                              if (sisa < 0) return "Expired"
                              return `${sisa} hari lagi`
                            })()}
                          </Typography>
                        )}

                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={0.5}
                      >
                        {/* ================= STATUS ================= */}
                        <Chip
                          label={
                            sisaHari === null
                              ? "-"
                              : sisaHari < 0
                              ? "Expired"
                              : `${sisaHari} hari`
                          }
                          color={
                            sisaHari === null
                              ? "default"
                              : sisaHari < 0
                              ? "error"
                              : sisaHari <= 30
                              ? "warning"
                              : "success"
                          }
                          size="small"
                        />
                        <Chip
                          label={getTtdStatusLabel(item.Status).label}
                          color={getTtdStatusLabel(item.Status).color}
                          size="small"
                          variant="outlined"
                        />

                        {/* ================= ACTION ================= */}
                        <Box display="flex" gap={0.5}>
                          {item.Status === 1 && (
                            <AccessButton
                              access={{ subject: "KontrakPkwt", action: "ApproveKontrakPkwt" }}
                              color="primary"
                              type="icon"
                              onClick={() => {
                                setSelectedApprove(item)
                                setOpenApproveDialog(true)
                              }}
                            >
                              <IconCircleCheck width={18} />
                            </AccessButton>
                          )}

                          <AccessButton
                            access={{ subject: "KontrakPkwt", action: "GetDetailKontrakPkwt" }}
                            color="success"
                            type="icon"
                            onClick={() => {
                              setSelectedRow(item);
                              setOpenForm(true);
                            }}
                          >
                            <IconEdit width={18} />
                          </AccessButton>

                          <AccessButton
                            access={{ subject: "KontrakPkwt", action: "DeleteKontrakPkwt" }}
                            color="error"
                            type="icon"
                            onClick={() => {
                              setSelectedDelete(item); // 🔥 simpan data
                              setOpenDeleteDialog(true);
                            }}
                          >
                            <IconTrash width={18} />
                          </AccessButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
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
        <FormKontrakKaryawan
          noKontrak={selectedRow?.NOKONTRAK} // 🔥 ini penting
          onClose={() => {
            setOpenForm(false)
            setSelectedRow(null) // 🔥 penting biar tidak nyangkut
          }}
          onSubmit={async (payload, option?: { closeAfterSave?: boolean }) => {
            try {
              // 🔥 mapping + normalisasi data
              const data = {
                ...payload,

                // ======================
                // FORMAT DATE (WAJIB)
                // ======================
                TGLMASUK: payload.TGLMASUK
                  ? dayjs(payload.TGLMASUK).format("YYYY-MM-DD")
                  : null,

                TGLINPUT: payload.TGLINPUT
                  ? dayjs(payload.TGLINPUT).format("YYYY-MM-DD")
                  : null,

                PAWAL: payload.PAWAL
                  ? dayjs(payload.PAWAL).format("YYYY-MM-DD")
                  : null,

                PAKHIR: payload.PAKHIR
                  ? dayjs(payload.PAKHIR).format("YYYY-MM-DD")
                  : null,

                // ======================
                // NULL HANDLING
                // ======================
                KDCABANG: payload.KDCABANG || null,
                KDDIVISI: payload.KDDIVISI || null,
                KDBAGIAN: payload.KDBAGIAN || null,
                KDSUBBAGIAN: payload.KDSUBBAGIAN || null,
                KDJABATAN: payload.KDJABATAN || null,

                // ======================
                // KONTRAK (EDIT vs INSERT)
                // ======================
                NOKONTRAK: payload.NOKONTRAK || "",

                // ======================
                // FOTO (kalau ada)
                // ======================
                FOTO_BASE64: payload.FOTO_BASE64 || null,
              }

              // 🔥 CALL API
              const res = await saveKontrakPkwt(data)

              console.log("SUCCESS:", res)
              showSnackbar(res.Metadata?.Message || 'Berhasil menyimpan data', 'success');

              // 🔥 UPDATE SELECTED ROW DENGAN RESPON API
              if (res?.Data?.NoKontrak) {
                setSelectedRow((prev: any) => ({
                  ...prev,
                  NOKONTRAK: res.Data.NoKontrak,
                  NIKSISTAG: res.Data.Niksistag ?? prev?.NIKSISTAG,
                }))
              }

              await mutate()

              // 🔥 FIX DISINI SAJA
              if (option?.closeAfterSave) {
                setOpenForm(false)
                setSelectedRow(null)
              }

            } catch (err: any) {
              // console.error(err)
              // alert(err.message || "Gagal menyimpan data")
              showSnackbar(err.message || 'Gagal menghapus data', 'error');
            }
          }}
        />
      )}

      <Dialog open={openApproveDialog} onClose={() => !loadingApprove && setOpenApproveDialog(false)}>
        <DialogTitle>Konfirmasi Approve</DialogTitle>
        <DialogContent>
          Approve kontrak <strong>{selectedApprove?.NOKONTRAK}</strong> untuk{' '}
          <strong>{selectedApprove?.NMKARYAWAN}</strong>? Status TTD akan diubah menjadi Approved.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)} disabled={loadingApprove}>
            Batal
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={handleConfirmApprove}
            disabled={loadingApprove}
          >
            {loadingApprove ? 'Memproses...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>Apakah Anda yakin ingin menghapus data yang dipilih?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default KontrakPkwtListComponent