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
} from '@mui/material'
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react'
import useSWR from 'swr'
import { useComboCabangWith } from '@/hooks/useComboGroup'
import { deleteCutiKaryawan, fetchCutiKaryawan, saveCutiKaryawan } from '@/services/hrd/cuti-karyawan.service'
import { formatDate } from '@/utils/format'
import { getCabang } from '@/helpers/auth.helper'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AccessButton from '@/app/components/buttons/AccessButton'
import { AddRounded } from '@mui/icons-material'
import { useSnackbar } from '@/app/context/SnackbarContext'
import FormCutiKaryawan from './FormCuti'

const CutiKaryawanListComponent = () => {
	const { showSnackbar } = useSnackbar();
	const today = dayjs().format('YYYY-MM-DD');

	const [openForm, setOpenForm] = useState(false)

  const { cabang: cabangOptions, loading: cabangLoading } = useComboCabangWith()

  const [userCabang, setUserCabang] = useState<string | null>(null)

  // ================= INPUT STATE =================
  const [inputNama, setInputNama] = useState('')
  const [inputCabang, setInputCabang] = useState('')
	const [inputTglAwal, setInputTglAwal] = useState<string | null>(today);
	const [inputTglAkhir, setInputTglAkhir] = useState<string | null>(today);

  // ================= FILTER STATE =================
  const [filterNama, setFilterNama] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
	const [filterTglAwal, setFilterTglAwal] = useState<string | null>(today);
	const [filterTglAkhir, setFilterTglAkhir] = useState<string | null>(today);

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

	const [selectedRow, setSelectedRow] = useState<any>(null)
	
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const [selectedDelete, setSelectedDelete] = useState<any>(null);
	const [loadingDelete, setLoadingDelete] = useState(false);
	
  // ================= FETCH =================
  const { data, isLoading, mutate } = useSWR(
    ['cuti', filterNama, filterCabang, filterTglAwal, filterTglAkhir, page, pageSize],
    () =>
      fetchCutiKaryawan({
				tglAwal: filterTglAwal ?? '',
        tglAkhir: filterTglAkhir ?? '',
        namaKaryawan: filterNama,
        cabang: filterCabang,
        page,
        pageSize,
      })
  )

  const list = data?.Data ?? []
  const total = data?.TotalCount ?? 0
  const loading = isLoading && !data

  // ================= INIT CABANG =================
  useEffect(() => {
    const cab = getCabang()

    if (cab && cab.trim() !== '') {
      setUserCabang(cab)
      setInputCabang(cab)
      setFilterCabang(cab)
    }
  }, [])

  // ================= HANDLE SEARCH =================
  const handleSearch = () => {
    setFilterNama(inputNama)
    setFilterCabang(inputCabang)
    setPage(1)
  }

	// ================= HAPUS =================
	const handleConfirmDelete = async () => {
		if (!selectedDelete) return;

		try {
			setLoadingDelete(true);

			await deleteCutiKaryawan(
				selectedDelete.NoCuti
			);

			// 🔥 refresh data
			await mutate();

			// 🔥 reset
			setOpenDeleteDialog(false);
			setSelectedDelete(null);

		} catch (err: any) {
			showSnackbar(err.message || 'Gagal menghapus data', 'error');
		} finally {
			setLoadingDelete(false);
		}
	};
	
  const headerStyle = (theme: any) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
    fontWeight: 700,
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

					{/* ================= NAMA ================= */}
					<TextField
						placeholder="Cari Nama Karyawan"
						size="small"
						value={inputNama}

						// ✅ update state saat ketik
						onChange={(e) => {
							setInputNama(e.target.value)
						}}

						// ✅ desktop (Enter)
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setFilterNama(inputNama)
								setPage(1)
							}
						}}

						// ✅ mobile (blur / selesai input)
						onBlur={() => {
							if (inputNama !== filterNama) { // 🔥 biar tidak double trigger
								setFilterNama(inputNama)
								setPage(1)
							}
						}}

						fullWidth
						sx={{
							minWidth: { xs: '100%', sm: 220 },
							"& .MuiOutlinedInput-root": { height: 36 },
						}}

						InputProps={{
							endAdornment: (
								<InputAdornment
									position="end"
									sx={{ cursor: "pointer" }}
									onClick={() => {
										setFilterNama(inputNama)
										setPage(1)
									}}
								>
									<IconSearch size={16} />
								</InputAdornment>
							),
						}}
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
			
					{/* ================= DATE RANGE ================= */}
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }} // ✅ mobile turun
							spacing={1}
							sx={{
								width: { xs: '100%', sm: 'auto' }, // 🔥 penting
							}}
						>

							{/* ================= TANGGAL AWAL ================= */}
							<DatePicker
								format="DD-MM-YYYY"
								value={inputTglAwal ? dayjs(inputTglAwal) : null}
								onChange={(newValue) => {
									const val = newValue ? newValue.format('YYYY-MM-DD') : null
									setInputTglAwal(val)
									setFilterTglAwal(val)
									setPage(1)
								}}
								slotProps={{
									textField: (params) => ({
										...params,
										size: 'small',
										fullWidth: true,
										placeholder: "Tanggal Awal",
										sx: {
											minWidth: 200, // 🔥 biar tidak kepotong
											"& .MuiOutlinedInput-root": {
												height: 36,
											},
										},

										InputProps: {
											...params.InputProps,
											endAdornment: (
												<>
													{/* CLEAR */}
													{inputTglAwal && (
														<InputAdornment
															position="end"
															sx={{ cursor: "pointer", mr: 0.5 }}
															onClick={() => {
																setInputTglAwal(null)
																setFilterTglAwal(null)
																setPage(1)
															}}
														>
															✕
														</InputAdornment>
													)}

													{/* ICON CALENDAR */}
													{params.InputProps?.endAdornment}
												</>
											),
										},
									}),

									actionBar: {
										actions: ['clear', 'today'],
									},
								}}
							/>

							{/* ================= TANGGAL AKHIR ================= */}
							<DatePicker
								format="DD-MM-YYYY"
								value={inputTglAkhir ? dayjs(inputTglAkhir) : null}
								onChange={(newValue) => {
									const val = newValue ? newValue.format('YYYY-MM-DD') : null
									setInputTglAkhir(val)
									setFilterTglAkhir(val)
									setPage(1)
								}}
								slotProps={{
									textField: (params) => ({
										...params,
										size: 'small',
										fullWidth: true,
										placeholder: "Tanggal Akhir",
										sx: {
											minWidth: 200, // 🔥 samakan
											"& .MuiOutlinedInput-root": {
												height: 36,
											},
										},

										InputProps: {
											...params.InputProps,
											endAdornment: (
												<>
													{/* CLEAR */}
													{inputTglAkhir && (
														<InputAdornment
															position="end"
															sx={{ cursor: "pointer", mr: 0.5 }}
															onClick={() => {
																setInputTglAkhir(null)
																setFilterTglAkhir(null)
																setPage(1)
															}}
														>
															✕
														</InputAdornment>
													)}

													{/* ICON CALENDAR */}
													{params.InputProps?.endAdornment}
												</>
											),
										},
									}),

									actionBar: {
										actions: ['clear', 'today'],
									},
								}}
							/>

						</Stack>
					</LocalizationProvider>
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
					<AccessButton
						access={{ subject: "CutiKaryawan", action: "SaveEditCutiKaryawan" }}
						color="primary"
						variant="contained"
						onClick={() => setOpenForm(true)}
						startIcon={<AddRounded />}
					>
						Tambah
					</AccessButton>
				</Stack>

			</Stack>

      {/* ================= TABLE ================= */}
      <TableContainer component={Paper} sx={{ maxHeight: "70vh", borderRadius: 2 }}>
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
              <TableCell sx={headerStyle}>No Cuti</TableCell>
              <TableCell sx={headerStyle}>Tanggal</TableCell>
              <TableCell sx={headerStyle}>Karyawan</TableCell>
              <TableCell sx={headerStyle}>Hari</TableCell>
              <TableCell sx={headerStyle}>Keperluan</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
							<TableCell sx={headerStyle}>Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">
                      Memuat data cuti...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    Data tidak ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: any, index: number) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {item.NoCuti}
                    </Typography>
                  </TableCell>

            			<TableCell>
                    {formatDate(item.Tanggal)}
                  </TableCell>

                  <TableCell>
                    <Typography>{item.NamaKaryawan}</Typography>
                    <Typography variant="caption">
                      NIK: {item.Nik}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.JmlHari} Hari
                  </TableCell>

                  <TableCell>
                    {item.Keperluan}
                  </TableCell>

                  <TableCell>
										<Chip
											label={
												!item.Status || item.Status === '1'
													? 'Pengajuan'
													: item.Status === '2'
													? 'Disetujui'
													: item.Status === '3'
													? 'Ditolak'
													: '-'
											}
											color={
												!item.Status || item.Status === '1'
													? 'warning'
													: item.Status === '2'
													? 'success'
													: item.Status === '3'
													? 'error'
													: 'default'
											}
											size="small"
										/>
										
									</TableCell>
									<TableCell>
										<Box
											display="flex"
											flexDirection="column"
											alignItems="center"
											gap={0.5}
										>

											{/* ================= ACTION ================= */}
											<Box display="flex" gap={0.5}>
												<AccessButton
													access={{ subject: "CutiKaryawan", action: "GetDetailCuti" }}
													color="success"
													type="icon"
													onClick={() => {
														setSelectedRow(item);
														setOpenForm(true);
													}}
												>
													<IconEdit width={18} />
												</AccessButton>

												<AccessButton
													access={{ subject: "CutiKaryawan", action: "DeleteCuti" }}
													color="error"
													type="icon"
													onClick={() => {
														setSelectedDelete(item); // 🔥 simpan data
														setOpenDeleteDialog(true);
													}}
												>
													<IconTrash width={18} />
												</AccessButton>
											</Box>
										</Box>
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

			{/* ================= FORM ================= */}
      {openForm && (
        <FormCutiKaryawan
					noCuti={selectedRow?.NoCuti} // 🔥 ini penting
          onClose={() => {
            setOpenForm(false)
            setSelectedRow(null)
          }}

          onSubmit={async (payload, option?: { closeAfterSave?: boolean }) => {
						try {
							const data = {
								...payload,
								Tanggal: payload.Tanggal
									? dayjs(payload.Tanggal).format("YYYY-MM-DD")
									: null,

								DetailTanggal: payload.DetailTanggal?.map((d: any) =>
									dayjs(d).format("YYYY-MM-DD")
								) || [],

								NikKaryawan: payload.NikKaryawan || "",
								KdDivisi: payload.KdDivisi || "",
								KdBagian: payload.KdBagian || "",
								KdSubBagian: payload.KdSubBagian || "",
								KdJabatan: payload.KdJabatan || "",
								KdCabang: payload.KdCabang || "",

								JmlHari: Number(payload.JmlHari || 0),
								HakCuti: Number(payload.HakCuti || 0),
								Terpakai: Number(payload.Terpakai || 0),
								SisaCuti: Number(payload.SisaCuti || 0),

								ValidUser: "SYSTEM"
							}

							const res = await saveCutiKaryawan(data)

							const noCuti = res?.Data?.NoCuti

							// 🔥 FIX UTAMA
              if (noCuti) {
                setSelectedRow((prev: any) => ({
                  ...prev,
                  NoCuti: noCuti
                }))
              }
							showSnackbar(res?.Metadata?.Message || 'Berhasil simpan cuti', 'success')

							await mutate()

							// 🔥 KUNCI FIX
							// 🔥 FIX DISINI SAJA
              if (option?.closeAfterSave) {
                setOpenForm(false)
                setSelectedRow(null)
              }

						} catch (err: any) {
							showSnackbar(err.message || 'Gagal menyimpan cuti', 'error')
						}
					}}
        />
      )}
			
			<Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
				<DialogTitle>Konfirmasi Hapus</DialogTitle>
				<DialogContent>Apakah Anda yakin ingin menghapus data yang dipilih?</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
					<Button color="error" onClick={handleConfirmDelete}>
						Hapus
					</Button>
				</DialogActions>
			</Dialog>
    </Box>
  )
}

export default CutiKaryawanListComponent