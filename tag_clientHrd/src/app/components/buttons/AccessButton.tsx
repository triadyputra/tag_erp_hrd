"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { IconButton, Button, CircularProgress } from "@mui/material";
import { getAuthAccess, AccessItem } from "@/helpers/access.helper";

interface AccessButtonProps {
  access: {
    subject: string;
    action: string;
  };
  onClick?: (e?: any) => void; // 🔥 FIX DISINI
  children: ReactNode;

  color?:
    | "inherit"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";

  size?: "small" | "medium" | "large";
  variant?: "text" | "outlined" | "contained";

  type?: "button" | "icon";

  startIcon?: ReactNode;
  endIcon?: ReactNode;

  // 🔥 tambahan
  loading?: boolean;

  // 🔥 optional (kalau mau hide total)
  hideIfNoAccess?: boolean;
}

const AccessButton: React.FC<AccessButtonProps> = ({
  access,
  onClick,
  children,
  color = "inherit",
  size = "medium",
  variant = "contained",
  type = "button",
  startIcon,
  endIcon,
  loading = false,
  hideIfNoAccess = false,
}) => {
  const [acces, setAcces] = useState<AccessItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // =========================
  // GET ACCESS (SAFE HYDRATION)
  // =========================
  useEffect(() => {
    setMounted(true);

    const data = getAuthAccess();
    if (data.length > 0) {
      setAcces(data);
      return;
    }

    // retry (nanti setelah getMe / auth selesai)
    const timer = setInterval(() => {
      const retry = getAuthAccess();
      if (retry.length > 0) {
        setAcces(retry);
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  // =========================
  // CHECK ACCESS
  // =========================
  const hasAccess = useMemo(() => {
    if (!mounted || acces.length === 0) return false;

    return acces.some(
      (a) =>
        a.subject === access.subject &&
        a.action === access.action
    );
  }, [mounted, acces, access.subject, access.action]);

  // =========================
  // DISABLED LOGIC
  // =========================
  const isDisabled = !hasAccess || loading;

  // =========================
  // HIDE JIKA TIDAK ADA AKSES
  // =========================
  if (hideIfNoAccess && !hasAccess) return null;

  // =========================
  // ICON BUTTON
  // =========================
  if (type === "icon") {
    return (
      <IconButton
        onClick={onClick}
        disabled={isDisabled}
        color={color}
        size={size}
      >
        {loading ? <CircularProgress size={18} /> : children}
      </IconButton>
    );
  }

  // =========================
  // NORMAL BUTTON
  // =========================
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      color={color}
      size={size}
      variant={variant}
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" /> : startIcon
      }
      endIcon={!loading ? endIcon : null}
    >
      {children}
    </Button>
  );
};

export default AccessButton;