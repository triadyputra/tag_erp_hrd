"use client";

import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconClockHour4 } from "@tabler/icons-react";
import { borderColor } from "./karyawanStyles";

function formatShortDate(val?: string) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBarColors(progress: number, sisaHari: number | null, theme: any) {
  const isDark = theme.palette.mode === "dark";

  if (sisaHari != null && sisaHari <= 14) {
    return {
      gradient: isDark
        ? "linear-gradient(90deg, #f87171 0%, #ef4444 100%)"
        : "linear-gradient(90deg, #fca5a5 0%, #ef4444 100%)",
      glow: alpha("#ef4444", 0.35),
      label: "Segera berakhir",
      labelColor: "error.main",
    };
  }

  if (sisaHari != null && sisaHari <= 45) {
    return {
      gradient: isDark
        ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
        : "linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)",
      glow: alpha("#f59e0b", 0.3),
      label: "Perlu perhatian",
      labelColor: "warning.main",
    };
  }

  return {
    gradient: isDark
      ? "linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)"
      : "linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)",
    glow: alpha(theme.palette.primary.main, 0.28),
    label: "Berjalan normal",
    labelColor: "primary.main",
  };
}

type Props = {
  kontrak: any[];
  progress: number;
  sisa: string;
};

export default function KontrakProgressBar({ kontrak, progress, sisa }: Props) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  const aktif = kontrak?.find((k) => {
    if (!k?.PAWAL || !k?.PAKHIR) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(k.PAWAL);
    const end = new Date(k.PAKHIR);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return start <= today && end >= today;
  });

  const sisaNum =
    sisa !== "-" ? parseInt(sisa.replace(/[^\d]/g, ""), 10) : null;
  const colors = getBarColors(
    pct,
    sisaNum != null && !Number.isNaN(sisaNum) ? sisaNum : null,
    theme
  );

  if (!aktif) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 1.75,
          borderRadius: 2,
          border: `1px dashed ${borderColor(theme)}`,
          bgcolor: alpha(theme.palette.text.primary, 0.02),
          textAlign: "center",
        }}
      >
        <Typography fontSize={12.5} color="text.secondary" fontWeight={600}>
          Tidak ada kontrak aktif saat ini
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 2,
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${borderColor(theme)}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.primary.main, 0.06)
            : alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        mb={1.25}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <IconClockHour4 size={17} stroke={1.75} />
          </Box>
          <Box>
            <Typography fontSize={13} fontWeight={800} lineHeight={1.2}>
              Progress kontrak aktif
            </Typography>
            <Typography fontSize={11.5} sx={{ color: colors.labelColor, fontWeight: 700 }}>
              {colors.label}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="baseline">
          <Typography
            fontSize={22}
            fontWeight={900}
            lineHeight={1}
            sx={{
              background: colors.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {pct}%
          </Typography>
          <Typography fontSize={12} color="text.secondary" fontWeight={600}>
            Sisa {sisa}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="space-between" mb={0.75}>
        <Typography fontSize={11} color="text.secondary" fontWeight={600}>
          {formatShortDate(aktif.PAWAL)}
        </Typography>
        <Typography fontSize={11} color="text.secondary" fontWeight={600}>
          {formatShortDate(aktif.PAKHIR)}
        </Typography>
      </Stack>

      <Box sx={{ position: "relative", pt: 0.5, pb: 0.5 }}>
        <Box
          sx={{
            height: 12,
            borderRadius: 999,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha("#fff", 0.08)
                : alpha("#0f172a", 0.06),
            overflow: "hidden",
            boxShadow: `inset 0 1px 2px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 999,
              background: colors.gradient,
              boxShadow: `0 0 12px ${colors.glow}`,
              transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: `calc(${pct}% - 8px)`,
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            bgcolor: theme.palette.background.paper,
            border: `2.5px solid ${theme.palette.primary.main}`,
            boxShadow: `0 2px 8px ${colors.glow}`,
            transition: "left 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: "none",
          }}
        />
      </Box>

      {aktif.NOKONTRAK && (
        <Typography fontSize={11} color="text.secondary" mt={1} fontWeight={600}>
          No. Kontrak: {aktif.NOKONTRAK}
          {aktif.JNSKONTRAK ? ` · ${aktif.JNSKONTRAK}` : ""}
        </Typography>
      )}
    </Box>
  );
}
