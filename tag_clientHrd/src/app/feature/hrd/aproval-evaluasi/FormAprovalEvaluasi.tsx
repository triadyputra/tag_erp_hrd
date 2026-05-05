'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, Divider, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import dayjs from 'dayjs'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'
import { formatDate, formatNumber } from '@/utils/format'
import { useSnackbar } from '@/app/context/SnackbarContext'
import { getAuthUser } from '@/helpers/auth.helper'
import type { AprovalEvaluasiRow, UpdateAprovalEvaluasiPayload } from '@/services/hrd/aproval-evaluasi.service'
import { getDetailMasterKtp, getFilterMasterKtp } from '@/hooks/useComboGroup'

const KEPUTUSAN_OPTIONS = [
  { label: 'MENUNGGU', value: 'MENUNGGU' },
  { label: 'PERPANJANG', value: 'PERPANJANG' },
  { label: 'TIDAK PERPANJANG', value: 'TIDAK PERPANJANG' },
] as const

type Props = {
  open: boolean
  row: AprovalEvaluasiRow | null
  onClose: () => void
  onSubmit: (payload: UpdateAprovalEvaluasiPayload) => Promise<void>
}

export default function FormAprovalEvaluasi({ open, row, onClose, onSubmit }: Props) {
  const { showSnackbar } = useSnackbar()

  const user = getAuthUser()
  const defaultStaff = useMemo(
    () => ({
      NikHrdStaff: user?.username ?? '',
      NmHrdStaff: user?.fullName ?? '',
      ValidUser: user?.username ?? '',
    }),
    [user?.username, user?.fullName]
  )

  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<UpdateAprovalEvaluasiPayload>({
    NoTran: '',
    CatatanHrd: '',
    NikHrdStaff: defaultStaff.NikHrdStaff,
    NmHrdStaff: defaultStaff.NmHrdStaff,
    Keputusan: 'MENUNGGU',
    ValidUser: defaultStaff.ValidUser,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [staffKeyword, setStaffKeyword] = useState('')
  const [staffList, setStaffList] = useState<any[]>([])
  const [loadingStaffSearch, setLoadingStaffSearch] = useState(false)
  const [loadingStaffSelect, setLoadingStaffSelect] = useState(false)
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)

  useEffect(() => {
    if (!open) return

    setErrors({})
    setStaffList([])
    setShowStaffDropdown(false)
    setValues({
      NoTran: row?.NoTran ?? '',
      CatatanHrd: row?.CatatanHrd ?? '',
      NikHrdStaff: defaultStaff.NikHrdStaff,
      NmHrdStaff: defaultStaff.NmHrdStaff,
      Keputusan: (row?.Keputusan?.trim() ? String(row?.Keputusan).toUpperCase() : 'MENUNGGU') as any,
      ValidUser: defaultStaff.ValidUser,
    })
    setStaffKeyword(defaultStaff.NmHrdStaff ?? '')
  }, [open, row?.NoTran, row?.CatatanHrd, row?.Keputusan, defaultStaff.NikHrdStaff, defaultStaff.NmHrdStaff, defaultStaff.ValidUser])

  useEffect(() => {
    if (!showStaffDropdown) return

    if (!staffKeyword || staffKeyword.trim().length < 3) {
      setStaffList([])
      setLoadingStaffSearch(false)
      return
    }

    let active = true
    setLoadingStaffSearch(true)

    const timeout = setTimeout(async () => {
      try {
        if (staffKeyword.trim().length < 3) {
          setStaffList([])
          return
        }
        const res = await getFilterMasterKtp(staffKeyword)
        if (active) setStaffList(res || [])
      } catch {
        if (active) setStaffList([])
      } finally {
        if (active) setLoadingStaffSearch(false)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [staffKeyword, showStaffDropdown])

  useEffect(() => {
    const handleClickOutside = () => setShowStaffDropdown(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelectStaff = async (item: any) => {
    try {
      setLoadingStaffSelect(true)
      const nama = String(item?.NAMALENGKAP ?? '').trim()
      const noKtp = String(item?.NOKTP ?? '').trim()

      if (!noKtp) throw new Error('No KTP staf HRD tidak ditemukan')

      const rawKtp = await getDetailMasterKtp(noKtp)
      const ktp: any = rawKtp?.Data ?? rawKtp
      const nikStaff = String(ktp?.NIKSISTAG ?? ktp?.NikSistag ?? ktp?.nikSistag ?? '').trim()

      if (!nikStaff) {
        throw new Error('NIK staf HRD tidak ditemukan')
      }

      setValues((prev) => ({
        ...prev,
        NmHrdStaff: nama,
        NikHrdStaff: nikStaff,
      }))
      setErrors((prev) => ({ ...prev, NmHrdStaff: '', NikHrdStaff: '' }))
      setStaffKeyword(nama)
      setShowStaffDropdown(false)
    } catch (e: any) {
      showSnackbar(e?.message || 'Gagal mengambil data staf HRD', 'error')
    } finally {
      setLoadingStaffSelect(false)
    }
  }

  const setField =
    (field: keyof UpdateAprovalEvaluasiPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value
      setValues((prev) => ({ ...prev, [field]: v }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleSubmit = async () => {
    const err: Record<string, string> = {}
    if (!values.NoTran) err.NoTran = 'No transaksi wajib diisi'
    if (!values.Keputusan) err.Keputusan = 'Keputusan wajib diisi'
    if (!values.NikHrdStaff?.trim()) err.NikHrdStaff = 'Staff HRD wajib diisi'
    if (!values.NmHrdStaff?.trim()) err.NmHrdStaff = 'Nama staff HRD wajib diisi'

    setErrors(err)
    if (Object.keys(err).length) return

    setLoading(true)
    try {
      await onSubmit({
        ...values,
        CatatanHrd: values.CatatanHrd?.trim() ? values.CatatanHrd : null,
        NikHrdStaff: values.NikHrdStaff?.trim() ? values.NikHrdStaff : null,
        NmHrdStaff: values.NmHrdStaff?.trim() ? values.NmHrdStaff : null,
        ValidUser: values.ValidUser?.trim() ? values.ValidUser : null,
      })
    } catch (e: any) {
      showSnackbar(e?.message || 'Gagal menyimpan approval evaluasi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const tglMasuk = row?.TglMasuk ? formatDate(row.TglMasuk) : '-'
  const tglNilai = row?.TglNilai ? formatDate(row.TglNilai) : '-'
  const tglAwal = row?.PAwal ? formatDate(row.PAwal) : '-'
  const tglAkhir = row?.PAkhir ? formatDate(row.PAkhir) : '-'

  return (
    <Dialog
      open={open}
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
        title="Approval Evaluasi Kontrak"
        subtitle="Catatan HRD & keputusan kontrak"
        statusLabel="APPROVAL"
        statusColor="info"
      />

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <SectionTitle title="Data Evaluasi" subtitle="Informasi evaluasi (read-only)" />

            <Stack spacing={1.25}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="No. Evaluasi"
                    value={row?.NoTran ?? '-'}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.NoTran}
                    helperText={errors.NoTran}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nama Karyawan"
                    value={row?.NmKaryawan ?? '-'}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="NIK Karyawan"
                    value={row?.Nip ?? '-'}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="No Kontrak"
                    value={row?.NoKontrak ?? '-'}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tgl Masuk"
                    value={tglMasuk}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tgl A. Kontrak"
                    value={tglAwal}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tgl H. Kontrak"
                    value={tglAkhir}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nilai Aspek"
                    value={formatNumber(Number(row?.Nilai ?? 0))}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tanggal Nilai"
                    value={tglNilai}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Rekomendasi"
                    value={row?.Rekomendasi ?? '-'}
                    disabled
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Alasan"
                value={row?.Catatan ?? '-'}
                disabled
                multiline
                minRows={2}
                InputLabelProps={{ shrink: true }}
                sx={(theme) => ({
                  ...inputCompactStyle(theme),
                  '& .MuiOutlinedInput-root': {
                    height: 'auto',
                    minHeight: 'auto',
                    alignItems: 'flex-start',
                  },
                })}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <SectionTitle title="Catatan HRD" subtitle="Pengisian oleh HRD Pusat" />

            <Stack spacing={1.25}>
              <TextField
                fullWidth
                size="small"
                label="Catatan HRD"
                value={values.CatatanHrd ?? ''}
                onChange={setField('CatatanHrd')}
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
                sx={(theme) => ({
                  ...inputCompactStyle(theme),
                  '& .MuiOutlinedInput-root': {
                    height: 'auto',
                    minHeight: 'auto',
                    alignItems: 'flex-start',
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '12px 14px',
                    fontSize: 13,
                    lineHeight: 1.5,
                  },
                })}
              />

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Box position="relative" onClick={(e) => e.stopPropagation()}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nama Staf HRD Pusat (cari min. 3 huruf)"
                      value={staffKeyword}
                      onChange={(e) => {
                        const next = e.target.value
                        setStaffKeyword(next)
                        setErrors((prev) => ({ ...prev, NmHrdStaff: '' }))

                        if (!next.trim()) {
                          setValues((prev) => ({ ...prev, NmHrdStaff: '', NikHrdStaff: '' }))
                          setStaffList([])
                          setShowStaffDropdown(false)
                          return
                        }

                        if (next !== values.NmHrdStaff) {
                          setValues((prev) => ({ ...prev, NikHrdStaff: '' }))
                        }

                        setShowStaffDropdown(next.trim().length >= 3)
                      }}
                      onFocus={() => setShowStaffDropdown(staffKeyword.trim().length >= 3)}
                      sx={inputCompactStyle}
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.NmHrdStaff}
                      helperText={errors.NmHrdStaff}
                    />

                    {showStaffDropdown && (
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
                          zIndex: 12,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Box maxHeight={220} overflow="auto">
                          {loadingStaffSearch || loadingStaffSelect ? (
                            <Box p={2} textAlign="center">
                              <CircularProgress size={20} />
                              {loadingStaffSelect && (
                                <Typography fontSize={12} mt={1} color="text.secondary">
                                  Mengambil NIK staf...
                                </Typography>
                              )}
                            </Box>
                          ) : staffKeyword.trim().length < 3 ? (
                            <Box p={2}>
                              <Typography fontSize={12} color="text.secondary">
                                Ketik minimal 3 huruf
                              </Typography>
                            </Box>
                          ) : staffList.length === 0 ? (
                            <Box p={2}>
                              <Typography fontSize={13}>Data tidak ditemukan</Typography>
                            </Box>
                          ) : (
                            staffList.map((it, i) => (
                              <Box
                                key={i}
                                onClick={() => handleSelectStaff(it)}
                                sx={{
                                  p: 1.5,
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f1f5f9',
                                  '&:hover': { bgcolor: '#f9fafb' },
                                }}
                              >
                                <Typography fontWeight={600} fontSize={13}>
                                  {it.NAMALENGKAP}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {it.NOKTP ?? it.NIKSISTAG ?? '-'} • {it.KDCABANG}
                                </Typography>
                              </Box>
                            ))
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="NIK Staf HRD Pusat"
                    value={values.NikHrdStaff ?? ''}
                    InputProps={{ readOnly: true }}
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.NikHrdStaff}
                    helperText={errors.NikHrdStaff}
                  />
                </Grid>
              </Grid>

              <TextField
                select
                fullWidth
                size="small"
                label="Keputusan Kontrak"
                value={values.Keputusan}
                onChange={setField('Keputusan')}
                sx={inputCompactStyle}
                InputLabelProps={{ shrink: true }}
                error={!!errors.Keputusan}
                helperText={errors.Keputusan}
              >
                {KEPUTUSAN_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>

              <Typography fontSize={11} color="text.secondary">
                Valid user: {values.ValidUser || '-'}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Selesai
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !values.NoTran}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

