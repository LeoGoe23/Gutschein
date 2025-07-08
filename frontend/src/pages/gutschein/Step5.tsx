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
      <Typography sx={{ fontSize: '1rem', color: '#666', mb: '1rem' }}>
        Sie können Ihre Daten jederzeit auf unserer Website ändern.
      </Typography>

      <Box sx={{ border: '1px solid #ddd', borderRadius: '1rem', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        
        <Typography sx={{ fontWeight: 500, mb: '0.5rem', color: '#333' }}>
          Persönliche Daten:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Person sx={{ color: '#607D8B' }} />
          <Typography>Name: {data.nachname}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Email sx={{ color: '#607D8B' }} />
          <Typography>E-Mail: {data.email}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone sx={{ color: '#607D8B' }} />
          <Typography>Telefon: {data.telefon}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Business sx={{ color: '#607D8B' }} />
          <Typography>IBAN: {data.geschaeftsart}</Typography>
        </Box>

        {data.bild && (
          <Box sx={{ mt: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image sx={{ color: '#607D8B' }} />
            <img src={data.bild} alt="Bild" style={{ width: '100px', borderRadius: '0.5rem' }} />
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        sx={{
          mt: '2rem',
          backgroundColor: '#607D8B',
          color: '#fff',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '2rem',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: '#546E7A',
          },
        }}
      >
        Vorschau: Was sieht Ihr Kunde
      </Button>

    </Box>
  );
}
