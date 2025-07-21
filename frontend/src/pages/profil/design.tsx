import { Box, Button, TextField, Typography, Paper, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Launch from '@mui/icons-material/Launch';
import { auth, db } from '../../auth/firebase';
import PageContainer from '../../components/profil/PageContainer';
import { uploadImageToStorage } from '../../utils/saveToFirebase'; // Importiere die Funktion zum Hochladen

export default function GutscheinEditorPage() {
  const [checkoutLink, setCheckoutLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        if (data.slug) {
          setCheckoutLink(`https://gutscheinery.de/checkoutc/${data.slug}`);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkoutLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSnackbar('Link kopiert!');
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
      showSnackbar('Fehler beim Kopieren');
    }
  };

  const handleTestLink = () => {
    if (checkoutLink) {
      window.open(checkoutLink, '_blank');
    }
  };

  const handleChangeImage = async (file: File) => {
    if (!checkoutLink) {
      showSnackbar('Kein gültiger Checkout-Link vorhanden');
      return;
    }

    const slug = checkoutLink.split('/').pop(); // Extrahiere den Slug aus dem Link
    if (!slug) {
      showSnackbar('Fehler beim Extrahieren des Slugs');
      return;
    }

    try {
      const newImagePath = `seiten/${slug}/screen`;
      const newImageURL = await uploadImageToStorage(file, newImagePath);
      showSnackbar('Bild erfolgreich aktualisiert!');
      console.log('Neue Bild-URL:', newImageURL);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Bildes:', error);
      showSnackbar('Fehler beim Aktualisieren des Bildes');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  return (
    <PageContainer title="Gutschein Editor">
      {/* Checkout-Link Bereich */}
      {checkoutLink && (
        <Paper
          elevation={2}
          sx={{
            padding: '1.5rem',
            borderRadius: '1rem',
            mb: 3,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Ihr Checkout-Link
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              value={checkoutLink}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.9rem' },
              }}
            />
            <Button
              variant="contained"
              onClick={handleCopyLink}
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              sx={{
                backgroundColor: copied ? '#4CAF50' : '#607D8B',
                minWidth: '120px',
                '&:hover': {
                  backgroundColor: copied ? '#45a049' : '#546E7A',
                },
              }}
            >
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
          </Box>

          <Button
            variant="outlined"
            onClick={handleTestLink}
            startIcon={<Launch />}
            size="small"
            sx={{ color: '#607D8B', borderColor: '#607D8B' }}
          >
            Link testen
          </Button>
        </Paper>
      )}

      {/* Bild ändern Button */}
      <Button
        variant="contained"
        component="label"
        startIcon={<ContentCopy />}
        sx={{
          backgroundColor: '#607D8B',
          minWidth: '120px',
          '&:hover': {
            backgroundColor: '#546E7A',
          },
        }}
      >
        Bild ändern
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleChangeImage(e.target.files[0]);
            }
          }}
        />
      </Button>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </PageContainer>
  );
}