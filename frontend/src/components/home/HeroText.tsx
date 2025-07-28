import { useState, useEffect } from 'react';
import { Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../auth/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import LoginModal from '../login/LoginModal';

export default function HeroText() {
  const navigate = useNavigate();
  const [anmeldenOpen, setAnmeldenOpen] = useState(false);
  const [registrationFinished, setRegistrationFinished] = useState<boolean>(false);

  const user = useAuth();

  // Firebase-Check für registrationFinished
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRegistrationFinished(userData.registrationFinished || false);
          }
        } catch (error) {
          console.error("Error checking registration status:", error);
        }
      }
    };

    checkRegistrationStatus();
  }, [user]);

  const handleStartDemo = () => {
    navigate('/checkout');
  };

  const handleAccountClick = () => {
    if (!user) {
      setAnmeldenOpen(true);
    } else if (registrationFinished) {
      navigate('/profil');
    } else {
      navigate('/gutschein/step1');
    }
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
          onClick={handleStartDemo} // Direkt zur Demo navigieren
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

        <Button
          variant="outlined"
          onClick={handleAccountClick}
          sx={{
            fontSize: '1.1rem',
            padding: '1rem 2.2rem',
            borderRadius: '1rem',
            textTransform: 'none',
            borderColor: '#4F46E5',
            color: '#4F46E5',
            '&:hover': {
              borderColor: '#4338CA',
              color: '#4338CA',
              backgroundColor: 'rgba(79, 70, 229, 0.05)',
            },
          }}
        >
          {user ? (registrationFinished ? "Mein Konto" : "Registrieren") : "Anmelden"}
        </Button>
      </Stack>

      <LoginModal open={anmeldenOpen} onClose={() => setAnmeldenOpen(false)} />
    </Stack>
  );
}
