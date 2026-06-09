"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayersSubtract,
  IconPoint,
  IconX,
  IconXboxX,
} from "@tabler/icons-react";
import { useTabWorkspace } from "@/app/context/tabWorkspaceContext";
import { isPinnedTab } from "@/app/(DashboardLayout)/workspace/routeRegistry";
import { iconMap } from "@/utils/iconMap";

const TAB_BAR_HEIGHT = 46;
/** Icon + tombol tutup + padding horizontal */
const TAB_CHROME_PX = 76;
const TAB_MIN_WIDTH = 88;
const TAB_MAX_WIDTH = 320;
const TAB_TITLE_MAX_WIDTH = TAB_MAX_WIDTH - TAB_CHROME_PX;
const TAB_HEIGHT = 34;
const TAB_SCROLL_STEP = 240;

function TabIcon({ iconKey, active }: { iconKey?: string; active?: boolean }) {
  const Icon = iconKey ? iconMap[iconKey] : IconPoint;
  return (
    <Icon
      size={15}
      stroke={active ? 2 : 1.65}
      style={{ flexShrink: 0 }}
    />
  );
}

function scrollTabsBy(el: HTMLDivElement | null, delta: number) {
  if (!el) return;
  el.scrollBy({ left: delta, behavior: "smooth" });
}

type TabBarProps = {
  /** Tab + konten dalam satu shell (tanpa border bawah strip) */
  unified?: boolean;
};

export default function TabBar({ unified = false }: TabBarProps) {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const {
    tabs,
    activeHref,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
  } = useTabWorkspace();

  const isDark = theme.palette.mode === "dark";

  const trayBg = isDark
    ? alpha(theme.palette.background.default, 0.85)
    : alpha(theme.palette.grey[200], 0.45);

  const borderColor = isDark
    ? alpha("#fff", 0.08)
    : alpha("#0f172a", 0.1);

  const fadeBg = isDark ? theme.palette.background.paper : theme.palette.grey[100];

  const scrollBtnSx = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    width: 28,
    height: 28,
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${borderColor}`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
    color: "text.secondary",
    "&:hover": {
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      color: "primary.main",
      borderColor: alpha(theme.palette.primary.main, 0.25),
    },
  };

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollHints();
    const onScroll = () => updateScrollHints();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateScrollHints());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [tabs.length, updateScrollHints]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeHref) return;
    const active = el.querySelector<HTMLElement>(
      `[data-tab-href="${CSS.escape(activeHref)}"]`
    );
    if (!active) return;

    const pad = 16;
    const tabLeft = active.offsetLeft;
    const tabRight = tabLeft + active.offsetWidth;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;

    if (tabLeft < viewLeft + pad) {
      el.scrollLeft = Math.max(0, tabLeft - pad);
    } else if (tabRight > viewRight - pad) {
      el.scrollLeft = tabRight - el.clientWidth + pad;
    }
    updateScrollHints();
  }, [activeHref, tabs.length, updateScrollHints]);

  if (tabs.length === 0) return null;

  return (
    <Box
      component="nav"
      aria-label="Tab workspace"
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "stretch",
        columnGap: 0,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: TAB_BAR_HEIGHT,
        boxSizing: "border-box",
        bgcolor: unified ? "transparent" : trayBg,
        borderBottom: unified ? "none" : `1px solid ${borderColor}`,
      }}
    >
      {/* Area scroll tab */}
      <Box
        sx={{
          position: "relative",
          minWidth: 0,
          height: TAB_BAR_HEIGHT,
          display: "flex",
          alignItems: "flex-end",
          pl: 0.75,
        }}
      >
        {canScrollLeft && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 40,
                zIndex: 2,
                pointerEvents: "none",
                background: `linear-gradient(to right, ${fadeBg} 55%, ${alpha(fadeBg, 0)})`,
              }}
            />
            <IconButton
              size="small"
              aria-label="Scroll tab ke kiri"
              onClick={() =>
                scrollTabsBy(scrollRef.current, -TAB_SCROLL_STEP)
              }
              sx={{ ...scrollBtnSx, left: 6 }}
            >
              <IconChevronLeft size={15} />
            </IconButton>
          </>
        )}

        <Box
          ref={scrollRef}
          sx={{
            width: "100%",
            minWidth: 0,
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "flex-end",
            gap: 0.25,
            overflowX: "auto",
            overflowY: "hidden",
            height: TAB_BAR_HEIGHT,
            pb: 0,
            px: canScrollLeft ? 4.5 : 0.5,
            pr: canScrollRight ? 4.5 : 0.75,
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeHref === tab.href;
            const pinned = isPinnedTab(tab.href);
            const showTitleTooltip = tab.title.length > 22;

            return (
              <Tooltip
                key={tab.id}
                title={tab.title}
                arrow
                placement="bottom"
                disableHoverListener={!showTitleTooltip}
                enterDelay={400}
              >
                <Box
                  data-tab-href={tab.href}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={0}
                  onClick={() => setActiveTab(tab.href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveTab(tab.href);
                    }
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1 && !pinned) {
                      e.preventDefault();
                      closeTab(tab.href);
                    }
                  }}
                  sx={{
                  boxSizing: "border-box",
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  width: "max-content",
                  minWidth: TAB_MIN_WIDTH,
                  maxWidth: TAB_MAX_WIDTH,
                  height: TAB_HEIGHT,
                  px: 1.25,
                  flexShrink: 0,
                  cursor: "pointer",
                  userSelect: "none",
                  borderRadius: "8px 8px 0 0",
                  border: "1px solid",
                  borderBottom: isActive
                    ? `1px solid ${theme.palette.background.paper}`
                    : "none",
                  borderColor: isActive
                    ? borderColor
                    : "transparent",
                  bgcolor: isActive
                    ? theme.palette.background.paper
                    : "transparent",
                  color: isActive ? "text.primary" : "text.secondary",
                  boxShadow: "none",
                  transition:
                    "background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                  "&::after": isActive
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: 0,
                        height: 2,
                        borderRadius: "2px 2px 0 0",
                        bgcolor: "primary.main",
                      }
                    : undefined,
                  "&:hover": {
                    bgcolor: isActive
                      ? theme.palette.background.paper
                      : alpha(theme.palette.background.paper, isDark ? 0.5 : 0.85),
                    color: "text.primary",
                    borderColor: isActive
                      ? borderColor
                      : alpha(theme.palette.primary.main, 0.15),
                  },
                  ...(!pinned && {
                    "&:hover .tab-close-btn": { opacity: 1 },
                  }),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 1,
                    flexShrink: 0,
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.text.primary, 0.06),
                    color: isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  <TabIcon iconKey={tab.iconKey} active={isActive} />
                </Box>

                <Typography
                  variant="body2"
                  component="span"
                  noWrap
                  sx={{
                    flex: "0 1 auto",
                    maxWidth: TAB_TITLE_MAX_WIDTH,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 12.5,
                    fontWeight: isActive ? 700 : 500,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {tab.title}
                </Typography>

                {!pinned ? (
                  <IconButton
                    className="tab-close-btn"
                    size="small"
                    aria-label={`Tutup ${tab.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.href);
                    }}
                    sx={{
                      p: 0,
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      opacity: isActive ? 0.7 : 0,
                      color: "text.secondary",
                      transition:
                        "opacity 140ms ease, background-color 140ms ease",
                      "&:hover": {
                        opacity: 1,
                        bgcolor: alpha(theme.palette.error.main, 0.12),
                        color: "error.main",
                      },
                    }}
                  >
                    <IconX size={12} stroke={2} />
                  </IconButton>
                ) : null}
              </Box>
              </Tooltip>
            );
          })}
        </Box>

        {canScrollRight && (
          <>
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 40,
                zIndex: 2,
                pointerEvents: "none",
                background: `linear-gradient(to left, ${fadeBg} 55%, ${alpha(fadeBg, 0)})`,
              }}
            />
            <IconButton
              size="small"
              aria-label="Scroll tab ke kanan"
              onClick={() =>
                scrollTabsBy(scrollRef.current, TAB_SCROLL_STEP)
              }
              sx={{ ...scrollBtnSx, right: 6 }}
            >
              <IconChevronRight size={15} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Aksi kanan */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.25}
        sx={{
          flexShrink: 0,
          px: 1,
          height: TAB_BAR_HEIGHT,
          borderLeft: `1px solid ${borderColor}`,
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.35 : 0.65),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 1,
            py: 0.35,
            minWidth: 52,
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "text.secondary",
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            borderRadius: 1,
            border: `1px solid ${borderColor}`,
          }}
        >
          {tabs.length} tab
        </Typography>

        {tabs.length > 1 && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 0.5, height: 22, alignSelf: "center", borderColor }}
            />
            <Tooltip title="Tutup tab lain" arrow placement="bottom">
              <IconButton
                size="small"
                aria-label="Tutup tab lain"
                onClick={() => activeHref && closeOtherTabs(activeHref)}
                sx={{
                  width: 32,
                  height: 32,
                  color: "text.secondary",
                  borderRadius: 1.25,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  },
                }}
              >
                <IconLayersSubtract size={16} stroke={1.75} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tutup semua tab (kecuali Home)" arrow placement="bottom">
              <IconButton
                size="small"
                aria-label="Tutup semua tab"
                onClick={closeAllTabs}
                sx={{
                  width: 32,
                  height: 32,
                  color: "text.secondary",
                  borderRadius: 1.25,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: "error.main",
                  },
                }}
              >
                <IconXboxX size={16} stroke={1.75} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>
    </Box>
  );
}

export { TAB_BAR_HEIGHT };
