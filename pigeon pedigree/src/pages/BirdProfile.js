import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountTree as PedigreeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  ArrowBack as ArrowBackIcon,
  GetApp as ExportIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import DatabaseService from '../services/database';

const BirdProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bird, setBird] = useState(null);
  const [offspring, setOffspring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadBirdData();
    }
  }, [id]);

  const loadBirdData = async () => {
    try {
      const [birdData, offspringData] = await Promise.all([
        DatabaseService.getBirdById(id),
        DatabaseService.getOffspring(id)
      ]);
      
      setBird(birdData);
      setOffspring(offspringData);
    } catch (error) {
      console.error('Error loading bird data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await DatabaseService.deleteBird(id);
      navigate('/birds');
    } catch (error) {
      console.error('Error deleting bird:', error);
    }
  };

  const handleDuplicateForPedigree = () => {
    // Navigate to add bird with this bird's data pre-filled
    navigate('/birds/add', { 
      state: { 
        duplicateFrom: bird,
        mode: 'duplicate'
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading bird profile...</Typography>
      </Box>
    );
  }

  if (!bird) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Bird not found
        </Typography>
        <Button onClick={() => navigate('/birds')} sx={{ mt: 2 }}>
          Back to Birds
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/birds')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" flexGrow={1}>
          {bird.ring_number || bird.name || 'Unnamed Bird'}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PedigreeIcon />}
            onClick={() => navigate(`/pedigree/${bird.id}`)}
          >
            View Pedigree
          </Button>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleDuplicateForPedigree}
          >
            Duplicate
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/birds/${bird.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialog(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <Chip
                  icon={bird.sex === 'male' ? <MaleIcon /> : <FemaleIcon />}
                  label={bird.sex}
                  color={bird.sex === 'male' ? 'info' : 'secondary'}
                />
                {bird.ring_number && (
                  <Chip label={`Ring Details: ${bird.ring_number}`} variant="outlined" />
                )}
                {bird.breed && (
                  <Chip label={`Strain: ${bird.breed}`} variant="outlined" />
                )}
                {bird.color && (
                  <Chip label={`Color: ${bird.color}`} variant="outlined" />
                )}
                {bird.year && (
                  <Chip label={`Year: ${bird.year}`} variant="outlined" />
                )}
              </Box>

              {/* Photos */}
              {(bird.body_photo || bird.eye_photo) && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Photos
                  </Typography>
                  <Grid container spacing={2}>
                    {bird.body_photo && (
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="300"
                            image={bird.body_photo}
                            alt={`${bird.name} - Body`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Typography variant="subtitle2" textAlign="center">
                              Body Photo
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    {bird.eye_photo && (
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="300"
                            image={bird.eye_photo}
                            alt={`${bird.name} - Eye`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Typography variant="subtitle2" textAlign="center">
                              Eye Photo
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Parent Information */}
              {(bird.sire_name || bird.dam_name) && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Parents
                  </Typography>
                  <Grid container spacing={2}>
                    {bird.sire_name && (
                      <Grid item xs={12} sm={6}>
                        <Card
                          variant="outlined"
                          onClick={() => bird.sire_id && navigate(`/birds/${bird.sire_id}`)}
                          sx={{ cursor: bird.sire_id ? 'pointer' : 'default' }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                                <MaleIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Sire (Father)
                                </Typography>
                                <Typography variant="body2">
                                  {bird.sire_name}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    {bird.dam_name && (
                      <Grid item xs={12} sm={6}>
                        <Card
                          variant="outlined"
                          onClick={() => bird.dam_id && navigate(`/birds/${bird.dam_id}`)}
                          sx={{ cursor: bird.dam_id ? 'pointer' : 'default' }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                <FemaleIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Dam (Mother)
                                </Typography>
                                <Typography variant="body2">
                                  {bird.dam_name}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Notes */}
              {bird.notes && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {bird.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ExportIcon />}
                  onClick={() => navigate(`/pedigree/${bird.id}?export=pdf`)}
                >
                  Download Pedigree PDF
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CopyIcon />}
                  onClick={handleDuplicateForPedigree}
                >
                  Duplicate for Entry
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Offspring */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Offspring ({offspring.length})
              </Typography>
              {offspring.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No offspring recorded yet.
                </Typography>
              ) : (
                <List dense>
                  {offspring.map((child, index) => (
                    <React.Fragment key={child.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/birds/${child.id}`)}
                        sx={{ px: 0 }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: child.sex === 'male' ? 'info.main' : 'secondary.main',
                              width: 32,
                              height: 32
                            }}
                          >
                            {child.sex === 'male' ? <MaleIcon /> : <FemaleIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={child.name || child.ring_number || 'Unnamed Bird'}
                          secondary={child.ring_number || 'No ring details'}
                        />
                      </ListItem>
                      {index < offspring.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Bird</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{bird.name}"? This action cannot be undone.
            {offspring.length > 0 && (
              <Box mt={2}>
                <Typography color="warning.main" variant="body2">
                  Warning: This bird has {offspring.length} offspring. Deleting this bird will remove the parent relationship for these birds.
                </Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BirdProfile;
