import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { borderColor } from "./karyawanStyles";

type Props = {
  label: string;
  value: string | number;
};

export default function StatItem({ label, value }: Props) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        textAlign: "center",
        px: 1.5,
        py: 1,
        minWidth: 88,
        borderRadius: 1.5,
        border: `1px solid ${borderColor(theme)}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Typography fontWeight={800} fontSize={15} lineHeight={1.1} color="primary.main">
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: 10.5, fontWeight: 600, mt: 0.25, display: "block" }}
      >
        {label}
      </Typography>
    </Box>
  );
}
