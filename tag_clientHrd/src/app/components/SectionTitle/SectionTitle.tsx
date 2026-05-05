'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'

interface Props {
  title: string
  subtitle?: string
  /** Default 15 — judul blok form HRD */
  titleFontSize?: number
  /** Default 12 */
  subtitleFontSize?: number
}

const SectionTitle: React.FC<Props> = ({
  title,
  subtitle,
  titleFontSize = 15,
  subtitleFontSize = 12,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',

        mb: 2,          // 🔥 tambah jarak bawah (dari 1.2 → 2)
        mt: 0.5,        // 🔥 sedikit jarak atas biar lega

        pb: 0.5,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* garis kiri */}
      <Box
        sx={{
          width: 3,
          height: subtitle ? 36 : 22,
          borderRadius: 2,
          backgroundColor: (theme) => theme.palette.primary.main,
          mr: 1,
        }}
      />

      {/* text */}
      <Box>
        <Typography
          fontSize={titleFontSize}
          fontWeight={700}
          lineHeight={1.25}
          sx={{
            color: (theme) => theme.palette.primary.main, // 🔥 warna judul
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            fontSize={subtitleFontSize}
            sx={{
              color: 'text.secondary',
              mt: 0.35,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default SectionTitle