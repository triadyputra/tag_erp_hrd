'use client';

import React from 'react';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import BlankCard from '@/app/components/shared/BlankCard';
import { CardContent } from '@mui/material';
import UserAkunListComponent from '@/app/feature/hrd/user-akun';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'User Akun',
  },
];

const UserAkunPage = () => {
  return (
    <PageContainer
      title="User Akun"
      description="Kelola akun pengguna modul HRD"
    >
      <Breadcrumb title="User Akun" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <UserAkunListComponent />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
};

export default UserAkunPage;
