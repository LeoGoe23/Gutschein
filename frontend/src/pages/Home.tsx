import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import HeroText from '../components/home/HeroText';
import HeroImage from '../components/home/HeroImage';
import ContentSection from '../components/home/ContentSection';
import Footer from '../components/home/Footer';
import LogoTopLeft from '../components/home/TopLeftLogo';

export default function HomeLayout() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      <Box sx={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
        
        <LogoTopLeft />

        <Box sx={{ position: 'absolute', top: '1.5rem', right: '4rem', zIndex: 3 }}>
          <TopBar />
        </Box>

        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 4rem' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: '35%', marginLeft: '8%' }}>
            <HeroText />
          </Box>
        </Box>

<Box
  sx={{
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: '100%',
    maxWidth: '50%',
    zIndex: 1,
    pointerEvents: 'none',
    display: { xs: 'none', sm: 'block' }, // 👈 hier: auf Handys ausblenden
  }}
>
  <HeroImage />
</Box>

      </Box>

      <ContentSection />
      <Footer />
    </Box>
  );
}
