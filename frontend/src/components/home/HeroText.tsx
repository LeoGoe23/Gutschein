import { useState, useEffect } from 'react';
import { Typography, Button, Stack, Modal, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HeroText() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);  // Modal-Öffnung
  const [timer, setTimer] = useState(5);    // Timer-Startwert
  const [countdown, setCountdown] = useState(false);  // Startet den Timer

  // Countdown-Logik
  useEffect(() => {
    if (countdown && timer > 0) {
      const timerInterval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerInterval);  // Cleanup der Intervalle
    } else if (timer === 0) {
      // Automatisch Demo starten, wenn der Timer abgelaufen ist
      navigate('/demo');
    }
  }, [countdown, timer, navigate]);

  const handleDemoClick = () => {
    setOpen(true);  // Modal öffnen
    setCountdown(true);  // Countdown starten
  };

  const handleDemoStart = () => {
    navigate('/demo');
  };

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
          onClick={() => navigate('/gutschein/step1')}
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
          onClick={handleDemoClick}  // Modal und Timer aktivieren
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

      {/* Modal für die Demo */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
            <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
             Es folgt eine kurze Demo.
            </Typography>

          <Typography variant="body1" sx={{ marginBottom: '1rem' }}>
            Demo startet in {timer} Sekunden...
          </Typography>

          <Button
            variant="contained"
            onClick={handleDemoStart}
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
            Demo starten
          </Button>
        </Box>
      </Modal>
    </Stack>
  );
}
