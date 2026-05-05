'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { IconEye, IconEyeOff, IconKey, IconLock, IconUser } from '@tabler/icons-react'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { getAuthUser } from '@/helpers/auth.helper'
import { changePassword, getMe, uploadProfilePhoto } from '@/services/auth.service'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

export default function MyProfil() {
  const { showSnackbar } = useSnackbar()
  const user = getAuthUser()

  const [activeTab, setActiveTab] = useState<'akun' | 'password'>('akun')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [accountName, setAccountName] = useState(user?.fullName ?? '')
  const [accountUsername] = useState(user?.username ?? '')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountHp, setAccountHp] = useState('')

  const fileRef = useRef<HTMLInputElement | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string>('')

  const canSubmit = useMemo(() => {
    return !!oldPassword.trim() && !!newPassword.trim() && !!confirmPassword.trim() && !loading
  }, [oldPassword, newPassword, confirmPassword, loading])

  const validate = () => {
    if (!oldPassword.trim()) return 'Password lama wajib diisi'
    if (!newPassword.trim()) return 'Password baru wajib diisi'
    if (newPassword.trim().length < 6) return 'Password baru minimal 6 karakter'
    if (newPassword === oldPassword) return 'Password baru tidak boleh sama dengan password lama'
    if (confirmPassword !== newPassword) return 'Konfirmasi password tidak sama'
    return ''
  }

  const handleSubmit = async () => {
    const msg = validate()
    setError(msg)
    if (msg) return

    setLoading(true)
    try {
      await changePassword({
        username: user?.username ?? undefined,
        oldPassword,
        newPassword,
      })

      showSnackbar('Password berhasil diubah', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    } catch (e: any) {
      const m = e?.message || 'Gagal mengubah password'
      setError(m)
      showSnackbar(m, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePickPhoto = () => fileRef.current?.click()

  const handlePhotoSelected = (file: File | null) => {
    setPhotoError('')
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoError('Format photo harus JPG/PNG/GIF')
      return
    }

    const max = 100 * 1024 // 100KB (sesuai contoh)
    if (file.size > max) {
      setPhotoError('Ukuran photo maksimal 100KB')
      return
    }

    const preview = URL.createObjectURL(file)
    setPhotoFile(file)
    setPhotoPreview(preview)
  }

  const handleResetPhoto = () => {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSaveAccount = async () => {
    if (!photoFile) {
      showSnackbar('Tidak ada perubahan photo untuk disimpan.', 'info')
      return
    }

    setLoading(true)
    try {
      await uploadProfilePhoto(photoFile)
      // refresh me → simpan auth_user baru (agar header ikut update)
      const me = await getMe()
      localStorage.setItem('auth_user', JSON.stringify(me.user))
      showSnackbar('Photo profil berhasil diubah', 'success')
      handleResetPhoto()
    } catch (e: any) {
      showSnackbar(e?.message || 'Gagal mengubah photo profil', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 3.25,
              borderRadius: 3,
              borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.12) : alpha('#0f172a', 0.08),
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'linear-gradient(180deg, rgba(2,132,199,0.06), rgba(255,255,255,1) 55%)',
            })}
          >
            <Stack spacing={2.25} alignItems="center" textAlign="center">
              <Avatar
                src={photoPreview || user?.avatar || '/images/profile/user-1.jpg'}
                sx={(theme) => ({
                  width: 132,
                  height: 132,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontWeight: 900,
                  fontSize: 42,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                })}
              >
                {(user?.fullName?.[0] ?? user?.username?.[0] ?? 'U').toUpperCase()}
              </Avatar>

              <Box>
                <Typography fontWeight={900} fontSize={18.5} lineHeight={1.2}>
                  {user?.fullName ?? '-'}
                </Typography>
                <Typography fontSize={13.5} color="text.secondary">
                  {user?.username ?? '-'}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={user?.role ?? '-'}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: theme.palette.success.dark,
                      fontWeight: 800,
                      fontSize: 12,
                      borderRadius: 999,
                    })}
                  />
                </Box>
              </Box>

              <Divider flexItem sx={{ opacity: 0.7 }} />

              <Box width="100%">
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between" gap={2}>
                    <Typography fontSize={13} color="text.secondary">
                      Username
                    </Typography>
                    <Typography fontSize={13} fontWeight={900} sx={{ textAlign: 'right' }}>
                      {user?.username ?? '-'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" gap={2}>
                    <Typography fontSize={13} color="text.secondary">
                      Role
                    </Typography>
                    <Typography fontSize={13} fontWeight={900} sx={{ textAlign: 'right' }}>
                      {user?.role ?? '-'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" gap={2}>
                    <Typography fontSize={13} color="text.secondary">
                      Cabang
                    </Typography>
                    <Typography fontSize={13} fontWeight={900} sx={{ textAlign: 'right' }}>
                      {user?.cabang ?? '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 0,
              borderRadius: 3,
              borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.12) : alpha('#0f172a', 0.08),
            })}
          >
            <Box sx={{ px: 2, pt: 1.5 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 800 },
                }}
              >
                <Tab
                  value="akun"
                  icon={<IconUser size={16} />}
                  iconPosition="start"
                  label="Akun"
                />
                <Tab
                  value="password"
                  icon={<IconLock size={16} />}
                  iconPosition="start"
                  label="Ganti Password"
                />
              </Tabs>
            </Box>

            <Divider sx={{ opacity: 0.7 }} />

            <Box sx={{ p: 2 }}>
              {activeTab === 'akun' ? (
                <Box>
                  <Typography fontWeight={900} fontSize={14.5} mb={1}>
                    Profile Pengguna
                  </Typography>
                  <Typography fontSize={12.5} color="text.secondary" mb={2}>
                    Informasi akun. (Untuk edit detail seperti email/HP, endpoint belum tersedia.)
                  </Typography>

                  <Box
                    sx={(theme) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                      mb: 2,
                    })}
                  >
                    <Avatar
                      src={photoPreview || user?.avatar || '/images/profile/user-1.jpg'}
                      sx={{ width: 56, height: 56, borderRadius: 2 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} fontSize={13.5} lineHeight={1.2}>
                        Photo Profil
                      </Typography>
                      <Typography fontSize={12} color="text.secondary" lineHeight={1.2} sx={{ mt: 0.35 }}>
                        Allowed JPG, GIF, or PNG. Max size 100KB
                      </Typography>
                      {photoError ? (
                        <Typography fontSize={12} color="error.main" sx={{ mt: 0.5 }}>
                          {photoError}
                        </Typography>
                      ) : null}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoSelected(e.target.files?.[0] ?? null)}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handlePickPhoto}
                        disabled={loading}
                        sx={{ textTransform: 'none', fontWeight: 800, minWidth: 150 }}
                      >
                        Upload New Photo
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleResetPhoto}
                        disabled={loading || (!photoFile && !photoPreview)}
                        sx={{ textTransform: 'none', minWidth: 90 }}
                      >
                        Reset
                      </Button>
                    </Stack>
                  </Box>

                  <Stack spacing={1.15}>
                    <TextField
                      size="small"
                      label="Nama Lengkap"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                    />
                    <TextField
                      size="small"
                      label="Username"
                      value={accountUsername}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                    />
                    <TextField
                      size="small"
                      label="Email"
                      placeholder="(belum tersedia)"
                      value={accountEmail}
                      onChange={(e) => setAccountEmail(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                    />
                    <TextField
                      size="small"
                      label="HP"
                      placeholder="(belum tersedia)"
                      value={accountHp}
                      onChange={(e) => setAccountHp(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                    />
                  </Stack>

                  <Box
                    mt={2}
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{ textTransform: 'none', fontWeight: 800, minWidth: 120 }}
                      onClick={handleSaveAccount}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Stack direction="row" spacing={1.25} alignItems="center" mb={1.5}>
                    <Box
                      sx={(theme) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.warning.main, 0.12),
                        color: theme.palette.warning.dark,
                      })}
                    >
                      <IconKey size={20} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontSize={15} fontWeight={900} lineHeight={1.2}>
                        Ganti Password
                      </Typography>
                      <Typography fontSize={12.5} color="text.secondary" lineHeight={1.2}>
                        Masukkan password lama dan password baru Anda
                      </Typography>
                    </Box>
                  </Stack>

                  {error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  ) : null}

                  <Stack spacing={1.15}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Password Lama"
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showOld ? 'Sembunyikan password' : 'Lihat password'}
                              onClick={() => setShowOld((v) => !v)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              tabIndex={-1}
                            >
                              {showOld ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Password Baru"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="Minimal 6 karakter"
                      sx={inputCompactStyle}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showNew ? 'Sembunyikan password' : 'Lihat password'}
                              onClick={() => setShowNew((v) => !v)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              tabIndex={-1}
                            >
                              {showNew ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Konfirmasi Password Baru"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showConfirm ? 'Sembunyikan password' : 'Lihat password'}
                              onClick={() => setShowConfirm((v) => !v)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              tabIndex={-1}
                            >
                              {showConfirm ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box
                      mt={0.75}
                      pt={1.25}
                      sx={(theme) => ({
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        borderTop: `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
                      })}
                    >
                      <Button
                        variant="outlined"
                        disabled={loading}
                        onClick={() => {
                          setOldPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                          setError('')
                        }}
                        sx={{ textTransform: 'none', minWidth: 120 }}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="contained"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        sx={{ textTransform: 'none', minWidth: 190, fontWeight: 800 }}
                      >
                        {loading ? <CircularProgress size={18} color="inherit" /> : 'Simpan Perubahan'}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

