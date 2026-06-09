"use client";

import React from "react";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import TabBar, { TAB_BAR_HEIGHT } from "./TabBar";
import TabPanels from "./TabPanels";

/** Jarak antara strip tab dan breadcrumb */
export const WORKSPACE_CONTENT_GAP = 3;

export default function TabWorkspace() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const borderColor = isDark
    ? alpha("#fff", 0.1)
    : alpha("#0f172a", 0.08);

  const trayBg = isDark
    ? alpha(theme.palette.background.default, 0.92)
    : alpha(theme.palette.grey[200], 0.5);

  return (
    <Box
      sx={{
        display: "block",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        mb: 2.5,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${borderColor}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: isDark
          ? `0 4px 24px ${alpha("#000", 0.32)}`
          : `0 4px 18px ${alpha("#0f172a", 0.07)}, 0 1px 3px ${alpha("#0f172a", 0.04)}`,
      }}
    >
      <Box
        sx={{
          bgcolor: trayBg,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <TabBar unified />
      </Box>

      <Box
        component="section"
        aria-label="Konten tab aktif"
        sx={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          bgcolor: theme.palette.background.paper,
          pt: WORKSPACE_CONTENT_GAP,
          px: { xs: 1.5, sm: 2 },
          pb: { xs: 1.5, sm: 2 },
        }}
      >
        <TabPanels />
      </Box>
    </Box>
  );
}

export { TAB_BAR_HEIGHT };
