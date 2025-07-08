import { Box, Button, Typography, IconButton, Drawer, List, ListItem, ListItemText, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginModal from '../../components/login/LoginModal';
import { auth } from '../../auth/firebase';
import useAuth from '../../auth/useAuth';
import { signOut } from "firebase/auth";

export default function TopBar() {
  const navigate = useNavigate(); // Hook für Navigation
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const user = useAuth();
  const menuOpen = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/'); // Nach dem Abmelden zur Startseite navigieren
    }).catch((error) => {
      console.error("Logout failed:", error);
    });
    handleMenuClose();
  };

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
          <Typography
            component={Link}
            to="/ueberuns"
            sx={{
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#333',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Über uns
          </Typography>

          <Typography
            component={Link}
            to={user ? "/profil" : "#"}
            onClick={() => {
              if (!user) setOpen(true);
            }}
            sx={{
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#333',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Mein Konto
          </Typography>

          {user ? (
            <>
              <Tooltip title="Account">
                <IconButton onClick={handleAvatarClick}>
                  <Avatar sx={{ bgcolor: '#4F46E5', width: 36, height: 36 }}>
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>{user.email}</MenuItem>
                <MenuItem component={Link} to="/profil">Profil</MenuItem>
                <MenuItem onClick={handleLogout}>Abmelden</MenuItem>
              </Menu>
            </>
          ) : (
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
          )}
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
          {user ? (
            <ListItem component="li" onClick={() => { handleLogout(); setDrawerOpen(false); }}>
              <ListItemText primary="Abmelden" />
            </ListItem>
          ) : (
            <ListItem component="li" onClick={() => { setOpen(true); setDrawerOpen(false); }}>
              <ListItemText primary="Einloggen" />
            </ListItem>
          )}
        </List>
      </Drawer>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
