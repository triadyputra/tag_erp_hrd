import { Box, Typography, Grid, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { textBlue, textRed } from "./karyawanStyles";

export default function KeteranganKontrak() {
  return (
    <Box
      sx={(theme) => ({
        p: 2,
        borderRadius: 3,
        background:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.5)
            : "linear-gradient(180deg, rgba(2,132,199,0.03), rgba(255,255,255,1) 60%)",
        border: `1px solid ${
          theme.palette.mode === "dark"
            ? alpha("#fff", 0.10)
            : alpha("#0f172a", 0.07)
        }`,
      })}
    >
      <Typography
        sx={(theme) => ({
          fontWeight: 900,
          mb: 1,
          fontSize: 13.5,
          color: theme.palette.text.primary,
        })}
      >
        Keterangan
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography sx={(theme) => ({ ...textRed(theme), opacity: 0.85 })}>
            Data Kontrak yang AKTIVE adalah Data Kontrak yang :
          </Typography>

          <Typography sx={(theme) => ({ ...textRed(theme), opacity: 0.85 })}>
            Tgl.Aktif ≤ Tgl. Sekarang dan P.Akhir ≥ Tgl. Sekarang
          </Typography>

          <Typography sx={(theme) => ({ ...textBlue(theme), opacity: 0.85 })} mt={1}>
            Untuk Kontrak Selain PKWT Tgl. Aktif = P.AWAL Kontrak
          </Typography>

          <Typography sx={(theme) => ({ ...textBlue(theme), opacity: 0.85 })}>
            Untuk Kontrak PKWT Tgl. Aktif = P.AWAL Kontrak + 3 Bulan
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1}>
            {[
              { label: "Kontrak Non Aktif", color: "#ef4444" },
              { label: "Kontrak yang akan Aktif", color: "#f59e0b" },
              { label: "Kontrak yang sedang Aktif", color: "#22c55e" },
            ].map((it) => (
              <Box
                key={it.label}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.25,
                  py: 0.85,
                  borderRadius: 2,
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? alpha("#fff", 0.10)
                      : alpha("#0f172a", 0.06)
                  }`,
                  bgcolor: alpha(it.color, theme.palette.mode === "dark" ? 0.14 : 0.08),
                })}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    bgcolor: it.color,
                    boxShadow: `0 6px 16px ${alpha(it.color, 0.22)}`,
                  }}
                />
                <Typography fontSize={12.5} fontWeight={800} sx={{ color: "text.primary" }}>
                  {it.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}