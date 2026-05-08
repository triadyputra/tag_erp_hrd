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
	Grid,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material'
import { IconSearch } from '@tabler/icons-react'
import useSWR from 'swr'
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

	// FILTER STATE (yang dipakai API)
	const [filterKontrak, setFilterKontrak] = useState('')
	const [filterNama, setFilterNama] = useState('')
	const [filterJenis, setFilterJenis] = useState('')
	const [filterCabang, setFilterCabang] = useState('')
	const [filterSisaKontrak, setFilterSisaKontrak] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

	/* =======================
   * Print Preview
   * ======================= */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(
		['kontrak', filterKontrak, filterNama, filterJenis, filterCabang, filterSisaKontrak, page, pageSize],
		() =>
			fetchKontrakAktif({
				noKontrak: filterKontrak,
				namaKaryawan: filterNama,
				jenisKontrak: filterJenis,
				cabang: filterCabang,
				sisaKontrak: filterSisaKontrak, // 🔥 TAMBAH
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

	const handleSearch = () => {
		console.log(inputNama)
		console.log(inputCabang)
		setFilterKontrak(inputKontrak)
		setFilterNama(inputNama)
		setFilterJenis(inputJenis)
		setFilterCabang(inputCabang)
		setPage(1)
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
					format,
				});

				setPdfBase64(res.response);
				setPreviewOpen(true);
			} else {
				// ===============================
				// EXCEL DOWNLOAD
				// ===============================
				const res = await printDataKaryawan({
					noKontrak: filterKontrak,
					namaKaryawan: filterNama,
					jenisKontrak: filterJenis,
					cabang: filterCabang,
					sisaKontrak: filterSisaKontrak,
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
      {/* ================= FILTER ================= */}
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1.2}
				mb={3}
				alignItems={{ xs: 'stretch', sm: 'flex-end' }}
				justifyContent="space-between"
			>

				{/* ================= LEFT: FILTER ================= */}
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.2}
					sx={{ width: { xs: '100%', sm: 'auto' } }}
				>

					{/* ================= NO KONTRAK ================= */}
					<TextField
						placeholder="Cari No Kontrak"
						size="small"
						value={inputKontrak}

						onChange={(e) => setInputKontrak(e.target.value)}

						onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch()
						}}

						onBlur={() => {
							if (inputKontrak !== filterKontrak) handleSearch()
						}}

						fullWidth
						sx={{
							minWidth: { xs: '100%', sm: 200 },
							"& .MuiOutlinedInput-root": { height: 36 },
						}}

						InputProps={{
							endAdornment: (
								<InputAdornment
									position="end"
									sx={{ cursor: "pointer" }}
									onClick={handleSearch}
								>
									<IconSearch size={16} />
								</InputAdornment>
							),
						}}
					/>

					{/* ================= NAMA ================= */}
					<TextField
						placeholder="Cari Nama Karyawan"
						size="small"
						value={inputNama}

						onChange={(e) => setInputNama(e.target.value)}

						onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch()
						}}

						onBlur={() => {
							if (inputNama !== filterNama) handleSearch()
						}}

						fullWidth
						sx={{
							minWidth: { xs: '100%', sm: 220 },
							"& .MuiOutlinedInput-root": { height: 36 },
						}}
					/>

					{/* ================= JENIS ================= */}
					<Autocomplete
						options={jenisOptions}
						value={
							jenisOptions.find((c) => c.value === inputJenis) ?? null
						}
						isOptionEqualToValue={(opt, val) => opt.value === val.value}
						onChange={(_, v) => {
							const value = v?.value ?? ""

							setInputJenis(value)

							setFilterKontrak(inputKontrak)
							setFilterNama(inputNama)
							setFilterJenis(value)
							setFilterCabang(inputCabang)
							setFilterSisaKontrak(inputSisaKontrak)
							setPage(1)
						}}
						getOptionLabel={(o) => o.title ?? ""}
						fullWidth
						sx={{
							minWidth: { xs: '100%', sm: 180 },
							"& .MuiOutlinedInput-root": { height: 36 },
						}}
						renderInput={(params) => (
							<TextField {...params} size="small" placeholder="Jenis Kontrak" />
						)}
					/>

					{/* ================= CABANG ================= */}
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
								setPage(1)
							}}
							fullWidth
							sx={{ minWidth: { xs: '100%', sm: 220 } }}
							renderInput={(params) => (
							<TextField {...params} size="small" placeholder="Cabang" />
							)}
						/>
					)}

					<Autocomplete
						options={sisaKontrakOptions}
						value={
							sisaKontrakOptions.find((c) => c.value === inputSisaKontrak) ?? null
						}
						isOptionEqualToValue={(opt, val) => opt.value === val.value}
						onChange={(_, v) => {
							const value = v?.value ?? ""

							setInputSisaKontrak(value)

							// 🔥 langsung trigger filter (seperti jenis kontrak)
							setFilterKontrak(inputKontrak)
							setFilterNama(inputNama)
							setFilterJenis(inputJenis)
							setFilterCabang(inputCabang)
							setFilterSisaKontrak(value)

							setPage(1)
						}}
						getOptionLabel={(o) => o.title ?? ""}
						fullWidth
						sx={{
							minWidth: { xs: '100%', sm: 220 },
							"& .MuiOutlinedInput-root": { height: 36 },
						}}
						renderInput={(params) => (
							<TextField {...params} size="small" placeholder="Sisa Kontrak" />
						)}
					/>
				</Stack>

				{/* ================= RIGHT: BUTTON ================= */}
				<Stack
					direction="row"
					spacing={1}
					sx={{
						width: { xs: '100%', sm: 'auto' },
						justifyContent: { xs: 'stretch', sm: 'flex-end' },
					}}
				>
					<PrintDropdown onPrint={handlePrint} />

					<Button
						variant="outlined"
						onClick={() => {
							setInputKontrak('')
							setInputNama('')
							setInputJenis('')
							setInputCabang('')
							setInputSisaKontrak('')

							setFilterKontrak('')
							setFilterNama('')
							setFilterJenis('')
							setFilterCabang('')
							setFilterSisaKontrak('')

							setPage(1)
						}}
						sx={{
							height: 36,
							px: 2,
							whiteSpace: "nowrap",
						}}
					>
						Reset
					</Button>
				</Stack>

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