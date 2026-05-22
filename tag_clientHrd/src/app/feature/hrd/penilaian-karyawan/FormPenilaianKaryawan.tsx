'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { IconChevronDown, IconDeviceFloppy } from '@tabler/icons-react'
import { useSnackbar } from '@/app/context/SnackbarContext'
import {
  fetchAspekPenilaian,
  fetchDetailPenilaianKaryawan,
  FormEvaluasiKontrakPayload,
  ViewAspekPenilaianDto,
} from '@/services/hrd/penilaian-karyawan.service'
import {
  getDetailMasterKtp,
  getDetailPegawaiWithKontrakNik,
  getFilterMasterKtp,
  useComboBagian,
  useComboCabangWith,
  useComboDivisi,
  useComboJabatan,
} from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

export type AspekPenilaianRow = {
  id: number
  noUrut: number
  grupAspek: string
  kdAspek: string
  label: string
  nmGrp?: string | null
}

function mapRawAspekPenilaian(raw: ViewAspekPenilaianDto | Record<string, unknown>): AspekPenilaianRow | null {
  const r = raw as Record<string, unknown>
  const kd = String(r.KdAspek ?? r.kdAspek ?? '').trim()
  const grp = String(r.Grp ?? r.grp ?? '').trim()
  if (!kd || !grp) return null
  return {
    id: Number(r.Id ?? r.id ?? 0),
    noUrut: Number(r.NoUrut ?? r.noUrut ?? 0),
    grupAspek: grp,
    kdAspek: kd,
    label: String(r.NmAspek ?? r.nmAspek ?? '').trim() || kd,
    nmGrp: (r.NmGrp ?? r.nmGrp ?? null) as string | null,
  }
}

function emptyScoresFrom(rows: AspekPenilaianRow[]): Record<string, number> {
  return rows.reduce((acc, row) => {
    acc[row.kdAspek] = 0
    return acc
  }, {} as Record<string, number>)
}

function buildAspectBlocks(rows: AspekPenilaianRow[]): {
  key: string
  title: string
  rows: AspekPenilaianRow[]
}[] {
  const sorted = [...rows].sort((a, b) => a.noUrut - b.noUrut || a.id - b.id)
  const map = new Map<string, { nmGrp: string; rows: AspekPenilaianRow[] }>()
  const order: string[] = []
  for (const r of sorted) {
    if (!map.has(r.grupAspek)) {
      map.set(r.grupAspek, { nmGrp: r.nmGrp ?? '', rows: [] })
      order.push(r.grupAspek)
    }
    map.get(r.grupAspek)!.rows.push(r)
  }
  return order.map((key) => {
    const { nmGrp, rows: rs } = map.get(key)!
    const title = nmGrp?.trim() ? nmGrp.trim() : `Grup ${key}`
    return { key, title, rows: rs }
  })
}

const REKOMENDASI_OPTIONS = [
  // { title: 'PPK', value: 'PPK' },
  { title: 'PKWT', value: 'PKWT' },
  // { title: 'ADDENDUM', value: 'ADDENDUM' },
  // { title: 'FREELANCE', value: 'FREELANCE' },
  { title: 'KONTRAK TIDAK DIPERPANJANG', value: 'KONTRAK TIDAK DIPERPANJANG' },
]

function hitungUsiaString(tgl?: Dayjs | null): string {
  if (!tgl || !tgl.isValid()) return ''
  const now = dayjs()
  let years = now.diff(tgl, 'year')
  let cursor = tgl.add(years, 'year')
  let months = now.diff(cursor, 'month')
  if (months < 0) {
    years -= 1
    cursor = tgl.add(years, 'year')
    months = now.diff(cursor, 'month')
  }
  return `${years} tahun ${months} bulan`
}

/** Format angka untuk tampilan Indonesia (pemisah ribuan & desimal sesuai locale), mis. 1,80 */
/** Placeholder struktur accordion + tabel saat master aspek masih dimuat (mode tambah baru). */
function AspekPenilaianSkeletonPlaceholder() {
  const grupCount = 3
  const barisPerGrup = 2

  return (
    <Stack spacing={2}>
      {[...Array(grupCount)].map((_, gi) => (
        <Box
          key={gi}
          sx={(theme) => ({
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 4px 24px rgba(0,0,0,0.35)'
                : '0 4px 24px rgba(15, 23, 42, 0.07)',
          })}
        >
          <Skeleton
            variant="rectangular"
            height={52}
            animation="wave"
            sx={(theme) => ({
              borderRadius: 0,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.08),
            })}
          />
          <Box
            sx={(theme) => ({
              bgcolor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.default, 0.5)
                  : alpha(theme.palette.grey[50], 0.9),
            })}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={56} sx={{ py: 1, px: 2 }}>
                    <Skeleton width={28} height={14} animation="wave" />
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 2 }}>
                    <Skeleton width="45%" height={14} animation="wave" />
                  </TableCell>
                  <TableCell align="right" width={112} sx={{ py: 1, px: 2 }}>
                    <Skeleton width={48} height={14} sx={{ ml: 'auto' }} animation="wave" />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(barisPerGrup)].map((__, ri) => (
                  <TableRow key={ri}>
                    <TableCell sx={{ py: 1.25, px: 2, verticalAlign: 'middle' }}>
                      <Skeleton variant="rounded" width={28} height={28} animation="wave" />
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Skeleton width={`${68 + ri * 8}%`} height={18} animation="wave" />
                      <Skeleton width={`${42 + ri * 6}%`} height={12} sx={{ mt: 0.75 }} animation="wave" />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 2 }}>
                      <Skeleton
                        width={88}
                        height={36}
                        variant="rounded"
                        sx={{ ml: 'auto', borderRadius: 1 }}
                        animation="wave"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      ))}
    </Stack>
  )
}

function formatAngkaId(n: number, minFrac = 2, maxFrac = 2): string {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  })
}

/** Bulatkan ke 2 digit desimal (menghindari float panjang seperti 4,666666…) */
function round2(n: number): number {
  return Number.parseFloat(Number(n).toFixed(2))
}

/** Skala penilaian per kriteria (combo 1–5; default belum pilih = 0) */
const NILAI_SKALA = [1, 2, 3, 4, 5] as const

/** Normalisasi nilai dari DB: 0 tetap 0; lainnya dibulatkan ke 1–5 */
function normalizeNilaiDariApi(n: unknown): number {
  const x = Number(n)
  if (!Number.isFinite(x) || x <= 0) return 0
  return Math.min(5, Math.max(1, Math.round(x)))
}

export interface FormPenilaianValues {
  NoTran: string
  Nip: string
  Nik: string
  NoKontrak: string
  NamaKaryawan: string
  TglLahir: string
  Usia: string
  KdDepartemen: string
  NmDepartemen: string
  KdBagian: string
  NmBagian: string
  KdJabatan: string
  NmJabatan: string
  TglMasuk: string
  TglHabisKontrak: string
  NikAtasan: string
  NamaAtasan: string
  TglNilai: string
  PAwal: string
  PAkhir: string
  Nilai: number
  Rekomendasi: string
  Catatan: string
  KdCabang: string
}

const defaultValues: FormPenilaianValues = {
  NoTran: '',
  Nip: '',
  Nik: '',
  NoKontrak: '',
  NamaKaryawan: '',
  TglLahir: '',
  Usia: '',
  KdDepartemen: '',
  NmDepartemen: '',
  KdBagian: '',
  NmBagian: '',
  KdJabatan: '',
  NmJabatan: '',
  TglMasuk: '',
  TglHabisKontrak: '',
  NikAtasan: '',
  NamaAtasan: '',
  TglNilai: dayjs().format('YYYY-MM-DD'),
  PAwal: '',
  PAkhir: '',
  Nilai: 0,
  Rekomendasi: '',
  Catatan: '',
  KdCabang: '',
}

interface Props {
  noTran?: string | null
  onClose: () => void
  onSubmit: (payload: FormEvaluasiKontrakPayload) => Promise<string | void>
}

const FormPenilaianKaryawan: React.FC<Props> = ({ noTran, onClose, onSubmit }) => {
  const { showSnackbar } = useSnackbar()
  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [values, setValues] = useState<FormPenilaianValues>(defaultValues)

  const { data: divisiOptions, loading: loadingDivisi } = useComboDivisi()
  const { data: bagianOptions, loading: bagianLoading } = useComboBagian(values.KdDepartemen)
  const { data: jabatanOptions, loading: loadingJabatan } = useComboJabatan()
  const [aspekRows, setAspekRows] = useState<AspekPenilaianRow[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loadingAspek, setLoadingAspek] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = !!noTran

  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<any[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [atasanKeyword, setAtasanKeyword] = useState('')
  const [atasanList, setAtasanList] = useState<any[]>([])
  const [loadingAtasanSearch, setLoadingAtasanSearch] = useState(false)
  const [loadingAtasanSelect, setLoadingAtasanSelect] = useState(false)
  const [showAtasanDropdown, setShowAtasanDropdown] = useState(false)

  useEffect(() => {
    const cab = getCabang()
    if (cab && cab.trim() !== '') {
      setValues((prev) => ({ ...prev, KdCabang: cab }))
    }
  }, [])

  /** Mode baru / edit: satu fase loading — edit memuat master aspek + detail evaluasi paralel (tanpa bergantian dua kali). */
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoadingAspek(true)
        const mapAspek = (raw: ViewAspekPenilaianDto[]) =>
          raw
            .map((row) => mapRawAspekPenilaian(row as ViewAspekPenilaianDto))
            .filter((r): r is AspekPenilaianRow => r !== null)

        if (noTran) {
          const [rawAspek, detailRes] = await Promise.all([
            fetchAspekPenilaian(),
            fetchDetailPenilaianKaryawan(noTran),
          ])
          if (!active) return

          const mapped = mapAspek(rawAspek)
          setAspekRows(mapped)

          const d: any = detailRes
          const tglLahir = d.TglLahir?.substring?.(0, 10) ?? ''
          const tl = tglLahir ? dayjs(tglLahir) : null

          setValues({
            NoTran: d.NoTran ?? '',
            Nip: d.Nip ?? '',
            Nik: d.Nik ?? '',
            NoKontrak: d.NoKontrak ?? '',
            NamaKaryawan: d.NamaKaryawan ?? '',
            TglLahir: tglLahir,
            Usia: d.Usia ?? (tl ? hitungUsiaString(tl) : ''),
            KdDepartemen: d.KdDepartemen ?? '',
            NmDepartemen: '',
            KdBagian: d.KdBagian ?? '',
            NmBagian: '',
            KdJabatan: d.KdJabatan ?? '',
            NmJabatan: '',
            TglMasuk: d.TglMasuk?.substring?.(0, 10) ?? '',
            TglHabisKontrak: d.TglHabisKontrak?.substring?.(0, 10) ?? '',
            NikAtasan: d.NikAtasan ?? '',
            NamaAtasan: d.NamaAtasan ?? '',
            TglNilai: d.TglNilai?.substring?.(0, 10) ?? dayjs().format('YYYY-MM-DD'),
            PAwal: d.PAwal?.substring?.(0, 10) ?? '',
            PAkhir: d.PAkhir?.substring?.(0, 10) ?? '',
            Nilai: round2(Number(d.Nilai ?? 0)),
            Rekomendasi: d.Rekomendasi ?? '',
            Catatan: d.Catatan ?? '',
            KdCabang: d.KdCabang ?? '',
          })

          const nextScores = emptyScoresFrom(mapped)
          const details = d.Details ?? d.details ?? []
          for (const row of details) {
            const kd = String(row.KdAspek ?? row.kdAspek ?? '').trim()
            if (kd && nextScores[kd] !== undefined) {
              nextScores[kd] = normalizeNilaiDariApi(row.Nilai ?? row.nilai ?? 0)
            }
          }
          setScores(nextScores)
          setSelected({ NAMALENGKAP: d.NamaKaryawan })
          setKeyword(d.NamaKaryawan ?? '')
          setAtasanKeyword(d.NamaAtasan ?? '')
        } else {
          const raw = await fetchAspekPenilaian()
          if (!active) return
          const mapped = mapAspek(raw)
          setAspekRows(mapped)
        }
      } catch (err: any) {
        if (active) {
          showSnackbar(
            err?.message ||
              (noTran ? 'Gagal memuat data penilaian' : 'Gagal memuat master aspek penilaian'),
            'error'
          )
        }
      } finally {
        if (active) setLoadingAspek(false)
      }
    })()
    return () => {
      active = false
    }
  }, [noTran, showSnackbar])

  /** Mode baru: isi skor 0 per kd begitu master aspek selesai dimuat */
  useEffect(() => {
    if (aspekRows.length === 0 || noTran) return
    setScores((prev) => {
      const next = emptyScoresFrom(aspekRows)
      for (const kd of Object.keys(next)) {
        if (prev[kd] !== undefined) next[kd] = prev[kd]!
      }
      return next
    })
  }, [aspekRows, noTran])

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
    if (!showAtasanDropdown) return

    if (!atasanKeyword || atasanKeyword.trim().length < 3) {
      setAtasanList([])
      setLoadingAtasanSearch(false)
      return
    }

    let active = true
    setLoadingAtasanSearch(true)

    const timeout = setTimeout(async () => {
      try {
        if (atasanKeyword.length < 3) {
          setAtasanList([])
          return
        }

        const res = await getFilterMasterKtp(atasanKeyword)
        if (active) setAtasanList(res || [])
      } catch {
        if (active) setAtasanList([])
      } finally {
        if (active) setLoadingAtasanSearch(false)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [atasanKeyword, showAtasanDropdown])

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false)
      setShowAtasanDropdown(false)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelect = async (item: any) => {
    try {
      setSelected(item)
      setKeyword(item.NAMALENGKAP)
      setShowDropdown(false)
      setLoadingDetail(true)

      /* Lookup KTP hanya untuk dapatkan NIK sistem — data utama dari GetDetailPegawaiWithKontrakNik */
      const rawKtp = await getDetailMasterKtp(item.NOKTP)
      const ktp: any = rawKtp?.Data ?? rawKtp
      const nikSistem = String(
        ktp?.NIKSISTAG ?? ktp?.NikSistag ?? ktp?.nikSistag ?? ''
      ).trim()

      if (!nikSistem) {
        throw new Error('NIK sistem tidak ditemukan untuk KTP yang dipilih')
      }

      const raw = await getDetailPegawaiWithKontrakNik(nikSistem)
      const k: any = raw?.Data ?? raw

      const tgllRaw = k.TglLahir ?? k.tglLahir
      const tgll = tgllRaw ? dayjs(tgllRaw) : null

      const tglMasukSrc = k.BeginDate ?? k.beginDate ?? k.Tmt ?? k.tmt
      const tglHabisSrc = k.PAkhir ?? k.pAkhir ?? k.EndDate ?? k.endDate
      const pAwalSrc = k.PAwal ?? k.pAwal
      const pAkhirSrc = k.PAkhir ?? k.pAkhir

      const noKtpDisplay = String(k.NoKtp ?? k.noKtp ?? item.NOKTP ?? '').trim()

      setValues((prev) => ({
        ...prev,
        NoTran: '',
        Nip: k.NikSistag ?? k.nikSistag ?? nikSistem,
        Nik: noKtpDisplay,
        NoKontrak: k.NoKontrak ?? k.noKontrak ?? '',
        NamaKaryawan: k.NmKaryawan ?? k.nmKaryawan ?? '',
        TglLahir: tgll?.isValid() ? tgll.format('YYYY-MM-DD') : '',
        Usia: tgll?.isValid() ? hitungUsiaString(tgll) : '',
        KdDepartemen: k.KdDivisi ?? k.kdDivisi ?? '',
        NmDepartemen: k.NmDivisi ?? k.nmDivisi ?? '',
        KdBagian: k.KdBagian ?? k.kdBagian ?? '',
        NmBagian: k.NmBagian ?? k.nmBagian ?? '',
        KdJabatan: k.KdJabatan ?? k.kdJabatan ?? '',
        NmJabatan: k.NmJabatan ?? k.nmJabatan ?? '',
        TglMasuk: tglMasukSrc ? dayjs(tglMasukSrc).format('YYYY-MM-DD') : '',
        TglHabisKontrak: tglHabisSrc ? dayjs(tglHabisSrc).format('YYYY-MM-DD') : '',
        PAwal: pAwalSrc ? dayjs(pAwalSrc).format('YYYY-MM-DD') : '',
        PAkhir: pAkhirSrc ? dayjs(pAkhirSrc).format('YYYY-MM-DD') : '',
        NikAtasan: '',
        NamaAtasan: '',
        KdCabang: k.KdCabang ?? k.kdCabang ?? prev.KdCabang,
      }))
      setAtasanKeyword('')
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal mengambil data karyawan', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  const setField =
    (field: keyof FormPenilaianValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e?.target?.value
      setValues((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const handleSelectAtasan = async (item: any) => {
    try {
      setLoadingAtasanSelect(true)
      const nama = String(item?.NAMALENGKAP ?? '').trim()
      const noKtp = String(item?.NOKTP ?? '').trim()

      if (!noKtp) throw new Error('No KTP atasan tidak ditemukan')

      const rawKtp = await getDetailMasterKtp(noKtp)
      const ktp: any = rawKtp?.Data ?? rawKtp
      const nikKaryawan = String(
        ktp?.NIKSISTAG ?? ktp?.NikSistag ?? ktp?.nikSistag ?? ''
      ).trim()

      if (!nikKaryawan) {
        throw new Error('NIK karyawan atasan tidak ditemukan')
      }

      setValues((prev) => ({
        ...prev,
        NamaAtasan: nama,
        NikAtasan: nikKaryawan,
      }))
      setErrors((prev) => ({ ...prev, NamaAtasan: '' }))
      setAtasanKeyword(nama)
      setShowAtasanDropdown(false)
    } catch (err: any) {
      showSnackbar(err?.message || 'Gagal mengambil data atasan', 'error')
    } finally {
      setLoadingAtasanSelect(false)
    }
  }

  const aspectBlocks = useMemo(() => buildAspectBlocks(aspekRows), [aspekRows])

  /** Jumlah & rata-rata per grup aspek (dinamis mengikuti master API) */
  const statsPerGrupByKey = useMemo(() => {
    const m = new Map<string, { jumlah: number; rata: number }>()
    for (const block of aspectBlocks) {
      const vals = block.rows.map((r) => Number(scores[r.kdAspek] ?? 0))
      const jumlah = vals.reduce((a, b) => a + b, 0)
      const n = vals.length
      const rata = n > 0 ? round2(jumlah / n) : 0
      m.set(block.key, { jumlah, rata })
    }
    return m
  }, [aspectBlocks, scores])

  /** Rata-rata total = mean dari rata-rata tiap grup aspek (sinkron dengan nilai per baris). */
  const nilaiRataRataOtomatis = useMemo(() => {
    const ratas = Array.from(statsPerGrupByKey.values()).map((s) => s.rata)
    return ratas.length === 0 ? 0 : round2(ratas.reduce((a, b) => a + b, 0) / ratas.length)
  }, [statsPerGrupByKey])

  useEffect(() => {
    setValues((prev) => ({ ...prev, Nilai: nilaiRataRataOtomatis }))
  }, [nilaiRataRataOtomatis])

  const buildPayload = (): FormEvaluasiKontrakPayload => ({
    NoTran: values.NoTran || null,
    Nip: values.Nip || null,
    Nik: values.Nik || null,
    NoKontrak: values.NoKontrak || null,
    NamaKaryawan: values.NamaKaryawan || null,
    TglLahir: values.TglLahir || null,
    Usia: values.Usia || null,
    KdDepartemen: values.KdDepartemen || null,
    KdBagian: values.KdBagian || null,
    KdJabatan: values.KdJabatan || null,
    TglMasuk: values.TglMasuk || null,
    TglHabisKontrak: values.TglHabisKontrak || null,
    NikAtasan: values.NikAtasan || null,
    NamaAtasan: values.NamaAtasan || null,
    TglNilai: values.TglNilai || null,
    PAwal: values.PAwal || null,
    PAkhir: values.PAkhir || null,
    Nilai: round2(Number(values.Nilai ?? 0)),
    Rekomendasi: values.Rekomendasi || null,
    Catatan: values.Catatan || null,
    ValidUser: undefined,
    KdCabang: values.KdCabang || null,
    Details: aspekRows.map((r) => ({
      GrupAspek: r.grupAspek,
      KdAspek: r.kdAspek,
      Nilai: Number(scores[r.kdAspek] ?? 0),
    })),
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.()

    const err: Record<string, string> = {}
    if (!values.Nik?.trim()) err.Nik = 'NIK wajib diisi'
    if (!values.NamaKaryawan?.trim()) err.NamaKaryawan = 'Nama karyawan wajib diisi'
    if (!values.NamaAtasan?.trim()) err.NamaAtasan = 'Nama atasan wajib diisi'
    if (!values.TglNilai) err.TglNilai = 'Tanggal penilaian wajib diisi'
    if (aspekRows.length === 0) err._aspek = 'Master aspek penilaian belum dimuat'

    setErrors(err)
    if (Object.keys(err).length > 0) {
      if (err._aspek) showSnackbar('Master aspek penilaian belum dimuat', 'warning')
      return
    }

    setLoading(true)
    try {
      await onSubmit(buildPayload())
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xl"
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
        title={isEdit ? 'Ubah Penilaian Karyawan Kontrak' : 'Tambah Penilaian Karyawan Kontrak'}
        subtitle="Evaluasi kinerja karyawan kontrak"
        statusLabel={isEdit ? 'EDIT' : 'BARU'}
        statusColor={isEdit ? 'info' : 'warning'}
        onClose={onClose}
      />

      <Divider />

      {((Boolean(noTran) && loadingAspek) || loadingDetail) && (
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
            <Typography fontSize={12}>
              {noTran && loadingAspek ? 'Memuat data penilaian...' : 'Mengambil data...'}
            </Typography>
          </Stack>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ position: 'relative', pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <SectionTitle title="Data Karyawan" subtitle="Identitas pegawai dan kontrak kerja" />
              <Stack spacing={1.25}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nomor Evaluasi"
                  value={values.NoTran}
                  disabled
                  placeholder="Otomatis setelah simpan"
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Nomor Kontrak"
                  value={values.NoKontrak}
                  onChange={setField('NoKontrak')}
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Terisi dari master karyawan atau input manual"
                />

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
                      '&:hover': {
                        borderColor:
                          selected || isEdit ? theme.palette.divider : theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },
                    })}
                  >
                    <Box>
                      <Typography fontSize={12} color="text.secondary">
                        Nama Karyawan (cari min. 3 huruf)
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {keyword || 'Pilih karyawan'}
                      </Typography>
                    </Box>
                    {selected && !isEdit && (
                      <Box
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(null)
                          setKeyword('')
                          setScores(emptyScoresFrom(aspekRows))
                          setValues((prev) => ({
                            ...defaultValues,
                            KdCabang: prev.KdCabang,
                            TglNilai: dayjs().format('YYYY-MM-DD'),
                          }))
                          setAtasanKeyword('')
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
                          placeholder="Cari nama..."
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
                              Ketik minimal 3 huruf
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
                  label="NIP"
                  value={values.Nip}
                  disabled
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="NIK"
                  value={values.Nik}
                  disabled
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.Nik}
                  helperText={errors.Nik || 'Nomor KTP'}
                />

                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tanggal Lahir"
                        format="DD-MM-YYYY"
                        value={values.TglLahir ? dayjs(values.TglLahir) : null}
                        disabled
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: inputCompactStyle,
                            InputLabelProps: { shrink: true },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Usia"
                      value={values.Usia}
                      disabled
                      sx={inputCompactStyle}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={divisiOptions ?? []}
                      loading={loadingDivisi}
                      disabled={!values.Nik}
                      getOptionLabel={(o) => o.title ?? ''}
                      value={divisiOptions?.find((c) => c.value === values.KdDepartemen) ?? null}
                      onChange={(_, v) => {
                        setValues((prev) => ({
                          ...prev,
                          KdDepartemen: v?.value ?? '',
                          NmDepartemen: v?.title ?? '',
                          KdBagian: '',
                          NmBagian: '',
                        }))
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Divisi"
                          placeholder={values.Nik ? 'Pilih divisi' : 'Pilih karyawan terlebih dahulu'}
                          InputLabelProps={{ shrink: true }}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={bagianOptions ?? []}
                      loading={bagianLoading}
                      disabled={!values.Nik || !values.KdDepartemen}
                      getOptionLabel={(o) => o.title ?? ''}
                      value={bagianOptions?.find((c) => c.value === values.KdBagian) ?? null}
                      onChange={(_, v) => {
                        setValues((prev) => ({
                          ...prev,
                          KdBagian: v?.value ?? '',
                          NmBagian: v?.title ?? '',
                        }))
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Bagian"
                          placeholder={
                            !values.KdDepartemen ? 'Pilih divisi dulu' : 'Pilih bagian'
                          }
                          helperText={!values.KdDepartemen ? 'Pilih Divisi terlebih dahulu' : undefined}
                          InputLabelProps={{ shrink: true }}
                          sx={(theme) => ({
                            ...inputCompactStyle(theme),
                            '& .MuiOutlinedInput-root': {
                              height: 32,
                              backgroundColor: !values.KdDepartemen
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
                      disabled={!values.Nik}
                      getOptionLabel={(o) => o.title ?? ''}
                      value={jabatanOptions?.find((c) => c.value === values.KdJabatan) ?? null}
                      onChange={(_, v) => {
                        setValues((prev) => ({
                          ...prev,
                          KdJabatan: v?.value ?? '',
                          NmJabatan: v?.title ?? '',
                        }))
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Jabatan"
                          placeholder={values.Nik ? 'Pilih jabatan' : 'Pilih karyawan terlebih dahulu'}
                          InputLabelProps={{ shrink: true }}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tanggal Masuk"
                        format="DD-MM-YYYY"
                        value={values.TglMasuk ? dayjs(values.TglMasuk) : null}
                        disabled
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: inputCompactStyle,
                            InputLabelProps: { shrink: true },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tanggal Berakhir Kontrak"
                        format="DD-MM-YYYY"
                        value={values.TglHabisKontrak ? dayjs(values.TglHabisKontrak) : null}
                        disabled
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: inputCompactStyle,
                            InputLabelProps: { shrink: true },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <Autocomplete
                  options={cabangOptions ?? []}
                  loading={cabangLoading}
                  getOptionLabel={(o) => o.title ?? ''}
                  value={cabangOptions?.find((x) => x.value === values.KdCabang) ?? null}
                  onChange={(_, v) => setValues((prev) => ({ ...prev, KdCabang: v?.value ?? '' }))}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
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
              </Stack>

              <Box sx={{ mt: 2 }}>
                <SectionTitle
                  title="Data Penilaian"
                  subtitle="Atasan langsung, periode kontrak, dan rekomendasi lanjutan"
                />
              </Box>

              <Stack spacing={1.25}>
                <Box position="relative" onClick={(e) => e.stopPropagation()}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nama Atasan (cari min. 3 huruf)"
                    value={atasanKeyword}
                    onChange={(e) => {
                      const next = e.target.value
                      setAtasanKeyword(next)
                      setErrors((prev) => ({ ...prev, NamaAtasan: '' }))

                      if (!next.trim()) {
                        setValues((prev) => ({ ...prev, NamaAtasan: '', NikAtasan: '' }))
                        setAtasanList([])
                        setShowAtasanDropdown(false)
                        return
                      }

                      if (next !== values.NamaAtasan) {
                        setValues((prev) => ({ ...prev, NikAtasan: '' }))
                      }

                      setShowAtasanDropdown(next.trim().length >= 3)
                    }}
                    onFocus={() => setShowAtasanDropdown(atasanKeyword.trim().length >= 3)}
                    sx={inputCompactStyle}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.NamaAtasan}
                    helperText={errors.NamaAtasan}
                  />

                  {showAtasanDropdown && (
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
                        {loadingAtasanSearch || loadingAtasanSelect ? (
                          <Box p={2} textAlign="center">
                            <CircularProgress size={20} />
                            {loadingAtasanSelect && (
                              <Typography fontSize={12} mt={1} color="text.secondary">
                                Mengambil NIK karyawan...
                              </Typography>
                            )}
                          </Box>
                        ) : atasanKeyword.length < 3 ? (
                          <Box p={2}>
                            <Typography fontSize={12} color="text.secondary">
                              Ketik minimal 3 huruf
                            </Typography>
                          </Box>
                        ) : atasanList.length === 0 ? (
                          <Box p={2}>
                            <Typography fontSize={13}>Data tidak ditemukan</Typography>
                          </Box>
                        ) : (
                          atasanList.map((it, i) => (
                            <Box
                              key={i}
                              onClick={() => handleSelectAtasan(it)}
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

                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="NIK Atasan"
                      value={values.NikAtasan}
                      InputProps={{ readOnly: true }}
                      sx={inputCompactStyle}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={<span>Tanggal Penilaian <span style={{ color: 'red' }}>*</span></span>}
                    format="DD-MM-YYYY"
                    value={values.TglNilai ? dayjs(values.TglNilai) : null}
                    onChange={(newValue) => {
                      const val = newValue ? newValue.format('YYYY-MM-DD') : ''
                      setValues((prev) => ({ ...prev, TglNilai: val }))
                      setErrors((prev) => ({ ...prev, TglNilai: '' }))
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputLabelProps: { shrink: true },
                        error: !!errors.TglNilai,
                        helperText: errors.TglNilai,
                        sx: inputCompactStyle,
                      },
                      actionBar: { actions: ['clear', 'today'] },
                    }}
                  />
                </LocalizationProvider>

                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Periode Kontrak (Awal)"
                        format="DD-MM-YYYY"
                        value={values.PAwal ? dayjs(values.PAwal) : null}
                        onChange={(v) =>
                          setValues((prev) => ({ ...prev, PAwal: v ? v.format('YYYY-MM-DD') : '' }))
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: inputCompactStyle,
                            InputLabelProps: { shrink: true },
                          },
                          actionBar: { actions: ['clear', 'today'] },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Periode Kontrak (Akhir)"
                        format="DD-MM-YYYY"
                        value={values.PAkhir ? dayjs(values.PAkhir) : null}
                        onChange={(v) =>
                          setValues((prev) => ({ ...prev, PAkhir: v ? v.format('YYYY-MM-DD') : '' }))
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: inputCompactStyle,
                            InputLabelProps: { shrink: true },
                          },
                          actionBar: { actions: ['clear', 'today'] },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  label="Nilai Rata-rata Aspek"
                  type="number"
                  value={values.Nilai}
                  InputProps={{ readOnly: true }}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),
                    '& .MuiFormHelperText-root': {
                      fontSize: 12,
                      lineHeight: 1.4,
                      mt: 0.75,
                    },
                  })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 0.01, min: 0 }}
                  helperText="Dihitung otomatis dari rata-rata setiap grup aspek penilaian"
                />

                <Typography fontSize={12} color="text.secondary" component="div" lineHeight={1.45}>
                  {aspectBlocks.map((b, i) => {
                    const st = statsPerGrupByKey.get(b.key) ?? { jumlah: 0, rata: 0 }
                    return (
                      <span key={b.key}>
                        {i > 0 ? ' · ' : ''}
                        [{b.key}] Jumlah {st.jumlah}, Rata-rata {formatAngkaId(st.rata)}
                      </span>
                    )
                  })}
                  {aspectBlocks.length === 0 && !loadingAspek && '—'}
                </Typography>

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Rekomendasi"
                  value={values.Rekomendasi ?? ''}
                  onChange={setField('Rekomendasi')}
                  sx={inputCompactStyle}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">
                    <em>Pilih</em>
                  </MenuItem>
                  {REKOMENDASI_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.title}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="Catatan atau Alasan Penilaian"
                  multiline
                  minRows={3}
                  value={values.Catatan}
                  onChange={setField('Catatan')}
                  InputLabelProps={{ shrink: true }}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),
                    '& .MuiOutlinedInput-root': {
                      minHeight: 'auto',
                      height: 'auto',
                      alignItems: 'flex-start',
                      backgroundColor: theme.palette.background.paper,
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '12px 14px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: theme.palette.text.primary,
                    },
                  })}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <SectionTitle
                title="Aspek Penilaian"
                subtitle="Nilai tiap kriteria dengan skala 1–5 (belum diisi dihitung sebagai 0)"
              />
              <Stack spacing={2}>
                {loadingAspek && !noTran && <AspekPenilaianSkeletonPlaceholder />}
                {!loadingAspek && aspectBlocks.length === 0 && (
                  <Typography fontSize={13} color="text.secondary">
                    Tidak ada data aspek penilaian. Periksa master TBL_ASPEKPENILAIAN atau endpoint
                    GetAspekPenilaian.
                  </Typography>
                )}
                {!loadingAspek &&
                  aspectBlocks.map((block) => {
                    const statGrup = statsPerGrupByKey.get(block.key) ?? { jumlah: 0, rata: 0 }

                    return (
                      <Accordion
                        key={block.key}
                        defaultExpanded
                        disableGutters
                        elevation={0}
                        sx={(theme) => ({
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 4px 24px rgba(0,0,0,0.35)'
                              : '0 4px 24px rgba(15, 23, 42, 0.07)',
                          '&:before': { display: 'none' },
                        })}
                      >
                        <AccordionSummary
                          expandIcon={
                            <IconChevronDown size={20} stroke={1.75} style={{ opacity: 0.85 }} />
                          }
                          sx={(theme) => ({
                            px: 2,
                            py: 1.25,
                            minHeight: 52,
                            background:
                              theme.palette.mode === 'dark'
                                ? `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.22)} 0%, ${alpha(theme.palette.primary.dark, 0.08)} 100%)`
                                : `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.06)} 100%)`,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            '& .MuiAccordionSummary-content': { alignItems: 'center', my: 0 },
                          })}
                        >
                          <Typography fontWeight={700} fontSize={14} letterSpacing="-0.01em">
                            {block.title}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={(theme) => ({
                              borderRadius: 0,
                              bgcolor:
                                theme.palette.mode === 'dark'
                                  ? alpha(theme.palette.background.default, 0.5)
                                  : alpha(theme.palette.grey[50], 0.9),
                            })}
                          >
                            <Table size="small" sx={{ borderCollapse: 'separate' }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    width={56}
                                    sx={(theme) => ({
                                      py: 1.25,
                                      px: 2,
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.08em',
                                      color: 'text.secondary',
                                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                                      bgcolor:
                                        theme.palette.mode === 'dark'
                                          ? alpha(theme.palette.common.black, 0.2)
                                          : alpha(theme.palette.primary.main, 0.04),
                                    })}
                                  >
                                    No
                                  </TableCell>
                                  <TableCell
                                    sx={(theme) => ({
                                      py: 1.25,
                                      px: 2,
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.08em',
                                      color: 'text.secondary',
                                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                                      bgcolor:
                                        theme.palette.mode === 'dark'
                                          ? alpha(theme.palette.common.black, 0.2)
                                          : alpha(theme.palette.primary.main, 0.04),
                                    })}
                                  >
                                    Detail Aspek
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    width={112}
                                    sx={(theme) => ({
                                      py: 1.25,
                                      px: 2,
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.08em',
                                      color: 'text.secondary',
                                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                                      bgcolor:
                                        theme.palette.mode === 'dark'
                                          ? alpha(theme.palette.common.black, 0.2)
                                          : alpha(theme.palette.primary.main, 0.04),
                                    })}
                                  >
                                    Nilai
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {block.rows.map((row, idx) => {
                                  const rawNilai = scores[row.kdAspek] ?? 0
                                  const nilaiSelectValue = rawNilai === 0 ? '' : rawNilai

                                  return (
                                    <TableRow
                                      key={row.kdAspek}
                                      hover
                                      sx={(theme) => ({
                                        transition: 'background-color 0.15s ease',
                                        '&:nth-of-type(odd)': {
                                          bgcolor:
                                            theme.palette.mode === 'dark'
                                              ? alpha(theme.palette.common.white, 0.02)
                                              : alpha(theme.palette.primary.main, 0.02),
                                        },
                                      })}
                                    >
                                      <TableCell
                                        sx={{
                                          py: 1.35,
                                          px: 2,
                                          verticalAlign: 'middle',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider',
                                          fontWeight: 600,
                                          fontSize: 13,
                                          color: 'primary.main',
                                          width: 56,
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          sx={(theme) => ({
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 28,
                                            height: 28,
                                            borderRadius: 1,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            bgcolor:
                                              theme.palette.mode === 'dark'
                                                ? alpha(theme.palette.primary.main, 0.18)
                                                : alpha(theme.palette.primary.main, 0.12),
                                            color: 'primary.dark',
                                          })}
                                        >
                                          {row.noUrut > 0 ? row.noUrut : idx + 1}
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          py: 1.35,
                                          px: 2,
                                          verticalAlign: 'middle',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        <Typography fontSize={13} lineHeight={1.45} color="text.primary">
                                          {row.label}
                                        </Typography>
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{
                                          py: 1,
                                          px: 2,
                                          verticalAlign: 'middle',
                                          borderBottom: '1px solid',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        <TextField
                                          select
                                          size="small"
                                          value={nilaiSelectValue}
                                          onChange={(e) => {
                                            const v = e.target.value
                                            setScores((prev) => ({
                                              ...prev,
                                              [row.kdAspek]: v === '' ? 0 : Number(v),
                                            }))
                                          }}
                                          sx={(theme) => ({
                                            width: 96,
                                            '& .MuiOutlinedInput-root': {
                                              borderRadius: 1.5,
                                              bgcolor: theme.palette.background.paper,
                                              transition: 'box-shadow 0.15s ease',
                                              '&:hover': {
                                                boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}`,
                                              },
                                              '&.Mui-focused': {
                                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
                                              },
                                            },
                                            '& .MuiSelect-select': {
                                              py: 0.65,
                                              px: 1,
                                              fontSize: 13,
                                              fontWeight: 600,
                                              textAlign: 'center',
                                            },
                                          })}
                                          slotProps={{
                                            select: {
                                              displayEmpty: true,
                                            },
                                          }}
                                        >
                                          <MenuItem value="">
                                            <em>Pilih</em>
                                          </MenuItem>
                                          {NILAI_SKALA.map((n) => (
                                            <MenuItem key={n} value={n}>
                                              {n}
                                            </MenuItem>
                                          ))}
                                        </TextField>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                                <TableRow
                                  sx={(theme) => ({
                                    bgcolor:
                                      theme.palette.mode === 'dark'
                                        ? alpha(theme.palette.primary.dark, 0.25)
                                        : alpha(theme.palette.primary.main, 0.06),
                                    '& td': {
                                      borderBottom: 'none',
                                      py: 1.75,
                                      px: 2,
                                    },
                                  })}
                                >
                                  <TableCell />
                                  <TableCell align="right">
                                    <Typography fontWeight={700} fontSize={13} color="text.primary">
                                      Nilai Rata-rata{' '}
                                      <Box component="span" sx={{ color: 'primary.main', ml: 0.5 }}>
                                        {formatAngkaId(statGrup.rata)}
                                      </Box>
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Stack alignItems="flex-end" spacing={0.25}>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Jumlah
                                      </Typography>
                                      <Typography fontWeight={800} fontSize={17} color="primary.main">
                                        {statGrup.jumlah}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )
                  })}
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
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <Button variant="outlined" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading || loadingAspek || aspekRows.length === 0}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={16} />}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default FormPenilaianKaryawan
