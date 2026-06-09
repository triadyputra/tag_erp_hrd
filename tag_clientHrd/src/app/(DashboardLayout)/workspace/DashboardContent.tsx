"use client";

import React from "react";
import Box from "@mui/material/Box";
import { useTabWorkspace } from "@/app/context/tabWorkspaceContext";
import TabWorkspace from "./TabWorkspace";

export default function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tabs, hydrated } = useTabWorkspace();

  const showWorkspace = hydrated && tabs.length > 0;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showWorkspace && <TabWorkspace />}
      <Box
        sx={{
          display: showWorkspace ? "none" : "block",
          flex: showWorkspace ? 0 : undefined,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
