import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  label: string;
  value: string;
};

export default function ProfileItem({ label, value }: Props) {
  return (
    <Box
      sx={(theme) => ({
        p: 1.1,
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
      })}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 10.5, opacity: 0.65, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>

      <Typography fontWeight={800} fontSize={13.2} mt={0.2} lineHeight={1.2}>
        {value}
      </Typography>
    </Box>
  );
}