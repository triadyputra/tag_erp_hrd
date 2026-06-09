"use client"
import { Box, Container, Typography, Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { getAuthMenu } from "@/helpers/auth.helper";

function firstMenuHref(): string {
  const menu = getAuthMenu();
  for (const item of menu) {
    if (item.href && item.href !== "#" && !item.navlabel) {
      return item.href;
    }
    for (const child of item.children ?? []) {
      if (child.href && child.href !== "#") return child.href;
    }
  }
  return "/";
}

const forbidden = () => {
  const backHref = firstMenuHref();
  return (
  <Box
    display="flex"
    flexDirection="column"
    height="100vh"
    textAlign="center"
    justifyContent="center"
  >
    <Container maxWidth="md">
      <Image
        src={"/images/backgrounds/errorimg.svg"}
        alt="404" width={500} height={500}
        style={{ width: "100%", maxWidth: "500px",  maxHeight: '500px' }}
      />
      <Typography align="center" variant="h1" mb={4}>
        Opps!!!
      </Typography>
      <Typography align="center" variant="h4" mb={4}>
        Akses ke halaman ini dikunci.
      </Typography>
      <Button
        color="primary"
        variant="contained"
        component={Link}
        href={backHref}
        disableElevation
      >
        Kembali ke menu
      </Button>
    </Container>
  </Box>
  );
};

export default forbidden;
