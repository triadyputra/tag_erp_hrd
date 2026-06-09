import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  borderColor,
  innerTabStyle,
  pageStyle,
  sectionCardStyle,
} from "./karyawanStyles";
import StatItem from "./StatItem";
import ProfileItem from "./ProfileItem";
import KeteranganKontrak from "./KeteranganKontrak";
import KontrakTable from "./KontrakTable";
import SPTable from "./SPTable";
import KontrakProgressBar from "./KontrakProgressBar";
import { getDetailKaryawan, getFilterKaryawan } from "@/hooks/useComboGroup";
import ImagePreviewDialog from "@/app/components/ImagePreview/ImagePreviewDialog";
import {
  IconBuilding,
  IconCalendar,
  IconIdBadge,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";

export default function PageKaryawan() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    if (selected) return;
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
        const res = await getFilterKaryawan(keyword);
        if (active) setList(res || []);
      } catch {
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
      const res = await getDetailKaryawan(item.NOKTP);
      setDetail(res);
    } catch {
      /* ignore */
    } finally {
      setLoadingDetail(false);
    }
  };

  const resetSelection = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelected(null);
    setDetail(null);
    setKeyword("");
    setShowDropdown(false);
  };

  function hitungMasaKerja(profile: any, kontrak: any[]) {
    if (!profile?.TGLMASUK) return "-";
    const tglMasuk = new Date(profile.TGLMASUK);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tglAcuan: Date;
    if (profile?.ResignDate) {
      tglAcuan = new Date(profile.ResignDate);
    } else {
      const kontrakAktif = kontrak?.find((k) => {
        const start = k.PAWAL ? new Date(k.PAWAL) : null;
        const end = k.PAKHIR ? new Date(k.PAKHIR) : null;
        return start && end && start <= today && end >= today;
      });

      if (kontrakAktif) {
        tglAcuan = today;
      } else {
        const terakhir = kontrak
          ?.filter((k) => k.PAKHIR)
          ?.sort(
            (a, b) =>
              new Date(b.PAKHIR).getTime() - new Date(a.PAKHIR).getTime()
          )[0];
        tglAcuan = terakhir ? new Date(terakhir.PAKHIR) : today;
      }
    }

    let tahun = tglAcuan.getFullYear() - tglMasuk.getFullYear();
    let bulan = tglAcuan.getMonth() - tglMasuk.getMonth();
    let hari = tglAcuan.getDate() - tglMasuk.getDate();
    if (hari < 0) {
      bulan--;
      hari += new Date(tglAcuan.getFullYear(), tglAcuan.getMonth(), 0).getDate();
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
    const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "-";
    return `${days} hari`;
  }

  function getProgressKontrak(kontrak: any[]) {
    const aktif = getKontrakAktif(kontrak);
    if (!aktif?.PAWAL || !aktif?.PAKHIR) return { progress: 0, sisa: "-" };

    const start = new Date(aktif.PAWAL);
    const end = new Date(aktif.PAKHIR);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const total = end.getTime() - start.getTime();
    const berjalan = today.getTime() - start.getTime();
    if (total <= 0) return { progress: 0, sisa: "-" };

    const progress = Math.max(0, Math.min(100, (berjalan / total) * 100));
    const sisaHari = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { progress, sisa: sisaHari >= 0 ? `${sisaHari} hari` : "-" };
  }

  function hitungUsia(tglLahir?: string) {
    if (!tglLahir) return "-";
    const birth = new Date(tglLahir);
    const today = new Date();
    let tahun = today.getFullYear() - birth.getFullYear();
    let bulan = today.getMonth() - birth.getMonth();
    let hari = today.getDate() - birth.getDate();
    if (hari < 0) {
      bulan--;
      hari += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (bulan < 0) {
      tahun--;
      bulan += 12;
    }
    return `${tahun} th ${bulan} bln`;
  }

  const progressKontrak = getProgressKontrak(detail?.Kontrak || []);
  const displayName =
    detail?.Profile?.NAMALENGKAP || selected?.NAMALENGKAP || "Pilih karyawan";
  const displayNik =
    detail?.Profile?.NIKSISTAG || selected?.NIKSISTAG || "-";
  const displayJabatan =
    detail?.Profile?.NMJABATAN || selected?.NMJABATAN || "-";

  return (
    <Box sx={pageStyle}>
      {/* Toolbar pencarian */}
      <Box
        sx={{
          mb: 2.5,
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${borderColor(theme)}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.default, 0.5)
              : theme.palette.grey[50],
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
          <IconSearch size={16} stroke={1.75} color={theme.palette.text.secondary} />
          <Typography fontWeight={800} fontSize={13}>
            Cari Karyawan
          </Typography>
        </Stack>

        <Box position="relative" onClick={(e) => e.stopPropagation()}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ketik nama karyawan (min. 3 huruf)..."
            value={keyword}
            onChange={(e) => {
              if (selected) return;
              setKeyword(e.target.value);
            }}
            onFocus={() => !selected && setShowDropdown(true)}
            InputProps={{
              readOnly: !!selected,
              endAdornment: selected ? (
                <IconButton size="small" onClick={resetSelection} aria-label="Reset pilihan">
                  <IconX size={16} />
                </IconButton>
              ) : undefined,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
          />

          {showDropdown && !selected && (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                bgcolor: "background.paper",
                border: `1px solid ${borderColor(theme)}`,
                borderRadius: 2,
                zIndex: 20,
                boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                overflow: "hidden",
              }}
            >
              <Box maxHeight={240} overflow="auto">
                {loadingSearch ? (
                  <Box p={2.5} textAlign="center">
                    <CircularProgress size={22} />
                  </Box>
                ) : keyword.length < 3 ? (
                  <Box p={2}>
                    <Typography fontSize={12.5} color="text.secondary">
                      Ketik minimal 3 huruf untuk mencari...
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
                        px: 1.75,
                        py: 1.25,
                        cursor: "pointer",
                        borderBottom: `1px solid ${borderColor(theme)}`,
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Typography fontWeight={700} fontSize={13}>
                        {item.NAMALENGKAP}
                      </Typography>
                      <Typography fontSize={11.5} color="text.secondary">
                        {item.NMJABATAN} · {item.NMDIVISI}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        {item.NOKTP} · {item.NMCABANG}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Ringkasan karyawan */}
      <Box sx={(t) => ({ ...sectionCardStyle(t), mb: 2.5, p: 2, position: "relative" })}>
        {loadingDetail && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Avatar
              src={detail?.Profile?.FOTO_BASE64}
              onClick={() => detail?.Profile?.FOTO_BASE64 && setOpenPreview(true)}
              sx={{
                width: 64,
                height: 64,
                fontSize: 22,
                fontWeight: 800,
                border: `2px solid ${borderColor(theme)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                cursor: detail?.Profile?.FOTO_BASE64 ? "pointer" : "default",
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0) || "?"}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{ width: 3, height: 20, borderRadius: 1, bgcolor: "primary.main", flexShrink: 0 }}
                />
                <Typography fontWeight={800} fontSize={17} noWrap>
                  {displayName}
                </Typography>
              </Stack>
              <Typography fontSize={12.5} color="text.secondary" mt={0.35}>
                NIK {displayNik} · {displayJabatan}
              </Typography>

              <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
                {[
                  { icon: IconIdBadge, text: detail?.Profile?.NMDIVISI || selected?.NMDIVISI || "Divisi -" },
                  { icon: IconBuilding, text: detail?.Profile?.NMVENDOR ? `Vendor: ${detail.Profile.NMVENDOR}` : "Vendor -" },
                  {
                    icon: IconCalendar,
                    text: detail?.Profile?.TGLMASUK
                      ? `TMT ${new Date(detail.Profile.TGLMASUK).toLocaleDateString("id-ID")}`
                      : "TMT -",
                  },
                ].map(({ icon: Icon, text }, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.4,
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "text.secondary",
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      border: `1px solid ${borderColor(theme)}`,
                    }}
                  >
                    <Icon size={13} stroke={1.75} />
                    {text}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
            <StatItem label="Kontrak" value={detail?.Kontrak?.length || 0} />
            <StatItem label="SP" value={detail?.SP?.length || 0} />
            <StatItem label="Masa Kerja" value={hitungMasaKerja(detail?.Profile, detail?.Kontrak)} />
            <StatItem label="Sisa Kontrak" value={getSisaKontrak(detail?.Kontrak || [])} />
          </Stack>
        </Stack>

        {selected && (
          <KontrakProgressBar
            kontrak={detail?.Kontrak || []}
            progress={progressKontrak.progress}
            sisa={progressKontrak.sisa}
          />
        )}
      </Box>

      <Grid container spacing={2.5}>
        {/* Profil */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={(t) => ({ ...sectionCardStyle(t), p: 2 })}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <IconUser size={16} stroke={1.75} />
              <Box>
                <Typography fontWeight={800} fontSize={14}>
                  Data Profil
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  Informasi dasar karyawan
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2, opacity: 0.7 }} />
            <Stack spacing={1.25}>
              <ProfileItem label="No KTP" value={detail?.Profile?.NOKTP || "-"} />
              <ProfileItem label="Nama Lengkap" value={detail?.Profile?.NAMALENGKAP || "-"} />
              <ProfileItem label="Jenis Kelamin" value={detail?.Profile?.KELAMIN || "-"} />
              <ProfileItem
                label="Tanggal Lahir"
                value={
                  detail?.Profile?.TGLLAHIR
                    ? new Date(detail.Profile.TGLLAHIR).toLocaleDateString("id-ID")
                    : "-"
                }
              />
              <ProfileItem label="Usia" value={hitungUsia(detail?.Profile?.TGLLAHIR)} />
              <ProfileItem label="Alamat" value={detail?.Profile?.ALAMAT || "-"} />
              <ProfileItem
                label="TMT"
                value={
                  detail?.Profile?.TGLMASUK
                    ? new Date(detail.Profile.TGLMASUK).toLocaleDateString("id-ID")
                    : "-"
                }
              />
              <ProfileItem
                label="Tanggal Resign / Keluar"
                value={
                  detail?.Profile?.ResignDate
                    ? new Date(detail.Profile.ResignDate).toLocaleDateString("id-ID")
                    : "-"
                }
              />
              <ProfileItem label="Perusahaan" value={detail?.Profile?.NMVENDOR || "-"} />
            </Stack>
          </Box>
        </Grid>

        {/* Kontrak & SP */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={(t) => sectionCardStyle(t)}>
            <Box sx={{ p: 2, pb: 1.5 }}>
              <KeteranganKontrak />
            </Box>

            <Box
              sx={{
                px: 2,
                pb: 1.5,
                borderTop: `1px solid ${borderColor(theme)}`,
                pt: 1.5,
              }}
            >
              <Stack direction="row" spacing={0.75}>
                {(["Kontrak", "SP"] as const).map((label, i) => (
                  <Box
                    key={label}
                    role="tab"
                    aria-selected={tab === i}
                    onClick={() => setTab(i)}
                    sx={innerTabStyle(theme, tab === i)}
                  >
                    {label}
                    {i === 0 && detail?.Kontrak && (
                      <Typography
                        component="span"
                        sx={{ ml: 0.75, fontSize: 11, fontWeight: 800, opacity: 0.85 }}
                      >
                        ({detail.Kontrak.length})
                      </Typography>
                    )}
                    {i === 1 && detail?.SP && (
                      <Typography
                        component="span"
                        sx={{ ml: 0.75, fontSize: 11, fontWeight: 800, opacity: 0.85 }}
                      >
                        ({detail.SP.length})
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box sx={{ px: 2, pt: 0, pb: 2.5 }}>
              {tab === 0 && <KontrakTable data={detail?.Kontrak || []} />}
              {tab === 1 && <SPTable data={detail?.SP || []} />}
            </Box>
          </Box>
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
