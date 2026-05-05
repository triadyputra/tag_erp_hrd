import { alpha } from "@mui/material/styles";

export const pageStyle = (theme: any) => ({
  p: 3,
  minHeight: "100vh",
  background:
    theme.palette.mode === "dark"
      ? "#0f172a"
      : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #eef2f7 100%)",
});

export const cardStyle = (theme: any) => ({
  borderRadius: 3,
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.6)
      : "linear-gradient(180deg, rgba(2,132,199,0.045), rgba(255,255,255,1) 55%)",
  border: `1px solid ${
    theme.palette.mode === "dark"
      ? alpha("#fff", 0.10)
      : alpha("#0f172a", 0.07)
  }`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 10px 28px rgba(0,0,0,0.32)"
      : "0 10px 28px rgba(0,0,0,0.06)",
});

// Khusus card profil bagian atas (yang ada header gradient + avatar overlap)
export const profileCardStyle = (theme: any) => ({
  borderRadius: 3,
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.65)
      : "linear-gradient(180deg, rgba(2,132,199,0.06), rgba(255,255,255,1) 58%)",
  border: `1px solid ${
    theme.palette.mode === "dark"
      ? alpha("#fff", 0.12)
      : alpha("#0f172a", 0.08)
  }`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 10px 30px rgba(0,0,0,0.35)"
      : "0 10px 30px rgba(0,0,0,0.06)",
});

export const tableStyle = {
  borderRadius: 3,
  overflow: "hidden",
  border: "1px solid rgba(15, 23, 42, 0.06)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

export const rowHover = {
  transition: "0.2s",
  "&:hover": {
    backgroundColor: "rgba(2, 132, 199, 0.05)",
  },
};

export const avatarStyle = {
  width: 110,
  height: 110,
  margin: "auto",
  border: "4px solid white",
  boxShadow: "0 10px 25px rgba(0,0,0,0.14)",
};

export const headerStyle = (theme: any) => ({
  height: 150,
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(15,23,42,0.65) 0%, rgba(3,105,161,0.45) 55%, rgba(2,132,199,0.35) 100%)"
      : "linear-gradient(135deg, rgba(226,232,240,0.85) 0%, rgba(186,230,253,0.65) 55%, rgba(165,243,252,0.55) 100%)",
});

export const legendDanger = (theme: any) => ({
  bgcolor: theme.palette.mode === "dark" ? "#b91c1c" : "#ef4444",
  color: "white",
  textAlign: "center",
  py: 1,
  borderRadius: 5,
  fontWeight: 600,
});

export const legendWarning = (theme: any) => ({
  bgcolor: theme.palette.mode === "dark" ? "#ca8a04" : "#facc15",
  color: "#111",
  textAlign: "center",
  py: 1,
  borderRadius: 5,
  fontWeight: 600,
});

export const legendSuccess = (theme: any) => ({
  bgcolor: theme.palette.mode === "dark" ? "#15803d" : "#22c55e",
  color: "white",
  textAlign: "center",
  py: 1,
  borderRadius: 5,
  fontWeight: 600,
});

export const textRed = (theme: any) => ({
  fontSize: 12,
  display: "block",
  color: theme.palette.mode === "dark" ? "#f87171" : "#ef4444",
});

export const textBlue = (theme: any) => ({
  fontSize: 12,
  display: "block",
  color: theme.palette.mode === "dark" ? "#60a5fa" : "#2563eb",
});