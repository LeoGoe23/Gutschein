import { Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HeroText() {
  const navigate = useNavigate();

  return (
    <Stack spacing={4}>
      <Typography
        variant="h3"
        sx={{ fontWeight: 700, color: '#222', lineHeight: '1.2', fontSize: '3.2rem' }}
      >
        Ihr Partner für digitale Gutscheine
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: '#555', lineHeight: '1.6', fontSize: '1.4rem' }}
      >
        Wir wickeln Ihre Gutscheine ab. Digitale Gutscheine für Ihre Kunden – schnell, unkompliziert und ohne technische Hürden.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate('/gutschein/step1')}
        sx={{
          backgroundColor: '#4F46E5',
          fontSize: '1.1rem',
          padding: '0.8rem 1.8rem',
          borderRadius: '0.6rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textTransform: 'none',
          width: 'fit-content',
          alignSelf: 'flex-start',
          '&:hover': {
            backgroundColor: '#4338CA',
          },
        }}
      >
        Kostenlos testen
      </Button>
    </Stack>
  );
}
