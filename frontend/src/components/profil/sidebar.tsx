import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{
      width: '280px',
      height: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '4rem 2rem 8rem 2rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 2,
      alignItems: 'center',
      borderRadius: '0 1rem 1rem 0',
    }}>
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          marginBottom: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => window.location.href = '/'}
      >
        Gutscheinfabrik
      </Typography>

      <List sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profil/gutscheine'}
            onClick={() => navigate('/profil/gutscheine')}
            sx={{
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: location.pathname === '/profil/gutscheine' ? '#1f2937' : 'transparent',
              transform: location.pathname === '/profil/gutscheine' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: '#1f2937' }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/profil/gutscheine' ? '#4F46E5' : 'white', minWidth: 'auto' }}>
              <LocalActivityIcon sx={{ fontSize: '2rem' }} />
            </ListItemIcon>
            <ListItemText primary="Meine Gutscheine" sx={{ display: { xs: 'none', md: 'block' }, color: 'white', ml: 2 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profil/einnahmen'}
            onClick={() => navigate('/profil/einnahmen')}
            sx={{
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: location.pathname === '/profil/einnahmen' ? '#1f2937' : 'transparent',
              transform: location.pathname === '/profil/einnahmen' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: '#1f2937' }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/profil/einnahmen' ? '#4F46E5' : 'white', minWidth: 'auto' }}>
              <MonetizationOnIcon sx={{ fontSize: '2rem' }} />
            </ListItemIcon>
            <ListItemText primary="Einnahmen" sx={{ display: { xs: 'none', md: 'block' }, color: 'white', ml: 2 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profil/einstellungen'}
            onClick={() => navigate('/profil/einstellungen')}
            sx={{
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: location.pathname === '/profil/einstellungen' ? '#1f2937' : 'transparent',
              transform: location.pathname === '/profil/einstellungen' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: '#1f2937' }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/profil/einstellungen' ? '#4F46E5' : 'white', minWidth: 'auto' }}>
              <SettingsIcon sx={{ fontSize: '2rem' }} />
            </ListItemIcon>
            <ListItemText primary="Einstellungen" sx={{ display: { xs: 'none', md: 'block' }, color: 'white', ml: 2 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profil/konto'}
            onClick={() => navigate('/profil/konto')}
            sx={{
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: location.pathname === '/profil/konto' ? '#1f2937' : 'transparent',
              transform: location.pathname === '/profil/konto' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: '#1f2937' }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === '/profil/konto' ? '#4F46E5' : 'white', minWidth: 'auto' }}>
              <AccountCircleIcon sx={{ fontSize: '2rem' }} />
            </ListItemIcon>
            <ListItemText primary="Mein Konto" sx={{ display: { xs: 'none', md: 'block' }, color: 'white', ml: 2 }} />
          </ListItemButton>
        </ListItem>
        
      </List>
    </Box>
  );
}
