"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
// import AkunList from "@/app/components/konfigurasi/akun/akun-list/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import KontrakKaryawanListComponent from "@/app/feature/hrd/kontrak-karyawan";
import KontrakPkwtListComponent from "@/app/feature/hrd/kontrak-pkwt/indext";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Kontrak Perjanjian Kerja Waktu Tertentu",
  },
];

const KontrakKaryawanAktifListing = () => {
  return (
        <PageContainer title="Kontrak PKWT" description="ini adalah kontrak pkwt">
          <Breadcrumb title="Kontrak PKWT" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <KontrakPkwtListComponent/>
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default KontrakKaryawanAktifListing;
