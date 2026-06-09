"use client";

import React from "react";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { IconChevronRight, IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { useTabWorkspaceOptional } from "@/app/context/tabWorkspaceContext";
import {
  isWorkspaceRoute,
  normalizeHref,
} from "@/app/(DashboardLayout)/workspace/routeRegistry";

interface BreadcrumbItem {
  title: string;
  to?: string;
}

interface BreadCrumbType {
  subtitle?: string;
  items?: BreadcrumbItem[];
  title: string;
  children?: React.ReactNode;
}

function CrumbLink({
  href,
  label,
  isLast,
}: {
  href?: string;
  label: string;
  isLast?: boolean;
}) {
  const theme = useTheme();
  const tabWs = useTabWorkspaceOptional();

  const textSx = {
    fontSize: 12.5,
    fontWeight: isLast ? 700 : 600,
    lineHeight: 1.2,
    color: isLast ? "primary.main" : "text.secondary",
    transition: "color 160ms ease",
    "&:hover": !isLast ? { color: "primary.main" } : undefined,
  };

  if (!href || isLast) {
    return (
      <Typography component="span" sx={textSx}>
        {label}
      </Typography>
    );
  }

  const normalized = normalizeHref(href);
  const useTab = tabWs && isWorkspaceRoute(normalized);

  if (useTab) {
    return (
      <Typography
        component="button"
        type="button"
        onClick={() => tabWs.openTab(normalized, label)}
        sx={{
          ...textSx,
          border: "none",
          p: 0,
          m: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {label}
      </Typography>
    );
  }

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Typography component="span" sx={textSx}>
        {label}
      </Typography>
    </Link>
  );
}

const Breadcrumb = ({ subtitle, items, title, children }: BreadCrumbType) => {
  const theme = useTheme();
  const tabWs = useTabWorkspaceOptional();
  const inWorkspace = Boolean(tabWs?.hydrated && tabWs.tabs.length > 0);

  const borderColor =
    theme.palette.mode === "dark"
      ? alpha("#fff", 0.1)
      : alpha("#0f172a", 0.08);

  const trail = items ?? [];

  return (
    <Box
      sx={{
        ...(inWorkspace
          ? {
              position: "relative",
              zIndex: 2,
              mt: 0,
              px: 0,
              py: 0,
              border: "none",
              borderRadius: 0,
              bgcolor: "transparent",
              boxShadow: "none",
              borderBottom: `1px solid ${borderColor}`,
              pb: 2,
              mb: 2,
            }
          : {
              px: 2,
              py: 1.75,
              borderRadius: 2,
              border: `1px solid ${borderColor}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
              mb: 2.5,
            }),
      }}
    >
      {trail.length > 0 && (
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={
            <IconChevronRight
              size={14}
              stroke={1.75}
              color={theme.palette.text.disabled}
            />
          }
          sx={{
            mb: 0.75,
            "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
            "& .MuiBreadcrumbs-li": {
              display: "inline-flex",
              alignItems: "center",
            },
          }}
        >
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            const isHome = item.to === "/" || item.title?.toLowerCase() === "home";

            return (
              <Box
                key={`${item.title}-${index}`}
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                {isHome && index === 0 && (
                  <IconHome
                    size={14}
                    stroke={1.75}
                    style={{
                      color: isLast
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      flexShrink: 0,
                    }}
                  />
                )}
                <CrumbLink href={item.to} label={item.title} isLast={isLast} />
              </Box>
            );
          })}
        </Breadcrumbs>
      )}

      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 3,
            height: 22,
            borderRadius: 1,
            flexShrink: 0,
            bgcolor: "primary.main",
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: 17, sm: 18 },
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "text.primary",
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.35,
                fontSize: 12.5,
                color: "text.secondary",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {children ? (
          <Box sx={{ flexShrink: 0, ml: "auto" }}>{children}</Box>
        ) : null}
      </Stack>
    </Box>
  );
};

export default Breadcrumb;
