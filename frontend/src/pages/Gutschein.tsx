import { Box, Button } from '@mui/material';
import Sidebar from '../components/gutschein/sidebar';
import LogoTopLeft from '../components/home/TopLeftLogo';
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
        
        <LogoTopLeft />
        <Sidebar activeStep={currentIndex + 1} />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem', overflow: 'hidden' }}>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Outlet />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
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
              <Button variant="contained" sx={{ backgroundColor: '#2E7D66' }} onClick={() => console.log('Fertig')}>
                Fertig
              </Button>
            )}
          </Box>

        </Box>
      </Box>
    </GutscheinProvider>
  );
}
