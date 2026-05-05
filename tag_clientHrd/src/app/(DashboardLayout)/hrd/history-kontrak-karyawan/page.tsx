"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
// import AkunList from "@/app/components/konfigurasi/akun/akun-list/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import PageKaryawan from "@/app/feature/hrd/history-kontrak-karyawan";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "History Kontrak Kerja",
  },
];

const KontrakKaryawanAktifListing = () => {
  return (
        <PageKaryawan/>
  );
}
export default KontrakKaryawanAktifListing;
