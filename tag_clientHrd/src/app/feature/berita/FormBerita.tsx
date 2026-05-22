'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
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
  Avatar,
  IconButton,
  Badge,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { IconDeviceFloppy, IconCamera, IconX } from '@tabler/icons-react'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { fetchDetailBerita } from '@/services/berita/berita.service'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'
import { API_BASE_URL } from '@/config/api.config'

const resolveImageUrl = (gambar: string): string => {
  if (!gambar) return ''
  if (gambar.startsWith('data:')) return gambar
  if (gambar.startsWith('http')) return gambar
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${baseUrl}${gambar}`
}

const normalizeImageBase64 = (image: string): string => {
  if (!image) return ''
  if (image.startsWith('data:image')) return image
  if (image.startsWith('/upload') || image.startsWith('http')) return image
  if (/^[A-Za-z0-9+/=]+$/.test(image)) {
    return `data:image/jpeg;base64,${image}`
  }
  return image
}

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface FormBeritaDto {
  Id: number
  Judul: string
  Slug: string
  Isi: string
  Status: number
  Gambar: string
  IsPinned: boolean
  CreatedAt: string
  UpdatedAt: string
}

interface Props {
  id?: number
  onClose: () => void
  onSubmit: (
    payload: FormBeritaDto,
    option?: { closeAfterSave?: boolean }
  ) => Promise<void>
}

const defaultValues: FormBeritaDto = {
  Id: 0,
  Judul: '',
  Slug: '',
  Isi: '',
  Status: 0,
  Gambar: '',
  IsPinned: false,
  CreatedAt: '',
  UpdatedAt: '',
}

const statusOptions = [
  { value: 0, label: 'Draft' },
  { value: 1, label: 'Publish' },
]

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
}

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'blockquote', 'code-block',
  'list',
  'indent',
  'align',
  'link', 'image', 'video',
]

const FormBerita: React.FC<Props> = ({
  id,
  onClose,
  onSubmit,
}) => {
  const { showSnackbar } = useSnackbar()

  const [values, setValues] = useState<FormBeritaDto>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isEdit = !!id

  const normalizeImageBase64 = (image: string): string => {
    if (!image) return ''
    if (image.startsWith('data:image')) return image
    if (/^[A-Za-z0-9+/=]+$/.test(image)) {
      return `data:image/jpeg;base64,${image}`
    }
    return image
  }

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoadingDetail(true)

        const raw = await fetchDetailBerita(id)
        const res = raw?.Data ?? raw

        const data: FormBeritaDto = {
          Id: res.Id ?? res.id ?? 0,
          Judul: res.Judul ?? res.judul ?? '',
          Slug: res.Slug ?? res.slug ?? '',
          Isi: res.Isi ?? res.isi ?? '',
          Status: res.Status ?? res.status ?? 0,
          Gambar: res.Gambar ?? res.gambar ?? '',
          IsPinned: res.IsPinned ?? res.isPinned ?? false,
          CreatedAt: res.CreatedAt ?? res.createdAt ?? '',
          UpdatedAt: res.UpdatedAt ?? res.updatedAt ?? '',
        }

        setValues(data)
        setImagePreview(resolveImageUrl(data.Gambar))
      } catch (err: any) {
        console.error(err)
        showSnackbar(err?.message || 'Gagal mengambil detail berita', 'error')
      } finally {
        setLoadingDetail(false)
      }
    }

    load()
  }, [id, showSnackbar])

  const handleChange = (field: string) => (e: any) => {
    const value = e?.target?.value ?? ''

    setValues((prev: any) => ({
      ...prev,
      [field]: value,
    }))

    if (field === 'Judul') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setValues((prev: any) => ({
        ...prev,
        Slug: slug,
      }))
    }
  }

  const setField = (field: string) => (e: any) => {
    handleChange(field)(e)

    setErrors((prev: any) => ({
      ...prev,
      [field]: '',
    }))
  }

  const handleEditorChange = (content: string) => {
    setValues((prev) => ({
      ...prev,
      Isi: content,
    }))

    setErrors((prev: any) => ({
      ...prev,
      Isi: '',
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Ukuran gambar maksimal 2MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImagePreview(base64)
      setValues((prev) => ({
        ...prev,
        Gambar: base64,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setValues((prev) => ({
      ...prev,
      Gambar: '',
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e?: any, closeAfterSave = false) => {
    e?.preventDefault?.()

    const err: any = {}

    if (!values.Judul) err.Judul = 'Judul berita wajib diisi'
    if (!values.Isi || values.Isi === '<p><br></p>') err.Isi = 'Isi berita wajib diisi'

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
        title={isEdit ? 'Edit Berita' : 'Tambah Berita'}
        subtitle="Pengisian dan pengelolaan informasi berita"
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
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
              pb: 3,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
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
                    '&:hover': { backgroundColor: 'primary.light' },
                    boxShadow: 2,
                  }}
                >
                  <IconCamera size={18} />
                </IconButton>
              }
            >
              <Avatar
                src={imagePreview || undefined}
                alt={values.Judul || 'Gambar'}
                variant="rounded"
                sx={{
                  width: 140,
                  height: 140,
                  border: '4px solid',
                  borderColor: imagePreview ? 'primary.main' : 'divider',
                  bgcolor: imagePreview ? 'transparent' : 'action.selected',
                  fontSize: 48,
                  boxShadow: imagePreview ? 4 : 1,
                }}
              >
                {!imagePreview && <IconCamera size={48} />}
              </Avatar>
            </Badge>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <Typography variant="subtitle1" fontWeight={600} mt={1.5}>
              {values.Judul || 'Gambar Berita'}
            </Typography>
            <Stack direction="row" spacing={1} mt={1.5}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<IconCamera size={16} />}
              >
                Upload Gambar
              </Button>
              {imagePreview && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveImage}
                  startIcon={<IconX size={16} />}
                >
                  Hapus
                </Button>
              )}
            </Stack>
            <Typography fontSize={11} color="text.secondary" mt={0.5}>
              Max 2MB (JPG, PNG)
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Informasi Berita"
                subtitle="Judul dan slug berita"
              />

              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label={
                    <span>
                      Judul <span style={{ color: 'red' }}>*</span>
                    </span>
                  }
                  value={values.Judul ?? ''}
                  onChange={setField('Judul')}
                  error={!!errors.Judul}
                  helperText={errors.Judul}
                  sx={inputCompactStyle}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Slug"
                  value={values.Slug ?? ''}
                  onChange={handleChange('Slug')}
                  sx={inputCompactStyle}
                  InputProps={{
                    readOnly: true,
                  }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={values.IsPinned}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          IsPinned: e.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Pin Berita"
                />

                <Autocomplete
                  options={statusOptions}
                  getOptionLabel={(o) => o.label}
                  value={statusOptions.find((x) => x.value === values.Status) ?? statusOptions[0]}
                  onChange={(_, v) => {
                    setValues((prev) => ({
                      ...prev,
                      Status: v?.value ?? 0,
                    }))
                  }}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Status"
                      sx={inputCompactStyle}
                    />
                  )}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionTitle
                title="Konten"
                subtitle="Isi berita"
              />

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    Isi <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 0,
                      borderRadius: 1,
                      border: (theme) =>
                        `1px solid ${
                          errors.Isi
                            ? theme.palette.error.main
                            : theme.palette.divider
                        }`,
                      overflow: 'visible',
                      '& .ql-toolbar.ql-snow': {
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        border: 'none',
                        borderBottom: (theme) =>
                          `1px solid ${theme.palette.divider}`,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[800]
                            : theme.palette.grey[50],
                      },
                      '& .ql-toolbar .ql-picker-options': {
                        zIndex: 2000,
                      },
                      '& .ql-tooltip': {
                        zIndex: 2000,
                      },
                      '& .ql-container.ql-snow': {
                        border: 'none',
                        fontSize: 14,
                        fontFamily: 'inherit',
                      },
                      '& .ql-container': {
                        minHeight: 220,
                        maxHeight: 420,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                      },
                      '& .ql-editor': {
                        minHeight: 200,
                        maxHeight: 380,
                        overflowY: 'auto',
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={values.Isi}
                      onChange={handleEditorChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Tulis isi berita di sini..."
                    />
                  </Box>
                  {errors.Isi && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {errors.Isi}
                    </Typography>
                  )}
                </Box>
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
            Isi berita dengan lengkap dan benar
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
    </Dialog>
  )
}

export default FormBerita
