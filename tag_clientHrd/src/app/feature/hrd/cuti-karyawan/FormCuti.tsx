'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  DialogActions,
  Stack,
  InputAdornment,
  Tooltip,
	Autocomplete,
} from '@mui/material'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { IconDeviceFloppy } from '@tabler/icons-react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { getDetailMasterKtp, getDetailPegawaiWithKontrakNik, getFilterMasterKtp, useComboBagian, useComboDivisi, useComboJabatan, useComboSubBagian } from '@/hooks/useComboGroup'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { fetchDetailCuti, getDetailCutiKaryawan } from '@/services/hrd/cuti-karyawan.service'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

interface FormCutiKaryawanDto {
  NoCuti?: string
  Tanggal: string
  NikKaryawan: string
  NmKaryawan: string
  KdDivisi: string
  NmDivisi: string
  KdBagian: string
  NmBagian: string
  KdSubBagian: string
  NmSubBagian: string
  KdJabatan: string
  NmJabatan: string
  Alamat: string
  Telepon: string
  JnsCuti: string
  JmlHari: number
  Keperluan: string
  Catatan: string
  HakCuti: number
  Terpakai: number
  SisaCuti: number
  KdCabang: string
  ValidUser: string
	NoKtp?:string
  DetailTanggal: string[]
}

interface Props {
  noCuti?: string
  onClose: () => void
  onSubmit: (
    payload: FormCutiKaryawanDto,
    option?: { closeAfterSave?: boolean }
  ) => Promise<void>
}

const defaultValues: FormCutiKaryawanDto = {
  NoCuti: '',
  Tanggal: dayjs().format('YYYY-MM-DD'),
  NikKaryawan: '',
  NmKaryawan: '',
  KdDivisi: '',
  NmDivisi: '',
  KdBagian: '',
  NmBagian: '',
  KdSubBagian: '',
  NmSubBagian: '',
  KdJabatan: '',
  NmJabatan: '',
  Alamat: '',
  Telepon: '',
  JnsCuti: '',
  JmlHari: 0,
  Keperluan: '',
  Catatan: '',
  HakCuti: 0,
  Terpakai: 0,
  SisaCuti: 0,
  KdCabang: '',
  ValidUser: '',
  DetailTanggal: [],
}

const FormCutiKaryawan: React.FC<Props> = ({
  noCuti,
  onClose,
  onSubmit,
}) => {
  const { showSnackbar } = useSnackbar()

  const [values, setValues] = useState<FormCutiKaryawanDto>(defaultValues)
  const [loading, setLoading] = useState(false)

	const { data: divisiOptions, loading: loadingDivisi } = useComboDivisi();
	const { data: bagianOptions, loading: bagianLoading } = useComboBagian(values.KdDivisi);
	const { data: subBagianOptions, loading: subLoading } = useComboSubBagian(values.KdBagian);
	const { data: jabatanOptions, loading: loadingJabatan } = useComboJabatan();
	
  const isEdit = !!noCuti

  // ================= SEARCH =================
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<any[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  // ================= DETAIL =================
  const [detail, setDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ================= VALIDATION =================
  const [errors, setErrors] = useState<any>({})

	const jenisCutiOptions = [
		{ value: "CUTI RENCANA", label: "CUTI RENCANA" },
		{ value: "CUTI PERISTIWA", label: "CUTI PERISTIWA" }
	]

  // ================= LOAD EDIT =================
  useEffect(() => {
    if (!noCuti) return

    const load = async () => {
      try {
        setLoadingDetail(true)

        const raw = await fetchDetailCuti(noCuti)
        const res = raw?.Data ?? raw

        const data: FormCutiKaryawanDto = {
          NoCuti: res.NoCuti ?? '',
          Tanggal: res.Tanggal?.substring(0, 10) || '',
          NikKaryawan: res.NikKaryawan ?? '',
          NmKaryawan: res.NmKaryawan ?? '',
          KdDivisi: res.KdDivisi ?? '',
          NmDivisi: res.NmDivisi ?? '',
          KdBagian: res.KdBagian ?? '',
          NmBagian: res.NmBagian ?? '',
          KdSubBagian: res.KdSubBagian ?? '',
          NmSubBagian: res.NmSubBagian ?? '',
          KdJabatan: res.KdJabatan ?? '',
          NmJabatan: res.NmJabatan ?? '',
          Alamat: res.Alamat ?? '',
          Telepon: res.Telepon ?? '',
          JnsCuti: res.JnsCuti ?? '',
          JmlHari: Number(res.JmlHari ?? 0),
          Keperluan: res.Keperluan ?? '',
          Catatan: res.Catatan ?? '',
          HakCuti: Number(res.HakCuti ?? 0),
          Terpakai: Number(res.Terpakai ?? 0),
          SisaCuti: Number(res.SisaCuti ?? 0),
          KdCabang: res.KdCabang ?? '',
          ValidUser: res.ValidUser ?? '',
          DetailTanggal: Array.isArray(res.DetailTanggal)
            ? res.DetailTanggal.map((x: any) =>
                typeof x === 'string'
                  ? x.substring(0, 10)
                  : dayjs(x).format('YYYY-MM-DD')
              )
            : [],
        }

        setValues(data)

        setSelected({
          NIKSISTAG: res.NikKaryawan,
          NAMALENGKAP: res.NmKaryawan,
        })

        setKeyword(res.NmKaryawan || '')
        setDetail(res)
      } catch (err: any) {
        console.error(err)
        showSnackbar(err?.message || 'Gagal mengambil detail cuti', 'error')
      } finally {
        setLoadingDetail(false)
      }
    }

    load()
  }, [noCuti, showSnackbar])

  // ================= SEARCH KARYAWAN =================
  useEffect(() => {
    if (isEdit) return
    if (selected) return

    if (!keyword) {
      setList([])
      setShowDropdown(false)
      return
    }

    let active = true
    setLoadingSearch(true)
    setShowDropdown(true)

    const timeout = setTimeout(async () => {
      try {
        if (keyword.length < 3) {
          setList([])
          return
        }

        const res = await getFilterMasterKtp(keyword)

        if (active) setList(res || [])
      } catch (err) {
        console.error(err)
        if (active) setList([])
      } finally {
        if (active) setLoadingSearch(false)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [keyword, selected, isEdit])

  // ================= CLOSE DROPDOWN =================
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false)
    window.addEventListener('click', handleClickOutside)

    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // ================= AUTO HITUNG SISA CUTI =================
  useEffect(() => {
    const hak = Number(values.HakCuti || 0)
    const pakai = Number(values.Terpakai || 0)

    setValues((prev) => ({
      ...prev,
      SisaCuti: hak - pakai,
    }))
  }, [values.HakCuti, values.Terpakai])

 const handleSelect = async (item: any) => {
  try {
    if (loadingDetail) return

    setSelected(item)
    setKeyword(item.NAMALENGKAP)
    setShowDropdown(false)
    setLoadingDetail(true)

    const tahun = new Date().getFullYear()

    const resKtpRaw = await getDetailMasterKtp(item.NOKTP)

    const resKtp = resKtpRaw?.Data ?? resKtpRaw
    const nikSistem = String(
      resKtp?.NIKSISTAG ?? resKtp?.NikSistag ?? resKtp?.nikSistag ?? ''
    ).trim()
    if (!nikSistem) {
      throw new Error('Karyawan sudah keluar')
    }

    let k: any = {}
    try {
      const rawPegawai = await getDetailPegawaiWithKontrakNik(nikSistem)
      k = rawPegawai?.Data ?? rawPegawai ?? {}
    } catch {
      throw new Error('Karyawan sudah keluar')
    }

    if (!k || Object.keys(k).length === 0) {
      throw new Error('Karyawan sudah keluar')
    }
    let summary: any = {}
    try {
      const resCuti = await getDetailCutiKaryawan(item.NOKTP, tahun)
      summary = resCuti?.Summary || {}
    } catch {
      // Beberapa data lama melempar "Data karyawan tidak ditemukan dari NOKTP" di endpoint cuti.
      // Jangan gagalkan pemilihan karyawan, cukup default-kan saldo ke 0.
      summary = {}
    }

    setValues((prev) => ({
      ...prev,

      // ========================
      // DATA KARYAWAN
      // ========================
      NikKaryawan: k.NikSistag ?? k.nikSistag ?? nikSistem,
      NmKaryawan: k.NmKaryawan ?? k.nmKaryawan ?? resKtp.NMKARYAWAN ?? item.NAMALENGKAP ?? '',
      KdDivisi: k.KdDivisi ?? k.kdDivisi ?? resKtp.KDDIVISI ?? '',
      NmDivisi: k.NmDivisi ?? k.nmDivisi ?? resKtp.NMDIVISI ?? '',
      KdBagian: k.KdBagian ?? k.kdBagian ?? resKtp.KDBAGIAN ?? '',
      NmBagian: k.NmBagian ?? k.nmBagian ?? resKtp.NMBAGIAN ?? '',
      KdSubBagian: k.KdSubBagian ?? k.kdSubBagian ?? resKtp.KDSUBBAGIAN ?? '',
      NmSubBagian: k.NmSubBagian ?? k.nmSubBagian ?? resKtp.NMSUBBAGIAN ?? '',
      KdJabatan: k.KdJabatan ?? k.kdJabatan ?? resKtp.KDJABATAN ?? '',
      NmJabatan: k.NmJabatan ?? k.nmJabatan ?? resKtp.NMJABATAN ?? '',
      Alamat: k.AlamatTinggal ?? k.alamatTinggal ?? k.AlamatKtp ?? k.alamatKtp ?? resKtp.ALAMAT ?? '',
      Telepon: resKtp.NOHANDPHONE ?? '',
      KdCabang: k.KdCabang ?? k.kdCabang ?? resKtp.KDCABANG ?? '',
      NoKtp: k.NoKtp ?? k.noKtp ?? resKtp.NOKTP ?? item.NOKTP ?? '',

      // ========================
      // SALDO CUTI (FIXED)
      // ========================
      HakCuti: Number(summary.Saldo ?? 0),
      Terpakai: Number(summary.Terpakai ?? 0),
      SisaCuti: Number(summary.Sisa ?? 0),
    }))

    // setDetail({
    //   ...resKtp,
    //   DetailCuti: resCuti.Detail // optional kalau mau dipakai
    // })

  } catch (err: any) {
    showSnackbar(err.message || 'Gagal mengambil data', 'error')
  } finally {
    setLoadingDetail(false)
  }
}

  const handleChange = (field: string) => (e: any) => {
    const value = e?.target?.value

    setValues((prev: any) => ({
      ...prev,
      [field]: ['JmlHari', 'HakCuti', 'Terpakai'].includes(field)
        ? Number(value || 0)
        : value,
    }))
  }

  const setField = (field: string) => (e: any) => {
    handleChange(field)(e)

    setErrors((prev: any) => ({
      ...prev,
      [field]: '',
    }))
  }

  const handleSubmit = async (e?: any, closeAfterSave = false) => {
    e?.preventDefault?.()

    const err: any = {}

    if (values.JmlHari > values.SisaCuti) {
      err.JmlHari = "Jumlah cuti melebihi saldo"
    }

    if (!values.NikKaryawan) err.NikKaryawan = 'Karyawan wajib dipilih'
    if (!values.Tanggal || !dayjs(values.Tanggal).isValid()) {
      err.Tanggal = 'Tanggal wajib diisi'
    }
    if (!values.JnsCuti) err.JnsCuti = 'Jenis cuti wajib diisi'
    if (!values.JmlHari || Number(values.JmlHari) <= 0) {
      err.JmlHari = 'Jumlah hari wajib lebih dari 0'
    }
    if (!values.Keperluan) err.Keperluan = 'Keperluan wajib diisi'

    setErrors(err)
    if (Object.keys(err).length > 0) return

    setLoading(true)
    try {
      await onSubmit(values, { closeAfterSave })

      // 🔥 TAMBAH INI
      if (closeAfterSave) {
        onClose?.()   // atau setOpen(false)
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
        onClose()
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(0,0,0,0.2)',
        },
      }}
    >
      <DialogHeader
        title={isEdit ? 'Edit Cuti Karyawan' : 'Tambah Cuti Karyawan'}
        subtitle="Pengisian dan pengelolaan informasi cuti karyawan"
        statusLabel={isEdit ? 'EDIT' : 'CREATE'}
        statusColor={isEdit ? 'info' : 'warning'}
      />

      <Divider />

      {loadingDetail && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            backgroundColor: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <CircularProgress />
            <Typography fontSize={12}>Mengambil data...</Typography>
          </Stack>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ position: 'relative' }}>
          <Grid container spacing={3}>
            {/* ================= LEFT ================= */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Data Karyawan"
                subtitle="Data identitas dan informasi dasar karyawan"
              />

              <Stack spacing={1.5}>
                <Box position="relative" onClick={(e) => e.stopPropagation()}>
                  <Box
                    onClick={() => {
                      if (!selected && !isEdit) setShowDropdown(true)
                    }}
                    sx={(theme) => ({
                      p: 1,
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: selected || isEdit ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: selected || isEdit
                          ? theme.palette.divider
                          : theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                      ...(selected && { opacity: 0.9 }),
                    })}
                  >
                    <Box>
                      <Typography fontSize={12} color="text.secondary">
                        Nama Karyawan
                      </Typography>

                      <Typography fontSize={14} fontWeight={600}>
                        {loadingDetail
                          ? 'Mengambil data...'
                          : (keyword || 'Pilih Karyawan')}
                      </Typography>
                    </Box>

                    {selected && !isEdit && (
                      <Box
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(null)
                          setKeyword('')
                          setValues(defaultValues)
                          setDetail(null)
                          setErrors({})
                        }}
                        sx={{
                          fontSize: 16,
                          px: 1,
                          cursor: 'pointer',
                          color: '#9ca3af',
                          '&:hover': { color: '#ef4444' },
                        }}
                      >
                        ✕
                      </Box>
                    )}
                  </Box>

                  {showDropdown && !selected && !isEdit && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        bgcolor: 'background.paper',
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        mt: 1,
                        zIndex: 10,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Box p={1}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Cari nama karyawan..."
                          autoFocus
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                        />
                      </Box>

                      <Box maxHeight={220} overflow="auto">
                        {loadingSearch ? (
                          <Box p={2} textAlign="center">
                            <CircularProgress size={20} />
                          </Box>
                        ) : keyword.length < 3 ? (
                          <Box p={2}>
                            <Typography fontSize={12} color="text.secondary">
                              Ketik minimal 3 huruf...
                            </Typography>
                          </Box>
                        ) : list.length === 0 ? (
                          <Box p={2}>
                            <Typography fontSize={13}>Data tidak ditemukan</Typography>
                          </Box>
                        ) : (
                          list.map((item, i) => (
                            <Box
                              key={i}
                              onClick={() => handleSelect(item)}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                transition: '0.2s',
                                '&:hover': {
                                  bgcolor: '#f9fafb',
                                },
                              }}
                            >
                              <Typography fontWeight={600} fontSize={13}>
                                {item.NAMALENGKAP}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {item.KELAMIN || '-'}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  color: '#64748b',
                                  display: 'block',
                                }}
                              >
                                {item.NOKTP} • {item.KDCABANG}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  color: '#94a3b8',
                                  display: 'block',
                                  mt: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.ALAMAT}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {!!errors.NikKaryawan && (
                  <Typography fontSize={12} color="error">
                    {errors.NikKaryawan}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  size="small"
                  label="NIK Karyawan"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.NikKaryawan ?? ''}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Nama Karyawan"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.NmKaryawan ?? ''}
                  sx={inputCompactStyle}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
										<Autocomplete
											options={divisiOptions ?? []}
											loading={loadingDivisi}
											getOptionLabel={(o) => o.title ?? ""}
											value={
												divisiOptions?.find((c) => c.value === values.KdDivisi) ?? null
											}
											onChange={(_, v) => {
												setValues((prev: any) => ({
													...prev,
													KdDivisi: v?.value ?? "",
													NmDivisi: v?.title ?? "",
													KdBagian: "",
													KdSubBagian: "",
												}));

												// 🔥 reset error
												setErrors((prev: any) => ({
													...prev,
													KdDivisi: "",
												}));
											}}
											isOptionEqualToValue={(o, v) => o.value === v.value}
											fullWidth
											renderInput={(params) => (
												<TextField
													{...params}
													size="small"
													label={
														<span>
															Divisi <span style={{ color: "red" }}>*</span>
														</span>
													}
													InputLabelProps={{ shrink: true }}
													error={!!errors.KdDivisi}
													helperText={errors.KdDivisi}
													sx={inputCompactStyle}
												/>
											)}
										/>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {/* <TextField
                      fullWidth
                      size="small"
                      label="Jabatan"
                      disabled
                      InputProps={{ readOnly: true }}
                      value={values.NmJabatan ?? ''}
                      sx={inputCompactStyle}
                    /> */}
										<Autocomplete
											options={bagianOptions ?? []}
											loading={bagianLoading}
											getOptionLabel={(o) => o.title ?? ""}
											value={
												bagianOptions?.find((c) => c.value === values.KdBagian) ?? null
											}
											onChange={(_, v) => {
												setValues((prev: any) => ({
													...prev,
													KdBagian: v?.value ?? "",
													NmBagian: v?.title ?? "",
													KdSubBagian: "",
												}));

												// 🔥 reset error
												setErrors((prev: any) => ({
													...prev,
													KDBAGIAN: "",
												}));
											}}
											isOptionEqualToValue={(o, v) => o?.value === v?.value}
											fullWidth
											disabled={!values.KdDivisi}
											renderInput={(params) => (
												<TextField
													{...params}
													size="small"
													label={
														<span>
															Bagian <span style={{ color: "red" }}>*</span>
														</span>
													}
													placeholder={
														!values.KdDivisi ? "Pilih Divisi dulu" : "Pilih Bagian"
													}
													InputLabelProps={{ shrink: true }}

													// 🔥 ERROR + UX SMART
													error={!!errors.KdBagian}
													helperText={
														!values.KdDivisi
															? "Pilih Divisi terlebih dahulu"
															: errors.KDBAGIAN
													}

													sx={(theme) => ({
														...inputCompactStyle(theme),

														"& .MuiOutlinedInput-root": {
															height: 32,
															backgroundColor: !values.KdDivisi
																? theme.palette.action.disabledBackground
																: theme.palette.background.paper,
														},
													})}
												/>
											)}
										/>
                  </Grid>
                </Grid>

								<Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
										<Autocomplete
											options={subBagianOptions ?? []}
											loading={subLoading}
											getOptionLabel={(o) => o.title ?? ""}
											value={
												subBagianOptions?.find((c) => c.value === values.KdSubBagian) ?? null
											}
											onChange={(_, v) => {
												setValues((prev: any) => ({
													...prev,
													KdSubBagian: v?.value ?? "",
													NmSubBagian: v?.title ?? "",
												}));

												// 🔥 reset error
												setErrors((prev: any) => ({
													...prev,
													KdSubBagian: "",
												}));
											}}
											isOptionEqualToValue={(o, v) => o?.value === v?.value}
											fullWidth
											disabled={!values.KdBagian}
											renderInput={(params) => (
												<TextField
													{...params}
													size="small"
													label={
														<span>
															Sub Bagian <span style={{ color: "red" }}>*</span>
														</span>
													}
													placeholder={
														!values.KdBagian ? "Pilih Bagian dulu" : "Pilih Sub Bagian"
													}
													InputLabelProps={{ shrink: true }}

													// 🔥 ERROR
													error={!!errors.KDSUBBAGIAN}
													helperText={
														!values.KdBagian
															? "Pilih Bagian terlebih dahulu"
															: errors.KDSUBBAGIAN
													}

													sx={(theme) => ({
														...inputCompactStyle(theme),
														"& .MuiOutlinedInput-root": {
															height: 32,
															backgroundColor: !values.KdBagian
																? theme.palette.action.disabledBackground
																: theme.palette.background.paper,
														},
													})}
												/>
											)}
										/>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
										<Autocomplete
											options={jabatanOptions ?? []}
											loading={loadingJabatan}
											getOptionLabel={(o) => o.title ?? ""}
											value={
												jabatanOptions?.find((c) => c.value === values.KdJabatan) ?? null
											}
											onChange={(_, v) => {
												setValues((prev: any) => ({
													...prev,
													KdJabatan: v?.value ?? "",
													NmJabatan: v?.title ?? "",
												}));

												// 🔥 reset error saat pilih
												setErrors((prev: any) => ({
													...prev,
													KdJabatan: "",
												}));
											}}
											isOptionEqualToValue={(o, v) => o?.value === v?.value}
											fullWidth
											renderInput={(params) => (
												<TextField
													{...params}
													size="small"
													label={
														<span>
															Jabatan <span style={{ color: "red" }}>*</span>
														</span>
													}
													placeholder="Pilih Jabatan"
													InputLabelProps={{ shrink: true }}

													// 🔥 ERROR
													error={!!errors.KdJabatan}
													helperText={errors.KdJabatan}

													sx={inputCompactStyle}
												/>
											)}
										/>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="Alamat"
                  multiline
                  rows={2}
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.Alamat ?? ''}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),
                    '& .MuiOutlinedInput-root': {
                      minHeight: 'auto',
                      height: 'auto',
                      alignItems: 'flex-start',
                    },
                    '& textarea': {
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1.4,
                    },
                  })}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Telepon"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.Telepon ?? ''}
                  sx={inputCompactStyle}
                />
              </Stack>
            </Grid>

            {/* ================= RIGHT ================= */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Data Cuti"
                subtitle="Informasi pengajuan dan saldo cuti"
              />

              <Stack spacing={1.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={
                          <span>
                            Tanggal <span style={{ color: 'red' }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.Tanggal ? dayjs(values.Tanggal) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''

                          setValues((prev) => ({
                            ...prev,
                            Tanggal: val,
                          }))

                          setErrors((prev: any) => ({
                            ...prev,
                            Tanggal: '',
                          }))
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                            error: !!errors.Tanggal,
                            helperText: errors.Tanggal,
                            sx: inputCompactStyle,
                          },
                          actionBar: {
                            actions: ['clear', 'today'],
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="No Cuti"
                      disabled
                      InputProps={{ readOnly: true }}
                      value={values.NoCuti ?? ''}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                
								<Autocomplete
									options={jenisCutiOptions}
									getOptionLabel={(o) => o.label}
									value={
										jenisCutiOptions.find((x) => x.value === values.JnsCuti) ?? null
									}
									onChange={(_, v) => {
										setValues(prev => ({
											...prev,
											JnsCuti: v?.value ?? ""
										}))

										/* setErrors(prev => ({
											...prev,
											JnsCuti: ""
										})) */
										setErrors((prev: any) => ({
											...prev,
											JnsCuti: ""
										}))
									}}
									isOptionEqualToValue={(o, v) => o.value === v.value}
									fullWidth
									renderInput={(params) => (
										<TextField
											{...params}
											size="small"
											label={
												<span>
													Jenis Cuti <span style={{ color: 'red' }}>*</span>
												</span>
											}
											error={!!errors.JnsCuti}
											helperText={errors.JnsCuti}
											sx={inputCompactStyle}
										/>
									)}
								/>

								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<DatePicker
										label="Tambah Tanggal Cuti"
										value={null}
										onChange={(v) => {
											if (!v) return

											const tgl = v.format("YYYY-MM-DD")

											// 🔥 OPTIONAL: block weekend
											const day = v.day()
											if (day === 0 || day === 6) {
												showSnackbar("Tidak bisa pilih hari Sabtu/Minggu", "warning")
												return
											}
											
											setValues(prev => {
												// 🔥 toggle (klik lagi = hapus)
												if (prev.DetailTanggal.includes(tgl)) {
													const newDates = prev.DetailTanggal.filter(x => x !== tgl)
													return {
														...prev,
														DetailTanggal: newDates,
														JmlHari: newDates.length
													}
												}

												const newDates = [...prev.DetailTanggal, tgl]

												return {
													...prev,
													DetailTanggal: newDates,
													JmlHari: newDates.length
												}
											})
										}}
										shouldDisableDate={(date) => {
											const tgl = date.format("YYYY-MM-DD")

											// 🔥 disable kalau sudah dipilih
											if (values.DetailTanggal.includes(tgl)) return true

											// 🔥 disable weekend
											const day = date.day()
											if (day === 0 || day === 6) return true

											return false
										}}
										slotProps={{
											textField: {
												size: "small",
												fullWidth: true,
												sx: inputCompactStyle
											}
										}}
									/>
								</LocalizationProvider>
								<Box mt={2}>
									<Typography fontSize={12} color="text.secondary">
										Detail Tanggal Cuti
									</Typography>

									<Box display="flex" flexWrap="wrap" gap={1} mt={1}>
										{values.DetailTanggal
											.sort()
											.map((tgl, i) => (
												<Box
													key={i}
													onClick={() => {
														setValues(prev => {
															const newDates = prev.DetailTanggal.filter(x => x !== tgl)

															return {
																...prev,
																DetailTanggal: newDates,
																JmlHari: newDates.length
															}
														})
													}}
													sx={{
														px: 1.5,
														py: 0.5,
														borderRadius: 1,
														backgroundColor: "#e0f2fe",
														fontSize: 12,
														cursor: "pointer",
														"&:hover": {
															backgroundColor: "#fecaca"
														}
													}}
												>
													{dayjs(tgl).format("DD MMM YYYY")} ✕
												</Box>
											))}
									</Box>
								</Box>

                <TextField
									fullWidth
									size="small"
									type="number"
									label={
										<span>
											Jumlah Hari <span style={{ color: 'red' }}>*</span>
										</span>
									}
									value={values.JmlHari ?? 0}
									disabled
									InputProps={{ readOnly: true }}
									error={values.JmlHari > values.SisaCuti}
									helperText={
										values.JmlHari > values.SisaCuti
											? "Melebihi saldo cuti"
											: errors.JmlHari
									}
									sx={inputCompactStyle}
								/>

                <TextField
                  fullWidth
                  size="small"
                  label={
                    <span>
                      Keperluan <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  value={values.Keperluan ?? ''}
                  onChange={setField('Keperluan')}
                  error={!!errors.Keperluan}
                  helperText={errors.Keperluan}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Catatan"
                  multiline
                  rows={3}
                  value={values.Catatan ?? ''}
                  onChange={handleChange('Catatan')}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),
                    '& .MuiOutlinedInput-root': {
                      minHeight: 'auto',
                      height: 'auto',
                      alignItems: 'flex-start',
                    },
                    '& textarea': {
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1.4,
                    },
                  })}
                />

                <Divider sx={{ my: 1 }} />

                <SectionTitle
                  title="Saldo Cuti"
                  subtitle="Informasi saldo cuti karyawan"
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Hak Cuti"
                      value={values.HakCuti ?? 0}
                      onChange={handleChange('HakCuti')}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Terpakai"
                      value={values.Terpakai ?? 0}
                      onChange={handleChange('Terpakai')}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Tooltip title="Otomatis dihitung dari Hak Cuti - Terpakai">
                      <TextField
                        fullWidth
                        size="small"
                        label="Sisa Cuti"
                        disabled
                        InputProps={{ readOnly: true }}
                        value={values.SisaCuti ?? 0}
                        sx={inputCompactStyle}
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            px: 3,
            py: 2,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            fontSize={12}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontStyle: 'italic',
            }}
          >
            💡 Klik “Pilih Karyawan” untuk mencari dan mengisi data karyawan secara otomatis
          </Typography>

          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={onClose}>
              Batal
            </Button>

            <Button
              color="primary"
              variant="contained"
              disabled={loading}
              onClick={(e) => handleSubmit(e, false)}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconDeviceFloppy size={16} />
                )
              }
            >
              {loading ? 'Menyimpan...' : 'Simpan Cuti'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default FormCutiKaryawan