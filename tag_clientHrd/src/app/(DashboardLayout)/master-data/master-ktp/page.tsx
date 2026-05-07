"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import MasterKtpListComponent from "@/app/feature/master-data/master-ktp";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Master KTP",
  },
];

const MasterKtpListing = () => {
  return (
    <PageContainer title="Master KTP" description="Halaman pengelolaan data master KTP">
      <Breadcrumb title="Master KTP" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <MasterKtpListComponent/>
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
}
export default MasterKtpListing;
