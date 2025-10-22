import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

const LicensePrompt = ({ onLicenseActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.validateLicense(licenseKey.trim());
        
        if (result.success) {
          setSuccess('License activated successfully!');
          setTimeout(() => {
            onLicenseActivated();
          }, 1500);
        } else {
          setError(result.error || 'License validation failed');
        }
      } else {
        // Development mode - simulate success
        setSuccess('License activated successfully! (Development Mode)');
        setTimeout(() => {
          onLicenseActivated();
        }, 1500);
      }
    } catch (error) {
      console.error('License validation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
          <Typography variant="h4" component="div" color="primary.main">
            Pigeon Pedigree Manager
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          License Activation Required
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" paragraph sx={{ textAlign: 'center', mb: 3 }}>
          Please enter your license key to activate the application. 
          You can purchase a license from our website.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="License Key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Enter your license key"
            variant="outlined"
            disabled={loading}
            sx={{ mb: 2 }}
            autoFocus
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !licenseKey.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Validating...' : 'Activate License'}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need a license? Visit our website to purchase one.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Each license is valid for one device only.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LicensePrompt;
