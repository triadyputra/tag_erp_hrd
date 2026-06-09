"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardFeature from "@/app/feature/dashboard";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Dashboard",
  },
];

export default function Dashboard() {
  return (
    <PageContainer title="Dashboard" description="Ringkasan data HRD">
      <Breadcrumb title="Dashboard" items={BCrumb} />
      <DashboardFeature />
    </PageContainer>
  );
}
