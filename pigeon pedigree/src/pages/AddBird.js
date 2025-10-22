import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Male as MaleIcon,
  Female as FemaleIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import DatabaseService from '../services/database';

const AddBird = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const initialForm = () => ({
    name: '',
    ring_letters: '',
    ring_numbers: '',
    ring_number: '',
    sex: '',
    color: '',
    breed: '',
    year: new Date().getFullYear(),
    notes: '',
    sire_id: null,
    dam_id: null
  });
  const [formData, setFormData] = useState(initialForm());
  const [availableBirds, setAvailableBirds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAvailableBirds();
    if (isEdit) {
      // Load existing bird data into form
      (async () => {
        try {
          const existing = await DatabaseService.getBirdById(id);
          if (existing) {
            // Split existing ring_number into letters and numbers
            const ringNumber = existing.ring_number || '';
            const match = ringNumber.match(/^([A-Za-z]*)(.*)$/);
            const letters = match ? match[1] : '';
            const numbers = match ? match[2] : '';
            
            setFormData({
              name: existing.name || '',
              ring_letters: letters,
              ring_numbers: numbers,
              ring_number: existing.ring_number || '',
              sex: existing.sex || '',
              color: existing.color || '',
              breed: existing.breed || '',
              year: existing.year || new Date().getFullYear(),
              notes: existing.notes || '',
              sire_id: existing.sire_id || null,
              dam_id: existing.dam_id || null,
            });
          }
        } catch (e) {
          console.error('Error loading bird for edit:', e);
          setError('Failed to load bird for editing');
        }
      })();
    } else {
      // Navigated to Add page: reset the form completely
      setFormData(initialForm());
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [id]);

  const loadAvailableBirds = async () => {
    try {
      const birds = await DatabaseService.getBirdsForAutocomplete();
      setAvailableBirds(birds);
    } catch (error) {
      console.error('Error loading birds for autocomplete:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-combine ring letters and numbers into ring_number
      if (field === 'ring_letters' || field === 'ring_numbers') {
        const letters = field === 'ring_letters' ? value : prev.ring_letters;
        const numbers = field === 'ring_numbers' ? value : prev.ring_numbers;
        updated.ring_number = `${letters}${numbers}`;
      }
      
      return updated;
    });
    setError('');
  };

  const handleParentSelect = (field, bird) => {
    setFormData(prev => ({
      ...prev,
      [field]: bird ? bird.id : null
    }));
  };


  const validateForm = () => {
    if (!formData.sex) {
      setError('Sex is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        console.log('Updating bird id', id, 'with', formData);
        await DatabaseService.updateBird(id, formData);
        // Re-fetch to confirm persisted changes in dev mode
        const refreshed = await DatabaseService.getBirdById(id);
        console.log('Refetched bird after update:', refreshed);
        setSuccess('Bird updated successfully!');
        setTimeout(() => {
          navigate(`/birds/${id}`);
        }, 800);
      } else {
        console.log('Submitting bird data:', formData);
        const birdId = await DatabaseService.createBird(formData);
        console.log('Bird created with ID:', birdId);
        setSuccess('Bird added successfully!');
        setTimeout(() => {
          navigate('/birds');
        }, 800);
      }
    } catch (error) {
      console.error('Error creating pigeon:', error);
      setError(isEdit ? 'Error updating pigeon. Please try again.' : 'Error creating pigeon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEdit) {
      navigate(`/birds/${id}`);
    } else {
      navigate('/birds');
    }
  };

  const getMaleOptions = () => availableBirds.filter(bird => bird.sex === 'male');
  const getFemaleOptions = () => availableBirds.filter(bird => bird.sex === 'female');

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" mb={4}>
        {isEdit ? 'Edit Pigeon' : 'Add New Pigeon'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pigeon Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Optional - leave blank for unnamed pigeon"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Ring Letters"
                  value={formData.ring_letters}
                  onChange={(e) => handleInputChange('ring_letters', e.target.value.toUpperCase())}
                  placeholder="e.g., BE"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Ring Numbers"
                  value={formData.ring_numbers}
                  onChange={(e) => handleInputChange('ring_numbers', e.target.value)}
                  placeholder="e.g., 2024-001"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Sex</InputLabel>
                  <Select
                    value={formData.sex}
                    label="Sex"
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                  >
                    <MenuItem value="male">
                      <Box display="flex" alignItems="center">
                        <MaleIcon sx={{ mr: 1 }} />
                        Male
                      </Box>
                    </MenuItem>
                    <MenuItem value="female">
                      <Box display="flex" alignItems="center">
                        <FemaleIcon sx={{ mr: 1 }} />
                        Female
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Blue Bar, Red Checker"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Strain"
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  placeholder="e.g., Janssen, Sion"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                />
              </Grid>

              {/* Parent Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Parent Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={getMaleOptions()}
                  value={availableBirds.find(bird => bird.id === formData.sire_id) || null}
                  getOptionLabel={(option) => `${option.name || option.ring_number || 'Unnamed Bird'} (${option.ring_number || 'No ring details'})`}
                  onChange={(event, newValue) => handleParentSelect('sire_id', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sire (Father)"
                      placeholder="Search for male birds..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                        <MaleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{option.name || option.ring_number || 'Unnamed Bird'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.ring_number || 'No ring details'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={getFemaleOptions()}
                  value={availableBirds.find(bird => bird.id === formData.dam_id) || null}
                  getOptionLabel={(option) => `${option.name || option.ring_number || 'Unnamed Bird'} (${option.ring_number || 'No ring details'})`}
                  onChange={(event, newValue) => handleParentSelect('dam_id', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dam (Mother)"
                      placeholder="Search for female birds..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                        <FemaleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{option.name || option.ring_number || 'Unnamed Bird'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.ring_number || 'No ring details'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about this bird..."
                />
              </Grid>

              {/* Messages */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              {success && (
                <Grid item xs={12}>
                  <Alert severity="success">{success}</Alert>
                </Grid>
              )}

              {/* Actions */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (isEdit ? 'Update Bird' : 'Save Bird')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddBird;
