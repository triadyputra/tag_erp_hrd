import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { borderColor } from "./karyawanStyles";

type Props = {
  label: string;
  value: string;
};

export default function ProfileItem({ label, value }: Props) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        borderRadius: 1.5,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(15,23,42,0.02)",
        border: `1px solid ${borderColor(theme)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography
        fontWeight={700}
        fontSize={13}
        mt={0.25}
        lineHeight={1.3}
        sx={{ wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Box>
  );
}
