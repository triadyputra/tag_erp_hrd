'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Typography,
  Chip,
  TableContainer,
  Paper,
  Button,
	LinearProgress,
} from '@mui/material'
import { IconSearch } from '@tabler/icons-react'
import { useAccessGatedSWR } from '@/hooks/useAccessGatedSWR'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { getCabang } from '@/helpers/auth.helper'
import { fetchSaldoCutiKaryawan } from '@/services/hrd/monitoring-cuti.service'

const SaldoCutiKaryawanListComponent = () => {
  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [userCabang, setUserCabang] = useState<string | null>(null)

  // INPUT
  const [inputNama, setInputNama] = useState('')
  const [inputCabang, setInputCabang] = useState('')
  const [inputTahun, setInputTahun] = useState(new Date().getFullYear())

  // FILTER
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [filterTahun, setFilterTahun] = useState<number | undefined>(undefined)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useAccessGatedSWR(
    { subject: 'MonitoringCuti', any: true },
    ['saldo-cuti', filterNama, filterCabang, filterTahun, page, pageSize],
    () =>
      fetchSaldoCutiKaryawan({
        nama: filterNama,
        cabang: filterCabang,
        tahun: filterTahun,
        page,
        pageSize,
      })
  )

  const list = data?.Data ?? []
  const total = data?.TotalCount ?? 0
  const loading = isLoading && !data

  useEffect(() => {
    const cab = getCabang()
    if (cab) {
      setUserCabang(cab)
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  const handleSearch = () => {
    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setFilterTahun(inputTahun)
    setPage(1)
  }

	const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.palette.divider}`
  })

  return (
    <Box>
      {/* ================= FILTER ================= */}
      <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">

        <TextField
          size="small"
          placeholder="Nama Karyawan"
          value={inputNama}
          onChange={(e) => setInputNama(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" onClick={handleSearch}>
                <IconSearch size={16} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          size="small"
          type="number"
          placeholder="Tahun"
          value={inputTahun}
          onChange={(e) => setInputTahun(parseInt(e.target.value))}
        />

        {!userCabang && (
          <Autocomplete
            options={cabangOptions ?? []}
            loading={cabangLoading}
            getOptionLabel={(o) => o.title ?? ''}
            value={cabangOptions?.find(c => c.value === inputCabang) ?? null}
            onChange={(_, v) => {
              const val = v?.value ?? ''
              setInputCabang(val)
            }}
            sx={{ minWidth: 200 }}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Cabang" />
            )}
          />
        )}

        <Button variant="outlined" onClick={handleSearch}>
          Cari
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setInputNama('')
            setInputCabang('')
            setInputTahun(new Date().getFullYear())

            setFilterNama('')
            setFilterCabang('')
            setFilterTahun(undefined)

            setPage(1)
          }}
        >
          Reset
        </Button>

      </Stack>

      {/* ================= TABLE ================= */}
      <TableContainer
					component={Paper}
					sx={{
							maxHeight: "70vh",
							borderRadius: 2
					}}
			>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
							sx={(theme) => ({
								backgroundColor:
									theme.palette.mode === "dark"
										? "#1e293b"
										: "#f3f4f6",

								"& th": {
									fontWeight: 600,
									fontSize: 13,
									color:
										theme.palette.mode === "dark"
											? "#e2e8f0"
											: "#374151",
								},
							})}
						>
              <TableCell sx={headerStyle}>Karyawan</TableCell>
              <TableCell sx={headerStyle}>Divisi</TableCell>
              <TableCell sx={headerStyle}>Jabatan</TableCell>
              <TableCell sx={headerStyle}>Saldo</TableCell>
              <TableCell sx={headerStyle}>Terpakai</TableCell>
              <TableCell sx={headerStyle}>Sisa</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data monitoring cuti...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {item.NMKARYAWAN}
                    </Typography>
                    <Typography variant="caption">
                      {item.NIKSISTAG}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography>{item.NMDIVISI}</Typography>
                    <Typography variant="caption">
                      {item.NMBAGIAN}
                    </Typography>
                  </TableCell>

                  <TableCell>{item.NMJABATAN}</TableCell>

                  <TableCell>
                    <Chip label={item.SALDO} color="info" size="small" />
                  </TableCell>

                  <TableCell>
                    <Chip label={item.TERPAKAI} color="warning" size="small" />
                  </TableCell>

                  <TableCell sx={{ minWidth: 140 }}>
										<Stack spacing={0.5}>

											{/* HITUNG PERSENTASE */}
											{(() => {
												const percent = item.SALDO > 0
													? Math.round((item.SISA / item.SALDO) * 100)
													: 0

												const safePercent = Math.max(0, Math.min(100, percent))

												const getColor = () => {
													if (safePercent <= 20) return '#ef4444' // merah
													if (safePercent <= 50) return '#f59e0b' // kuning
													return '#22c55e' // hijau
												}

												const getStatus = () => {
													if (safePercent <= 0) return 'Habis'
													if (safePercent <= 20) return 'Kritis'
													if (safePercent <= 50) return 'Menipis'
													return 'Aman'
												}

												const getTextColor = () => {
													if (safePercent <= 20) return 'error.main'
													if (safePercent <= 50) return 'warning.main'
													return 'success.main'
												}

												return (
													<>
														{/* LABEL */}
														<Stack direction="row" justifyContent="space-between">
															<Typography fontSize={12} fontWeight={600}>
																{item.SISA} hari
															</Typography>

															<Typography fontSize={11} color="text.secondary">
																{safePercent}%
															</Typography>
														</Stack>

														{/* PROGRESS */}
														<LinearProgress
															variant="determinate"
															value={safePercent}
															sx={{
																height: 8,
																borderRadius: 5,
																transition: 'all 0.6s ease',

																'& .MuiLinearProgress-bar': {
																	borderRadius: 5,
																	backgroundColor: getColor(),
																},
															}}
														/>

														{/* STATUS */}
														<Typography
															fontSize={11}
															sx={{
																color: getTextColor(),
																fontWeight: 500,
															}}
														>
															{getStatus()}
														</Typography>
													</>
												)
											})()}

										</Stack>
									</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= PAGINATION ================= */}
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10))
          setPage(1)
        }}
      />
    </Box>
  )
}

export default SaldoCutiKaryawanListComponent