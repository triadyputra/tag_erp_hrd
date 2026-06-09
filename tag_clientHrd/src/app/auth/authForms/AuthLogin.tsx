'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

import { loginType } from '@/app/(DashboardLayout)/types/auth/auth'
import CustomTextField from '@/app/components/forms/theme-elements/CustomTextField'
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel'
import { login, getMe } from '@/services/auth.service'
import { setAuthToken } from '@/helpers/token.helper'
import { setAuthMenu } from '@/helpers/auth.helper'
import { IconEye, IconEyeOff } from '@tabler/icons-react'

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 🔒 Redirect kalau sudah login
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) router.replace('/')
  }, [router])

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username dan password wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await login({ username, password })

      setAuthToken(
        res.token,
        res.refreshToken,
        res.expiresIn
      )

      const me = await getMe()
      localStorage.setItem('auth_user', JSON.stringify(me.user))
      localStorage.setItem('auth_access', JSON.stringify(me.acces))
      setAuthMenu(me.Menu ?? [])

      window.location.replace(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {title && (
        <Typography fontWeight={700} variant="h3" mb={1}>
          {title}
        </Typography>
      )}

      {subtext}

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleLogin()
        }}
      >
        {/* 🔥 spacing + ukuran diperbaiki */}
        <Stack spacing={0} mt={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <CustomFormLabel sx={{ mb: 0.5 }}>Username</CustomFormLabel>
            <CustomTextField
              fullWidth
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              sx={{
                '& .MuiInputBase-root': {
                  height: 48,
                },
                mb: 0, // 🔒 pastikan tidak nambah jarak
              }}
            />
          </Box>

          <Box mb={2}>
            <CustomFormLabel sx={{ mb: 0.5 }}>Password</CustomFormLabel>
            <CustomTextField
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      onClick={() => setShowPassword((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: 48,
                },
                mb: 0, // 🔒 pastikan tidak nambah jarak
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{
              height: 48,
              fontWeight: 600,
              mt: 1,
            }}
          >
            {loading ? <CircularProgress size={22} /> : 'Sign In'}
          </Button>
        </Stack>
      </Box>

      {subtitle}
    </>
  )
}

export default AuthLogin
