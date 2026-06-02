'use client'

import React from 'react'
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb'
import PageContainer from '@/app/components/container/PageContainer'
import BlankCard from '@/app/components/shared/BlankCard'
import { CardContent } from '@mui/material'
import KaryawanTetapListComponent from '@/app/feature/hrd/karyawan-tetap'

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Karyawan Tetap',
  },
]

const KaryawanTetapPage = () => {
  return (
    <PageContainer
      title="Karyawan Tetap"
      description="Daftar data karyawan tetap"
    >
      <Breadcrumb title="Karyawan Tetap" items={BCrumb} />
      <BlankCard>
        <CardContent>
          <KaryawanTetapListComponent />
        </CardContent>
      </BlankCard>
    </PageContainer>
  )
}

export default KaryawanTetapPage
