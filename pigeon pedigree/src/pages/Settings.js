import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import DatabaseService from '../services/database';

const Settings = () => {
  const [settings, setSettings] = useState({
    loftName: '',
    loftSlogan: '',
    breederName: '',
    loftAddress: '',
    loftPhone: '',
    loftEmail: '',
    loftWebsite: '',
    autoBackup: false,
    backupLocation: ''
  });
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
    loadLicenseInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsKeys = Object.keys(settings);
      const settingsData = {};
      
      for (const key of settingsKeys) {
        const value = await DatabaseService.getSetting(key);
        if (value !== null) {
          settingsData[key] = value;
        }
      }
      
      setSettings(prev => ({ ...prev, ...settingsData }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLicenseInfo = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getLicenseStatus();
        setLicenseInfo(status);
      }
    } catch (error) {
      console.error('Error loading license info:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setMessage({ type: '', text: '' });
  };


  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Save all settings
      for (const [key, value] of Object.entries(settings)) {
        await DatabaseService.setSetting(key, value);
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error saving settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={4}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Loft Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Loft Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Loft Name"
                    value={settings.loftName}
                    onChange={(e) => handleSettingChange('loftName', e.target.value)}
                    placeholder="Your Loft Name"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Loft Slogan"
                    value={settings.loftSlogan}
                    onChange={(e) => handleSettingChange('loftSlogan', e.target.value)}
                    placeholder="Excellence in Racing Pigeons"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Breeder Name"
                    value={settings.breederName}
                    onChange={(e) => handleSettingChange('breederName', e.target.value)}
                    placeholder="Your Full Name"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={settings.loftPhone}
                    onChange={(e) => handleSettingChange('loftPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={settings.loftAddress}
                    onChange={(e) => handleSettingChange('loftAddress', e.target.value)}
                    placeholder="Street Address, City, State, ZIP"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={settings.loftEmail}
                    onChange={(e) => handleSettingChange('loftEmail', e.target.value)}
                    placeholder="contact@yourloft.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={settings.loftWebsite}
                    onChange={(e) => handleSettingChange('loftWebsite', e.target.value)}
                    placeholder="https://www.yourloft.com"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* License Information */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  License Information
                </Typography>
              </Box>

              {licenseInfo ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong>{' '}
                    <span style={{ color: licenseInfo.activated ? 'green' : 'red' }}>
                      {licenseInfo.activated ? 'Active' : 'Inactive'}
                    </span>
                  </Typography>
                  {licenseInfo.licenseKey && (
                    <Typography variant="body2" gutterBottom>
                      <strong>License Key:</strong> {licenseInfo.licenseKey.substring(0, 8)}...
                    </Typography>
                  )}
                  {licenseInfo.activatedAt && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Activated:</strong>{' '}
                      {new Date(licenseInfo.activatedAt).toLocaleDateString()}
                    </Typography>
                  )}
                  {licenseInfo.expiresAt && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Expires:</strong>{' '}
                      {new Date(licenseInfo.expiresAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  License information not available
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Application Information
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Version:</strong> 1.0.0
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Build:</strong> Production
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Database:</strong> SQLite
              </Typography>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>

              {message.text && (
                <Alert 
                  severity={message.type} 
                  sx={{ mt: 2 }}
                  onClose={() => setMessage({ type: '', text: '' })}
                >
                  {message.text}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
