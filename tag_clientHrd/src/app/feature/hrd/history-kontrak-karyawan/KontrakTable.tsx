import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  Box,
  useTheme,
  TableContainer,
} from "@mui/material";
import { rowHover, tableStyle } from "./karyawanStyles";

// ================= FORMAT DATE =================
function formatDate(val?: string) {
  return val ? new Date(val).toLocaleDateString("id-ID") : "-";
}

// ================= STATUS =================
function getStatus(begin?: string, akhir?: string) {
  if (!begin && !akhir)
    return { label: "-", color: "default" as const };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = begin ? new Date(begin) : null;
  const end = akhir ? new Date(akhir) : null;

  if (start && end && start <= today && end >= today) {
    return { label: "Aktif", color: "success" as const };
  }

  if (end && end < today) {
    return { label: "Tidak Aktif", color: "error" as const };
  }

  if (start && start > today) {
    return { label: "Belum Aktif", color: "warning" as const };
  }

  return { label: "-", color: "default" as const };
}

// ================= ROW STYLE =================
function getRowStyle(begin?: string, akhir?: string, theme?: any) {
  if (!begin && !akhir) return {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = begin ? new Date(begin) : null;
  const end = akhir ? new Date(akhir) : null;

  const isDark = theme?.palette?.mode === "dark";

  // AKTIF
  if (start && end && start <= today && end >= today) {
    return {
      bgcolor: isDark
        ? "rgba(34,197,94,0.08)"
        : "rgba(34,197,94,0.06)",
    };
  }

  // SUDAH SELESAI
  if (end && end < today) {
    return {
      bgcolor: isDark
        ? "rgba(239,68,68,0.08)"
        : "rgba(239,68,68,0.05)",
    };
  }

  // BELUM AKTIF
  if (start && start > today) {
    return {
      bgcolor: isDark
        ? "rgba(234,179,8,0.08)"
        : "rgba(234,179,8,0.06)",
    };
  }

  return {};
}

// ================= CHIP STYLE =================
function getChipStyle(color: any, theme: any) {
  const isDark = theme.palette.mode === "dark";

  const map: any = {
    success: {
      bgcolor: isDark
        ? "rgba(34,197,94,0.2)"
        : "success.light",
      color: "success.main",
    },
    error: {
      bgcolor: isDark
        ? "rgba(239,68,68,0.2)"
        : "error.light",
      color: "error.main",
    },
    warning: {
      bgcolor: isDark
        ? "rgba(234,179,8,0.2)"
        : "warning.light",
      color: "warning.main",
    },
  };

  return map[color] || {};
}

// ================= HEADER STYLE =================
const headerStyle = (theme: any) => ({
  fontWeight: 600,
  fontSize: 12.5,
  color:
    theme.palette.mode === "dark"
      ? "common.white"
      : "text.primary", // 🔥 ini fix utama
  borderBottom: "1px solid",
  borderColor: "divider",
});

// ================= COMPONENT =================
export default function KontrakTable({ data = [] }: { data: any[] }) {
  const theme = useTheme();

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        ...tableStyle(theme),
        overflowX: "auto",
      }}
    >
      <Table size="small">
          {/* ================= HEADER ================= */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "#f8fafc",
              }}
            >
              <TableCell sx={headerStyle}>No Kontrak</TableCell>
              <TableCell sx={headerStyle}>Divisi</TableCell>
              <TableCell sx={headerStyle}>Jabatan</TableCell>
              <TableCell sx={headerStyle}>Periode</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
            </TableRow>
          </TableHead>

          {/* ================= BODY ================= */}
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => {
                const status = getStatus(item.BEGINDATE, item.PAKHIR);

                return (
                  <TableRow
                    key={i}
                    hover
                    sx={{
                      ...rowHover,
                      ...getRowStyle(
                        item.BEGINDATE,
                        item.PAKHIR,
                        theme
                      ),

                      "& td": {
                        color: theme.palette.text.primary,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1.35,
                        verticalAlign: "top",
                      },
                      "&:last-child td": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    {/* NO KONTRAK */}
                    <TableCell>
                      <Box>
                        <Typography fontSize={13} fontWeight={700} lineHeight={1.2}>
                          {item.NOKONTRAK}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {item.JNSKONTRAK} - {item.NMCABANG}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          Ket : {item.KETERANGAN}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* DIVISI */}
                    <TableCell>
                      <Box>
                        <Typography fontSize={13} fontWeight={700} lineHeight={1.2}>
                          {item.NMDIVISI}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {item.NMBAGIAN}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* JABATAN */}
                    <TableCell>{item.NMJABATAN}</TableCell>

                    {/* PERIODE */}
                    <TableCell>
                      <Box>
                        <Typography fontSize={13} fontWeight={700} lineHeight={1.2}>
                          {formatDate(item.PAWAL)}
                        </Typography>

                        <Typography fontSize={11} color="text.secondary">
                          sampai {formatDate(item.PAKHIR)}
                        </Typography>

                        <Typography
                          fontSize={11}
                          fontWeight={600}
                          mt={0.5}
                          sx={{
                            color: '#0F766E',
                            backgroundColor: '#ECFDF5',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            display: 'inline-block',
                          }}
                        >
                          {item.Validuser}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          borderRadius: 999,
                          fontSize: 11,
                          ...getChipStyle(status.color, theme),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

      </TableContainer>
      
    
  );
}