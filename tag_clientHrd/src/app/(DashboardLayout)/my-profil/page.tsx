"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";
import MyProfil from "@/app/feature/my-profil";

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "My Profil" },
];

export default function MyProfilPage() {
  return (
    <PageContainer title="My Profil" description="Ubah password akun">
      <Breadcrumb title="My Profil" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <MyProfil />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
}

