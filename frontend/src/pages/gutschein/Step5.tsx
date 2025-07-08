import { Box, Typography, Button } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';
import { ReactElement } from 'react';
import { Email, Phone, Person, Business, Image } from '@mui/icons-material';

export default function Zusammenfassung() {
  const { data } = useGutschein();

  return (
    <Box sx={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zusammenfassung
      </Typography>

      <Box sx={{ border: '1px solid #ccc', borderRadius: '1rem', padding: '2rem', backgroundColor: '#F9F9F9' }}>
        
        <Typography sx={{ fontWeight: 500, mb: '0.5rem' }}>
          Persönliche Daten:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Person sx={{ color: '#4CAF50' }} />
          <Typography>Vorname: {data.vorname}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Person sx={{ color: '#4CAF50' }} />
          <Typography>Nachname: {data.nachname}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Email sx={{ color: '#4CAF50' }} />
          <Typography>E-Mail: {data.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone sx={{ color: '#4CAF50' }} />
          <Typography>Telefon: {data.telefon}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Business sx={{ color: '#4CAF50' }} />
          <Typography>Geschäftsart: {data.geschaeftsart}</Typography>
        </Box>

        {data.bild && (
          <Box sx={{ mt: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image sx={{ color: '#4CAF50' }} />
            <img src={data.bild} alt="Bild" style={{ width: '100px', borderRadius: '0.5rem' }} />
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        sx={{
          mt: '2rem',
          backgroundColor: '#4CAF50',
          color: '#fff',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '2rem',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: '#45A049',
          },
        }}
      >
        Vorschau: Was sieht Ihr Kunde
      </Button>

    </Box>
  );
}
