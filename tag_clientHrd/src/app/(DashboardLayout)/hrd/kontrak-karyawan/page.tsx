"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
// import AkunList from "@/app/components/konfigurasi/akun/akun-list/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import KontrakKaryawanListComponent from "@/app/feature/hrd/kontrak-karyawan";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Kontrak Karyawan Aktif",
  },
];

const KontrakKaryawanAktifListing = () => {
  return (
        <PageContainer title="Kontrak Karyawan Aktif" description="ini adalah kontrak karyawan aktif">
          <Breadcrumb title="Kontrak Karyawan Aktif" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <KontrakKaryawanListComponent/>
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default KontrakKaryawanAktifListing;
