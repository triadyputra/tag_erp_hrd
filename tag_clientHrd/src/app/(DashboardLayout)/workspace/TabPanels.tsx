"use client";

import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { IconAlertCircle } from "@tabler/icons-react";
import type { ComponentType } from "react";
import { useTabWorkspace } from "@/app/context/tabWorkspaceContext";
import { getRouteLoader, normalizeHref } from "./routeRegistry";

/** Cache komponen yang sudah di-load agar tab yang dibuka ulang tidak fetch ulang */
const loadedComponentCache = new Map<string, ComponentType>();

function TabPanelSkeleton() {
  return (
    <Box sx={{ pt: 0, px: 0, pb: 0 }}>
      <Skeleton variant="text" width={220} height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={320} height={18} sx={{ mb: 2.5 }} />
      <Skeleton
        variant="rounded"
        height={46}
        sx={{ mb: 2, borderRadius: 2 }}
      />
      <Stack spacing={1}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={38} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    </Box>
  );
}

function TabPanelContent({ href }: { href: string }) {
  const theme = useTheme();
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const normalizedHref = normalizeHref(href);
    const cached = loadedComponentCache.get(normalizedHref);
    if (cached) {
      setComponent(() => cached);
      setError(null);
      setReady(true);
      return;
    }

    const loader = getRouteLoader(normalizedHref);
    if (!loader) {
      setError("Halaman tidak ditemukan");
      setReady(true);
      return;
    }

    setComponent(null);
    setError(null);
    setReady(false);

    loader()
      .then((mod) => {
        if (!cancelled) {
          loadedComponentCache.set(normalizedHref, mod.default);
          setComponent(() => mod.default);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal memuat halaman");
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [href]);

  if (error) {
    return (
      <Box
        sx={{
          py: 8,
          px: 3,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            mb: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: "error.main",
          }}
        >
          <IconAlertCircle size={24} />
        </Box>
        <Typography fontWeight={700}>{error}</Typography>
      </Box>
    );
  }

  if (!Component || !ready) {
    return <TabPanelSkeleton />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        animation: "tabFadeIn 200ms ease",
        "@keyframes tabFadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Component />
    </Box>
  );
}

export default function TabPanels() {
  const { tabs, activeHref, hydrated } = useTabWorkspace();
  const active = normalizeHref(activeHref ?? "");
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!hydrated || !active) return;
    setVisited((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [active, hydrated]);

  const panelsToRender = useMemo(
    () => tabs.filter((t) => visited.has(normalizeHref(t.href))),
    [tabs, visited]
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      {panelsToRender.map((tab) => {
        const href = normalizeHref(tab.href);
        const isActive = href === active;

        return (
          <Box
            key={href}
            role="tabpanel"
            id={`workspace-tabpanel-${href}`}
            aria-labelledby={`workspace-tab-${href}`}
            hidden={!isActive}
            sx={{
              display: isActive ? "block" : "none",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <TabPanelContent href={href} />
          </Box>
        );
      })}
    </Box>
  );
}
