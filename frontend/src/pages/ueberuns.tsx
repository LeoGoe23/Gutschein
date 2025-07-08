import { Box } from '@mui/material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../auth/firebase';

export default function UeberUns() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const url = await getDownloadURL(ref(storage, 'start.jpg'));
        setImageUrl(url);
      } catch (error) {
        console.error('Bild konnte nicht geladen werden:', error);
      }
    };

    fetchImage();
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif', padding: { xs: '1rem', md: '0' } }}>
      
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 'auto', md: '100vh' }, backgroundColor: '#f4f4f4', overflow: 'hidden', padding: { xs: '2rem 1rem', md: '0' } }}>
        
        <LogoTopLeft />

        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        {imageUrl && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: '2rem' }}>
            <img src={imageUrl} alt="Start" style={{ maxWidth: '100%', height: 'auto', borderRadius: '1rem' }} />
          </Box>
        )}
        
      </Box>
    </Box>
  );
}
