"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Typography,
  Skeleton,
} from "@mui/material";
import { Stack } from "@mui/system";
import { IconMail } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import * as dropdownData from "./data";
import { clearAuth, getAuthUser } from "@/helpers/auth.helper";
import { logout } from "@/services/auth.service";

const Profile = () => {
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    setMounted(true);

    // 1️⃣ coba ambil langsung
    const u = getAuthUser();
    if (u) {
      setUser(u);
      return;
    }

    // 2️⃣ tunggu AuthGuard selesai getMe()
    const timer = setInterval(() => {
      const retryUser = getAuthUser();
      if (retryUser) {
        setUser(retryUser);
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // const handleLogout = () => {
  //   clearAuth();
  //   handleClose();
  //   router.replace("/auth/auth1/login");
  // };

  const handleLogout = async () => {
    handleClose();        // tutup menu dulu
    await logout();
    window.location.replace("/auth/auth1/login");
  };

  return (
    <Box>
      {/* 🔥 AVATAR BUTTON */}
      <IconButton
        size="large"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        {!mounted ? (
          <Skeleton variant="circular" width={35} height={35} />
        ) : (
          <Avatar
            src={user?.avatar || "/images/profile/user-1.jpg"}
            alt={user?.fullName || "User"}
            sx={{ width: 35, height: 35 }}
          />
        )}
      </IconButton>

      {/* 🔽 DROPDOWN */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: 360,
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>

        {/* 🔥 USER INFO / SKELETON */}
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          {!mounted || !user ? (
            <>
              <Skeleton variant="circular" width={95} height={95} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={22} />
                <Skeleton width="50%" height={18} />
                <Skeleton width="80%" height={18} />
              </Box>
            </>
          ) : (
            <>
              <Avatar
                src={user.avatar || "/images/profile/user-1.jpg"}
                alt={user.fullName}
                sx={{ width: 95, height: 95 }}
              />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user.fullName}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  {user.role}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <IconMail width={15} height={15} />
                  {user.username}
                </Typography>
              </Box>
            </>
          )}
        </Stack>

        <Divider />

        {/* 🔗 MENU ITEM */}
        {dropdownData.profile.map((profile) => (
          <Box key={profile.title} sx={{ py: 2 }} className="hover-text-primary">
            <Link href={profile.href} onClick={handleClose}>
              <Stack direction="row" spacing={2}>
                <Box
                  width={45}
                  height={45}
                  bgcolor="primary.light"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Avatar
                    src={profile.icon}
                    alt={profile.title}
                    sx={{ width: 24, height: 24, borderRadius: 0 }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {profile.title}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    noWrap
                  >
                    {profile.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </Link>
          </Box>
        ))}

        <Box mt={2}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
