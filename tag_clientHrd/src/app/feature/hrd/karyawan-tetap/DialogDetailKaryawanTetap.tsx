'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import {
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCreditCard,
  IconMapPin,
  IconPhone,
  IconUser,
  IconX,
  IconZoomIn,
} from '@tabler/icons-react'
import ImagePreviewDialog from '@/app/components/ImagePreview/ImagePreviewDialog'
import ProfileItem from '@/app/feature/hrd/history-kontrak-karyawan/ProfileItem'
import {
  cardStyle,
  headerStyle,
} from '@/app/feature/hrd/history-kontrak-karyawan/karyawanStyles'
import { fetchDetailKaryawanTetap } from '@/services/hrd/karyawan-tetap.service'

interface Props {
  open: boolean
  noktp: string | null
  onClose: () => void
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card elevation={0} sx={(theme) => ({ ...cardStyle(theme), height: '100%' })}>
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            })}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

function InfoPill({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.6,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color: theme.palette.text.secondary,
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha('#0284c7', 0.06),
        border: `1px solid ${
          theme.palette.mode === 'dark'
            ? alpha('#fff', 0.1)
            : alpha('#0f172a', 0.06)
        }`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: 'grid',
          placeItems: 'center',
          width: 22,
          height: 22,
          borderRadius: 999,
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha('#fff', 0.06)
              : alpha('#ffffff', 0.95),
        })}
      >
        {icon}
      </Box>
      <span>{text}</span>
    </Box>
  )
}

const DialogDetailKaryawanTetap: React.FC<Props> = ({ open, noktp, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [openPreview, setOpenPreview] = useState(false)

  useEffect(() => {
    if (!open || !noktp) {
      setDetail(null)
      setError(null)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const raw = await fetchDetailKaryawanTetap(noktp)
        if (!cancelled) setDetail(raw)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat detail'
          )
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, noktp])

  const foto =
    detail?.FotoBase64 ?? detail?.fotoBase64 ?? detail?.FOTO_BASE64 ?? null

  const nama = detail?.NamaLengkap ?? detail?.NAMALENGKAP ?? '—'
  const nik = detail?.NikSistag ?? detail?.NIKSISTAG ?? '—'
  const jabatan = detail?.NmJabatan ?? detail?.NMJABATAN ?? '—'
  const cabang = detail?.NmCabang ?? detail?.KDCABANG ?? '—'
  const divisi = detail?.NmDivisi ?? '—'

  const kelamin = useMemo(() => {
    if (detail?.Kelamin === 'L') return 'Laki-laki'
    if (detail?.Kelamin === 'P') return 'Perempuan'
    return detail?.Kelamin ?? '—'
  }, [detail?.Kelamin])

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID')
  }

  const hitungUsia = (tglLahir?: string | null) => {
    if (!tglLahir) return null
    const birth = new Date(tglLahir)
    if (Number.isNaN(birth.getTime())) return null
    const today = new Date()
    let tahun = today.getFullYear() - birth.getFullYear()
    const bln = today.getMonth() - birth.getMonth()
    if (bln < 0 || (bln === 0 && today.getDate() < birth.getDate())) tahun--
    return `${tahun} tahun`
  }

  const usia = hitungUsia(detail?.TglLahir)

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <IconButton
            onClick={onClose}
            aria-label="Tutup"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 10,
              bgcolor: alpha('#fff', 0.9),
              boxShadow: 2,
              '&:hover': { bgcolor: '#fff' },
            }}
          >
            <IconX size={18} />
          </IconButton>

          {loading ? (
            <Stack alignItems="center" justifyContent="center" py={10} spacing={1.5}>
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">
                Memuat profil karyawan...
              </Typography>
            </Stack>
          ) : error ? (
            <Stack alignItems="center" py={8} px={3}>
              <Typography color="error" textAlign="center" fontWeight={600}>
                {error}
              </Typography>
            </Stack>
          ) : detail ? (
            <>
              {/* Hero profil */}
              <Box
                sx={(theme) => ({
                  position: 'relative',
                  pb: 3,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.4)
                      : alpha('#f8fafc', 0.9),
                })}
              >
                <Box sx={(theme) => headerStyle(theme)} />

                <Stack
                  alignItems="center"
                  textAlign="center"
                  sx={{ mt: -8, px: 3, position: 'relative' }}
                >
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={foto ?? undefined}
                      sx={{
                        width: 128,
                        height: 128,
                        fontSize: 44,
                        border: '5px solid',
                        borderColor: 'background.paper',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                        '& img': { objectFit: 'cover' },
                      }}
                    >
                      {nama.charAt(0)}
                    </Avatar>
                    {foto ? (
                      <IconButton
                        size="small"
                        onClick={() => setOpenPreview(true)}
                        sx={{
                          position: 'absolute',
                          right: 4,
                          bottom: 4,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <IconZoomIn size={16} />
                      </IconButton>
                    ) : null}
                  </Box>

                  <Chip
                    label="Karyawan Tetap"
                    size="small"
                    color="primary"
                    sx={{ mt: 1.5, fontWeight: 700, letterSpacing: 0.3 }}
                  />

                  <Typography variant="h5" fontWeight={800} mt={1} lineHeight={1.2}>
                    {nama}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: '#64748B', fontWeight: 600, mt: 0.5 }}
                  >
                    NIK {nik}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" mt={0.25}>
                    {jabatan}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={1}
                    mt={2}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <InfoPill
                      icon={<IconBuilding size={14} />}
                      text={cabang}
                    />
                    <InfoPill
                      icon={<IconBriefcase size={14} />}
                      text={divisi}
                    />
                    <InfoPill
                      icon={<IconCalendar size={14} />}
                      text={
                        detail.TglMasuk
                          ? `Masuk ${formatDate(detail.TglMasuk)}`
                          : 'Tgl masuk —'
                      }
                    />
                    {detail.NoTelepon ? (
                      <InfoPill
                        icon={<IconPhone size={14} />}
                        text={detail.NoTelepon}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </Box>

              {/* Konten detail */}
              <Box sx={{ p: { xs: 2, sm: 3 }, pt: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionCard
                      title="Data Identitas"
                      icon={<IconUser size={20} />}
                    >
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="No KTP"
                            value={detail.Noktp ?? detail.NOKTP ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem label="NIK Sistag" value={nik} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Tempat Lahir"
                            value={detail.TempatLahir ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Tanggal Lahir"
                            value={
                              usia
                                ? `${formatDate(detail.TglLahir)} (${usia})`
                                : formatDate(detail.TglLahir)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem label="Jenis Kelamin" value={kelamin} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Status Perkawinan"
                            value={detail.Perkawinan ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <ProfileItem
                            label="Pendidikan"
                            value={detail.Pendidikan ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <ProfileItem label="Agama" value={detail.Agama ?? '—'} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <ProfileItem
                            label="Alamat"
                            value={detail.Alamat ?? '—'}
                          />
                        </Grid>
                      </Grid>
                    </SectionCard>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionCard
                      title="Kepegawaian"
                      icon={<IconBriefcase size={20} />}
                    >
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem label="Cabang" value={cabang} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Tanggal Masuk"
                            value={formatDate(detail.TglMasuk)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem label="Divisi" value={divisi} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Bagian"
                            value={detail.NmBagian ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="Sub Bagian"
                            value={detail.NmSubBagian ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem label="Jabatan" value={jabatan} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <ProfileItem
                            label="ID Finger"
                            value={detail.IdFinger ?? '—'}
                          />
                        </Grid>
                      </Grid>
                    </SectionCard>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <SectionCard
                      title="Administrasi & Keuangan"
                      icon={<IconCreditCard size={20} />}
                    >
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem
                            label="No Kontrak"
                            value={detail.NoKontrak ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem label="No SK" value={detail.NoSk ?? '—'} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem
                            label="Tanggal SK"
                            value={formatDate(detail.TglSk)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem label="No IM" value={detail.NoIm ?? '—'} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem label="Bank" value={detail.NmBank ?? '—'} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem
                            label="No Rekening"
                            value={detail.NoRekening ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem
                            label="No Telepon"
                            value={detail.NoTelepon ?? '—'}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <ProfileItem
                            label="Tanggal Input"
                            value={formatDate(detail.TglInput)}
                          />
                        </Grid>
                        {detail.ValidUser ? (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <ProfileItem
                              label="User Input"
                              value={detail.ValidUser}
                            />
                          </Grid>
                        ) : null}
                      </Grid>
                    </SectionCard>
                  </Grid>
                </Grid>

                {!foto ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    mt={2}
                    sx={(theme) => ({
                      py: 1.25,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                      color: 'text.secondary',
                    })}
                  >
                    <IconMapPin size={16} style={{ opacity: 0.5 }} />
                    <Typography variant="caption">
                      Foto karyawan belum diunggah pada data master
                    </Typography>
                  </Stack>
                ) : null}
              </Box>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ImagePreviewDialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        image={foto ?? undefined}
      />
    </>
  )
}

export default DialogDetailKaryawanTetap
