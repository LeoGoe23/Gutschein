import { Alert, Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import Sidebar from '../components/profil/sidebar';
import { Outlet } from 'react-router-dom';
import useProfileViewContext from '../auth/useProfileViewContext';

export default function ProfileLayout() {
  const { isImpersonating, isDevMode } = useProfileViewContext();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar />

      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 4 }}>
        <TopBar />
      </Box>

      <Box sx={{ marginLeft: { xs: 0, md: '280px' }, padding: { xs: '4.25rem 1rem 1rem 1rem', md: '5.25rem 2rem 2rem 2rem' } }}>
        {isDevMode && isImpersonating && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Dev-Preview aktiv: Du siehst gerade die Kundenansicht im Nur-Lesen-Modus.
          </Alert>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
