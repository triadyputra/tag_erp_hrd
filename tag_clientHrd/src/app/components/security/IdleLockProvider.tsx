'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Box, Button, Dialog, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { login } from '@/services/auth.service'
import { setAuthToken } from '@/helpers/token.helper'
import { getAuthUser } from '@/helpers/auth.helper'
import { useSnackbar } from '@/app/context/SnackbarContext'

const IDLE_LOCK_MS = 30 * 60 * 1000 // 10 menit

const SESSION_LOCK_KEY = 'idle_locked_hrd'
const SESSION_LOCKED_AT_KEY = 'idle_locked_hrd_at'

export default function IdleLockProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { showSnackbar } = useSnackbar()

  const isAuthPage = pathname?.startsWith('/auth') ?? false

  const [locked, setLocked] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockError, setUnlockError] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  const lastActivityAtRef = useRef<number>(Date.now())
  const lockedRef = useRef<boolean>(false)

  // Saat refresh (F5) atau tab direload, user tidak boleh "lepas lock" tanpa unlock.
  // Di halaman auth tidak memuat state lock dari sessionStorage (login harus selalu tampil).
  // mounted harus true di auth juga — jika tidak, `return null` di bawah membuat halaman login kosong.
  useEffect(() => {
    if (!isAuthPage) {
      try {
        const isLocked = sessionStorage.getItem(SESSION_LOCK_KEY) === '1'
        const lockedAtRaw = sessionStorage.getItem(SESSION_LOCKED_AT_KEY)

        if (isLocked) {
          lockedRef.current = true
          setLocked(true)
          setPassword('')
          setUnlockError('')

          const lockedAt = lockedAtRaw ? Number(lockedAtRaw) : Date.now()
          lastActivityAtRef.current = Math.max(0, lockedAt)
        }
      } catch {
        // ignore (mis. browser privasi)
      }
    }

    setMounted(true)
  }, [isAuthPage])

  useEffect(() => {
    lockedRef.current = locked
  }, [locked])

  useEffect(() => {
    const updateActivity = () => {
      if (lockedRef.current) return
      lastActivityAtRef.current = Date.now()
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    for (const evt of events) window.addEventListener(evt, updateActivity, { passive: true })
    return () => {
      for (const evt of events) window.removeEventListener(evt, updateActivity)
    }
  }, [])

  useEffect(() => {
    if (!mounted || isAuthPage) return

    const t = window.setInterval(() => {
      if (lockedRef.current) return
      const diff = Date.now() - lastActivityAtRef.current
      if (diff >= IDLE_LOCK_MS) {
        lockedRef.current = true
        sessionStorage.setItem(SESSION_LOCK_KEY, '1')
        sessionStorage.setItem(SESSION_LOCKED_AT_KEY, String(Date.now()))
        setLocked(true)
        setPassword('')
        setUnlockError('')
        showSnackbar('Aplikasi terkunci karena idle', 'warning')
      }
    }, 1000)

    return () => window.clearInterval(t)
  }, [mounted, isAuthPage, showSnackbar])

  // Jika user pindah ke halaman auth, buka lock otomatis
  useEffect(() => {
    if (isAuthPage && locked) {
      lockedRef.current = false
      setLocked(false)
      sessionStorage.removeItem(SESSION_LOCK_KEY)
      sessionStorage.removeItem(SESSION_LOCKED_AT_KEY)
      lastActivityAtRef.current = Date.now()
      setPassword('')
      setUnlockError('')
    }
  }, [isAuthPage, locked])

  const handleUnlock = async () => {
    const user = getAuthUser()
    if (!user?.username) {
      showSnackbar('Sesi tidak valid, silakan login ulang', 'error')
      setLocked(true)
      return
    }

    if (!password.trim()) {
      setUnlockError('Password wajib diisi')
      return
    }

    try {
      setUnlockLoading(true)
      setUnlockError('')

      // Konsep: "unlock" = re-auth tanpa pindah halaman login.
      const res = await login({ username: user.username, password })
      setAuthToken(res.token, res.refreshToken, res.expiresIn)

      lockedRef.current = false
      setLocked(false)
      sessionStorage.removeItem(SESSION_LOCK_KEY)
      sessionStorage.removeItem(SESSION_LOCKED_AT_KEY)
      lastActivityAtRef.current = Date.now()
      setPassword('')
      showSnackbar('Berhasil membuka kunci', 'success')
    } catch (err: any) {
      setUnlockError(err?.message || 'Password salah / tidak bisa membuka kunci')
      showSnackbar('Gagal membuka kunci', 'error')
    } finally {
      setUnlockLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      {children}

      <Dialog
        open={locked}
        disableEscapeKeyDown
        onClose={() => {
          /* sengaja di-nonaktifkan */
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Terkunci</DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary" sx={{ mb: 1.5 }}>
            Aplikasi terkunci karena tidak digunakan selama 10 menit. Masukkan password untuk melanjutkan.
          </Typography>

          <Box
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
          >
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!unlockError}
              helperText={unlockError}
              autoFocus
            />

            <Button
              variant="contained"
              onClick={handleUnlock}
              disabled={unlockLoading}
              sx={{ mt: 0.5 }}
            >
              {unlockLoading ? 'Membuka...' : 'Buka Kunci'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

