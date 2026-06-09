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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Badge,
} from '@mui/material'
import { IconFilter, IconSearch } from '@tabler/icons-react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useAccessGatedSWR } from '@/hooks/useAccessGatedSWR'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { fetchKontrakAktif, printDataKaryawan } from '@/services/hrd/kontrak.service'
import { formatDate } from '@/utils/format'
import dayjs from 'dayjs'
import { getCabang } from '@/helpers/auth.helper'
import PrintDropdown from '@/app/components/buttons/PrintDropdown'
import { useSnackbar } from '@/app/context/SnackbarContext'
import PdfPreviewDialog from '@/app/components/print-preview/PdfPreviewDialog'

const KontrakKaryawanListComponent = () => {
  const { showSnackbar } = useSnackbar()
  const { cabang: cabangOptions, loading : cabangLoading } = useComboCabangWith()
	const [userCabang, setUserCabang] = useState<string | null>(null)
	
	// INPUT STATE (yang diketik user)
	const [inputKontrak, setInputKontrak] = useState('')
	const [inputNama, setInputNama] = useState('')
	const [inputJenis, setInputJenis] = useState('')
	const [inputCabang, setInputCabang] = useState('')
	const [inputSisaKontrak, setInputSisaKontrak] = useState('')
	const [inputTglBerakhirAwal, setInputTglBerakhirAwal] = useState<string | null>(null)
	const [inputTglBerakhirAkhir, setInputTglBerakhirAkhir] = useState<string | null>(null)

	// FILTER STATE (yang dipakai API)
	const [filterKontrak, setFilterKontrak] = useState('')
	const [filterNama, setFilterNama] = useState('')
	const [filterJenis, setFilterJenis] = useState('')
	const [filterCabang, setFilterCabang] = useState('')
	const [filterSisaKontrak, setFilterSisaKontrak] = useState('')
	const [filterTglBerakhirAwal, setFilterTglBerakhirAwal] = useState<string | null>(null)
	const [filterTglBerakhirAkhir, setFilterTglBerakhirAkhir] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

	/* =======================
   * Print Preview
   * ======================= */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { data, isLoading, mutate } = useAccessGatedSWR(
    { subject: 'KontrakKaryawan', any: true },
		[
			'kontrak',
			filterKontrak,
			filterNama,
			filterJenis,
			filterCabang,
			filterSisaKontrak,
			filterTglBerakhirAwal,
			filterTglBerakhirAkhir,
			page,
			pageSize,
		],
		() =>
			fetchKontrakAktif({
				noKontrak: filterKontrak,
				namaKaryawan: filterNama,
				jenisKontrak: filterJenis,
				cabang: filterCabang,
				sisaKontrak: filterSisaKontrak,
				tglBerakhirAwal: filterTglBerakhirAwal ?? '',
				tglBerakhirAkhir: filterTglBerakhirAkhir ?? '',
				page,
				pageSize,
			})
	)

  const list = data?.Data ?? []
  const total = data?.TotalCount ?? 0
  const loading = isLoading && !data

	const sisaKontrakOptions = [
		{ title: 'Semua', value: '' },
		{ title: 'Kritis (≤ 7 hari)', value: 'KRITIS' },
		{ title: 'Menipis (≤ 30 hari)', value: 'MENIPIS' },
		{ title: 'Aman (> 30 hari)', value: 'AMAN' },
		{ title: 'Expired', value: 'EXPIRED' },
	]

	useEffect(() => {
		const cab = getCabang()

		if (cab && cab.trim() !== "") {
			setUserCabang(cab)

			// 🔥 auto set filter
			setInputCabang(cab)
			setFilterCabang(cab)
		}
	}, [])
	
	const jenisOptions = [
		{ title: "TETAP", value: "TETAP" },
		{ title: "PPK", value: "PPK" },
		{ title: "PKWT", value: "PKWT" },
		{ title: "ADDENDUM", value: "ADDENDUM" },
		{ title: "FREELANCE", value: "FREELANCE" },
	];

	const applyDateFilters = (awal: string | null, akhir: string | null) => {
		if (awal && akhir && dayjs(awal).isAfter(dayjs(akhir), 'day')) {
			showSnackbar(
				'Tanggal berakhir awal tidak boleh lebih besar dari tanggal berakhir akhir',
				'error'
			)
			return false
		}
		setFilterTglBerakhirAwal(awal)
		setFilterTglBerakhirAkhir(akhir)
		return true
	}

	const applyAllFilters = () => {
		if (!applyDateFilters(inputTglBerakhirAwal, inputTglBerakhirAkhir)) return false

		setFilterKontrak(inputKontrak)
		setFilterNama(inputNama)
		setFilterJenis(inputJenis)
		setFilterCabang(inputCabang)
		setFilterSisaKontrak(inputSisaKontrak)
		setPage(1)
		return true
	}

	const handleSearch = () => {
		applyAllFilters()
	}

	const resetAllFilters = () => {
		const cab = userCabang ?? ''

		setInputKontrak('')
		setInputNama('')
		setInputJenis('')
		setInputSisaKontrak('')
		setInputCabang(cab)
		setInputTglBerakhirAwal(null)
		setInputTglBerakhirAkhir(null)

		setFilterKontrak('')
		setFilterNama('')
		setFilterJenis('')
		setFilterSisaKontrak('')
		setFilterCabang(cab)
		setFilterTglBerakhirAwal(null)
		setFilterTglBerakhirAkhir(null)

		setPage(1)
	}

	const advancedFilterCount = [filterKontrak, filterJenis, filterSisaKontrak].filter(
		Boolean
	).length

	const compactFieldSx = {
		minWidth: { xs: '100%', sm: 160 },
		'& .MuiOutlinedInput-root': { height: 36 },
	}

	// const handlePrint = async (format: 'pdf' | 'excel') => {
	// 	try {
	// 		const printUrl = await printDataKaryawan({
	// 			noKontrak: filterKontrak,
	// 			namaKaryawan: filterNama,
	// 			jenisKontrak: filterJenis,
	// 			cabang: filterCabang,
	// 			sisaKontrak: filterSisaKontrak,
	// 			format,
	// 		})

			
	// 	} catch (err: any) {
	// 		showSnackbar(err.message || 'Gagal mencetak data', 'error')
	// 	}
	// }
	/* =======================
   * Print
   * ======================= */
  const handlePrint = async (
		format: 'pdf' | 'xlsx' = 'pdf'
	) => {
		try {
			if (format === 'pdf') {
				setPreviewLoading(true);

				const res = await printDataKaryawan({
					noKontrak: filterKontrak,
					namaKaryawan: filterNama,
					jenisKontrak: filterJenis,
					cabang: filterCabang,
					sisaKontrak: filterSisaKontrak,
					tglBerakhirAwal: filterTglBerakhirAwal ?? '',
					tglBerakhirAkhir: filterTglBerakhirAkhir ?? '',
					format,
				});

				setPdfBase64(res.response);
				setPreviewOpen(true);
			} else {
				const res = await printDataKaryawan({
					noKontrak: filterKontrak,
					namaKaryawan: filterNama,
					jenisKontrak: filterJenis,
					cabang: filterCabang,
					sisaKontrak: filterSisaKontrak,
					tglBerakhirAwal: filterTglBerakhirAwal ?? '',
					tglBerakhirAkhir: filterTglBerakhirAkhir ?? '',
					format: 'xlsx',
				});

				const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.response}`;

				const downloadLink = document.createElement('a');

				downloadLink.href = linkSource;
				downloadLink.download = `DataKaryawan.xlsx`;

				downloadLink.click();
			}
		} catch (err: any) {
			showSnackbar(
				err.message || 'Gagal generate file',
				'error'
			);
		} finally {
			setPreviewLoading(false);
		}
	};

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
      {/* ================= FILTER UTAMA ================= */}
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.2}
				mb={3}
				alignItems={{ xs: 'stretch', md: 'flex-end' }}
				justifyContent="space-between"
			>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.2}
					flexWrap="wrap"
					sx={{ flex: 1 }}
				>
					<TextField
						placeholder="Cari Nama Karyawan"
						size="small"
						value={inputNama}
						onChange={(e) => setInputNama(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleSearch()
						}}
						onBlur={() => {
							if (inputNama !== filterNama) handleSearch()
						}}
						sx={compactFieldSx}
						InputProps={{
							endAdornment: (
								<InputAdornment
									position="end"
									sx={{ cursor: 'pointer' }}
									onClick={handleSearch}
								>
									<IconSearch size={16} />
								</InputAdornment>
							),
						}}
					/>

					{!userCabang && (
						<Autocomplete
							options={cabangOptions ?? []}
							loading={cabangLoading}
							getOptionLabel={(o) => o.title ?? ''}
							value={
								cabangOptions?.find((c) => c.value === inputCabang) ?? null
							}
							onChange={(_, v) => {
								const val = v?.value ?? ''
								setInputCabang(val)
								setFilterCabang(val)
								setFilterNama(inputNama)
								setPage(1)
							}}
							sx={{ ...compactFieldSx, minWidth: { xs: '100%', sm: 180 } }}
							renderInput={(params) => (
								<TextField {...params} size="small" placeholder="Cabang" />
							)}
						/>
					)}

					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<DatePicker
								format="DD-MM-YYYY"
								label="Tgl Berakhir Awal"
								value={inputTglBerakhirAwal ? dayjs(inputTglBerakhirAwal) : null}
								onChange={(newValue) => {
									const val = newValue ? newValue.format('YYYY-MM-DD') : null
									setInputTglBerakhirAwal(val)
									if (applyDateFilters(val, inputTglBerakhirAkhir)) {
										setFilterNama(inputNama)
										setFilterCabang(inputCabang)
										setPage(1)
									}
								}}
								slotProps={{
									textField: {
										size: 'small',
										sx: compactFieldSx,
									},
									actionBar: { actions: ['clear', 'today'] },
								}}
							/>
							<DatePicker
								format="DD-MM-YYYY"
								label="Tgl Berakhir Akhir"
								value={inputTglBerakhirAkhir ? dayjs(inputTglBerakhirAkhir) : null}
								onChange={(newValue) => {
									const val = newValue ? newValue.format('YYYY-MM-DD') : null
									setInputTglBerakhirAkhir(val)
									if (applyDateFilters(inputTglBerakhirAwal, val)) {
										setFilterNama(inputNama)
										setFilterCabang(inputCabang)
										setPage(1)
									}
								}}
								slotProps={{
									textField: {
										size: 'small',
										sx: compactFieldSx,
									},
									actionBar: { actions: ['clear', 'today'] },
								}}
							/>
						</Stack>
					</LocalizationProvider>
				</Stack>

				<Stack direction="row" spacing={1} flexShrink={0}>
					<Badge
						color="primary"
						badgeContent={advancedFilterCount}
						invisible={advancedFilterCount === 0}
					>
						<Button
							variant="outlined"
							startIcon={<IconFilter size={18} />}
							onClick={() => setFilterModalOpen(true)}
							sx={{ height: 36, whiteSpace: 'nowrap' }}
						>
							Filter
						</Button>
					</Badge>
					<PrintDropdown onPrint={handlePrint} />
				</Stack>
			</Stack>

			<Dialog
				open={filterModalOpen}
				onClose={() => setFilterModalOpen(false)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle sx={{ fontWeight: 700 }}>Filter Lanjutan</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2} pt={0.5}>
						<TextField
							fullWidth
							size="small"
							label="No Kontrak"
							placeholder="Cari no kontrak"
							value={inputKontrak}
							onChange={(e) => setInputKontrak(e.target.value)}
						/>

						<Autocomplete
							options={jenisOptions}
							getOptionLabel={(o) => o.title}
							value={jenisOptions.find((c) => c.value === inputJenis) ?? null}
							isOptionEqualToValue={(o, v) => o.value === v.value}
							onChange={(_, v) => setInputJenis(v?.value ?? '')}
							renderInput={(params) => (
								<TextField {...params} size="small" label="Jenis Kontrak" />
							)}
						/>

						<Autocomplete
							options={sisaKontrakOptions}
							getOptionLabel={(o) => o.title}
							value={
								sisaKontrakOptions.find((c) => c.value === inputSisaKontrak) ?? null
							}
							isOptionEqualToValue={(o, v) => o.value === v.value}
							onChange={(_, v) => setInputSisaKontrak(v?.value ?? '')}
							renderInput={(params) => (
								<TextField {...params} size="small" label="Sisa Kontrak" />
							)}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
					<Button
						color="inherit"
						onClick={() => {
							setInputKontrak('')
							setInputJenis('')
							setInputSisaKontrak('')
						}}
					>
						Reset Filter
					</Button>
					<Button
						color="error"
						variant="outlined"
						onClick={() => {
							resetAllFilters()
							setFilterModalOpen(false)
						}}
					>
						Reset Semua
					</Button>
					<Box sx={{ flex: 1 }} />
					<Button onClick={() => setFilterModalOpen(false)}>Batal</Button>
					<Button
						variant="contained"
						onClick={() => {
							if (applyAllFilters()) {
								setFilterModalOpen(false)
							}
						}}
					>
						Terapkan
					</Button>
				</DialogActions>
			</Dialog>

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
							<TableCell sx={headerStyle}>Kontrak</TableCell>
							<TableCell sx={headerStyle}>Karyawan</TableCell>
							<TableCell sx={headerStyle}>Organisasi</TableCell>
							<TableCell sx={headerStyle}>Jabatan</TableCell>
							<TableCell sx={headerStyle}>Periode</TableCell>
							<TableCell sx={headerStyle}>Info</TableCell>
						</TableRow>
					</TableHead>

					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={6} align="center" sx={{ py: 5 }}>
									<Stack alignItems="center" spacing={1}>
										<CircularProgress size={28} />
										<Typography variant="caption" color="text.secondary">
											Memuat data kontrak...
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
							list.map((item: any, index: number) => {
								// ================= SAFE DATA =================
								const parts = item.NoKontrak?.split("/") ?? [];

								const sisaHari = item.PAkhir
											? dayjs(item.PAkhir).startOf("day").diff(dayjs().startOf("day"), "day")
											: null;

								return (
									<TableRow
										key={`${item.NoKtp}-${index}`}
										hover
										sx={{
											transition: "all 0.2s ease",
											borderBottom: "1px solid #f1f5f9",

											"&:hover": {
												backgroundColor: "#f1f5f9",
											},

											"&:nth-of-type(odd)": {
												backgroundColor: "rgba(0,0,0,0.02)",
											},
										}}
									>

										{/* ================= KONTRAK ================= */}
										<TableCell sx={{ py: 1.5 }}>
											<Stack spacing={0.5}>

												{/* NO KONTRAK */}
												<Typography fontWeight={700}>
													{parts[0] ?? "-"}
												</Typography>

												{/* DETAIL */}
												<Typography variant="caption" color="text.secondary">
													{parts.slice(1).join(" • ")}
												</Typography>

												<Stack
													direction="row"
													spacing={1}
													alignItems="center"
													sx={{ mt: 0.2 }}
												>
  												{/* STATUS */}
													<Chip
														label={item.JnsKontrak}
														size="small"
														color={
															item.JnsKontrak === "TETAP"
																? "success"
																: item.JnsKontrak === "PKWT"
																? "warning"
																: "default"
														}
														sx={{
															height: 22,
															fontSize: 11,
															fontWeight: 600,
														}}
													/>

													{/* CABANG */}
													<Typography
														fontSize={11}
														color="text.secondary"
													>
														{item.KdCabang}
													</Typography>

												</Stack>

											</Stack>
										</TableCell>

										{/* ================= KARYAWAN ================= */}
										<TableCell sx={{ py: 2 }}>
											<Stack spacing={0.3}>
												<Typography fontWeight={600}>
													{item.NmKaryawan}
												</Typography>

												<Typography variant="caption" color="text.secondary">
													NIK: {item.NikSistag} • Finger: {item.IdFinger}
												</Typography>
											</Stack>
										</TableCell>

										{/* ================= ORGANISASI ================= */}
										<TableCell sx={{ py: 2 }}>
											<Stack spacing={0.3}>
												<Typography variant="body2" fontWeight={500}>
													{item.NmDivisi}
												</Typography>

												<Typography variant="caption" color="text.secondary">
													{item.NmBagian}
												</Typography>
											</Stack>
										</TableCell>

										{/* ================= JABATAN ================= */}
										<TableCell sx={{ py: 2 }}>
											<Typography variant="body2">
												{item.NmJabatan}
											</Typography>
										</TableCell>

										{/* ================= PERIODE ================= */}
										<TableCell sx={{ py: 2 }}>
											<Stack spacing={0.3}>
												<Typography variant="body2">
													{formatDate(item.PAwal)}
													{item.PAkhir
														? ` - ${formatDate(item.PAkhir)}`
														: " (Tetap)"}
												</Typography>

												{sisaHari !== null && (
													<Typography
														variant="caption"
														sx={{
															color:
																sisaHari < 0
																	? "error.main"
																	: sisaHari <= 30
																	? "warning.main"
																	: "text.secondary",
															fontWeight: 500,
														}}
													>
														{sisaHari < 0
															? "Expired"
															: `${sisaHari} hari lagi`}
													</Typography>
												)}
											</Stack>
										</TableCell>

										{/* ================= INFO TAMBAHAN ================= */}
										<TableCell sx={{ py: 2 }}>
											<Stack spacing={0.3}>
												<Typography variant="caption">
													TMT: {formatDate(item.Tmt)}
												</Typography>

												<Typography variant="caption" color="text.secondary">
													Umur: {dayjs().diff(dayjs(item.TglLahir), "year")} tahun
												</Typography>

												<Typography variant="caption" color="text.secondary">
													KTP: {item.NoKtp}
												</Typography>
											</Stack>
										</TableCell>

									</TableRow>
								);
							})
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

			<PdfPreviewDialog
        open={previewOpen}
        loading={previewLoading}
        base64Pdf={pdfBase64}
        title="Preview Laporan CPC"
        onClose={() => {
          setPreviewOpen(false);
          setPdfBase64(null);
        }}
      />
			
    </Box>
  )
}

export default KontrakKaryawanListComponent