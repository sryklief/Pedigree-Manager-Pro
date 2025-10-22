import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import pigeonIcon from '../assets/icons/pigeon_icon.png';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  AccountTree as PedigreeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'All Birds', icon: <img src={pigeonIcon} alt="pigeon" style={{ width: 32, height: 32 }} />, path: '/birds' },
    { text: 'Add Bird', icon: <AddIcon />, path: '/birds/add' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0'
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" component="div" color="primary.main" fontWeight="bold">
          Pigeon Pedigree
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Manager
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(44, 90, 160, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'primary.main',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Navigation;
