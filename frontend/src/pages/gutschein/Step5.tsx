import { Box, Typography, Button, Stack } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';
import { ReactElement } from 'react';
import { Email, Phone, Person, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Zusammenfassung() {
  const { data } = useGutschein();
  const navigate = useNavigate();

  const handlePreview = () => {
    navigate('/checkoutdemo');
  };

  return (
    <Box sx={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zusammenfassung
      </Typography>
      <Typography sx={{ fontSize: '1rem', color: '#666', mb: '1rem' }}>
        Sie können Ihre Daten jederzeit auf unserer Website ändern.
      </Typography>

      <Box sx={{ border: '1px solid #ddd', borderRadius: '1rem', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        
        <Typography sx={{ fontWeight: 500, mb: '1.5rem', color: '#333' }}>
          Persönliche Daten:
        </Typography>
        
        <Stack spacing={2}>
          <Stack direction="row" spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Person sx={{ color: '#4CAF50', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>Name: {data.nachname}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Email sx={{ color: '#2196F3', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>E-Mail: {data.email}</Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Phone sx={{ color: '#FF9800', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>Telefon: {data.telefon}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Business sx={{ color: '#9C27B0', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>IBAN: {data.iban}</Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Button
        variant="contained"
        onClick={handlePreview}
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
