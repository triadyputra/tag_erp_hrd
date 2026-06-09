"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import PageKaryawan from "@/app/feature/hrd/history-kontrak-karyawan";

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "History Kontrak Kerja" },
];

const HistoryKontrakKaryawanPage = () => {
  return (
    <PageContainer
      title="History Kontrak Kerja"
      description="Riwayat kontrak dan surat peringatan karyawan"
    >
      <Breadcrumb title="History Kontrak Kerja" items={BCrumb} />
      <BlankCard>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <PageKaryawan />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
};

export default HistoryKontrakKaryawanPage;
