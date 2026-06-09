import { alpha } from "@mui/material/styles";

export const borderColor = (theme: any) =>
  theme.palette.mode === "dark"
    ? alpha("#fff", 0.1)
    : alpha("#0f172a", 0.08);

export const pageStyle = {
  width: "100%",
  minWidth: 0,
};

export const sectionCardStyle = (theme: any) => ({
  borderRadius: 2,
  bgcolor: theme.palette.background.paper,
  border: `1px solid ${borderColor(theme)}`,
  boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
  overflow: "visible",
});

export const cardStyle = sectionCardStyle;

export const tableStyle = (theme: any) => ({
  borderRadius: 2,
  border: `1px solid ${borderColor(theme)}`,
  boxShadow: "none",
});

export const rowHover = {
  transition: "background-color 160ms ease",
  "&:hover": {
    backgroundColor: alpha("#0284c7", 0.04),
  },
};

export const textRed = (theme: any) => ({
  fontSize: 12,
  display: "block",
  color: theme.palette.mode === "dark" ? "#f87171" : "#dc2626",
});

export const textBlue = (theme: any) => ({
  fontSize: 12,
  display: "block",
  color: theme.palette.mode === "dark" ? "#60a5fa" : "#2563eb",
});

export const innerTabStyle = (
  theme: any,
  active: boolean
) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 34,
  px: 1.5,
  minWidth: 88,
  borderRadius: 2,
  cursor: "pointer",
  userSelect: "none" as const,
  fontSize: 12.5,
  fontWeight: active ? 800 : 600,
  color: active ? "primary.main" : "text.secondary",
  border: "1px solid",
  borderColor: active
    ? alpha(theme.palette.primary.main, 0.45)
    : "transparent",
  bgcolor: active
    ? alpha(theme.palette.primary.main, 0.1)
    : alpha(theme.palette.text.primary, 0.04),
  transition: "all 160ms ease",
  "&:hover": {
    color: "primary.main",
    borderColor: alpha(theme.palette.primary.main, 0.25),
    bgcolor: active
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.primary.main, 0.06),
  },
});

/** @deprecated Digunakan DialogDetailKaryawanTetap — pertahankan kompatibilitas */
export const headerStyle = (theme: any) => ({
  height: 120,
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.primary.main, 0.08),
});
