"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
// import AkunList from "@/app/components/konfigurasi/akun/akun-list/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import CutiKaryawanListComponent from "@/app/feature/hrd/cuti-karyawan";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Cuti Karyawan",
  },
];

const CutiKaryawanListing = () => {
  return (
        <PageContainer title="Cuti Karyawan" description="ini adalah cuti karyawan">
          <Breadcrumb title="Cuti Karyawan" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <CutiKaryawanListComponent/>
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default CutiKaryawanListing;
