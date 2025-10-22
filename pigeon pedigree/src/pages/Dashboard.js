import React, { useState, useEffect } from 'react';
import pigeonIcon from '../assets/icons/pigeon_icon.png';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import {
  Male as MaleIcon,
  Female as FemaleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  AccountTree as PedigreeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DatabaseService from '../services/database';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBirds: 0,
    maleCount: 0,
    femaleCount: 0,
    recentBirds: 0
  });
  const [recentBirds, setRecentBirds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, birdsData] = await Promise.all([
        DatabaseService.getStats(),
        DatabaseService.query(`
          SELECT * FROM birds 
          ORDER BY created_at DESC 
          LIMIT 5
        `)
      ]);
      
      setStats(statsData);
      setRecentBirds(birdsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', noAvatar = false }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
          {noAvatar ? (
            <Box>
              {icon}
            </Box>
          ) : (
            <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
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

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Birds"
            value={stats.totalBirds}
            icon={<img src={pigeonIcon} alt="pigeon" style={{ width: 56, height: 56 }} />}
            color="primary"
            noAvatar={true}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Males"
            value={stats.maleCount}
            icon={<MaleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Females"
            value={stats.femaleCount}
            icon={<FemaleIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Added This Month"
            value={stats.recentBirds}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Recent Birds and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recently Added Birds
              </Typography>
              {recentBirds.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    No birds added yet. Start by adding your first bird!
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/birds/add')}
                    sx={{ mt: 2 }}
                  >
                    Add First Bird
                  </Button>
                </Box>
              ) : (
                <List>
                  {recentBirds.map((bird) => (
                    <ListItem
                      key={bird.id}
                      button
                      onClick={() => navigate(`/birds/${bird.id}`)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: bird.sex === 'male' ? 'info.main' : 'secondary.main',
                          }}
                        >
                          {bird.sex === 'male' ? <MaleIcon /> : <FemaleIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {bird.name || bird.ring_number || 'Unnamed Bird'}
                            </Typography>
                            {bird.ring_number && (
                              <Chip
                                label={bird.ring_number}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {bird.breed && `${bird.breed} • `}
                              {bird.color && `${bird.color} • `}
                              {bird.year && `${bird.year}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Tips Card */}
          <Card sx={{ mt: 0 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                💡 Tips
              </Typography>
              <Typography variant="body2" paragraph>
                • Always add parent information when creating birds to build complete pedigrees
              </Typography>
              <Typography variant="body2" paragraph>
                • Use clear, consistent naming conventions for easy searching
              </Typography>
              <Typography variant="body2">
                • Add photos to make your pedigrees more professional
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
