"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import PacklaringListComponent from "@/app/feature/hrd/packlaring-kerja";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Packlaring Kerja",
  },
];

const PacklaringKerjaListing = () => {
  return (
        <PageContainer title="Packlaring Kerja" description="ini adalah Packlaring kerja">
          <Breadcrumb title="Packlaring Karyawan" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <PacklaringListComponent/>
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default PacklaringKerjaListing;
