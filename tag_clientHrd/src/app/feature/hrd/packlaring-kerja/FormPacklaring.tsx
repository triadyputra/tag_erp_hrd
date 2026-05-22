'use client'

import React, { useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { IconDeviceFloppy, IconPrinter } from '@tabler/icons-react'
import { useSnackbar } from '@/app/context/SnackbarContext'
import PdfPreviewDialog from '@/app/components/print-preview/PdfPreviewDialog'
import { fetchDetailPacklaring, printPacklaring } from '@/services/hrd/packlaring.service'
import { getDetailMasterKtp, getFilterMasterKtp, useComboCabangWith } from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

export interface FormPacklaringDto {
  Id?: string
  Tanggal: string
  Nomor: string
  NoKtp: string
  Nik: string
  NamaKaryawan: string
  Divisi: string
  Masuk: string
  Keluar: string
  Hrd: string
  KdCabang: string
  NmCabang: string
  Keperluan: string
  Jenis: string
  Status: number
}

interface Props {
  id?: string
  onClose: () => void
  onSubmit: (
    payload: FormPacklaringDto,
    option?: { closeAfterSave?: boolean }
  ) => Promise<string | void>
}

const defaultValues: FormPacklaringDto = {
  Id: '',
  Tanggal: dayjs().format('YYYY-MM-DD'),
  Nomor: '',
  NoKtp: '',
  Nik: '',
  NamaKaryawan: '',
  Divisi: '',
  Masuk: dayjs().format('YYYY-MM-DD'),
  Keluar: dayjs().format('YYYY-MM-DD'),
  Hrd: 'Poppie Intan',
  KdCabang: '',
  NmCabang: '',
  Keperluan: '',
  Jenis: '',
  Status: 1,
}

const jenisOptions = [
  { title: 'BPJS', value: 'BPJS' },
  { title: 'KARYAWAN', value: 'KARYAWAN' },
  { title: 'LAINNYA', value: 'LAINNYA' },
]

const statusOptions = [
  { title: 'Approval', value: 1 },
  { title: 'Pengajuan', value: 0 },
]

const FormPacklaring: React.FC<Props> = ({ id, onClose, onSubmit }) => {
  const { showSnackbar } = useSnackbar()
  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [values, setValues] = useState<FormPacklaringDto>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errors, setErrors] = useState<any>({})

  // ================= PRINT PREVIEW =================
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  const isEdit = !!id

  // ================= SEARCH KARYAWAN (mirip FormCuti) =================
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<any[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  // ================= INIT CABANG DEFAULT =================
  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      const opt = cabangOptions?.find((x) => x.value === cab)
      setValues((prev) => ({
        ...prev,
        KdCabang: cab,
        NmCabang: opt?.title ?? prev.NmCabang,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ================= LOAD EDIT =================
  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoadingDetail(true)
        const res = await fetchDetailPacklaring(id)

        setValues((prev) => ({
          ...prev,
          Id: res.Id ?? '',
          Tanggal: res.Tanggal?.substring(0, 10) ?? prev.Tanggal,
          Nomor: res.Nomor ?? '',
          NoKtp: res.NoKtp ?? '',
          Nik: res.Nik ?? '',
          NamaKaryawan: res.NamaKaryawan ?? '',
          Divisi: res.Divisi ?? '',
          Masuk: res.Masuk?.substring(0, 10) ?? prev.Masuk,
          Keluar: res.Keluar?.substring(0, 10) ?? prev.Keluar,
          Hrd: res.Hrd ?? '',
          KdCabang: res.KdCabang ?? prev.KdCabang,
          NmCabang: res.NmCabang ?? prev.NmCabang,
          Keperluan: res.Keperluan ?? '',
          Jenis: res.Jenis ?? '',
          Status: Number(res.Status ?? 1),
        }))

        setSelected({ NAMALENGKAP: res.NamaKaryawan })
        setKeyword(res.NamaKaryawan ?? '')
      } catch (err: any) {
        showSnackbar(err?.message || 'Gagal mengambil detail packlaring', 'error')
      } finally {
        setLoadingDetail(false)
      }
    }

    load()
  }, [id, showSnackbar])

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
      } catch {
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

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelect = async (item: any) => {
    try {
      setSelected(item)
      setKeyword(item.NAMALENGKAP)
      setShowDropdown(false)
      setLoadingDetail(true)

      const raw = await getDetailMasterKtp(item.NOKTP)
      const resKtp = raw?.Data ?? raw

      setValues((prev) => ({
        ...prev,
        NoKtp: resKtp.NOKTP ?? item.NOKTP ?? '',
        Nik: resKtp.NIKSISTAG ?? '',
        NamaKaryawan: resKtp.NMKARYAWAN ?? item.NAMALENGKAP ?? '',
        Divisi: resKtp.NMDIVISI ?? '',
        KdCabang: resKtp.KDCABANG ?? prev.KdCabang,
        NmCabang: resKtp.NMCABANG ?? prev.NmCabang,
      }))
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal mengambil data karyawan', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  const setField = (field: keyof FormPacklaringDto) => (e: any) => {
    const value = e?.target?.value
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev: any) => ({ ...prev, [field]: '' }))
  }

  const handlePrint = async () => {
    try {
      if (!values.Id) {
        showSnackbar('Simpan dulu sebelum print', 'warning')
        return
      }

      setPreviewLoading(true)
      const res = await printPacklaring(values.Id)
      setPdfBase64(res.response)
      setPreviewOpen(true)
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal generate PDF', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e?: any, closeAfterSave = false) => {
    e?.preventDefault?.()

    const err: any = {}
    if (!values.Tanggal || !dayjs(values.Tanggal).isValid()) err.Tanggal = 'Tanggal wajib diisi'
    if (!values.Nomor) err.Nomor = 'Nomor wajib diisi'
    if (!values.NamaKaryawan) err.NamaKaryawan = 'Karyawan wajib dipilih'
    if (!values.NoKtp) err.NoKtp = 'No KTP wajib terisi'
    if (!values.Nik) err.Nik = 'NIK wajib terisi'
    if (!values.Masuk || !dayjs(values.Masuk).isValid()) err.Masuk = 'Tanggal masuk wajib diisi'
    if (!values.Keluar || !dayjs(values.Keluar).isValid()) err.Keluar = 'Tanggal keluar wajib diisi'
    if (values.Masuk && values.Keluar && dayjs(values.Masuk).isAfter(dayjs(values.Keluar))) {
      err.Keluar = 'Tanggal keluar tidak boleh lebih kecil dari tanggal masuk'
    }
    if (!values.Jenis) err.Jenis = 'Jenis wajib dipilih'
    if (!values.Nomor) err.Nomor = 'Nomor wajib terisi'
    setErrors(err)
    if (Object.keys(err).length > 0) return

    setLoading(true)
    try {
      const savedId = await onSubmit(values, { closeAfterSave })
      if (savedId) {
        setValues((prev) => ({ ...prev, Id: savedId }))
      }
      if (closeAfterSave) onClose?.()
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
        title={isEdit ? 'Edit Packlaring' : 'Tambah Packlaring'}
        subtitle="Pengisian dan pengelolaan informasi packlaring"
        statusLabel={isEdit ? 'EDIT' : 'CREATE'}
        statusColor={isEdit ? 'info' : 'warning'}
        onClose={onClose}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle title="Data Karyawan" subtitle="Pilih karyawan untuk mengisi data otomatis" />

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
                        borderColor: selected || isEdit ? theme.palette.divider : theme.palette.primary.main,
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
                        {loadingDetail ? 'Mengambil data...' : keyword || 'Pilih Karyawan'}
                      </Typography>
                    </Box>

                    {selected && !isEdit && (
                      <Box
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(null)
                          setKeyword('')
                          setValues((prev) => ({ ...defaultValues, KdCabang: prev.KdCabang, NmCabang: prev.NmCabang }))
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

                  {!!errors.NamaKaryawan && (
                    <Typography fontSize={12} color="error" mt={0.5}>
                      {errors.NamaKaryawan}
                    </Typography>
                  )}

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
                          list.map((it, i) => (
                            <Box
                              key={i}
                              onClick={() => handleSelect(it)}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                transition: '0.2s',
                                '&:hover': { bgcolor: '#f9fafb' },
                              }}
                            >
                              <Typography fontWeight={600} fontSize={13}>
                                {it.NAMALENGKAP}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {it.NOKTP} • {it.KDCABANG}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="No KTP"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.NoKtp ?? ''}
                  error={!!errors.NoKtp}
                  helperText={errors.NoKtp}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="NIK"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.Nik ?? ''}
                  error={!!errors.Nik}
                  helperText={errors.Nik}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Divisi"
                  disabled
                  InputProps={{ readOnly: true }}
                  value={values.Divisi ?? ''}
                  sx={inputCompactStyle}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle title="Data Packlaring" subtitle="Tanggal, periode kerja, dan informasi dokumen" />

              <Stack spacing={1.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={<span>Tanggal <span style={{ color: 'red' }}>*</span></span>}
                        format="DD-MM-YYYY"
                        value={values.Tanggal ? dayjs(values.Tanggal) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''
                          setValues((prev) => ({ ...prev, Tanggal: val }))
                          setErrors((prev: any) => ({ ...prev, Tanggal: '' }))
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
                          actionBar: { actions: ['clear', 'today'] },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={<span>Nomor <span style={{ color: 'red' }}>*</span></span>}
                      value={values.Nomor ?? ''}
                      onChange={setField('Nomor')}
                      error={!!errors.Nomor}
                      helperText={errors.Nomor}
                      sx={inputCompactStyle}
                      InputLabelProps={{ shrink: true }}
                      placeholder="Auto / manual"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={<span>Masuk <span style={{ color: 'red' }}>*</span></span>}
                        format="DD-MM-YYYY"
                        value={values.Masuk ? dayjs(values.Masuk) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''
                          setValues((prev) => ({ ...prev, Masuk: val }))
                          setErrors((prev: any) => ({ ...prev, Masuk: '' }))
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                            error: !!errors.Masuk,
                            helperText: errors.Masuk,
                            sx: inputCompactStyle,
                          },
                          actionBar: { actions: ['clear', 'today'] },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={<span>Keluar <span style={{ color: 'red' }}>*</span></span>}
                        format="DD-MM-YYYY"
                        value={values.Keluar ? dayjs(values.Keluar) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''
                          setValues((prev) => ({ ...prev, Keluar: val }))
                          setErrors((prev: any) => ({ ...prev, Keluar: '' }))
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                            error: !!errors.Keluar,
                            helperText: errors.Keluar,
                            sx: inputCompactStyle,
                          },
                          actionBar: { actions: ['clear', 'today'] },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <Autocomplete
                  options={jenisOptions}
                  getOptionLabel={(o) => o.title ?? ''}
                  value={jenisOptions.find((x) => x.value === values.Jenis) ?? null}
                  onChange={(_, v) => {
                    const value = v?.value ?? ''
                    setValues((prev) => ({ ...prev, Jenis: value }))
                    setErrors((prev: any) => ({ ...prev, Jenis: '' }))
                  }}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={<span>Jenis <span style={{ color: 'red' }}>*</span></span>}
                      error={!!errors.Jenis}
                      helperText={errors.Jenis}
                      sx={inputCompactStyle}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Keperluan"
                  value={values.Keperluan ?? ''}
                  onChange={setField('Keperluan')}
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={cabangOptions ?? []}
                      loading={cabangLoading}
                      getOptionLabel={(o) => o.title ?? ''}
                      value={cabangOptions?.find((x) => x.value === values.KdCabang) ?? null}
                      onChange={(_, v) => {
                        const kd = v?.value ?? ''
                        setValues((prev) => ({ ...prev, KdCabang: kd, NmCabang: v?.title ?? '' }))
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Cabang"
                          sx={inputCompactStyle}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={statusOptions}
                      getOptionLabel={(o) => o.title}
                      value={statusOptions.find((x) => x.value === Number(values.Status)) ?? statusOptions[0]}
                      onChange={(_, v) => setValues((prev) => ({ ...prev, Status: v?.value ?? 1 }))}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Status"
                          sx={inputCompactStyle}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="Penandatanganan"
                  value={values.Hrd ?? ''}
                  onChange={setField('Hrd')}
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ fontSize: 12, color: 'text.secondary' }}>
                        optional
                      </InputAdornment>
                    ),
                  }}
                />
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
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button variant="outlined" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="contained"
            disabled={loading || !values.Id}
            onClick={handlePrint}
            startIcon={
              previewLoading ? <CircularProgress size={18} color="inherit" /> : <IconPrinter size={16} />
            }
          >
            Print
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={loading}
            onClick={(e) => handleSubmit(e, false)}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={16} />
            }
          >
            {loading ? 'Menyimpan...' : 'Simpan Packlaring'}
          </Button>
        </DialogActions>

        <PdfPreviewDialog
          open={previewOpen}
          loading={previewLoading}
          base64Pdf={pdfBase64}
          title="Preview Packlaring"
          onClose={() => {
            setPreviewOpen(false)
            setPdfBase64(null)
          }}
        />
      </form>
    </Dialog>
  )
}

export default FormPacklaring

