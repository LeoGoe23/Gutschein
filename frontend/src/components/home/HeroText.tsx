import { useState } from 'react';
import { Typography, Button, Stack, Modal, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function HeroText() {
  const navigate = useNavigate();
  const [anmeldenOpen, setAnmeldenOpen] = useState(false);

  return (
    <Stack spacing={5}>
      <Typography
        variant="h3"
        sx={{ fontWeight: 700, color: '#222', lineHeight: 1.2, fontSize: '3.2rem' }}
      >
        Ihr Partner für digitale Gutscheine
      </Typography>

      <Typography
        variant="body1"
        sx={{ color: '#555', lineHeight: 1.6, fontSize: '1.4rem', maxWidth: '600px' }}
      >
        Wir wickeln Ihre Gutscheine ab. Digitale Gutscheine für Ihre Kunden – schnell, unkompliziert und ohne technische Hürden.
      </Typography>

      <Stack direction="row" spacing={3}>
        <Button
          variant="contained"
          onClick={() => setAnmeldenOpen(true)}
          sx={{
            backgroundColor: '#4F46E5',
            fontSize: '1.1rem',
            padding: '1rem 2.2rem',
            borderRadius: '1rem',
            boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#4338CA',
              boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
            },
          }}
        >
          Anmelden
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate('/demo')}
          sx={{
            borderColor: '#4F46E5',
            color: '#4F46E5',
            fontSize: '1.1rem',
            padding: '1rem 2.2rem',
            borderRadius: '1rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#4338CA',
              color: '#4338CA',
              backgroundColor: 'rgba(79, 70, 229, 0.05)',
            },
          }}
        >
          Demo
        </Button>
      </Stack>

      <Modal
        open={anmeldenOpen}
        onClose={() => setAnmeldenOpen(false)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            padding: '4rem',
            borderRadius: '16px',
            maxWidth: '1000px',
            width: '95%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(0,0,0,0.2)',
          }}
        >
          <Typography variant="h4" sx={{ marginBottom: '3rem', fontWeight: 700 }}>
            Wie möchten Sie starten?
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={5} justifyContent="center">
            <Box
              onClick={() => navigate('/gutschein/step1')}
              sx={{
                flex: 1,
                minWidth: '300px',
                border: '3px solid #E0E0E0',
                borderRadius: '20px',
                padding: '3rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '&:hover': {
                  borderColor: '#4F46E5',
                  boxShadow: '0 0 25px rgba(79,70,229,0.25)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <DesignServicesIcon sx={{ fontSize: 90, color: '#4F46E5', marginBottom: '1.5rem' }} />
              <Typography variant="h5" sx={{ marginBottom: '1rem', fontWeight: 600 }}>
                Selbst gestalten
              </Typography>
              <Typography variant="body1" sx={{ color: '#555', maxWidth: '350px' }}>
                Geben Sie Ihre Daten selbst ein und designen Sie Ihren Gutschein ganz nach Ihren Vorstellungen.
              </Typography>
            </Box>

            <Box
              onClick={() => navigate('/stepminimal')}
              sx={{
                flex: 1,
                minWidth: '300px',
                border: '3px solid #E0E0E0',
                borderRadius: '20px',
                padding: '3rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '&:hover': {
                  borderColor: '#4F46E5',
                  boxShadow: '0 0 25px rgba(79,70,229,0.25)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <SupportAgentIcon sx={{ fontSize: 90, color: '#4F46E5', marginBottom: '1.5rem' }} />
              <Typography variant="h5" sx={{ marginBottom: '1rem', fontWeight: 600 }}>
                Wir übernehmen das
              </Typography>
              <Typography variant="body1" sx={{ color: '#555', maxWidth: '350px' }}>
                Lehnen Sie sich zurück. Sie geben nur die Grunddaten an – wir kümmern uns um das Design und die Abwicklung.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Modal>
    </Stack>
  );
}
