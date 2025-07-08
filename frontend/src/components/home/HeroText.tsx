import { useState } from 'react';
import { Typography, Button, Stack, Modal, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export default function HeroText() {
  const navigate = useNavigate();
  const [anmeldenOpen, setAnmeldenOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDemo = () => {
    navigate('/checkout', { state: { uploadedImage } });
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
          onClick={() => setImageModalOpen(true)}
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
          onClick={() => navigate('/gutschein/step1')}
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
          Anmelden
        </Button>
      </Stack>

      {/* Modal für Bildauswahl */}
      <Modal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
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
            borderRadius: '16px',
            maxWidth: '500px',
            width: '95%',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(0,0,0,0.2)',
          }}
        >
          <Typography variant="h5" sx={{ marginBottom: '1.5rem', fontWeight: 700 }}>
            Möchten Sie ein eigenes Bild hochladen oder das Demodesign verwenden?
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <Button
              variant="outlined"
              component="label"
              sx={{
                padding: '0.8rem 2rem',
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
              Bild hochladen
              <input type="file" hidden onChange={handleImageUpload} />
            </Button>

            <Button
              variant="contained"
              onClick={handleStartDemo}
              sx={{
                backgroundColor: '#4F46E5',
                fontSize: '1.1rem',
                padding: '0.8rem 2rem',
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
        </Box>
      </Modal>
    </Stack>
  );
}
