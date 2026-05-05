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
import { useRouter } from "next/navigation";
import { clearAuth, getAuthUser } from "@/helpers/auth.helper";
import { logout } from "@/services/auth.service";

export const Profile = () => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse === "mini-sidebar" && !isSidebarHover : false;

  const router = useRouter();

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

  // const handleLogout = () => {
  //   clearAuth();
  //   router.replace("/auth/auth1/login");
  // };

  const handleLogout = async () => {
    await logout();                // 🔥 revoke + clear
    window.location.replace("/auth/auth1/login");
  };

  if (hideMenu) return null;

  // 🔥 SKELETON (AMAN UNTUK HYDRATION)
  if (!mounted || !user) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        sx={{ m: 3, p: 2, bgcolor: "secondary.light" }}
      >
        <Skeleton variant="circular" width={40} height={40} />

        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={22} />
          <Skeleton width="40%" height={16} />
        </Box>

        <Skeleton variant="circular" width={28} height={28} />
      </Box>
    );
  }

  // ✅ UI ASLI
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: "secondary.light" }}
    >
      <Avatar
        alt={user.fullName}
        src={user.avatar || "/images/profile/user-1.jpg"}
        sx={{ height: 40, width: 40 }}
      />

      <Box>
        <Typography variant="h6">{user.fullName}</Typography>
        <Typography variant="caption">{user.role}</Typography>
      </Box>

      <Box sx={{ ml: "auto" }}>
        <Tooltip title="Logout">
          <IconButton size="small" onClick={handleLogout}>
            <IconPower size={20} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
