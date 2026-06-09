'use client';

import React, { useEffect, useState } from 'react';
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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TableContainer,
  Paper,
  alpha,
  Tooltip,
} from '@mui/material';
import { IconSearch, IconTrash, IconEdit } from '@tabler/icons-react';
import CustomCheckbox from '@/app/components/forms/theme-elements/CustomCheckbox';
import useSWR from 'swr'
import { useAccessGatedSWR } from '@/hooks/useAccessGatedSWR';
import AccessButton from '@/app/components/buttons/AccessButton';
import { useSnackbar } from '@/app/context/SnackbarContext';
import { AkunList } from '@/app/(DashboardLayout)/types/feature/konfigurasi/akun';
import { deleteAkun, fetchAkun } from '@/services/hrd/akun.service';
import FormAkun from './FormAkun';

const UserAkunListComponent = () => {
  const { showSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedAkunIds, setSelectedAkunIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingAkun, setEditingAkun] = useState<AkunList | null>(null);

  const { data, isLoading, mutate } = useAccessGatedSWR(
    { subject: 'HrdUserAkun', any: true },
    ['hrd-user-akun', searchTerm, page, pageSize],
    () =>
      fetchAkun({
        filter: searchTerm,
        page,
        pageSize,
      })
  );

  const akuns: AkunList[] = data?.Data ?? [];
  const totalCount: number = data?.TotalCount ?? 0;
  const loading = isLoading && !data;

  useEffect(() => {
    if (akuns.length === 0) return;
    setSelectAll(selectedAkunIds.length === akuns.length);
  }, [selectedAkunIds, akuns]);

  const toggleSelectAll = () => {
    const value = !selectAll;
    setSelectAll(value);
    setSelectedAkunIds(value ? akuns.map((a) => a.Id) : []);
  };

  const toggleSelectAkun = (id: string) => {
    setSelectedAkunIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedAkunIds) {
        await deleteAkun(id);
      }

      showSnackbar('Akun berhasil dihapus', 'success');
      setSelectedAkunIds([]);
      setSelectAll(false);
      setOpenDeleteDialog(false);
      mutate();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghapus akun';
      showSnackbar(message, 'error');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage + 1);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  const headerStyle = (theme: any) => ({
    position: 'relative' as const,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.background.paper
        : theme.palette.grey[100],
    background:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.9)
        : alpha(theme.palette.grey[200], 0.9),
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    backgroundClip: 'padding-box',
    color: theme.palette.text.primary,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.palette.divider}`,
  });

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        mb={3}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Cari nama, No KTP, NIK Sistag, atau username"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconSearch size={16} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1}>
          {selectedAkunIds.length > 0 && (
            <AccessButton
              access={{ subject: 'HrdUserAkun', action: 'DeleteAkun' }}
              color="error"
              variant="outlined"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Hapus Yang Dipilih
            </AccessButton>
          )}

          {editingAkun && (
            <FormAkun
              akunToEdit={editingAkun}
              onClose={() => setEditingAkun(null)}
              onSaved={mutate}
            />
          )}

          <AccessButton
            access={{ subject: 'HrdUserAkun', action: 'PostAkun' }}
            color="primary"
            variant="contained"
            onClick={() => setEditingAkun({} as AkunList)}
          >
            Tambah Akun
          </AccessButton>
        </Stack>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{ maxHeight: '70vh', borderRadius: 1 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={(theme) => ({
                backgroundColor:
                  theme.palette.mode === 'dark' ? '#1f2937' : '#f3f4f6',
                '& th': {
                  fontWeight: 600,
                  fontSize: 13,
                  color:
                    theme.palette.mode === 'dark' ? '#e5e7eb' : '#374151',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              })}
            >
              <TableCell sx={headerStyle} padding="checkbox">
                <CustomCheckbox checked={selectAll} onChange={toggleSelectAll} />
              </TableCell>
              <TableCell sx={headerStyle}>No. KTP</TableCell>
              <TableCell sx={headerStyle}>NIK Sistag</TableCell>
              <TableCell sx={headerStyle}>Nama Lengkap</TableCell>
              <TableCell sx={headerStyle}>Username</TableCell>
              <TableCell sx={headerStyle}>Group</TableCell>
              <TableCell sx={headerStyle}>Email</TableCell>
              <TableCell sx={headerStyle}>Status</TableCell>
              <TableCell sx={headerStyle} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : akuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              akuns.map((akun) => (
                <TableRow key={akun.Id}>
                  <TableCell padding="checkbox">
                    <CustomCheckbox
                      checked={selectedAkunIds.includes(akun.Id)}
                      onChange={() => toggleSelectAkun(akun.Id)}
                    />
                  </TableCell>
                  <TableCell>{akun.NoKtp ?? '-'}</TableCell>
                  <TableCell>{akun.NikSistag || '-'}</TableCell>
                  <TableCell>{akun.FullName}</TableCell>
                  <TableCell>{akun.UserName}</TableCell>
                  <TableCell>
                    {akun.Group?.map((g, i) => (
                      <Chip key={i} label={g} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>{akun.Email}</TableCell>
                  <TableCell>
                    <Chip
                      label={akun.Active ? 'Aktif' : 'Non Aktif'}
                      color={akun.Active ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Akun" arrow placement="top">
                      <span>
                        <AccessButton
                          access={{
                            subject: 'HrdUserAkun',
                            action: 'PutAkun',
                          }}
                          color="success"
                          type="icon"
                          onClick={() => setEditingAkun(akun)}
                        >
                          <IconEdit width={18} />
                        </AccessButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Hapus Akun" arrow placement="top">
                      <span>
                        <AccessButton
                          access={{
                            subject: 'HrdUserAkun',
                            action: 'DeleteAkun',
                          }}
                          color="error"
                          type="icon"
                          onClick={() => {
                            setSelectedAkunIds([akun.Id]);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <IconTrash width={18} />
                        </AccessButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        size="small"
      />

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menghapus data yang dipilih?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Batal</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAkunListComponent;
