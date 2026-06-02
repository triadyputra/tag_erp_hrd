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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TableContainer,
  Paper,
  alpha,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconSearch, IconTrash, IconEdit } from '@tabler/icons-react';
import CustomCheckbox from '@/app/components/forms/theme-elements/CustomCheckbox';
import useSWR from 'swr';
import AccessButton from '@/app/components/buttons/AccessButton';
import { useSnackbar } from '@/app/context/SnackbarContext';
import { GroupList } from '@/app/(DashboardLayout)/types/feature/konfigurasi/group';
import {
  deleteGroup,
  fetchAccessRoles,
  fetchGroups,
  saveGroup,
} from '@/services/hrd/group.service';
import FormGroup from './FormGroup';

const GroupListComponent = () => {
  const { showSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupList | null>(null);

  const { data, isLoading, mutate } = useSWR(
    ['hrd-groups', searchTerm, page, pageSize],
    () =>
      fetchGroups({
        filter: searchTerm,
        page,
        pageSize,
      })
  );

  const { data: accessRoleData } = useSWR('hrd-access-roles', fetchAccessRoles);

  const groups: GroupList[] = data?.Data ?? [];
  const totalCount: number = data?.TotalCount ?? 0;
  const loading = isLoading && !data;
  const accessRoles = accessRoleData ?? [];

  useEffect(() => {
    if (groups.length === 0) return;
    setSelectAll(selectedGroupIds.length === groups.length);
  }, [selectedGroupIds, groups]);

  const toggleSelectAll = () => {
    const value = !selectAll;
    setSelectAll(value);
    setSelectedGroupIds(value ? groups.map((g) => g.Id) : []);
  };

  const toggleSelectGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedGroupIds) {
        await deleteGroup(id);
      }

      showSnackbar('Group berhasil dihapus', 'success');
      setSelectedGroupIds([]);
      setSelectAll(false);
      setOpenDeleteDialog(false);
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus group';
      showSnackbar(message, 'error');
    }
  };

  const handleSaveGroup = async (payload: GroupList) => {
    try {
      await saveGroup(payload);

      showSnackbar(
        payload.Id ? 'Group berhasil diperbarui' : 'Group berhasil ditambahkan',
        'success'
      );

      setEditingGroup(null);
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan group';
      showSnackbar(message, 'error');
      throw err;
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
    position: 'relative',
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
          placeholder="Cari group"
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
          {selectedGroupIds.length > 0 && (
            <AccessButton
              access={{ subject: 'HrdGroupAkun', action: 'DeleteRole' }}
              color="error"
              variant="outlined"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Hapus Yang Dipilih
            </AccessButton>
          )}

          {editingGroup && (
            <FormGroup
              groupToEdit={editingGroup}
              accessRoles={accessRoles}
              onClose={() => setEditingGroup(null)}
              onSubmit={handleSaveGroup}
            />
          )}

          <AccessButton
            access={{ subject: 'HrdGroupAkun', action: 'PostRole' }}
            color="primary"
            variant="contained"
            onClick={() => setEditingGroup({} as GroupList)}
          >
            Tambah Group
          </AccessButton>
        </Stack>
      </Stack>

      <TableContainer
        component={Paper}
        sx={(theme) => ({
          maxHeight: '70vh',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
        })}
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
                <CustomCheckbox
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell sx={headerStyle}>Nama Group</TableCell>
              <TableCell sx={headerStyle}>Keterangan</TableCell>
              <TableCell sx={headerStyle} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.Id}>
                  <TableCell padding="checkbox">
                    <CustomCheckbox
                      checked={selectedGroupIds.includes(group.Id)}
                      onChange={() => toggleSelectGroup(group.Id)}
                    />
                  </TableCell>
                  <TableCell>{group.Name}</TableCell>
                  <TableCell>{group.Keterangan}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Group" arrow placement="top">
                      <span>
                        <AccessButton
                          access={{
                            subject: 'HrdGroupAkun',
                            action: 'PutRole',
                          }}
                          type="icon"
                          color="success"
                          onClick={() => setEditingGroup(group)}
                        >
                          <IconEdit size={18} />
                        </AccessButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Hapus Group" arrow placement="top">
                      <span>
                        <AccessButton
                          access={{
                            subject: 'HrdGroupAkun',
                            action: 'DeleteRole',
                          }}
                          type="icon"
                          color="error"
                          onClick={() => {
                            setSelectedGroupIds([group.Id]);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <IconTrash size={18} />
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

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Role yang dihapus berlaku untuk semua modul (Konfigurasi, HRD, dll.).
          </Typography>
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

export default GroupListComponent;
