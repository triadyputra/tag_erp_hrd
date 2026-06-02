"use client";

import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import { IconPower } from "@tabler/icons-react";
import { CustomizerContext } from "@/app/context/customizerContext";
import { useContext, useEffect, useState } from "react";
import { getAuthUser } from "@/helpers/auth.helper";
import { logout } from "@/services/auth.service";

const profileBoxSx = {
  mx: 2,
  mb: 2,
  p: 1.5,
  bgcolor: "secondary.light",
  borderRadius: 1,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
} as const;

export const Profile = () => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse === "mini-sidebar" && !isSidebarHover : false;

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const u = getAuthUser();
    if (u) {
      setUser(u);
      return;
    }

    const timer = setInterval(() => {
      const retryUser = getAuthUser();
      if (retryUser) {
        setUser(retryUser);
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.replace("/auth/auth1/login");
  };

  if (hideMenu) return null;

  if (!mounted || !user) {
    return (
      <Box sx={profileBoxSx}>
        <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="80%" height={18} />
          <Skeleton width="50%" height={14} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="circular" width={28} height={28} sx={{ flexShrink: 0 }} />
      </Box>
    );
  }

  return (
    <Box sx={profileBoxSx}>
      <Avatar
        alt={user.fullName}
        src={user.avatar || "/images/profile/user-1.jpg"}
        sx={{ height: 40, width: 40, flexShrink: 0 }}
      />

      <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <Tooltip title={user.fullName || ""} placement="top" enterDelay={400}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{ lineHeight: 1.35, display: "block" }}
          >
            {user.fullName}
          </Typography>
        </Tooltip>
        {user.role ? (
          <Tooltip title={user.role} placement="top" enterDelay={400}>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block", lineHeight: 1.3 }}
            >
              {user.role}
            </Typography>
          </Tooltip>
        ) : null}
      </Box>

      <Tooltip title="Logout">
        <IconButton
          size="small"
          onClick={handleLogout}
          sx={{ flexShrink: 0, ml: 0.5 }}
        >
          <IconPower size={20} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
