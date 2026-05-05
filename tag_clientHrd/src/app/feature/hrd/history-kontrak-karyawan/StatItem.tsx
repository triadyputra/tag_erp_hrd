import { Box, Typography } from "@mui/material";

type Props = {
  label: string;
  value: string;
};

export default function StatItem({ label, value }: Props) {
  return (
    <Box textAlign="center">
      <Typography fontWeight={800} fontSize={14} lineHeight={1.1}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
        {label}
      </Typography>
    </Box>
  );
}