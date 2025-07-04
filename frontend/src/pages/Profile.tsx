import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import Sidebar from '../components/profil/sidebar';
import { Outlet } from 'react-router-dom';

export default function ProfileLayout() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />

      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>

      <Box sx={{ marginLeft: { xs: '60px', md: '220px' }, padding: '2rem' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
