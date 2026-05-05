'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  FormLabel,
  CircularProgress,
  Checkbox,
  DialogActions,
  Stack,
  Autocomplete,
  InputAdornment,
  Tooltip,
} from '@mui/material'
import DialogHeader from '@/app/components/DialogHeader/DialogHeader'
import { IconDeviceFloppy, IconPrinter } from '@tabler/icons-react'
import SectionTitle from '@/app/components/SectionTitle/SectionTitle'
import { getDetailMasterKtp, getFilterMasterKtp, useComboBagian, useComboCabangWith, useComboDivisi, useComboJabatan, useComboJenisGaji, useComboJenisKontrak, useComboKategoriGaji, useComboPeriodeBulan, useComboStatusPajak, useComboSubBagian, useComboVendorByNama } from '@/hooks/useComboGroup'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs'
import { fetchDetailKontrakPkwt, printKontrakPkwt } from '@/services/hrd/kontrak-pkwt.service'
import AccessButton from '@/app/components/buttons/AccessButton'
import { useSnackbar } from '@/app/context/SnackbarContext'
import PdfPreviewDialog from '@/app/components/print-preview/PdfPreviewDialog'
import { inputCompactStyle } from '@/app/feature/hrd/shared/inputCompactStyle'

interface KontrakKaryawanDto {
  NOKTP?: string
  NMKARYAWAN?: string
  TEMPATLAHIR?: string
  TGLLAHIR?: string
  ALAMAT?: string
  KELAMIN?: string
  PERKAWINAN?: string
  PENDIDIKAN?: string
  AGAMA?: string
  KDCABANG?: string
  NMCABANG?: string
  NIKSISTAG?: string
  IDFINGER?: string
  NMBANK?: string
  NOREKENING?: string
  NOHANDPHONE?: string
  TGLMASUK?: string
  TGLINPUT?: string
  NOKONTRAK?: string
  KDDIVISI?: string
  NMDIVISI?: string
  KDBAGIAN?: string
  NMBAGIAN?: string
  KDSUBBAGIAN?: string
  NMSUBBAGIAN?: string
  KDJABATAN?: string
  NMJABATAN?: string
  PERIODE?: string
  PAWAL?: string
  PAKHIR?: string
  NMPERUSAHAAN?: string
  JNSKONTRAK?: string
  KATEGORIGAJI?: string
  JNSGAJI?: string
  NONPWP?: string
  PPH21?: string
  ISJAMINANBPJS?: boolean
  NOBPJSTK?: string
  NOBPJSKSH?: string
  NOBPJSJHT?: string
  NOSURATTUGAS?: string
  KETERANGAN?: string
  FOTO_BASE64?: string
  SIGNATURE_BASE64?: string
}

interface Props {
  noKontrak?: string   // 🔥 ganti dari editData
  onClose: () => void
  onSubmit: (
    payload: any,
    option?: { closeAfterSave?: boolean }
  ) => Promise<void>;
}

const FormKontrakKaryawan: React.FC<Props> = ({
  noKontrak,
  onClose,
  onSubmit,
}) => {
  const { showSnackbar } = useSnackbar();
  
  const { cabang: cabangOptions, loading : cabangLoading } = useComboCabangWith()
  const [values, setValues] = useState<KontrakKaryawanDto>({})
  const [loading, setLoading] = useState(false)

  const { data: divisiOptions, loading: loadingDivisi } = useComboDivisi();
  const { data: bagianOptions, loading: bagianLoading } = useComboBagian(values.KDDIVISI);
  const { data: subBagianOptions, loading: subLoading } = useComboSubBagian(values.KDBAGIAN);

  const { data: jabatanOptions, loading: loadingJabatan } = useComboJabatan();
  const { data: periodeOptions, loading: loadingPeriode } = useComboPeriodeBulan();
  const { vendor: vendorOptions } = useComboVendorByNama()
  const { data: jenisKontrakOptions, loading: loadingJenisKontrak } = useComboJenisKontrak()
  
  const { data: kategoriGajiOptions, loading: loadingKategoriGaji } = useComboKategoriGaji()
  const { data: jenisGajiOptions, loading: loadingJenisGaji } = useComboJenisGaji()
  const { data: statusPajakOptions, loading: loadingStatusPajak } = useComboStatusPajak()
  

  const isEdit = !!noKontrak

    // 🔥 STATE SEARCH
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // 🔥 DETAIL
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [errors, setErrors] = useState<any>({});
  
  /* =======================
  * Print Preview
  * ======================= */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  
  useEffect(() => {
    if (!noKontrak) return

    const load = async () => {
      try {
        setLoadingDetail(true)

        const raw = await fetchDetailKontrakPkwt(noKontrak)
        // 🔥 FIX UTAMA
        const res = raw?.Data ?? raw

        const data = {
          ...res,

          // 🔥 FORMAT DATE
          TGLLAHIR: res.TGLLAHIR?.substring(0, 10) || "",
          TGLMASUK: res.TGLMASUK?.substring(0, 10) || "",
          TGLINPUT: res.TGLINPUT?.substring(0, 10) || "",
          PAWAL: res.PAWAL?.substring(0, 10) || "",
          PAKHIR: res.PAKHIR?.substring(0, 10) || "",

          // 🔥 NULL SAFE
          NOHANDPHONE: res.NOHANDPHONE ?? "",
          NOSURATTUGAS: res.NOSURATTUGAS ?? "",
          KETERANGAN: res.KETERANGAN ?? "",
        }

        setValues({ ...data }) // 🔥 force render

        // 🔥 penting untuk header/search
        setSelected({
          NOKTP: res.NOKTP,
          NAMALENGKAP: res.NMKARYAWAN,
        })

        setKeyword(res.NMKARYAWAN || "")
        setDetail(res)

      } catch (err) {
        console.error(err)
        setLoadingDetail(false)
      } finally {
        setLoadingDetail(false)
      }
    }

    load()
  }, [noKontrak])

  // ================= SEARCH =================
  useEffect(() => {
    if (isEdit) return // 🔥 ini penting

    if (selected) return; // 🔥 stop kalau sudah pilih

    if (!keyword) {
      setList([]);
      setShowDropdown(false);
      return;
    }

    let active = true;

    setLoadingSearch(true);
    setShowDropdown(true);

    const timeout = setTimeout(async () => {
      try {
        if (keyword.length < 3) {
          setList([]);
          return;
        }

        /* BELUM DISET CABANG */
        const res = await getFilterMasterKtp(keyword);

        if (active) setList(res || []);
      } catch (err) {
        console.error(err);
        if (active) setList([]);
      } finally {
        if (active) setLoadingSearch(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [keyword, selected]);
  
  // ================= CLOSE DROPDOWN =================
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);
  
  const handleSelect = async (item: any) => {
    try {
      if (loadingDetail) return;

      setSelected(item);
      setKeyword(item.NAMALENGKAP);
      setShowDropdown(false);

      setLoadingDetail(true);

      const response = await getDetailMasterKtp(item.NOKTP);
      console.log(response)
      // 🔥 AMBIL DATA DARI WRAPPER
      
      const res = response?.Data ?? response;

      // if (!res) return;
      console.log(res.NMKARYAWAN)
      // 🔥 AUTO FILL FORM
      setValues({
        ...res,

        // fallback nama
        NMKARYAWAN: res.NMKARYAWAN ?? item.NAMALENGKAP,
        
        // format date
        TGLLAHIR: res.TGLLAHIR?.substring(0, 10) || "",
        TGLMASUK: res.TGLMASUK?.substring(0, 10) || "",
        TGLINPUT: res.TGLINPUT?.substring(0, 10) || "",
        PAWAL: res.PAWAL?.substring(0, 10) || "",
        PAKHIR: res.PAKHIR?.substring(0, 10) || "",

        // null safe
        NOHANDPHONE: res.NOHANDPHONE ?? "",
        NOSURATTUGAS: res.NOSURATTUGAS ?? "",
        KETERANGAN: res.KETERANGAN ?? "",
      });

      setDetail(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    const value =
      e?.target?.type === "checkbox"
        ? e.target.checked   // 🔥 ini kunci
        : e.target.value;

    setValues((prev: any) => {
      const newVal = { ...prev, [field]: value };

      // 🔥 reset BPJS kalau dimatikan
      if (field === "ISJAMINANBPJS" && !value) {
        newVal.NOBPJSTK = "";
        newVal.NOBPJSKSH = "";
        newVal.NOBPJSJHT = "";
      }

      return newVal;
    });
  };


  const handleSubmit = async (e?: any, closeAfterSave = false) => {
    e?.preventDefault?.();

    let err: any = {};

    if (!values.IDFINGER) err.IDFINGER = "ID Finger wajib diisi";
    if (!values.NMBANK) err.NMBANK = "Bank wajib diisi";
    if (!values.NOREKENING) err.NOREKENING = "No Rekening wajib diisi";
    if (!values.NOHANDPHONE) err.NOHANDPHONE = "No HP wajib diisi";
    if (!values.TGLMASUK || !dayjs(values.TGLMASUK).isValid())
      err.TGLMASUK = "Tanggal masuk wajib diisi";
    if (!values.TGLINPUT || !dayjs(values.TGLINPUT).isValid())
      err.TGLINPUT = "Tanggal input wajib diisi";
    if (!values.KDDIVISI) err.KDDIVISI = "Divisi wajib dipilih";
    if (!values.KDBAGIAN) err.KDBAGIAN = "Bagian wajib dipilih";
    if (!values.KDJABATAN) err.KDJABATAN = "Jabatan wajib dipilih";
    if (!values.PERIODE) err.PERIODE = "Periode wajib dipilih";
    if (!values.PAWAL) err.PAWAL = "Periode awal wajib diisi";
    if (!values.PAKHIR) err.PAKHIR = "Periode akhir wajib diisi";
    if (!values.NMPERUSAHAAN) err.NMPERUSAHAAN = "Perusahaan wajib dipilih";
    if (!values.JNSKONTRAK) err.JNSKONTRAK = "Jenis kontrak wajib dipilih";

    setErrors(err);

    if (Object.keys(err).length > 0) return;

    setLoading(true);
    try {
      await onSubmit(values, { closeAfterSave });
    } finally {
      setLoading(false);
    }
  };

  /* =======================
 * Print Kontrak (PDF Only)
 * ======================= */
  const handlePrintKontrak = async (noKontrak: string) => {
    try {
      if (!noKontrak) {
        showSnackbar('No kontrak tidak boleh kosong', 'warning')
        return
      }
      setLoading(true);
      setPreviewLoading(true)

      const res = await printKontrakPkwt(noKontrak)

      // 🔥 set base64 ke preview
      setPdfBase64(res.response)
      setPreviewOpen(true)

    } catch (err: any) {
      setLoading(false);
      showSnackbar(err.message || 'Gagal generate PDF', 'error')
    } finally {
      setLoading(false);
      setPreviewLoading(false)
    }
  }

  const setField = (field: string) => (e: any) => {
    handleChange(field)(e);

    setErrors((prev: any) => ({
      ...prev,
      [field]: "",
    }));
  };
  return (

    
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(6px)", // 🔥 ini kunci
          backgroundColor: "rgba(0,0,0,0.2)", // 🔥 biar agak gelap
        },
      }}
    >
      {/* HEADER */}
      <DialogHeader
        title={isEdit ? 'Edit Kontrak Karyawan' : 'Tambah Kontrak Karyawan'}
        subtitle="Pengisian dan pengelolaan informasi kontrak karyawan"
        statusLabel={isEdit ? 'EDIT' : 'CREATE'}
        statusColor={isEdit ? 'info' : 'warning'}
      />

      <Divider />

      {loadingDetail && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <CircularProgress />
            <Typography fontSize={12}>Mengambil data karyawan...</Typography>
          </Stack>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ position: "relative" }}>

          <Grid container spacing={3}>
            
            {/* ================= LEFT ================= */}
            <Grid size={{ xs: 12, md: 6 }}>

              {/* ================= DATA KARYAWAN ================= */}
              <SectionTitle
                title="Data Karyawan"
                subtitle="Data identitas dan informasi dasar karyawan"
              />

              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                gap={3}
                mb={2}
              >
                {/* FOTO */}
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #e5e7eb",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {values.FOTO_BASE64 ? (
                    <img
                      src={values.FOTO_BASE64}
                      alt="Foto Karyawan"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Typography fontSize={12} color="text.secondary">
                      No Photo
                    </Typography>
                  )}
                </Box>

                {/* SIGNATURE */}
                <Box
                  sx={{
                    width: 180,   // 🔥 sebelumnya 140 → jadi lebih lebar
                    height: 90,   // 🔥 sebelumnya 70 → lebih tinggi
                    border: "1px dashed #cbd5f5",
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {values.SIGNATURE_BASE64 ? (
                    <img
                      src={values.SIGNATURE_BASE64}
                      alt="Signature"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain", // 🔥 penting biar tidak gepeng
                      }}
                    />
                  ) : (
                    <Typography fontSize={11} color="text.secondary">
                      Signature
                    </Typography>
                  )}
                </Box>
              </Box>          

              <Stack spacing={1.5}>
                <TextField
                  fullWidth size="small"
                  label="No KTP"
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  value={values.NOKTP ?? ""}
                  onChange={handleChange("NOKTP")}
                  sx={inputCompactStyle}
                />

                <Box position="relative" onClick={(e) => e.stopPropagation()}>

                  {/* DISPLAY */}
                  <Box
                    onClick={() => {
                      if (!selected) setShowDropdown(true);
                    }}
                    sx={(theme) => ({
                      p: 1,
                      borderRadius: 1.5,

                      // 🔥 THEME AWARE
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,

                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",

                      cursor: selected ? "default" : "pointer",
                      transition: "all 0.2s ease",

                      // 🔥 HOVER EFFECT
                      "&:hover": {
                        borderColor: selected
                          ? theme.palette.divider
                          : theme.palette.primary.main,
                        backgroundColor: theme.palette.action.hover,
                      },

                      // 🔥 DISABLED LOOK
                      ...(selected && {
                        opacity: 0.8,
                      }),
                    })}
                  >
                    <Box>
                      <Typography fontSize={12} color="text.secondary">
                        Nama
                      </Typography>

                      <Typography fontSize={14} fontWeight={600}>
                        {loadingDetail ? "Mengambil data..." : (keyword || "Pilih Karyawan")}
                      </Typography>
                    </Box>

                    {/* RESET */}
                    {selected && !isEdit && (
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(null);
                          setKeyword("");
                          setValues({});
                        }}
                        sx={{
                          fontSize: 16,
                          px: 1,
                          cursor: "pointer",
                          color: "#9ca3af",
                          "&:hover": { color: "#ef4444" },
                        }}
                      >
                        ✕
                      </Box>
                    )}
                  </Box>

                  {/* DROPDOWN */}
                  {showDropdown && !selected && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        bgcolor: "background.paper",
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        mt: 1,
                        zIndex: 10,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      }}
                    >
                      {/* INPUT */}
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

                      {/* LIST */}
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
                          list.map((item, i) => (
                            <Box
                              key={i}
                              onClick={() => handleSelect(item)}
                              sx={{
                                p: 1.5,
                                cursor: "pointer",
                                borderBottom: "1px solid #f1f5f9",
                                transition: "0.2s",
                                "&:hover": {
                                  bgcolor: "#f9fafb",
                                },
                              }}
                            >
                              {/* NAMA */}
                              <Typography fontWeight={600} fontSize={13}>
                                {item.NAMALENGKAP}
                              </Typography>

                              {/* INFO TAMBAHAN */}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {item.KELAMIN || "-"}
                              </Typography>

                              {/* DETAIL */}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  display: "block",
                                }}
                              >
                                {item.NOKTP} • {item.KDCABANG}
                              </Typography>

                              {/* OPTIONAL: ALAMAT (dipotong biar rapi) */}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  display: "block",
                                  mt: 0.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.ALAMAT}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="Tempat Lahir"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.TEMPATLAHIR ?? ""}
                      onChange={handleChange("TEMPATLAHIR")}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    {/* <TextField
                      fullWidth size="small"
                      type="date"
                      label="Tanggal Lahir"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      InputLabelProps={{ shrink: true }}
                      value={values.TGLLAHIR ?? ""}
                      onChange={handleChange("TGLLAHIR")}
                      sx={inputCompactStyle}
                    /> */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Tanggal Lahir"
                        format="DD-MM-YYYY"
                        value={values.TGLLAHIR ? dayjs(values.TGLLAHIR) : null}
                        disabled // 🔥 biar tidak bisa diubah
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },

                            sx: (theme) => ({
                              ...inputCompactStyle(theme),
                            }),
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth size="small"
                  label="Alamat"
                  multiline rows={2}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  value={values.ALAMAT ?? ""}
                  onChange={handleChange("ALAMAT")}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),

                    "& .MuiOutlinedInput-root": {
                      padding: "4px 6px",
                      alignItems: "flex-start",
                      minHeight: "auto",
                      height: "auto",
                    },

                    "& textarea": {
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1.4,
                    },
                  })}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="Jenis Kelamin"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.KELAMIN ?? ""}
                      onChange={handleChange("KELAMIN")}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="Pendidikan"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.PENDIDIKAN ?? ""}
                      onChange={handleChange("PENDIDIKAN")}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="Status Perkawinan"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.PERKAWINAN ?? ""}
                      onChange={handleChange("PERKAWINAN")}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="Agama"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.AGAMA ?? ""}
                      onChange={handleChange("AGAMA")}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* ================= DATA KEPEGAWAIAN ================= */}
              <SectionTitle
                title="Data Kepegawaian"
                subtitle="Informasi kepegawaian dan penempatan kerja"
              />

              <Stack spacing={1.5}>
                <Autocomplete
                  options={cabangOptions ?? []}
                  loading={cabangLoading}
                  getOptionLabel={(o) => o.title ?? ""}
                  value={
                    cabangOptions?.find((c) => c.value === values.KDCABANG) ?? null
                  }
                  isOptionEqualToValue={(o, v) => o.value === v.value} // 🔥 WAJIB (hindari bug)
                  fullWidth
                  disabled
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Cabang"
                      InputLabelProps={{ shrink: true }}
                      sx={inputCompactStyle} // 🔥 APPLY DISINI
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="NIK SISTAG"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.NIKSISTAG ?? ""}
                      onChange={handleChange("NIKSISTAG")}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={
                        <span>
                          ID Finger <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={values.IDFINGER ?? ""}
                      onChange={setField("IDFINGER")}
                      error={!!errors.IDFINGER}
                      helperText={errors.IDFINGER}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={
                        <span>
                          Bank <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={values.NMBANK ?? ""}
                      onChange={setField("NMBANK")}
                      error={!!errors.NMBANK}
                      helperText={errors.NMBANK}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={
                        <span>
                          No Rekening <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={values.NOREKENING ?? ""}
                      onChange={setField("NOREKENING")}
                      error={!!errors.NOREKENING}
                      helperText={errors.NOREKENING}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label={
                        <span>
                          No HP <span style={{ color: "red" }}>*</span>
                        </span>
                      }
                      value={values.NOHANDPHONE ?? ""}
                      onChange={setField("NOHANDPHONE")}
                      error={!!errors.NOHANDPHONE}
                      helperText={errors.NOHANDPHONE}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={
                          <span>
                            Tanggal Masuk <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.TGLMASUK ? dayjs(values.TGLMASUK) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format("YYYY-MM-DD") : "";

                          setValues((prev: any) => ({
                            ...prev,
                            TGLMASUK: val,
                          }));

                          // 🔥 reset error
                          setErrors((prev: any) => ({
                            ...prev,
                            TGLMASUK: "",
                          }));
                        }}
                        slotProps={{
                          textField: (params) => ({
                            ...params,
                            size: "small",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },

                            error: !!errors.TGLMASUK,
                            helperText: errors.TGLMASUK,

                            // 🔥 FIX YANG BENAR
                            InputProps: {
                              ...params.InputProps,
                              readOnly: true,
                            },

                            sx: (theme) => ({
                              ...inputCompactStyle(theme),
                              "& input": {
                                cursor: "default",
                              },
                            }),
                          }),

                          // 🔥 UX lebih enak
                          actionBar: {
                            actions: ["clear", "today"],
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth size="small"
                  label="Keterangan"
                  multiline rows={2}
                  value={values.KETERANGAN ?? ""}
                  onChange={handleChange("KETERANGAN")}
                  sx={(theme) => ({
                    ...inputCompactStyle(theme),

                    "& .MuiOutlinedInput-root": {
                      padding: "4px 8px",
                      alignItems: "flex-start",
                      minHeight: "auto",
                      height: "auto",
                    },

                    "& textarea": {
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1.4,
                    },
                  })}

                />
              </Stack>

            </Grid>

            {/* ================= RIGHT ================= */}
            <Grid size={{ xs: 12, md: 6 }}>

              {/* ================= DATA KONTRAK ================= */}
              <SectionTitle
                title="Data Kontrak"
                subtitle="Detail kontrak kerja dan periode berlaku"
              />

              <Stack spacing={1.5}>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={
                          <span>
                            Tgl Input <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.TGLINPUT ? dayjs(values.TGLINPUT) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format("YYYY-MM-DD") : "";

                          setValues((prev: any) => ({
                            ...prev,
                            TGLINPUT: val,
                          }));

                          // 🔥 reset error
                          setErrors((prev: any) => ({
                            ...prev,
                            TGLINPUT: "",
                          }));
                        }}
                        slotProps={{
                          textField: (params) => ({
                            ...params,
                            size: "small",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },

                            // 🔥 ERROR
                            error: !!errors.TGLINPUT,
                            helperText: errors.TGLINPUT,

                            InputProps: {
                              ...params.InputProps,
                            },

                            sx: inputCompactStyle,
                          }),

                          actionBar: {
                            actions: ["clear", "today"],
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth size="small"
                      label="No Kontrak"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      value={values.NOKONTRAK ?? ""}
                      onChange={handleChange("NOKONTRAK")}
                      sx={inputCompactStyle}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={divisiOptions ?? []}
                      loading={loadingDivisi}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        divisiOptions?.find((c) => c.value === values.KDDIVISI) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          KDDIVISI: v?.value ?? "",
                          NMDIVISI: v?.title ?? "",
                          KDBAGIAN: "",
                          KDSUBBAGIAN: "",
                        }));

                        // 🔥 reset error
                        setErrors((prev: any) => ({
                          ...prev,
                          KDDIVISI: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Divisi <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.KDDIVISI}
                          helperText={errors.KDDIVISI}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={bagianOptions ?? []}
                      loading={bagianLoading}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        bagianOptions?.find((c) => c.value === values.KDBAGIAN) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          KDBAGIAN: v?.value ?? "",
                          NMBAGIAN: v?.title ?? "",
                          KDSUBBAGIAN: "",
                        }));

                        // 🔥 reset error
                        setErrors((prev: any) => ({
                          ...prev,
                          KDBAGIAN: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      disabled={!values.KDDIVISI}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Bagian <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder={
                            !values.KDDIVISI ? "Pilih Divisi dulu" : "Pilih Bagian"
                          }
                          InputLabelProps={{ shrink: true }}

                          // 🔥 ERROR + UX SMART
                          error={!!errors.KDBAGIAN}
                          helperText={
                            !values.KDDIVISI
                              ? "Pilih Divisi terlebih dahulu"
                              : errors.KDBAGIAN
                          }

                          sx={(theme) => ({
                            ...inputCompactStyle(theme),

                            "& .MuiOutlinedInput-root": {
                              height: 32,
                              backgroundColor: !values.KDDIVISI
                                ? theme.palette.action.disabledBackground
                                : theme.palette.background.paper,
                            },
                          })}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={subBagianOptions ?? []}
                      loading={subLoading}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        subBagianOptions?.find((c) => c.value === values.KDSUBBAGIAN) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          KDSUBBAGIAN: v?.value ?? "",
                          NMSUBBAGIAN: v?.title ?? "",
                        }));

                        // 🔥 reset error
                        setErrors((prev: any) => ({
                          ...prev,
                          KDSUBBAGIAN: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      disabled={!values.KDBAGIAN}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Sub Bagian <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder={
                            !values.KDBAGIAN ? "Pilih Bagian dulu" : "Pilih Sub Bagian"
                          }
                          InputLabelProps={{ shrink: true }}

                          // 🔥 ERROR
                          error={!!errors.KDSUBBAGIAN}
                          helperText={
                            !values.KDBAGIAN
                              ? "Pilih Bagian terlebih dahulu"
                              : errors.KDSUBBAGIAN
                          }

                          sx={(theme) => ({
                            ...inputCompactStyle(theme),
                            "& .MuiOutlinedInput-root": {
                              height: 32,
                              backgroundColor: !values.KDBAGIAN
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
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        jabatanOptions?.find((c) => c.value === values.KDJABATAN) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          KDJABATAN: v?.value ?? "",
                          NMJABATAN: v?.title ?? "",
                        }));

                        // 🔥 reset error saat pilih
                        setErrors((prev: any) => ({
                          ...prev,
                          KDJABATAN: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Jabatan <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Pilih Jabatan"
                          InputLabelProps={{ shrink: true }}

                          // 🔥 ERROR
                          error={!!errors.KDJABATAN}
                          helperText={errors.KDJABATAN}

                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid container spacing={2}>

                    {/* ================= PERIODE ================= */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Autocomplete
                        options={periodeOptions ?? []}
                        loading={loadingPeriode}
                        getOptionLabel={(o) => o.title ?? ""}
                        value={
                          periodeOptions?.find((c) => c.value === values.PERIODE) ?? null
                        }
                        onChange={(_, v) => {
                          const periode = parseInt(v?.value ?? "0"); // 🔥 FIX

                          setValues((prev: any) => {
                            let pakhir = prev.PAKHIR;

                            if (prev.PAWAL && periode > 0) {
                              pakhir = dayjs(prev.PAWAL)
                                .add(periode, "month")
                                .subtract(1, "day")
                                .format("YYYY-MM-DD");
                            }

                            return {
                              ...prev,
                              PERIODE: v?.value ?? "",
                              PAKHIR: pakhir,
                            };
                          });

                          setErrors((prev: any) => ({
                            ...prev,
                            PERIODE: "",
                          }));
                        }}
                        isOptionEqualToValue={(o, v) => o?.value === v?.value}
                        fullWidth
                        noOptionsText="Data tidak ditemukan"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            label={
                              <span>
                                Periode Kontrak <span style={{ color: "red" }}>*</span>
                              </span>
                            }
                            placeholder="Pilih Periode"
                            InputLabelProps={{ shrink: true }}

                            // 🔥 ERROR
                            error={!!errors.PERIODE}
                            helperText={errors.PERIODE}

                            sx={inputCompactStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* ================= PAWAL ================= */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <DatePicker
                        label={
                          <span>
                            Periode Awal <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.PAWAL ? dayjs(values.PAWAL) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format("YYYY-MM-DD") : "";

                          setValues((prev: any) => {
                            let pakhir = prev.PAKHIR;
                            const periode = parseInt(prev.PERIODE ?? "0"); // 🔥 FIX
                            if (val && periode) {
                              pakhir = dayjs(val)
                                .add(Number(periode), "month")
                                .subtract(1, "day")
                                .format("YYYY-MM-DD");
                            }

                            return {
                              ...prev,
                              PAWAL: val,
                              PAKHIR: pakhir,
                            };
                          });

                          // 🔥 reset error
                          setErrors((prev: any) => ({
                            ...prev,
                            PAWAL: "",
                          }));
                        }}
                        slotProps={{
                          textField: (params) => ({
                            ...params,
                            size: "small",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },

                            // 🔥 ERROR
                            error: !!errors.PAWAL,
                            helperText: errors.PAWAL,

                            sx: inputCompactStyle,

                            InputProps: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {values.PAWAL && (
                                    <InputAdornment
                                      position="end"
                                      sx={{ cursor: "pointer", mr: 0.5 }}
                                      onClick={() => {
                                        setValues((prev: any) => ({
                                          ...prev,
                                          PAWAL: "",
                                          PAKHIR: "",
                                        }));

                                        // 🔥 reset error juga
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          PAWAL: "",
                                        }));
                                      }}
                                    >
                                      ✕
                                    </InputAdornment>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </>
                              ),
                            },
                          }),
                          actionBar: {
                            actions: ["clear", "today"],
                          },
                        }}
                      />
                    </Grid>

                    {/* ================= PAKHIR ================= */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <DatePicker
                        label={
                          <span>
                            Periode Akhir <span style={{ color: "red" }}>*</span>
                          </span>
                        }
                        format="DD-MM-YYYY"
                        value={values.PAKHIR ? dayjs(values.PAKHIR) : null}
                        onChange={(newValue) => {
                          const val = newValue ? newValue.format("YYYY-MM-DD") : "";

                          setValues((prev: any) => ({
                            ...prev,
                            PAKHIR: val,
                          }));

                          // 🔥 reset error
                          setErrors((prev: any) => ({
                            ...prev,
                            PAKHIR: "",
                          }));
                        }}
                        minDate={values.PAWAL ? dayjs(values.PAWAL) : undefined}
                        slotProps={{
                          textField: (params) => ({
                            ...params,
                            size: "small",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },

                            // 🔥 ERROR
                            error: !!errors.PAKHIR,
                            helperText: errors.PAKHIR || "Otomatis dari periode",

                            sx: inputCompactStyle,

                            InputProps: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {values.PAKHIR && (
                                    <InputAdornment
                                      position="end"
                                      sx={{ cursor: "pointer", mr: 0.5 }}
                                      onClick={() => {
                                        setValues((prev: any) => ({
                                          ...prev,
                                          PAKHIR: "",
                                        }));

                                        // 🔥 reset error juga
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          PAKHIR: "",
                                        }));
                                      }}
                                    >
                                      ✕
                                    </InputAdornment>
                                  )}
                                  {params.InputProps?.endAdornment}
                                </>
                              ),
                            },
                          }),
                          actionBar: {
                            actions: ["clear", "today"],
                          },
                        }}
                      />
                    </Grid>

                  </Grid>
                </LocalizationProvider>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={vendorOptions ?? []}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        vendorOptions?.find((c) => c.value === values.NMPERUSAHAAN) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          NMPERUSAHAAN: v?.value ?? "",
                        }));

                        // 🔥 reset error
                        setErrors((prev: any) => ({
                          ...prev,
                          NMPERUSAHAAN: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      noOptionsText="Data tidak ditemukan"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Perusahaan <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Pilih Perusahaan"
                          InputLabelProps={{ shrink: true }}

                          // 🔥 ERROR
                          error={!!errors.NMPERUSAHAAN}
                          helperText={errors.NMPERUSAHAAN}

                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={jenisKontrakOptions ?? []}
                      loading={loadingJenisKontrak}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        jenisKontrakOptions?.find((c) => c.value === values.JNSKONTRAK) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          JNSKONTRAK: v?.value ?? "",
                        }));

                        // 🔥 reset error
                        setErrors((prev: any) => ({
                          ...prev,
                          JNSKONTRAK: "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      fullWidth
                      noOptionsText="Data tidak ditemukan"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label={
                            <span>
                              Jenis Kontrak <span style={{ color: "red" }}>*</span>
                            </span>
                          }
                          placeholder="Pilih Jenis Kontrak"
                          InputLabelProps={{ shrink: true }}

                          // 🔥 ERROR
                          error={!!errors.JNSKONTRAK}
                          helperText={errors.JNSKONTRAK}

                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* ================= DATA PENGGAJIAN ================= */}
              <SectionTitle
                title="Data Penggajian"
                subtitle="Informasi penggajian, pajak, dan jaminan"
              />

              <Stack spacing={1.5}>

                <Grid container spacing={2}>
                  {/* ================= KATEGORI GAJI ================= */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={kategoriGajiOptions ?? []}
                      loading={loadingKategoriGaji}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        kategoriGajiOptions?.find(
                          (c) => c.value === values.KATEGORIGAJI
                        ) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          KATEGORIGAJI: v?.value ?? "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      noOptionsText="Data tidak ditemukan"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Kategori Gaji"
                          placeholder="Pilih Kategori"
                          InputLabelProps={{ shrink: true }}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>

                  {/* ================= JENIS GAJI ================= */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={jenisGajiOptions ?? []}
                      loading={loadingJenisGaji}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        jenisGajiOptions?.find(
                          (c) => c.value === values.JNSGAJI
                        ) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          JNSGAJI: v?.value ?? "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      noOptionsText="Data tidak ditemukan"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Jenis Gaji"
                          placeholder="Pilih Jenis"
                          InputLabelProps={{ shrink: true }}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small"
                      label="NPWP"
                      value={values.NONPWP ?? ""}
                      onChange={handleChange("NONPWP")}
                      sx={inputCompactStyle}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={statusPajakOptions ?? []}
                      loading={loadingStatusPajak}
                      getOptionLabel={(o) => o.title ?? ""}
                      value={
                        statusPajakOptions?.find((c) => c.value === values.PPH21) ?? null
                      }
                      onChange={(_, v) => {
                        setValues((prev: any) => ({
                          ...prev,
                          PPH21: v?.value ?? "",
                        }));
                      }}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      fullWidth
                      noOptionsText="Data tidak ditemukan"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          label="Status Pajak (PPH21)" // 🔥 lebih jelas
                          placeholder="Pilih Status Pajak"
                          InputLabelProps={{ shrink: true }}
                          sx={inputCompactStyle}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={(theme) => ({
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,

                    // 🔥 adaptive background
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "#f8fafc",

                    // 🔥 soft border (bukan dashed)
                    border:
                        theme.palette.mode === "dark"
                          ? "1px dashed #e5e7eb" // tetap terang di dark
                          : "1px dashed #6b7280", // abu gelap di light

                    transition: "all 0.2s ease",

                    // 🔥 hover effect
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "#f1f5f9",
                    },
                  })}
                >
                  <Checkbox
                    checked={values.ISJAMINANBPJS ?? false}
                    onChange={handleChange("ISJAMINANBPJS")}
                    size="small"
                  />

                  <Typography fontSize={14} fontWeight={500}>
                    Jaminan BPJS
                  </Typography>
                </Box>
                {/* 🔥 CONDITIONAL RENDER */}
                {values.ISJAMINANBPJS && (
                  <Stack spacing={1} mt={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="BPJS TK"
                      value={values.NOBPJSTK ?? ""}
                      onChange={handleChange("NOBPJSTK")}
                      sx={inputCompactStyle}

                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="BPJS Kesehatan"
                      value={values.NOBPJSKSH ?? ""}
                      onChange={handleChange("NOBPJSKSH")}
                      sx={inputCompactStyle}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="BPJS Hari Tua"
                      value={values.NOBPJSJHT ?? ""}
                      onChange={handleChange("NOBPJSJHT")}
                      sx={inputCompactStyle}
                    />
                  </Stack>
                )}

              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* ================= SURAT TUGAS ================= */}
              <SectionTitle
                title="Surat Tugas"
                subtitle="Informasi tambahan terkait penugasan"
              />

              <Stack spacing={1.5}>

                <TextField
                  fullWidth size="small"
                  label="No Surat Tugas"
                  value={values.NOSURATTUGAS ?? ""}
                  onChange={handleChange("NOSURATTUGAS")}
                  sx={inputCompactStyle}
                />

                

              </Stack>

            </Grid>
          </Grid>

        </DialogContent>

        <DialogActions
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            px: 3,
            py: 2,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper,

            display: "flex",
            justifyContent: "space-between", // 🔥 kiri & kanan
            alignItems: "center",
          }}
        >
          {/* 🔥 KIRI: CATATAN */}
          <Typography
            fontSize={12}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: "#eff6ff", // 🔵 soft blue
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",

              fontStyle: "italic",        // 🔥 ini kunci
            }}
          >
            💡 Klik “Pilih Karyawan” untuk mencari dan mengisi data karyawan secara otomatis
          </Typography>

          {/* 🔥 KANAN: BUTTON */}
          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={onClose}>
              Batal
            </Button>

            {/* PRINT */}
            <Tooltip title={!values?.NOKONTRAK ? "Kontrak belum dibuat" : "Print Kontrak"}>
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  loading={loading}
                  disabled={!values?.NOKONTRAK}
                  onClick={() => {
                    if (!values?.NOKONTRAK) return
                    handlePrintKontrak(values.NOKONTRAK)
                  }}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <IconPrinter size={16} />
                    )
                  }
                >
                  Print
                </Button>
              </span>
            </Tooltip>
            
            <AccessButton
              access={{ subject: "KontrakPkwt", action: "SaveEditKontrakPkwt" }}
              color="primary"
              variant="contained"
              loading={loading}
              //onClick={handleSubmit} // 🔥 INI WAJIB
              onClick={(e) => {
                console.log("CLICKED 🔥");
                handleSubmit(e, false); // ✅ FIX
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconDeviceFloppy size={16} />
                )
              }
            >
              {loading ? "Menyimpan..." : "Simpan Kontrak"}
            </AccessButton>
          </Box>
        </DialogActions>
        
        <PdfPreviewDialog
          open={previewOpen}
          loading={previewLoading}
          base64Pdf={pdfBase64}
          title="Preview Kontrak"
          onClose={() => {
            setPreviewOpen(false);
            setPdfBase64(null);
          }}
        />
  
      </form>
    </Dialog>

    
  )
}

export default FormKontrakKaryawan