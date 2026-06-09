"use client";

import { useEffect, useState, useContext } from "react";
import { useTabWorkspace } from "@/app/context/tabWorkspaceContext";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Skeleton from "@mui/material/Skeleton";
import useMediaQuery from "@mui/material/useMediaQuery";

import NavItem from "./NavItem";
import NavCollapse from "./NavCollapse";
import NavGroup from "./NavGroup/NavGroup";

import { CustomizerContext } from "@/app/context/customizerContext";
import { getAuthMenu } from "@/helpers/auth.helper";
import { iconMap } from "@/utils/iconMap";

/**
 * SidebarItems
 * - Full client side
 * - Menu dari localStorage (auth_menu)
 * - Aman untuk next export (full static)
 */
const SidebarItems = () => {
  const { pathDirect } = useTabWorkspace();
  const pathWithoutLastPart = pathDirect.slice(
    0,
    pathDirect.lastIndexOf("/")
  );

  const {
    isSidebarHover,
    isCollapse,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);

  const lgUp = useMediaQuery((theme: any) =>
    theme.breakpoints.up("lg")
  );

  const hideMenu =
    lgUp && isCollapse === "mini-sidebar" && !isSidebarHover;

  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  /**
   * 🔥 Ambil menu dari localStorage
   * Tunggu sampai AuthGuard / getMe() selesai
   */
  useEffect(() => {
    setMounted(true);

    const menu = getAuthMenu();
    if (menu.length > 0) {
      setMenuItems(menu);
      return;
    }

    // tunggu auth_menu tersedia
    const timer = setInterval(() => {
      const retryMenu = getAuthMenu();
      if (retryMenu.length > 0) {
        setMenuItems(retryMenu);
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  /**
   * 🔧 Normalisasi menu
   * - icon string -> React component
   * - recursive children
   */
  const normalizeMenu = (items: any[]): any[] =>
    items.map((item) => ({
      ...item,
      iconKey:
        typeof item.icon === "string" ? item.icon : item.iconKey,
      icon:
        typeof item.icon === "string" && iconMap[item.icon]
          ? iconMap[item.icon]
          : item.icon,

      children: Array.isArray(item.children)
        ? normalizeMenu(item.children)
        : undefined,
    }));

  const normalizedMenu = normalizeMenu(menuItems);

  /**
   * ⏳ Skeleton sidebar (aman hydration)
   */
  if (!mounted || normalizedMenu.length === 0) {
    return (
      <Box sx={{ px: 3 }}>
        <List sx={{ pt: 0 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ mb: 1 }}>
              <Skeleton height={40} />
            </Box>
          ))}
        </List>
      </Box>
    );
  }

  /**
   * ✅ Sidebar render
   */
  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {normalizedMenu.map((item) => {
          // Subheader
          if (item.navlabel) {
            return (
              <NavGroup
                key={item.subheader}
                item={item}
                hideMenu={hideMenu}
              />
            );
          }

          // Menu dengan children
          if (item.children) {
            return (
              <NavCollapse
                key={item.id}
                menu={item}
                pathDirect={pathDirect}
                pathWithoutLastPart={pathWithoutLastPart}
                hideMenu={hideMenu}
                level={1}
                onClick={() =>
                  setIsMobileSidebar(!isMobileSidebar)
                }
              />
            );
          }

          // Menu biasa
          return (
            <NavItem
              key={item.id}
              item={item}
              pathDirect={pathDirect}
              hideMenu={hideMenu}
              onClick={() =>
                setIsMobileSidebar(!isMobileSidebar)
              }
            />
          );
        })}
      </List>
    </Box>
  );
};

export default SidebarItems;
