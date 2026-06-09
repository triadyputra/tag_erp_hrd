import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconInfoCircle } from "@tabler/icons-react";
import { borderColor, textBlue, textRed } from "./karyawanStyles";

const LEGEND = [
  { label: "Non Aktif", color: "#ef4444" },
  { label: "Akan Aktif", color: "#f59e0b" },
  { label: "Sedang Aktif", color: "#22c55e" },
];

export default function KeteranganKontrak() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${borderColor(theme)}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.info.main, 0.08)
            : alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", lg: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              mt: 0.25,
              color: "primary.main",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <IconInfoCircle size={18} stroke={1.75} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} fontSize={13} mb={0.5}>
              Keterangan status kontrak
            </Typography>
            <Typography sx={(t) => ({ ...textRed(t), lineHeight: 1.5 })}>
              Kontrak aktif: Tgl. Aktif ≤ hari ini dan P.Akhir ≥ hari ini.
            </Typography>
            <Typography sx={(t) => ({ ...textBlue(t), lineHeight: 1.5, mt: 0.35 })}>
              PKWT: Tgl. Aktif = P.AWAL + 3 bulan. Selain PKWT: Tgl. Aktif = P.AWAL.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          {LEGEND.map((it) => (
            <Box
              key={it.label}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.1,
                py: 0.55,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                color: "text.secondary",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${borderColor(theme)}`,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: it.color,
                }}
              />
              {it.label}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
