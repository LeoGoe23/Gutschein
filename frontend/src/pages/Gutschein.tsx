import { Box, Button } from '@mui/material';
import Sidebar from '../components/gutschein/sidebar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar'; // Import der TopBar
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GutscheinProvider } from '../context/GutscheinContext';

export default function Gutschein() {
  const location = useLocation();
  const navigate = useNavigate();

  const steps = [
    '/gutschein/step1',
    '/gutschein/step2',
    '/gutschein/step3',
    '/gutschein/step4',
    '/gutschein/step5',
  ];

  const currentIndex = steps.indexOf(location.pathname);

  const nextStep = () => {
    if (currentIndex < steps.length - 1) navigate(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    if (currentIndex > 0) navigate(steps[currentIndex - 1]);
  };

  return (
    <GutscheinProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#fff', position: 'relative' }}>
        
        <Sidebar activeStep={currentIndex + 1} />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* TopBar genau wie bei Home */}
          <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
            <TopBar />
          </Box>

          <Box sx={{ flex: 1, padding: '4rem', overflow: 'auto' }}>
            <Outlet />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem', padding: '4rem' }}>
            {currentIndex > 0 && (
              <Button variant="outlined" onClick={prevStep}>
                Zurück
              </Button>
            )}

            {currentIndex < steps.length - 1 && (
              <Button variant="contained" sx={{ backgroundColor: '#2E7D66' }} onClick={nextStep}>
                Weiter
              </Button>
            )}

            {currentIndex === steps.length - 1 && (
              <Button variant="contained" sx={{ backgroundColor: '#2E7D66' }} onClick={() => console.log('Abgeschlossen')}>
                Abschließen
              </Button>
            )}
          </Box>

        </Box>
      </Box>
    </GutscheinProvider>
  );
}
