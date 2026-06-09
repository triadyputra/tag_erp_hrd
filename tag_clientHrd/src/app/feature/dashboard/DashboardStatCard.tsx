'use client'

import { Box, CircularProgress, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

type Props = {
  label: string
  value: number | string | null
  icon?: ReactNode
  loading?: boolean
  error?: string | null
  onClick?: () => void
}

export default function DashboardStatCard({
  label,
  value,
  icon,
  loading,
  error,
  onClick,
}: Props) {
  const theme = useTheme()
  const clickable = Boolean(onClick)

  return (
    <Box
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        ...(clickable && {
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.4),
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-1px)',
          },
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <CircularProgress size={22} sx={{ my: 0.5 }} />
          ) : error ? (
            <Typography fontSize={12} color="error.main" fontWeight={600}>
              —
            </Typography>
          ) : (
            <Typography
              fontWeight={800}
              fontSize={22}
              lineHeight={1.1}
              color="primary.main"
              letterSpacing="-0.02em"
            >
              {value ?? 0}
            </Typography>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 11.5, fontWeight: 600, mt: 0.5, display: 'block', lineHeight: 1.3 }}
          >
            {label}
          </Typography>
          {error ? (
            <Typography variant="caption" color="error.main" sx={{ fontSize: 10, display: 'block', mt: 0.25 }}>
              {error}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
