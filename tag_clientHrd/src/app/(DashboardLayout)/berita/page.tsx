"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import BeritaListComponent from "@/app/feature/berita";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Berita",
  },
];

const BeritaListing = () => {
  return (
    <PageContainer title="Berita" description="Halaman pengelolaan data berita">
      <Breadcrumb title="Berita" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <BeritaListComponent/>
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
}
export default BeritaListing;
