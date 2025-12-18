import { SnackbarProvider, useSnackbar, type SnackbarKey } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  HashRouter,
  Route, Routes
} from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider
} from '@mui/material/styles';

import App from './App';
import { ReduxStore } from './redux/store/store';

import './index.css';

interface SnackBarAction {
  snackbarKey: SnackbarKey;
}

function SnackbarCloseButton({ snackbarKey }: SnackBarAction): JSX.Element {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon htmlColor="white" />
    </IconButton>
  );
}

const modernDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0b0b', // Dark Grey
      paper: '#121212',  // Mid Grey
    },
    text: {
      primary: '#e2e8f0', // White Text
      secondary: '#94a3b8', // Muted Text
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b0b0b',
          color: '#e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={modernDarkTheme}>
      <StyledEngineProvider injectFirst>
        <Provider store={ReduxStore}>
          <SnackbarProvider
            maxSnack={3}
            action={(snackBarKey) => (
              <SnackbarCloseButton snackbarKey={snackBarKey} />
            )}
            autoHideDuration={3000}
          >
            <CssBaseline />
            <HashRouter>
              <Routes>
                <Route path="/:id?" element={<App />} />
              </Routes>
            </HashRouter>
          </SnackbarProvider>
        </Provider>
      </StyledEngineProvider>
    </ThemeProvider>
  </React.StrictMode>
);