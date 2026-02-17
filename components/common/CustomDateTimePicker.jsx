'use client';
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

const darkTheme = createTheme({
  palette: {
    mode: 'dark', // We'll force dark mode style for now or you can make it dynamic
    primary: {
      main: '#3b82f6', // Adjust to match your --color-primary
    },
    background: {
      paper: '#1e293b', // Adjust to match --color-surface
      default: '#0f172a', // Adjust to match --color-background
    },
    text: {
      primary: '#f8fafc', // Adjust to match --color-text
      secondary: '#94a3b8', // Adjust to match --color-text-muted
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #334155', // --color-border
          borderRadius: '12px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          borderColor: '#334155',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6', // Primary color on hover
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
        notchedOutline: {
          borderColor: '#334155', // Default border color
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
          borderRadius: '0.75rem', // rounded-xl
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          '& fieldset': {
            borderColor: '#e2e8f0', // border-slate-200
          },
          '&:hover fieldset': {
            borderColor: '#cbd5e1', // border-slate-300
          },
          '&.Mui-focused fieldset': {
            borderColor: '#2563eb', // primary
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
  // Detect theme for the internal MUI parts (Dialogs etc)
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MobileDateTimePicker
          label={label}
          value={value ? dayjs(value) : null}
          onChange={(newValue) => {
            onChange(newValue ? newValue.toISOString() : '');
          }}
          {...props}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error,
              helperText: error,
              placeholder: placeholder,
              // Convert label to placeholder behavior if no value
              InputLabelProps: { shrink: true },
              InputProps: {
                sx: {
                  height: '44px', // Match h-11
                  color: 'rgb(var(--color-text))',
                  backgroundColor: 'rgb(var(--color-background))',
                  borderRadius: '0.75rem', // rounded-xl
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-border))',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-primary))',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-primary))',
                    borderWidth: '2px',
                  },
                },
              },
              sx: {
                '& .MuiInputBase-root': {
                  paddingRight: '14px',
                },
                // Hide the label if we want to rely on the external label + placeholder
                '& .MuiInputLabel-root': {
                  display: 'none',
                },
              },
            },
            dialog: {
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
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
