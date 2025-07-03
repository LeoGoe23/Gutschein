import { Box, Button, Typography, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginModal from '../../components/login/LoginModal';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: { xs: '0.5rem 1rem', md: '0' } }}>
        {/* Burger Menu Icon for Mobile */}
        <IconButton
          sx={{ display: { xs: 'block', md: 'none' } }}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon sx={{ fontSize: '2rem', color: '#333' }} />
        </IconButton>

        {/* Links for Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '2rem' }}>
          <Typography sx={{ cursor: 'pointer', fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
            Über uns
          </Typography>

          <Typography
            component={Link}
            to="/roadmap"
            sx={{
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#333',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Funktionen
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setOpen(true)}
            sx={{
              color: '#4F46E5',
              borderColor: '#4F46E5',
              backgroundColor: 'white',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 20,
              padding: '1rem 1.6rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              fontSize: '1rem',
              '&:hover': { backgroundColor: '#f0f0f0' },
            }}
          >
            Einloggen
          </Button>
        </Box>
      </Box>

      {/* Drawer for Mobile */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 250 }}>
          <ListItem component="li" onClick={() => setDrawerOpen(false)}>
            <ListItemText primary="Über uns" />
          </ListItem>
          <ListItem component={Link} to="/roadmap" onClick={() => setDrawerOpen(false)}>
            <ListItemText primary="Funktionen" />
          </ListItem>
          <ListItem component="li" onClick={() => { setOpen(true); setDrawerOpen(false); }}>
            <ListItemText primary="Einloggen" />
          </ListItem>
        </List>
      </Drawer>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
