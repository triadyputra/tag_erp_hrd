'use client'

import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

type Column = {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  render?: (row: any) => ReactNode
}

type Props = {
  title: string
  columns: Column[]
  rows: any[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onViewAll?: () => void
}

export default function DashboardRecentTable({
  title,
  columns,
  rows,
  loading,
  error,
  emptyMessage = 'Tidak ada data.',
  onViewAll,
}: Props) {
  const theme = useTheme()

  const headerSx = {
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.04) : '#f8fafc',
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography fontWeight={700} fontSize={14}>
          {title}
        </Typography>
        {onViewAll ? (
          <Typography
            component="button"
            type="button"
            onClick={onViewAll}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: 'primary.main',
              fontFamily: 'inherit',
              p: 0,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Lihat semua
          </Typography>
        ) : null}
      </Box>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align ?? 'left'} sx={headerSx}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography fontSize={12} color="error.main">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography fontSize={12} color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id ?? row.NoTran ?? row.NoKontrak ?? row.Id ?? idx} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? 'left'} sx={{ fontSize: 12.5, py: 1.25 }}>
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
