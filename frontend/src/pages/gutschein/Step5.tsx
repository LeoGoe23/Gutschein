import { Box, Typography, Button, Stack, Checkbox, FormControlLabel, Link } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';
import { Email, Phone, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Zusammenfassung() {
  const { data, setData, clearData } = useGutschein(); // setData ergänzt
  const navigate = useNavigate();

  const handlePreview = () => {
    navigate('/checkoutc');
  };

  return (
    <Box sx={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zusammenfassung
      </Typography>
      <Typography sx={{ fontSize: '1rem', color: '#666', mb: '1rem' }}>
        Sie können Ihre Daten jederzeit auf unserer Website ändern.
      </Typography>

      {/* Persönliche Daten */}
      <Box sx={{ border: '1px solid #ddd', borderRadius: '1rem', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        <Typography sx={{ fontWeight: 500, mb: '1.5rem', color: '#333' }}>
          Persönliche Daten:
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Person sx={{ color: '#4CAF50', fontSize: '2rem' }} />
            <Typography sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              Name: {data.vorname} {data.nachname}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Email sx={{ color: '#2196F3', fontSize: '2rem' }} />
            <Typography sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              E-Mail: {data.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Phone sx={{ color: '#FF9800', fontSize: '2rem' }} />
            <Typography sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              Telefon: {data.telefon}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* AGB Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={!!data.agbAccepted}
            onChange={e => setData({ agbAccepted: e.target.checked })}
            color="primary"
          />
        }
        label={
          <span>
            Ich habe die{' '}
            <Link href="/agb" target="_blank" rel="noopener">
              AGB
            </Link>{' '}
            gelesen und akzeptiere sie.
          </span>
        }
        sx={{ mt: 2 }}
      />

      <Stack direction="row" spacing={2} sx={{ mt: '2rem' }}>
        <Button
          variant="contained"
          onClick={handlePreview}
          sx={{
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
      </Stack>

      {/* Reset-Button */}
      <Button
        variant="outlined"
        onClick={() => clearData()}
        sx={{
          mt: '1rem',
          color: '#FF5722',
          borderColor: '#FF5722',
          padding: '0.5rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: '2rem',
          '&:hover': {
            backgroundColor: '#FFEBEE',
            borderColor: '#FF5722',
          },
        }}
      >
        Zurücksetzen
      </Button>

    </Box>
  );
}
