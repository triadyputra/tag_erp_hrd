import type { Theme } from '@mui/material/styles'

/**
 * Style label & input kompak untuk form HRD: judul field lebih besar (13px), tegas,
 * tinggi baris nyaman — dipakai konsisten di Packlaring, Cuti, PKWT, Penilaian, dll.
 */
export function inputCompactStyle(theme: Theme) {
  return {
    '& .MuiOutlinedInput-root': {
      minHeight: 36,
      height: 'auto',
      backgroundColor: theme.palette.background.paper,
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 10px',
      fontSize: 13,
      lineHeight: 1.4,
      color: theme.palette.text.primary,
    },
    '& .MuiInputLabel-root': {
      fontSize: 13,
      fontWeight: 600,
      top: -2,
      color: theme.palette.text.primary,
    },
    '& .MuiInputLabel-root.Mui-disabled': {
      color: theme.palette.text.primary,
      opacity: 1,
    },
    '& .MuiInputLabel-shrink': {
      top: 0,
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.text.primary,
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '& .MuiInputBase-root.Mui-disabled': {
      color: theme.palette.text.primary,
      WebkitTextFillColor: theme.palette.text.primary,
      opacity: 1,
    },
    '& .MuiInputBase-input.Mui-disabled': {
      WebkitTextFillColor: theme.palette.text.primary,
    },
  }
}
