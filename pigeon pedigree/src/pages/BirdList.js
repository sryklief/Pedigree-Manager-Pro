import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  ButtonGroup,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  AccountTree as PedigreeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DatabaseService from '../services/database';

const BirdList = () => {
  const navigate = useNavigate();
  const [birds, setBirds] = useState([]);
  const [filteredBirds, setFilteredBirds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexFilter, setSexFilter] = useState('all'); // 'all', 'male', 'female'
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBird, setSelectedBird] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    loadBirds();
  }, []);

  useEffect(() => {
    filterBirds();
  }, [searchTerm, sexFilter, birds]);

  const loadBirds = async () => {
    try {
      const birdsData = await DatabaseService.getAllBirds();
      setBirds(birdsData);
      setFilteredBirds(birdsData);
    } catch (error) {
      console.error('Error loading birds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBirds = () => {
    let filtered = birds;

    // Filter by sex
    if (sexFilter !== 'all') {
      filtered = filtered.filter(bird => bird.sex === sexFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(bird =>
        bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bird.ring_number && bird.ring_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bird.breed && bird.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bird.color && bird.color.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredBirds(filtered);
  };

  const handleMenuOpen = (event, bird) => {
    setAnchorEl(event.currentTarget);
    setSelectedBird(bird);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBird(null);
  };

  const handleViewPedigree = () => {
    if (selectedBird) {
      navigate(`/pedigree/${selectedBird.id}`);
    }
    handleMenuClose();
  };

  const handleEditBird = () => {
    if (selectedBird) {
      navigate(`/birds/${selectedBird.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteBird = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedBird) {
      try {
        await DatabaseService.deleteBird(selectedBird.id);
        await loadBirds();
        setDeleteDialog(false);
        setSelectedBird(null);
      } catch (error) {
        console.error('Error deleting bird:', error);
      }
    }
  };

  const BirdListItem = ({ bird }) => {
    const displayName = (/^bird\s+\d+$/i.test((bird.name || '').trim()) ? '' : bird.name) || bird.ring_number || 'Unnamed Bird';
    
    return (
      <>
        <ListItem
          sx={{
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            py: 2
          }}
          onClick={() => navigate(`/birds/${bird.id}`)}
          secondaryAction={
            <Box display="flex" gap={1}>
              <Button
                size="small"
                startIcon={<PedigreeIcon />}
                onClick={(e) => { e.stopPropagation(); navigate(`/pedigree/${bird.id}`); }}
              >
                Pedigree
              </Button>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={(e) => { e.stopPropagation(); navigate(`/birds/${bird.id}/edit`); }}
              >
                Edit
              </Button>
              <IconButton
                edge="end"
                onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, bird); }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar
              src={bird.body_photo}
              sx={{
                width: 30,
                height: 30,
                bgcolor: bird.sex === 'male' ? 'info.main' : 'secondary.main'
              }}
            >
              {bird.sex === 'male' ? <MaleIcon /> : <FemaleIcon />}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" component="span" fontWeight="bold">
                  {displayName}
                </Typography>
                {/* <Chip
                  icon={bird.sex === 'male' ? <MaleIcon /> : <FemaleIcon />}
                  label={bird.sex}
                  size="small"
                  color={bird.sex === 'male' ? 'info' : 'secondary'}
                /> */}
                {bird.ring_number && (
                  <Chip label={bird.ring_number} size="small" variant="outlined" />
                )}
              </Box>
            }
            secondary={
              <Box component="span" display="flex" flexDirection="column" gap={0.5} mt={1}>
                {bird.breed && (
                  <Typography variant="body2" color="text.secondary">
                    Strain: {bird.breed}
                  </Typography>
                )}
                {bird.color && (
                  <Typography variant="body2" color="text.secondary">
                    Color: {bird.color}
                  </Typography>
                )}
              </Box>
            }
            sx={{ pr: 30 }}
          />
        </ListItem>
        <Divider component="li" />
      </>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading birds...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          All Birds ({filteredBirds.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/birds/add')}
          size="large"
        >
          Add New Bird
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box mb={4}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search birds by name, ring details, breed, or color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 600 }}
          />
          <ButtonGroup variant="outlined">
            <Button
              variant={sexFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setSexFilter('all')}
            >
              All
            </Button>
            <Button
              variant={sexFilter === 'male' ? 'contained' : 'outlined'}
              startIcon={<MaleIcon />}
              onClick={() => setSexFilter('male')}
              color="info"
            >
              Males
            </Button>
            <Button
              variant={sexFilter === 'female' ? 'contained' : 'outlined'}
              startIcon={<FemaleIcon />}
              onClick={() => setSexFilter('female')}
              color="secondary"
            >
              Females
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Birds List */}
      {filteredBirds.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || sexFilter !== 'all' ? 'No birds found matching your filters' : 'No birds added yet'}
          </Typography>
          {!searchTerm && sexFilter === 'all' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/birds/add')}
              sx={{ mt: 2 }}
            >
              Add Your First Bird
            </Button>
          )}
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {filteredBirds.map((bird) => (
            <BirdListItem key={bird.id} bird={bird} />
          ))}
        </List>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewPedigree}>
          <PedigreeIcon sx={{ mr: 1 }} />
          View Pedigree
        </MenuItem>
        <MenuItem onClick={handleEditBird}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Bird
        </MenuItem>
        <MenuItem onClick={handleDeleteBird} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Bird
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Bird</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedBird?.name || selectedBird?.ring_number || 'Unnamed Bird'}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BirdList;
