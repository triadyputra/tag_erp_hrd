'use client'

import { Box, Typography } from '@mui/material'
import { getApiEnvironmentStatuses, type ApiEnvironmentStatus } from '@/config/api.config'

const apiStatuses = getApiEnvironmentStatuses()

function StatusItem({ label, status }: { label: string; status: ApiEnvironmentStatus }) {
  const isProduction = status === 'production'

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: isProduction ? 'success.main' : 'warning.main',
          opacity: isProduction ? 0.55 : 0.9,
          flexShrink: 0,
        }}
      />
      <Typography component="span" variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
        {label}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        sx={{
          fontSize: 11,
          fontWeight: isProduction ? 500 : 600,
          color: isProduction ? 'text.disabled' : 'warning.main',
        }}
      >
        {isProduction ? 'Production' : 'Dummy'}
      </Typography>
    </Box>
  )
}

export default function LoginApiStatus() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: 2.5 },
        mt: 1,
      }}
    >
      <StatusItem label="Auth" status={apiStatuses.auth} />
      <Box
        component="span"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: '1px',
          height: 12,
          bgcolor: 'divider',
        }}
      />
      <StatusItem label="Data HRD" status={apiStatuses.hrd} />
    </Box>
  )
}
