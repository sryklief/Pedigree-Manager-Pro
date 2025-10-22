import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

import LicensePrompt from './components/LicensePrompt';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import BirdList from './pages/BirdList';
import BirdProfile from './pages/BirdProfile';
import AddBird from './pages/AddBird';
import PedigreeView from './pages/PedigreeView';
import Settings from './pages/Settings';

import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2c5aa0',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [isLicensed, setIsLicensed] = useState(false);
  const [showLicensePrompt, setShowLicensePrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLicenseStatus();
    
    // Listen for license prompt from main process
    if (window.electronAPI) {
      window.electronAPI.onShowLicensePrompt(() => {
        setShowLicensePrompt(true);
        setIsLicensed(false);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('show-license-prompt');
      }
    };
  }, []);

  const checkLicenseStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getLicenseStatus();
        setIsLicensed(status.activated && !status.expired);
        setShowLicensePrompt(!status.activated || status.expired);
      } else {
        // Development mode - skip license check
        setIsLicensed(true);
        setShowLicensePrompt(false);
      }
    } catch (error) {
      console.error('Error checking license status:', error);
      setShowLicensePrompt(true);
      setIsLicensed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseActivated = () => {
    setIsLicensed(true);
    setShowLicensePrompt(false);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
        >
          <div>Loading...</div>
        </Box>
      </ThemeProvider>
    );
  }

  if (showLicensePrompt || !isLicensed) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LicensePrompt onLicenseActivated={handleLicenseActivated} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/birds" element={<BirdList />} />
              <Route path="/birds/add" element={<AddBird />} />
              <Route path="/birds/:id/edit" element={<AddBird />} />
              <Route path="/birds/:id" element={<BirdProfile />} />
              <Route path="/pedigree/:id" element={<PedigreeView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
