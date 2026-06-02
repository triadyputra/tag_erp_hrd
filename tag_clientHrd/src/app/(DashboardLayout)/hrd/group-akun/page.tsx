'use client';

import React from 'react';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import BlankCard from '@/app/components/shared/BlankCard';
import { CardContent } from '@mui/material';
import GroupListComponent from '@/app/feature/hrd/group-akun';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Group Akun',
  },
];

const GroupAkunPage = () => {
  return (
    <PageContainer
      title="Group Akun"
      description="Kelola group dan hak akses modul HRD"
    >
      <Breadcrumb title="Group Akun" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <GroupListComponent />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
};

export default GroupAkunPage;
