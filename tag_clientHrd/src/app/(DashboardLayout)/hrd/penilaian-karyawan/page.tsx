"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import PenilaianKaryawanListComponent from "@/app/feature/hrd/penilaian-karyawan";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Penilaian Karyawan",
  },
];

const PacklaringKerjaListing = () => {
  return (
        <PageContainer title="Penilaian Karyawan" description="ini adalah penilaian karyawan">
          <Breadcrumb title="Penilaian Karyawan" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <PenilaianKaryawanListComponent/>
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default PacklaringKerjaListing;
