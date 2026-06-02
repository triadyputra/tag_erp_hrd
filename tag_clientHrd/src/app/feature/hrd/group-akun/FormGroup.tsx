'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  FormLabel,
  TextField,
  CircularProgress,
  Grid,
  Divider,
  DialogActions,
  Typography,
} from '@mui/material';
import NestedAccessCheckbox from './NestedAccessCheckbox';
import { GroupList } from '@/app/(DashboardLayout)/types/feature/konfigurasi/group';
import DialogHeader from '@/app/components/DialogHeader/DialogHeader';
import { IconDeviceFloppy } from '@tabler/icons-react';
import {
  collectHrdControllerIds,
  filterAccessForHrdTree,
} from './group-akun.utils';

interface FormGroupProps {
  groupToEdit: GroupList | null;
  accessRoles: any[];
  onClose: () => void;
  onSubmit: (payload: GroupList) => Promise<void>;
}

const emptyGroup: GroupList = {
  Id: '',
  Name: '',
  Access: '',
  Keterangan: '',
  Photo: '',
};

const FormGroup: React.FC<FormGroupProps> = ({
  groupToEdit,
  accessRoles,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<GroupList>(emptyGroup);
  const [accessList, setAccessList] = useState<
    { IdController: string; IdAction: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    Name?: string;
    Access?: string;
    Keterangan?: string;
  }>({});

  const hrdControllerIds = useMemo(
    () => collectHrdControllerIds(accessRoles ?? []),
    [accessRoles]
  );

  useEffect(() => {
    if (!groupToEdit) {
      setValues(emptyGroup);
      setAccessList([]);
      return;
    }

    setValues({
      Id: groupToEdit.Id ?? '',
      Name: groupToEdit.Name ?? '',
      Access: groupToEdit.Access ?? '',
      Keterangan: groupToEdit.Keterangan ?? '',
      Photo: groupToEdit.Photo ?? '',
    });

    try {
      const parsed =
        groupToEdit.Access?.startsWith('[')
          ? JSON.parse(groupToEdit.Access)
          : [];
      setAccessList(filterAccessForHrdTree(parsed, hrdControllerIds));
    } catch {
      setAccessList([]);
    }
  }, [groupToEdit, hrdControllerIds]);

  const validate = () => {
    const newErrors: {
      Name?: string;
      Access?: string;
      Keterangan?: string;
    } = {};

    if (!values.Name || values.Name.trim() === '') {
      newErrors.Name = 'Nama Group wajib diisi';
    } else if (values.Name.trim().length < 3) {
      newErrors.Name = 'Minimal 3 karakter';
    }

    if (!accessList || accessList.length === 0) {
      newErrors.Access = 'Minimal pilih 1 hak akses modul HRD';
    }

    if (values.Keterangan && values.Keterangan.length > 100) {
      newErrors.Keterangan = 'Maksimal 100 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const payload: GroupList = {
        ...values,
        Access: JSON.stringify(accessList),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!groupToEdit} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader
        title={values.Id ? 'Edit Group' : 'Tambah Group'}
        subtitle="Kelola group dan hak akses modul HRD saja (role dipakai bersama modul lain)"
        statusLabel={values.Id ? 'EDIT' : 'CREATE'}
        statusColor={values.Id ? 'info' : 'warning'}
      />

      <Divider />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mt={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 12 }}>
                <FormLabel>Nama Group</FormLabel>
                <TextField
                  size="small"
                  fullWidth
                  value={values.Name}
                  error={!!errors.Name}
                  helperText={errors.Name}
                  onChange={(e) => {
                    setValues({ ...values, Name: e.target.value });
                    if (errors.Name) {
                      setErrors({ ...errors, Name: undefined });
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, lg: 12 }}>
                <FormLabel>Keterangan</FormLabel>
                <TextField
                  size="small"
                  fullWidth
                  value={values.Keterangan}
                  onChange={(e) =>
                    setValues({ ...values, Keterangan: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, lg: 12 }}>
                <NestedAccessCheckbox
                  key={groupToEdit?.Id || 'new'}
                  data={accessRoles}
                  selected={accessList}
                  onChange={setAccessList}
                />
              </Grid>

              {errors.Access && (
                <Typography color="error" fontSize={12}>
                  {errors.Access}
                </Typography>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            fontSize={12}
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary.dark
                  : theme.palette.primary.light,
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.primary.contrastText
                  : theme.palette.primary.main,
              border: `1px solid ${
                theme.palette.mode === 'dark'
                  ? theme.palette.primary.main
                  : theme.palette.primary.light
              }`,
              fontStyle: 'italic',
            })}
          >
            Hak akses modul lain tidak diubah dari halaman ini
          </Typography>

          <Box display="flex" gap={1}>
            <Button
              sx={{ mr: 1 }}
              variant="outlined"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconDeviceFloppy size={16} />
                )
              }
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormGroup;
