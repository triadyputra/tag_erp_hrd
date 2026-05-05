"use client"; // <-- wajib

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
// import AkunList from "@/app/components/konfigurasi/akun/akun-list/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import AprovalEvaluasiListComponent from "@/app/feature/hrd/aproval-evaluasi";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Aproval Evaluasi Kontrak",
  },
];

const AprovalEvaluasiListing = () => {
  return (
        <PageContainer
          title="Aproval Evaluasi"
          description="daftar approval evaluasi kontrak"
        >
          <Breadcrumb title="Aproval Evaluasi" items={BCrumb} />
          <BlankCard>
            <CardContent>
              <AprovalEvaluasiListComponent />
            </CardContent>
          </BlankCard>
        </PageContainer>
  );
}
export default AprovalEvaluasiListing;
