'use client'

import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { styled } from "@mui/material/styles";
import { Typography, Box } from "@mui/material";

import { CustomizerContext } from "@/app/context/customizerContext";
import config from "@/app/context/config";

const Logo = () => {
  const { isCollapse, isSidebarHover, activeDir, activeMode } =
    useContext(CustomizerContext);

  const TopbarHeight = config.topbarHeight;

  const showTitle =
    isCollapse !== "mini-sidebar" || isSidebarHover;

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width:
      isCollapse === "mini-sidebar" && !isSidebarHover
        ? "48px"
        : "200px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden",
    textDecoration: "none",
    paddingLeft: "8px",
  }));

  const logoSrc = () => {
    if (activeDir === "rtl") {
      return activeMode === "dark"
        ? "/images/logos/tag_icon.png"
        : "/images/logos/tag_icon.png";
    }

    return activeMode === "dark"
      ? "/images/logos/tag_icon.png"
      : "/images/logos/tag_icon.png";
  };

  return (
    <LinkStyled href="/">
      {/* LOGO */}
      <Image
        src={logoSrc()}
        alt="logo"
        width={36}
        height={36}
        priority
      />

      {/* TITLE */}
      {showTitle && (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: "text.primary",
            }}
          >
            TAG SYSTEM
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              whiteSpace: "nowrap",
            }}
          >
            PT. Tunas Arha Gardatama
          </Typography>
        </Box>
      )}
    </LinkStyled>
  );
};

export default Logo;
