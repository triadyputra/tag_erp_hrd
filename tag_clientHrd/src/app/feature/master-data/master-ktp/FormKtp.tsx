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
  Autocomplete,
  Avatar,
  IconButton,
  Badge,
  Paper,
  Chip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import {
  IconDeviceFloppy,
  IconCamera,
  IconX,
  IconFileTypePdf,
  IconUpload,
  IconEye,
} from '@tabler/icons-react'
import PdfPreviewDialog from '@/app/components/print-preview/PdfPreviewDialog'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useComboCabangWith, useComboVendorByKode } from '@/hooks/useComboGroup'
import { useSnackbar } from '@/app/context/SnackbarContext'
import {
  deleteFaktaIntegritas,
  fetchDetailMasterKtp,
  fetchFaktaIntegritas,
  uploadFaktaIntegritas,
} from '@/services/master-data/master-ktp.service'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

interface FormMasterKtpDto {
  Noktp: string
  NamaLengkap: string
  Kelamin: string
  TempatLahir: string
  TglLahir: string
  Alamat: string
  AlamatTinggal: string
  Pendidikan: string
  Agama: string
  Perkawinan: string
  TglMasuk: string
  IdFinger: string
  NoTelepon: string
  TitipIjazah: string
  Foto: string
  KdCabang: string
  NmCabang: string
  KdVendor: string
  NmVendor: string
}

interface Props {
  noktp?: string
  onClose: () => void
  onSubmit: (
    payload: FormMasterKtpDto,
    option?: { closeAfterSave?: boolean }
  ) => Promise<void>
}

const defaultValues: FormMasterKtpDto = {
  Noktp: '',
  NamaLengkap: '',
  Kelamin: '',
  TempatLahir: '',
  TglLahir: '',
  Alamat: '',
  AlamatTinggal: '',
  Pendidikan: '',
  Agama: '',
  Perkawinan: '',
  TglMasuk: '',
  IdFinger: '',
  NoTelepon: '',
  TitipIjazah: '',
  Foto: '',
  KdCabang: '',
  NmCabang: '',
  KdVendor: '',
  NmVendor: '',
}

const FormMasterKtp: React.FC<Props> = ({
  noktp,
  onClose,
  onSubmit,
}) => {
  const { showSnackbar } = useSnackbar()

  const [values, setValues] = useState<FormMasterKtpDto>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [pdfPreviewBase64, setPdfPreviewBase64] = useState<string | null>(null)
  const [faktaBase64, setFaktaBase64] = useState<string | null>(null)
  const [hasFakta, setHasFakta] = useState(false)
  const [faktaUploading, setFaktaUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const docInputRef = React.useRef<HTMLInputElement>(null)

  const MAX_PDF_SIZE = 2 * 1024 * 1024

  const faktaThumbnailUrl = React.useMemo(() => {
    if (!faktaBase64) return null
    try {
      const byteCharacters = atob(faktaBase64)
      const byteNumbers = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [faktaBase64])

  React.useEffect(() => {
    return () => {
      if (faktaThumbnailUrl) URL.revokeObjectURL(faktaThumbnailUrl)
    }
  }, [faktaThumbnailUrl])

  const loadFaktaIntegritas = async (noKtp: string) => {
    try {
      const res = await fetchFaktaIntegritas(noKtp)
      if (res.Exists && res.Base64) {
        setFaktaBase64(res.Base64)
        setHasFakta(true)
      } else {
        setFaktaBase64(null)
        setHasFakta(false)
      }
    } catch {
      setFaktaBase64(null)
      setHasFakta(false)
    }
  }

  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()
  const { vendor: vendorOptions, loading: vendorLoading } = useComboVendorByKode()

  const isEdit = !!noktp

  const jenisKelaminOptions = [
    { value: 'LAKI-LAKI', label: 'Laki-laki' },
    { value: 'PEREMPUAN', label: 'PEREMPUAN' },
  ]

  const pendidikanOptions = [
    { value: 'SD', label: 'SD' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA', label: 'SMA' },
    { value: 'D1', label: 'D1' },
    { value: 'D2', label: 'D2' },
    { value: 'D3', label: 'D3' },
    { value: 'S1', label: 'S1' },
    { value: 'S2', label: 'S2' },
    { value: 'S3', label: 'S3' },
  ]

  const agamaOptions = [
    { value: 'ISLAM', label: 'ISLAM' },
    { value: 'KRISTEN', label: 'KRISTEN' },
    { value: 'KATOLIK', label: 'KATOLIK' },
    { value: 'HINDU', label: 'HINDU' },
    { value: 'BUDDHA', label: 'BUDDHA' },
    { value: 'KONGHUCU', label: 'KONGHUCU' },
  ]

  const perkawinanOptions = [
    { value: 'BELUM KAWIN', label: 'BELUM KAWIN' },
    { value: 'MENIKAH', label: 'MENIKAH' },
    { value: 'CERAI HIDUP', label: 'CERAI HIDUP' },
    { value: 'CERAI MATI', label: 'CERAI MATI' },
  ]

  const normalizePhotoBase64 = (photo: string): string => {
    if (!photo) return ''
    if (photo.startsWith('data:image')) return photo
    if (/^[A-Za-z0-9+/=]+$/.test(photo)) {
      return `data:image/jpeg;base64,${photo}`
    }
    return photo
  }

  useEffect(() => {
    if (!noktp) return

    const load = async () => {
      try {
        setLoadingDetail(true)

        const raw = await fetchDetailMasterKtp(noktp)
        const res = raw?.Data ?? raw

        const data: FormMasterKtpDto = {
          Noktp: res.Noktp ?? res.NOKTP ?? '',
          NamaLengkap: res.NamaLengkap ?? res.NAMALENGKAP ?? '',
          Kelamin: res.Kelamin ?? res.KELAMIN ?? '',
          TempatLahir: res.TempatLahir ?? res.TEMPATLAHIR ?? '',
          TglLahir: res.TglLahir?.substring(0, 10) || res.TGLLAHIR?.substring(0, 10) || '',
          Alamat: res.Alamat ?? res.ALAMAT ?? '',
          AlamatTinggal: res.AlamatTinggal ?? res.ALAMATTINGGAL ?? '',
          Pendidikan: res.Pendidikan ?? res.PENDIDIKAN ?? '',
          Agama: res.Agama ?? res.AGAMA ?? '',
          Perkawinan: res.Perkawinan ?? res.PERKAWINAN ?? '',
          TglMasuk: res.TglMasuk?.substring(0, 10) || res.TGLMASUK?.substring(0, 10) || '',
          IdFinger: res.IdFinger ?? res.IDFINGER ?? '',
          NoTelepon: res.NoTelepon ?? res.NOTELEPON ?? '',
          TitipIjazah: res.TitipIjazah ?? res.TITIPIJAZAH ?? '',
          Foto: normalizePhotoBase64(res.Foto ?? res.FOTO ?? ''),
          KdCabang: res.KdCabang ?? res.KDCABANG ?? '',
          NmCabang: res.NmCabang ?? res.NMCABANG ?? '',
          KdVendor: res.KdVendor ?? res.KDVENDOR ?? '',
          NmVendor: res.NmVendor ?? res.NMVENDOR ?? '',
        }

        setValues(data)
        setPhotoPreview(data.Foto)

        if (data.Noktp) {
          await loadFaktaIntegritas(data.Noktp)
        }
      } catch (err: any) {
        console.error(err)
        showSnackbar(err?.message || 'Gagal mengambil detail KTP', 'error')
      } finally {
        setLoadingDetail(false)
      }
    }

    load()
  }, [noktp, showSnackbar])

  const handleChange = (field: string) => (e: any) => {
    const value = e?.target?.value

    setValues((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const setField = (field: string) => (e: any) => {
    handleChange(field)(e)

    setErrors((prev: any) => ({
      ...prev,
      [field]: '',
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Ukuran foto maksimal 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPhotoPreview(base64)
      setValues((prev) => ({
        ...prev,
        Foto: base64,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoPreview('')
    setValues((prev) => ({
      ...prev,
      Foto: '',
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFaktaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      showSnackbar('File harus berformat PDF', 'error')
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }

    if (file.size > MAX_PDF_SIZE) {
      showSnackbar('Ukuran dokumen maksimal 2MB', 'error')
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }

    const noKtp = values.Noktp?.trim()
    if (!noKtp) {
      showSnackbar('Isi No KTP terlebih dahulu sebelum upload', 'warning')
      if (docInputRef.current) docInputRef.current.value = ''
      return
    }

    setFaktaUploading(true)
    try {
      await uploadFaktaIntegritas(noKtp, file)
      await loadFaktaIntegritas(noKtp)
      showSnackbar('Dokumen fakta integritas berhasil diupload', 'success')
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal upload dokumen', 'error')
    } finally {
      setFaktaUploading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  const handleRemoveFakta = async () => {
    const noKtp = values.Noktp?.trim()
    if (!noKtp) return

    setFaktaUploading(true)
    try {
      await deleteFaktaIntegritas(noKtp)
      setFaktaBase64(null)
      setHasFakta(false)
      if (docInputRef.current) docInputRef.current.value = ''
      showSnackbar('Dokumen fakta integritas berhasil dihapus', 'success')
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal menghapus dokumen', 'error')
    } finally {
      setFaktaUploading(false)
    }
  }

  const handleOpenFaktaPreview = () => {
    if (!faktaBase64) return
    setPdfPreviewBase64(faktaBase64)
    setPdfPreviewOpen(true)
  }

  const handleSubmit = async (e?: any, closeAfterSave = false) => {
    e?.preventDefault?.()

    const err: any = {}

    if (!values.Noktp) err.Noktp = 'No KTP wajib diisi'
    if (!values.NamaLengkap) err.NamaLengkap = 'Nama lengkap wajib diisi'
    if (!values.Kelamin) err.Kelamin = 'Jenis kelamin wajib dipilih'
    if (!values.TglLahir) err.TglLahir = 'Tanggal lahir wajib diisi'
    if (!values.Alamat) err.Alamat = 'Alamat wajib diisi'
    if (!values.KdCabang) err.KdCabang = 'Cabang wajib dipilih'

    setErrors(err)
    if (Object.keys(err).length > 0) return

    setLoading(true)
    try {
      await onSubmit(values, { closeAfterSave })

      if (closeAfterSave) {
        onClose?.()
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
        title={isEdit ? 'Edit Data KTP' : 'Tambah Data KTP'}
        subtitle="Pengisian dan pengelolaan informasi data KTP"
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
        <DialogContent sx={{ position: 'relative', pt: 3 }}>
          
          {/* ================= FOTO & FAKTA INTEGRITAS ================= */}
          <Box
            sx={{
              mb: 3,
              pb: 3,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack alignItems="center" textAlign="center" spacing={0.5} mb={2.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {values.NamaLengkap || 'Data Karyawan'}
              </Typography>
              {values.Noktp ? (
                <Chip
                  size="small"
                  label={`No KTP: ${values.Noktp}`}
                  sx={{ fontWeight: 500, fontSize: 11 }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Lengkapi No KTP untuk nama file dokumen PDF
                </Typography>
              )}
            </Stack>

            <Grid container spacing={2.5}>
              {/* —— Foto —— */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    p: 2.5,
                    height: '100%',
                    minHeight: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: photoPreview
                      ? alpha(theme.palette.primary.main, 0.4)
                      : theme.palette.divider,
                    background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 55%)`,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                  })}
                >
                  <Chip
                    icon={<IconCamera size={14} />}
                    label="Foto Karyawan"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 2, fontWeight: 600 }}
                  />

                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          backgroundColor: 'background.paper',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                        }}
                      >
                        <IconCamera size={16} />
                      </IconButton>
                    }
                  >
                    <Avatar
                      src={photoPreview || undefined}
                      alt={values.NamaLengkap || 'Foto'}
                      sx={{
                        width: 128,
                        height: 128,
                        border: '3px solid',
                        borderColor: photoPreview ? 'primary.main' : 'divider',
                        bgcolor: photoPreview ? 'transparent' : 'action.selected',
                        fontSize: 44,
                        boxShadow: photoPreview ? 6 : 1,
                      }}
                    >
                      {!photoPreview && (values.NamaLengkap?.charAt(0) || '?')}
                    </Avatar>
                  </Badge>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    mt={2}
                    mb={1.5}
                  >
                    JPG atau PNG, maks. 2MB
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    <Button
                      size="small"
                      variant={photoPreview ? 'outlined' : 'contained'}
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={<IconCamera size={16} />}
                    >
                      {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
                    </Button>
                    {photoPreview && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleRemovePhoto}
                        startIcon={<IconX size={16} />}
                      >
                        Hapus
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              {/* —— Fakta Integritas —— */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    p: 2.5,
                    height: '100%',
                    minHeight: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: hasFakta
                      ? alpha(theme.palette.error.main, 0.35)
                      : theme.palette.divider,
                    background: `linear-gradient(160deg, ${alpha(theme.palette.error.main, 0.06)} 0%, ${theme.palette.background.paper} 55%)`,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: hasFakta
                        ? alpha(theme.palette.error.main, 0.45)
                        : alpha(theme.palette.divider, 1),
                    },
                  })}
                >
                  <Chip
                    icon={<IconFileTypePdf size={14} />}
                    label="Fakta Integritas"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ mb: 2, fontWeight: 600 }}
                  />

                  <Box
                    onClick={hasFakta ? handleOpenFaktaPreview : undefined}
                    sx={(theme) => ({
                      width: 128,
                      height: 128,
                      borderRadius: 2,
                      border: '3px solid',
                      borderColor: hasFakta
                        ? alpha(theme.palette.error.main, 0.6)
                        : theme.palette.divider,
                      overflow: 'hidden',
                      cursor: hasFakta ? 'pointer' : 'default',
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: hasFakta ? 4 : 0,
                      '&:hover .fakta-preview-overlay': hasFakta
                        ? { opacity: 1 }
                        : undefined,
                    })}
                  >
                    {hasFakta && faktaThumbnailUrl ? (
                      <iframe
                        src={`${faktaThumbnailUrl}#toolbar=0&navpanes=0`}
                        title="Thumbnail fakta integritas"
                        width="100%"
                        height="100%"
                        style={{ border: 'none', pointerEvents: 'none' }}
                      />
                    ) : (
                      <Stack alignItems="center" spacing={0.5}>
                        <IconFileTypePdf size={40} stroke={1.2} color="#bdbdbd" />
                        <Typography variant="caption" color="text.disabled" fontSize={10}>
                          Belum ada PDF
                        </Typography>
                      </Stack>
                    )}

                    {hasFakta && (
                      <Box
                        className="fakta-preview-overlay"
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 0.5,
                          bgcolor: 'rgba(0,0,0,0.45)',
                          color: '#fff',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <IconEye size={28} />
                        <Typography variant="caption" fontWeight={600}>
                          Preview
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <input
                    ref={docInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFaktaUpload}
                    style={{ display: 'none' }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    mt={2}
                    mb={1.5}
                    sx={{ px: 1 }}
                  >
                    PDF maks. 2MB
                    {values.Noktp?.trim() ? (
                      <>
                        <br />
                        <Box
                          component="span"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: 'text.primary',
                            fontWeight: 600,
                          }}
                        >
                          {values.Noktp.trim()}.pdf
                        </Box>
                      </>
                    ) : null}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    <Button
                      size="small"
                      variant={hasFakta ? 'outlined' : 'contained'}
                      color="error"
                      disabled={faktaUploading || !values.Noktp?.trim()}
                      onClick={() => docInputRef.current?.click()}
                      startIcon={
                        faktaUploading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <IconUpload size={16} />
                        )
                      }
                    >
                      {hasFakta ? 'Ganti PDF' : 'Upload PDF'}
                    </Button>
                    {hasFakta && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={handleOpenFaktaPreview}
                          startIcon={<IconEye size={16} />}
                        >
                          Lihat
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={faktaUploading}
                          onClick={handleRemoveFakta}
                          startIcon={<IconX size={16} />}
                        >
                          Hapus
                        </Button>
                      </>
                    )}
                  </Stack>

                  {!values.Noktp?.trim() && (
                    <Typography
                      variant="caption"
                      color="warning.main"
                      textAlign="center"
                      mt={1}
                      fontSize={10}
                    >
                      Isi No KTP terlebih dahulu
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* ================= FORM FIELDS ================= */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Data Identitas"
                subtitle="Informasi identitas pribadi"
              />

              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label={
                    <span>
                      No KTP <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  value={values.Noktp ?? ''}
                  onChange={setField('Noktp')}
                  error={!!errors.Noktp}
                  helperText={errors.Noktp}
                  disabled={isEdit}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label={
                    <span>
                      Nama Lengkap <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  value={values.NamaLengkap ?? ''}
                  onChange={setField('NamaLengkap')}
                  error={!!errors.NamaLengkap}
                  helperText={errors.NamaLengkap}
                  sx={inputCompactStyle}
                />

                <Autocomplete
                  options={jenisKelaminOptions}
                  getOptionLabel={(o) => o.label}
                  value={
                    jenisKelaminOptions.find((x) => x.value === values.Kelamin) ?? null
                  }
                  onChange={(_, v) => {
                    setValues(prev => ({
                      ...prev,
                      Kelamin: v?.value ?? ''
                    }))
                    setErrors((prev: any) => ({
                      ...prev,
                      Kelamin: ''
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
                          Jenis Kelamin <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      error={!!errors.Kelamin}
                      helperText={errors.Kelamin}
                      sx={inputCompactStyle}
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tempat Lahir"
                      value={values.TempatLahir ?? ''}
                      onChange={setField('TempatLahir')}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={
                          <span>
                            Tanggal Lahir <span style={{ color: 'red' }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.TglLahir ? dayjs(values.TglLahir) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''

                          setValues((prev) => ({
                            ...prev,
                            TglLahir: val,
                          }))

                          setErrors((prev: any) => ({
                            ...prev,
                            TglLahir: '',
                          }))
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                            error: !!errors.TglLahir,
                            helperText: errors.TglLahir,
                            sx: inputCompactStyle,
                          },
                          actionBar: {
                            actions: ['clear', 'today'],
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label={
                    <span>
                      Alamat <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  multiline
                  rows={2}
                  value={values.Alamat ?? ''}
                  onChange={setField('Alamat')}
                  error={!!errors.Alamat}
                  helperText={errors.Alamat}
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
                  label="Alamat Tinggal"
                  multiline
                  rows={2}
                  value={values.AlamatTinggal ?? ''}
                  onChange={setField('AlamatTinggal')}
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

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={pendidikanOptions}
                      getOptionLabel={(o) => o.label}
                      value={
                        pendidikanOptions.find((x) => x.value === values.Pendidikan) ?? null
                      }
                      onChange={(_, v) => {
                        setValues(prev => ({
                          ...prev,
                          Pendidikan: v?.value ?? ''
                        }))
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Pendidikan"
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={agamaOptions}
                      getOptionLabel={(o) => o.label}
                      value={
                        agamaOptions.find((x) => x.value === values.Agama) ?? null
                      }
                      onChange={(_, v) => {
                        setValues(prev => ({
                          ...prev,
                          Agama: v?.value ?? ''
                        }))
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Agama"
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Autocomplete
                  options={perkawinanOptions}
                  getOptionLabel={(o) => o.label}
                  value={
                    perkawinanOptions.find((x) => x.value === values.Perkawinan) ?? null
                  }
                  onChange={(_, v) => {
                    setValues(prev => ({
                      ...prev,
                      Perkawinan: v?.value ?? ''
                    }))
                  }}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Status Perkawinan"
                      sx={inputCompactStyle}
                    />
                  )}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Data Pekerjaan"
                subtitle="Informasi pekerjaan dan kontak"
              />

              <Stack spacing={1.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tanggal Masuk"
                        format="DD-MM-YYYY"
                        value={values.TglMasuk ? dayjs(values.TglMasuk) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format('YYYY-MM-DD') : ''
                          setValues((prev) => ({
                            ...prev,
                            TglMasuk: val,
                          }))
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
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
                      label="ID Finger"
                      value={values.IdFinger ?? ''}
                      onChange={setField('IdFinger')}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="No Telepon"
                  value={values.NoTelepon ?? ''}
                  onChange={setField('NoTelepon')}
                  sx={inputCompactStyle}
                />

                {/* <TextField
                  fullWidth
                  size="small"
                  label="Titip Ijazah"
                  value={values.TitipIjazah ?? ''}
                  onChange={setField('TitipIjazah')}
                  sx={inputCompactStyle}
                /> */}

                <Divider sx={{ my: 1 }} />

                <Autocomplete
                  options={cabangOptions ?? []}
                  loading={cabangLoading}
                  getOptionLabel={(o) => o.title ?? ''}
                  value={
                    cabangOptions?.find((c) => c.value === values.KdCabang) ?? null
                  }
                  onChange={(_, v) => {
                    setValues((prev: any) => ({
                      ...prev,
                      KdCabang: v?.value ?? '',
                      NmCabang: v?.title ?? '',
                    }))
                    setErrors((prev: any) => ({
                      ...prev,
                      KdCabang: '',
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
                          Cabang <span style={{ color: 'red' }}>*</span>
                        </span>
                      }
                      error={!!errors.KdCabang}
                      helperText={errors.KdCabang}
                      sx={inputCompactStyle}
                    />
                  )}
                />

                <Autocomplete
                  options={vendorOptions ?? []}
                  loading={vendorLoading}
                  getOptionLabel={(o) => o.title ?? ''}
                  value={
                    vendorOptions?.find((c) => c.value === values.KdVendor) ?? null
                  }
                  onChange={(_, v) => {
                    setValues((prev: any) => ({
                      ...prev,
                      KdVendor: v?.value ?? '',
                      NmVendor: v?.title ?? '',
                    }))
                  }}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Vendor"
                      sx={inputCompactStyle}
                    />
                  )}
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
            💡 Isi data KTP dengan lengkap dan benar
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
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Box>
        </DialogActions>
      </form>

      <PdfPreviewDialog
        open={pdfPreviewOpen}
        base64Pdf={pdfPreviewBase64}
        title="Preview Fakta Integritas"
        onClose={() => {
          setPdfPreviewOpen(false)
          setPdfPreviewBase64(null)
        }}
      />
    </Dialog>
  )
}

export default FormMasterKtp
