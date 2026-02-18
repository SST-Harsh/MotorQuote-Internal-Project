'use client';
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      paper: '#1e293b',
      default: '#0f172a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #334155',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          borderColor: '#334155',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
        notchedOutline: {
          borderColor: '#334155',
        },
        input: {
          padding: '10px 14px',
          height: 'auto',
        },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    background: {
      paper: '#ffffff',
      default: '#f8fafc',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          '& fieldset': {
            borderColor: '#e2e8f0',
          },
          '&:hover fieldset': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#2563eb',
          },
        },
      },
    },
  },
});

export default function CustomDateTimePicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  ...props
}) {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          value={value ? dayjs(value) : null}
          onChange={(newValue) => {
            onChange(newValue ? newValue.toISOString() : '');
          }}
          {...props}
          slotProps={{
            textField: {
              fullWidth: true,
              hiddenLabel: true, // Prevent label reservation
              error: !!error,
              helperText: error, // Error is handled by GenericFormPage too
              placeholder: placeholder,
              InputLabelProps: { shrink: false }, // Don't shrink label
              InputProps: {
                sx: {
                  height: '44px',
                  color: 'rgb(var(--color-text))',
                  backgroundColor: 'rgb(var(--color-surface))', // Use standard surface color
                  borderRadius: '0.375rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-border))', // Use tailwind var
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-primary))',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-primary))',
                    borderWidth: '4px', // Match focus ring roughly
                    borderColor: 'rgb(var(--color-primary))',
                    opacity: 0.1, // Ring opacity simulation? No, MUI handles this differently.
                    // Better to just match border color for now.
                  },
                },
              },
              sx: {
                '& .MuiInputBase-root': {
                  paddingRight: '14px',
                },
                '& .MuiInputLabel-root': {
                  display: 'none',
                },
                '& fieldset': {
                  top: 0, // Remove notch spacing
                  legend: { display: 'none' }, // Hide legend notch
                },
              },
            },
            dialog: {
              style: { zIndex: 10001 },
              sx: {
                '& .MuiDialog-paper': {
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  border: '1px solid rgb(var(--color-border))',
                },
                '& .MuiPickersDay-root': {
                  color: isDark ? '#f8fafc' : '#0f172a',
                  '&.Mui-selected': {
                    backgroundColor: 'rgb(var(--color-primary)) !important',
                  },
                },
                '& .MuiPickersCalendarHeader-label': {
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
                '& .MuiSvgIcon-root': {
                  color: isDark ? '#94a3b8' : '#64748b',
                },
              },
            },
            popper: {
              sx: {
                zIndex: 10001,
                '& .MuiPaper-root': {
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  border: '1px solid rgb(var(--color-border))',
                },
                '& .MuiPickersDay-root': {
                  color: isDark ? '#f8fafc' : '#0f172a',
                  '&.Mui-selected': {
                    backgroundColor: 'rgb(var(--color-primary)) !important',
                  },
                },
                '& .MuiPickersCalendarHeader-label': {
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
                '& .MuiSvgIcon-root': {
                  color: isDark ? '#94a3b8' : '#64748b',
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
