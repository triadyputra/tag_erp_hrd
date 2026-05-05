import {
  Box,
  Typography,
  Avatar,
  Stack,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  TextField,
  CircularProgress,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  avatarStyle,
  cardStyle,
  headerStyle,
  pageStyle,
  profileCardStyle,
} from "./karyawanStyles";
import StatItem from "./StatItem";
import ProfileItem from "./ProfileItem";
import KeteranganKontrak from "./KeteranganKontrak";
import KontrakTable from "./KontrakTable";
import SPTable from "./SPTable";
import { getDetailKaryawan, getFilterKaryawan } from "@/hooks/useComboGroup";
import ImagePreviewDialog from "@/app/components/ImagePreview/ImagePreviewDialog";
import { IconBuilding, IconCalendar, IconIdBadge, IconX } from "@tabler/icons-react";

export default function PageKaryawan() {
  const [tab, setTab] = useState(0);

  // 🔥 STATE SEARCH
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // 🔥 DETAIL
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [openPreview, setOpenPreview] = useState(false);

  // ================= SEARCH =================
  useEffect(() => {
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
        const res = await getFilterKaryawan(keyword);

        if (active) setList(res || []);
      } catch (err) {
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

  // ================= SELECT =================
  const handleSelect = async (item: any) => {
    try {
      if (loadingDetail) return;

      setSelected(item);
      setKeyword(item.NAMALENGKAP);
      setShowDropdown(false); // 🔥 langsung hilang

      setLoadingDetail(true);

      const res = await getDetailKaryawan(item.NOKTP);
      setDetail(res);
    } catch (err) {
    } finally {
      setLoadingDetail(false);
    }
  };

  function hitungMasaKerja(profile: any, kontrak: any[]) {
    if (!profile?.TGLMASUK) return "-";

    const tglMasuk = new Date(profile.TGLMASUK);

    // console.log(`TMT : ${tglMasuk}`)
    // console.log(`TMT : ${tglMasuk}`)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tglAcuan: Date;

    // 🔥 PRIORITAS 1: RESIGN DATE
    if (profile?.ResignDate) {
      tglAcuan = new Date(profile.ResignDate);
    } else {
      // 🔥 PRIORITAS 2: KONTRAK AKTIF
      const kontrakAktif = kontrak?.find((k) => {
        const start = k.PAWAL ? new Date(k.PAWAL) : null;
        const end = k.PAKHIR ? new Date(k.PAKHIR) : null;

        return start && end && start <= today && end >= today;
      });

      if (kontrakAktif) {
        tglAcuan = today;
      } else {
        // 🔥 PRIORITAS 3: KONTRAK TERAKHIR
        const terakhir = kontrak
          ?.filter((k) => k.PAKHIR)
          ?.sort(
            (a, b) =>
              new Date(b.PAKHIR).getTime() - new Date(a.PAKHIR).getTime()
          )[0];

        tglAcuan = terakhir ? new Date(terakhir.PAKHIR) : today;

        // console.log(`Kontrak Habis : ${terakhir.PAKHIR}`)
      }
    }

    console.log(`Tgl Acuan : ${tglAcuan}`)

    // ================= HITUNG =================
    let tahun = tglAcuan.getFullYear() - tglMasuk.getFullYear();
    let bulan = tglAcuan.getMonth() - tglMasuk.getMonth();
    let hari = tglAcuan.getDate() - tglMasuk.getDate();

    if (hari < 0) {
      bulan--;
      hari += new Date(
        tglAcuan.getFullYear(),
        tglAcuan.getMonth(),
        0
      ).getDate();
    }

    if (bulan < 0) {
      tahun--;
      bulan += 12;
    }

    return `${tahun} th ${bulan} bln`;
  }

  function getKontrakAktif(kontrak: any[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return kontrak?.find((k) => {
      const start = k.PAWAL ? new Date(k.PAWAL) : null;
      const end = k.PAKHIR ? new Date(k.PAKHIR) : null;

      if (!start || !end) return false;

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return start <= today && end >= today;
    });
  }

  function getSisaKontrak(kontrak: any[]) {
    const aktif = getKontrakAktif(kontrak);
    if (!aktif?.PAKHIR) return "-";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(aktif.PAKHIR);
    end.setHours(0, 0, 0, 0);

    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "-";
    return `${days} hari`;
  }

  function getProgressKontrak(kontrak: any[]) {
    const aktif = getKontrakAktif(kontrak);

    if (!aktif?.PAWAL || !aktif?.PAKHIR) {
      return {
        progress: 0,
        sisa: "-",
      };
    }

    const start = new Date(aktif.PAWAL);
    const end = new Date(aktif.PAKHIR);
    const today = new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const total = end.getTime() - start.getTime();
    const berjalan = today.getTime() - start.getTime();

    if (total <= 0) {
      return {
        progress: 0,
        sisa: "-",
      };
    }

    const progress = Math.max(0, Math.min(100, (berjalan / total) * 100));
    const sisaHari = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      progress,
      sisa: sisaHari >= 0 ? `${sisaHari} hari` : "-",
    };
  }

  const progressKontrak = getProgressKontrak(detail?.Kontrak || []);
  
  function hitungUsia(tglLahir?: string) {
    if (!tglLahir) return "-";

    const birth = new Date(tglLahir);
    const today = new Date();

    let tahun = today.getFullYear() - birth.getFullYear();
    let bulan = today.getMonth() - birth.getMonth();
    let hari = today.getDate() - birth.getDate();

    // koreksi hari
    if (hari < 0) {
      bulan--;
      hari += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    // koreksi bulan
    if (bulan < 0) {
      tahun--;
      bulan += 12;
    }

    return `${tahun} th ${bulan} bln`;
  }
  return (
    <Box sx={pageStyle}>
      {/* ================= HEADER ================= */}
      <Card
        sx={(theme) => ({
          ...profileCardStyle(theme),
          overflow: "hidden",
        })}
      >
        <Box sx={(theme) => headerStyle(theme)} />

        <Box
          sx={{
            textAlign: "center",
            mt: -7,
            pb: 2.25,
            px: 2,
            maxWidth: 820,
            mx: "auto",
          }}
        >
          <Avatar
            src={detail?.Profile?.FOTO_BASE64}
            onClick={() => {
              if (detail?.Profile?.FOTO_BASE64) setOpenPreview(true);
            }}
            sx={{
              width: 104,
              height: 104,
              fontSize: 38,
              border: "4px solid white",
              boxShadow: "0 10px 25px rgba(0,0,0,0.16)",
              mx: "auto",
              cursor: detail?.Profile?.FOTO_BASE64 ? "pointer" : "default",
              transition: "0.3s",
              "&:hover": {
                transform: detail?.Profile?.FOTO_BASE64 ? "scale(1.05)" : "none",
              },
              "& img": {
                objectFit: "cover",
              },
            }}
          >
            {detail?.Profile?.NAMALENGKAP?.charAt(0) || "?"}
          </Avatar>

          <Typography variant="h6" mt={1} fontWeight={800} lineHeight={1.15}>
            {detail?.Profile?.NAMALENGKAP ||
              selected?.NAMALENGKAP ||
              "Nama Karyawan"}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {detail?.Profile?.NMJABATAN ||
              selected?.NMJABATAN ||
              "-"}
          </Typography>

          {/* ================= INFO PILLS ================= */}
          <Stack
            direction="row"
            justifyContent="center"
            spacing={1}
            mt={1.25}
            flexWrap="wrap"
            useFlexGap
          >
            {[
              {
                icon: <IconIdBadge size={14} />,
                text: detail?.Profile?.NMDIVISI || selected?.NMDIVISI || "Divisi -",
              },
              {
                icon: <IconBuilding size={14} />,
                text: detail?.Profile?.NMVENDOR
                  ? `Perusahaan: ${detail.Profile.NMVENDOR}`
                  : "Perusahaan: -",
              },
              {
                icon: <IconCalendar size={14} />,
                text: detail?.Profile?.TGLMASUK
                  ? `Join ${new Date(detail.Profile.TGLMASUK).toLocaleDateString("id-ID")}`
                  : "Join -",
              },
            ].map((it, idx) => (
              <Box
                key={idx}
                sx={(theme) => ({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.2,
                  py: 0.65,
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.background.paper, 0.35)
                      : alpha("#0284c7", 0.06),
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? alpha("#fff", 0.10)
                      : alpha("#0f172a", 0.06)
                  }`,
                })}
              >
                <Box
                  sx={(theme) => ({
                    display: "grid",
                    placeItems: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha("#fff", 0.06)
                        : alpha("#ffffff", 0.9),
                    color: theme.palette.text.secondary,
                  })}
                >
                  {it.icon}
                </Box>
                <span>{it.text}</span>
              </Box>
            ))}
          </Stack>

          {/* ================= TAMBAHAN PROGRESS KONTRAK ================= */}
          <Box
            sx={{
              mt: 2.25,
              mx: "auto",
              width: "100%",
              maxWidth: 420,
              px: 0,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={0.75}
            >
              <Typography fontSize={12} fontWeight={600}>
                Progress Kontrak
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontSize={11} color="text.secondary">
                  {Math.round(progressKontrak.progress)}%
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  •
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  Sisa {progressKontrak.sisa}
                </Typography>
              </Stack>
            </Stack>

            <Box position="relative">
              <LinearProgress
                variant="determinate"
                value={progressKontrak.progress}
                sx={(theme) => ({
                  height: 10,
                  borderRadius: 999,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha("#fff", 0.08)
                      : alpha("#0f172a", 0.06),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundImage:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(90deg, rgba(56,189,248,0.9) 0%, rgba(34,211,238,0.9) 45%, rgba(99,102,241,0.9) 100%)"
                        : "linear-gradient(90deg, #38bdf8 0%, #22d3ee 45%, #6366f1 100%)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 18px rgba(34,211,238,0.18)"
                        : "0 8px 18px rgba(34,211,238,0.22)",
                  },
                })}
              />

              {/* indicator dot */}
              <Box
                sx={(theme) => ({
                  position: "absolute",
                  top: "50%",
                  left: `calc(${Math.max(0, Math.min(100, progressKontrak.progress))}% - 7px)`,
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha("#0b1220", 0.9)
                      : "#ffffff",
                  border: `2px solid ${
                    theme.palette.mode === "dark"
                      ? alpha("#38bdf8", 0.8)
                      : alpha("#38bdf8", 0.85)
                  }`,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 24px rgba(0,0,0,0.4)"
                      : "0 10px 24px rgba(0,0,0,0.14)",
                })}
              />
            </Box>
          </Box>

          {/* ================= STATS BAR ================= */}
          <Box
            sx={(theme) => ({
              mt: 2.25,
              mx: "auto",
              width: "100%",
              maxWidth: 520,
              borderRadius: 2.5,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.35)
                  : alpha("#ffffff", 0.85),
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? alpha("#fff", 0.10)
                  : alpha("#0f172a", 0.06)
              }`,
              px: 1.5,
              py: 1.25,
            })}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              divider={
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ opacity: 0.6, borderColor: alpha("#0f172a", 0.08) }}
                />
              }
              spacing={1.5}
              sx={{ flexWrap: "wrap", rowGap: 1.25 }}
            >
              <Box sx={{ minWidth: 90, flex: 1 }}>
                <StatItem label="Kontrak" value={detail?.Kontrak?.length || 0} />
              </Box>
              <Box sx={{ minWidth: 90, flex: 1 }}>
                <StatItem label="SP" value={detail?.SP?.length || 0} />
              </Box>
              <Box sx={{ minWidth: 120, flex: 1 }}>
                <StatItem label="Masa Kerja" value={hitungMasaKerja(detail?.Profile, detail?.Kontrak)} />
              </Box>
              <Box sx={{ minWidth: 120, flex: 1 }}>
                <StatItem label="Sisa Kontrak" value={getSisaKontrak(detail?.Kontrak || [])} />
              </Box>
            </Stack>
          </Box>
        </Box>
      </Card>

      {/* ================= CONTENT ================= */}
      <Grid container spacing={2} mt={2}>
        {/* LEFT */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={(theme) => cardStyle(theme)}>
            <CardContent sx={{ p: 2.5, position: "relative" }}>
              {/* 🔥 LOADING DETAIL OVERLAY */}
              {loadingDetail && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(255,255,255,0.6)",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                  }}
                >
                  <CircularProgress size={26} />
                </Box>
              )}

              <Box mb={2}>
                <Typography fontWeight={900} fontSize={14.5} lineHeight={1.2}>
                  Profile
                </Typography>
                <Typography fontSize={12.5} color="text.secondary" mt={0.35}>
                  Informasi dasar karyawan
                </Typography>
              </Box>

              <Divider sx={{ mb: 2, opacity: 0.7 }} />

              <Stack spacing={1.5}>
                <ProfileItem
                  label="No KTP"
                  value={detail?.Profile?.NOKTP || "-"}
                />

                {/* 🔥 SEARCH */}
                {/* ================= SEARCH SELECT (NAMA KARYAWAN) ================= */}
                <Box position="relative" onClick={(e) => e.stopPropagation()}>

                  {/* ================= DISPLAY ================= */}
                  <Box
                    onClick={() => {
                      if (!selected) setShowDropdown(true);
                    }}
                    sx={(theme) => ({
                      p: 1.25,
                      borderRadius: 2,
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.background.paper, 0.28)
                          : alpha("#ffffff", 0.9),
                      border: `1px solid ${
                        theme.palette.mode === "dark"
                          ? alpha("#fff", 0.10)
                          : alpha("#0f172a", 0.06)
                      }`,
                      transition: "0.18s ease",

                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: selected ? "default" : "pointer",

                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.background.paper, 0.32)
                            : alpha("#0284c7", 0.04),
                      },
                    })}
                  >
                    <Box>
                      <Typography fontSize={11.5} color="text.secondary">
                        Nama
                      </Typography>

                      <Typography fontSize={13.5} fontWeight={900} lineHeight={1.2}>
                        {keyword || "Pilih Karyawan"}
                      </Typography>
                    </Box>

                    {/* 🔥 RESET BUTTON */}
                    {selected && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(null);
                          setDetail(null);
                          setKeyword("");
                          setShowDropdown(false);
                        }}
                        size="small"
                        sx={(theme) => ({
                          color: theme.palette.text.secondary,
                          "&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.08) },
                        })}
                      >
                        <IconX size={16} />
                      </IconButton>
                    )}
                  </Box>

                  {/* ================= DROPDOWN ================= */}
                  {showDropdown && !selected && (
                    <Box
                      onClick={(e) => e.stopPropagation()}
                      sx={(theme) => ({
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        bgcolor: "background.paper",
                        border: `1px solid ${
                          theme.palette.mode === "dark"
                            ? alpha("#fff", 0.12)
                            : alpha("#0f172a", 0.10)
                        }`,
                        borderRadius: 2,
                        mt: 1,
                        zIndex: 10,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 18px 40px rgba(0,0,0,0.45)"
                            : "0 18px 40px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                      })}
                    >
                      {/* 🔍 INPUT SEARCH */}
                      <Box p={1} sx={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Cari nama karyawan..."
                          autoFocus
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
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
                                borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
                                "&:hover": {
                                  bgcolor: alpha("#0284c7", 0.06),
                                },
                              }}
                            >
                              <Typography fontWeight={600} fontSize={13}>
                                {item.NAMALENGKAP}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {item.NMJABATAN} - {item.NMDIVISI}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  color: "#64748b",
                                }}
                              >
                                {item.NOKTP} • {item.NMCABANG}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* AUTO FILL */}
                {/* <ProfileItem
                  label="Nama"
                  value={detail?.Profile?.NAMALENGKAP || "-"}
                /> */}
                <ProfileItem
                  label="Jenis Kelamin"
                  value={detail?.Profile?.KELAMIN || "-"}
                />
                <ProfileItem
                  label="Tanggal Lahir"
                  value={
                    detail?.Profile?.TGLLAHIR
                      ? new Date(detail.Profile.TGLLAHIR).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"
                  }
                />
                <ProfileItem
                  label="Usia"
                  value={hitungUsia(detail?.Profile?.TGLLAHIR)}
                />
                <ProfileItem
                  label="Alamat"
                  value={detail?.Profile?.ALAMAT || "-"}
                />
                <ProfileItem
                  label="TMT"
                  value={
                    detail?.Profile?.TGLMASUK
                      ? new Date(detail.Profile.TGLMASUK).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"
                  }
                />
                <ProfileItem
                  label="Tanggal Resign / Keluar"
                  value={
                    detail?.Profile?.ResignDate
                      ? new Date(detail.Profile.ResignDate).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"
                  }
                />
                <ProfileItem
                  label="Perusahaan"
                  value={detail?.Profile?.NMVENDOR || "-"}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={(theme) => cardStyle(theme)}>
            <Box p={2}>
              <KeteranganKontrak />
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
              <Tab label="Kontrak" />
              <Tab label="SP" />
            </Tabs>

            <CardContent>
              {tab === 0 && <KontrakTable data={detail?.Kontrak || []} />}
              {tab === 1 && <SPTable data={detail?.SP || []} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          <ImagePreviewDialog
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            image={detail?.Profile?.FOTO_BASE64}
          />
          
    </Box>
  );
}