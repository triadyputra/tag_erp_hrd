'use client'

import { Box, Chip, DialogTitle, Divider, Typography } from '@mui/material'
import React from 'react'

type Props = {
  title: string
  subtitle?: string
  statusLabel?: string
  statusColor?: 'success' | 'warning' | 'info' | 'error' | 'default'
}

export default function DialogHeader({
  title,
  subtitle,
  statusLabel,
  statusColor = 'default',
}: Props) {
  return (
    <>
      <DialogTitle
        sx={(theme) => ({
          position: 'sticky',     // 🔥 penting untuk sticky
          top: 0,
          zIndex: 20,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',

          px: 2.5,
          py: 1.5,
          minHeight: 56,

          // 🔥 GRADIENT (ERP FEEL)
          background:
            theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,

          color:
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : '#fff',

          // 🔥 SHADOW LEBIH HALUS
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 2px 10px rgba(0,0,0,0.6)'
              : '0 2px 8px rgba(0,0,0,0.08)',

          backdropFilter: 'blur(6px)', // 🔥 modern feel
        })}
      >
        {/* LEFT */}
        <Box>
          <Typography
            fontWeight={700}
            fontSize={15}
            lineHeight={1.2}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              fontSize={11}
              sx={{
                opacity: 0.75,
                mt: 0.3,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* RIGHT */}
        {statusLabel && (
          <Chip
            size="small"
            label={statusLabel}
            color={statusColor}
            variant="filled" // 🔥 ubah dari outlined → lebih premium
            sx={{
              fontWeight: 600,
              height: 24,
              borderRadius: 1.5,
            }}
          />
        )}
      </DialogTitle>

      <Divider />
    </>
  )
}