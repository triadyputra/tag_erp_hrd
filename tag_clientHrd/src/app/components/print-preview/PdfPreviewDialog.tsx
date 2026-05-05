'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface PdfPreviewDialogProps {
  open: boolean;
  base64Pdf: string | null;
  loading?: boolean;
  title?: string;
  onClose: () => void;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  open,
  base64Pdf,
  loading = false,
  title = 'Preview PDF',
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const pdfUrl = useMemo(() => {
    if (!base64Pdf) return null;

    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Uint8Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [base64Pdf]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth={isMobile ? false : 'lg'}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading || !pdfUrl ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: isMobile ? '100vh' : 500 }}
          >
            <CircularProgress />
          </Stack>
        ) : (
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            width="100%"
            height={isMobile ? '100%' : '750px'}
            style={{ border: 'none' }}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            if (pdfUrl) window.open(pdfUrl);
          }}
          disabled={!pdfUrl}
        >
          Download
        </Button>

        <Button variant="contained" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfPreviewDialog;
