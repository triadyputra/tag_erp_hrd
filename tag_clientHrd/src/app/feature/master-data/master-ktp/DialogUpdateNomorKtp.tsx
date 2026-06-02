'use client'

import React, { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import { updateNomorMasterKtp } from '@/services/master-data/master-ktp.service'

export interface UpdateNomorKtpRow {
  Noktp?: string
  NamaLengkap?: string
}

interface Props {
  open: boolean
  row?: UpdateNomorKtpRow | null
  onClose: () => void
  onSuccess?: () => void | Promise<void>
}

const DialogUpdateNomorKtp: React.FC<Props> = ({
  open,
  row,
  onClose,
  onSuccess,
}) => {
  const [noktpLama, setNoktpLama] = useState('')
  const [noktpBaru, setNoktpBaru] = useState('')
  const [errors, setErrors] = useState<{ noktpLama?: string; noktpBaru?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setNoktpLama(row?.Noktp?.trim() ?? '')
    setNoktpBaru('')
    setErrors({})
    setSubmitError(null)
  }, [open, row])

  const validate = () => {
    const next: { noktpLama?: string; noktpBaru?: string } = {}
    const lama = noktpLama.trim()
    const baru = noktpBaru.trim()

    if (!lama) next.noktpLama = 'Nomor KTP lama wajib diisi'
    if (!baru) next.noktpBaru = 'Nomor KTP baru wajib diisi'
    if (lama && baru && lama === baru) {
      next.noktpBaru = 'Nomor KTP baru harus berbeda dari nomor lama'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!validate()) return

    try {
      setSubmitting(true)
      await updateNomorMasterKtp({
        noktpLama: noktpLama.trim(),
        noktpBaru: noktpBaru.trim(),
      })
      await onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal memperbarui nomor KTP'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ubah Nomor KTP</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {row?.NamaLengkap ? (
            <Typography variant="body2" color="text.secondary">
              Karyawan: <strong>{row.NamaLengkap}</strong>
            </Typography>
          ) : null}

          {submitError ? (
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          ) : null}

          <TextField
            label="Nomor KTP Lama"
            size="small"
            fullWidth
            required
            value={noktpLama}
            onChange={(e) => setNoktpLama(e.target.value)}
            error={!!errors.noktpLama}
            helperText={errors.noktpLama}
            disabled={!!row?.Noktp || submitting}
            inputProps={{ maxLength: 20 }}
          />

          <TextField
            label="Nomor KTP Baru"
            size="small"
            fullWidth
            required
            value={noktpBaru}
            onChange={(e) => setNoktpBaru(e.target.value)}
            error={!!errors.noktpBaru}
            helperText={
              errors.noktpBaru ||
              'Nomor baru akan menggantikan nomor lama di master KTP dan data terkait'
            }
            disabled={submitting}
            inputProps={{ maxLength: 16 }}
            autoFocus={!!row?.Noktp}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogUpdateNomorKtp
