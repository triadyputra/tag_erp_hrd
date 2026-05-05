'use client';

import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { IconChevronDown, IconPrinter } from '@tabler/icons-react';

interface PrintDropdownProps {
  onPrint: (format: 'pdf' | 'excel') => Promise<void>;
  disabled?: boolean;
}

const PrintDropdown: React.FC<PrintDropdownProps> = ({
  onPrint,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    if (!loading) setAnchorEl(null);
  };

  const handleAction = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      setAnchorEl(null);
      await onPrint(format);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        disabled={disabled || loading}
        startIcon={!loading && <IconPrinter size={18} />}
        endIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <IconChevronDown size={18} />
          )
        }
      >
        {loading ? 'Processing...' : 'Print'}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleAction('pdf')}>
          Print PDF
        </MenuItem>
        <MenuItem onClick={() => handleAction('excel')}>
          Export Excel
        </MenuItem>
      </Menu>
    </Stack>
  );
};

export default PrintDropdown;
