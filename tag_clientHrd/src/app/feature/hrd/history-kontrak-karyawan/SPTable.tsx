import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { rowHover, tableStyle } from "./karyawanStyles";

function formatDate(val?: string) {
  return val ? new Date(val).toLocaleDateString("id-ID") : "-";
}

export default function SPTable({ data = [] }: { data: any[] }) {
  const theme = useTheme();
  return (
    <Paper sx={tableStyle}>
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              backgroundColor:
                theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc",
            }}
          >
            <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }}>Tanggal</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }}>No SP</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }}>Pelanggaran</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }}>Sanksi</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                <Typography color="text.secondary">
                  Data tidak ditemukan
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, i) => (
              <TableRow
                key={i}
                hover
                sx={{
                  ...rowHover,
                  "& td": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1.25,
                    fontSize: 12.5,
                  },
                }}
              >
                <TableCell>{formatDate(item.TGLPELANGGARAN)}</TableCell>

                <TableCell sx={{ fontWeight: 600 }}>{item.NOTRAN}</TableCell>

                {/* 🔥 PELANGGARAN + CATATAN */}
                <TableCell>
                  <Box>
                    <Typography fontSize={12.5} fontWeight={600} lineHeight={1.2}>
                      {item.PELANGGARANHRD}
                    </Typography>
                    {item.CATATANHRD && (
                      <Typography
                        fontSize={11.5}
                        color="text.secondary"
                      >
                        {item.CATATANHRD}
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* 🔥 SANKSI */}
                <TableCell>
                  <Typography fontSize={12.5} fontWeight={600} lineHeight={1.2}>
                    {item.SANKSIHRD}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}