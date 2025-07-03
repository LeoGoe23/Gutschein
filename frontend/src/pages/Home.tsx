import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import HeroText from '../components/home/HeroText';
import HeroImage from '../components/home/HeroImage';
import ContentSection from '../components/home/ContentSection';
import Footer from '../components/home/Footer';
import LogoTopLeft from '../components/home/TopLeftLogo';

export default function HomeLayout() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif', padding: { xs: '1rem', md: '0' } }}>
      
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 'auto', md: '100vh' }, backgroundColor: '#f4f4f4', overflow: 'hidden', padding: { xs: '2rem 1rem', md: '0' } }}>
        
        <LogoTopLeft />

        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        <Box sx={{ width: '100%', height: { xs: 'auto', md: '100%' }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: { xs: '7rem 1rem', md: '0 4rem' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: { xs: '100%', md: '35%' }, marginLeft: { xs: '0', md: '8%' }, textAlign: { xs: 'center', md: 'left' } }}>
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
            display: { xs: 'none', sm: 'block' },
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
