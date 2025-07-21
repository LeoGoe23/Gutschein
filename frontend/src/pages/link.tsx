import { Box, Typography, Button, TextField, Paper, Alert, CircularProgress } from '@mui/material';
import { useGutschein } from '../context/GutscheinContext';
import { useState, useEffect } from 'react';
import { ContentCopy, CheckCircle, Launch, Code } from '@mui/icons-material';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../auth/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LinkGenerierung() {
  const { data } = useGutschein();
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Slug aus Firebase holen
  useEffect(() => {
    const fetchSlug = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('Nicht angemeldet');
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.slug) {
            setSlug(userData.slug);
          } else {
            setError('Kein Slug gefunden. Bitte Setup erneut durchführen.');
          }
        } else {
          setError('Benutzerdaten nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden des Slugs:', err);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchSlug();
  }, []);

  // Checkout-Link mit echtem Slug erstellen
  const checkoutLink = slug ? `https://gutscheinery/checkoutc/${slug}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkoutLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  const handleTestLink = () => {
    if (checkoutLink) {
      window.open(checkoutLink, '_blank');
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/gutschein/step1')}>
          Zurück zum Setup
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#f4f4f4',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      <LogoTopLeft />
      
      <Box sx={{ 
        position: 'absolute', 
        top: { xs: '0.5rem', md: '1.5rem' }, 
        right: { xs: '1rem', md: '4rem' }, 
        zIndex: 3 
      }}>
        <TopBar />
      </Box>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        padding: { xs: '2rem 1rem', md: '4rem 2rem' },
        paddingTop: { xs: '4rem', md: '6rem' }
      }}>
        
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2rem',
          backgroundColor: '#fff',
          borderRadius: '2rem',
          padding: { xs: '2rem', md: '4rem' },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          
          <Box sx={{ textAlign: 'center', mb: '1rem' }}>
            <Typography sx={{ 
              fontSize: { xs: '1.8rem', md: '2.5rem' }, 
              fontWeight: 700, 
              color: '#333',
              mb: '0.5rem'
            }}>
              🎉 Ihr Gutschein-Link ist bereit!
            </Typography>
            <Typography sx={{ 
              fontSize: '1.1rem', 
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Ihr personalisierter Checkout-Link mit Code <strong>{slug}</strong> wurde erfolgreich erstellt.
            </Typography>
          </Box>
          
          <Alert severity="success" sx={{ 
            borderRadius: '1rem',
            fontSize: '1rem',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}>
            Der Checkout-Link wurde erfolgreich generiert und ist sofort einsatzbereit.
          </Alert>

          {/* Link Box */}
          <Paper elevation={3} sx={{ 
            padding: { xs: '1.5rem', md: '2rem' }, 
            borderRadius: '1.5rem', 
            backgroundColor: '#F8F9FA',
            border: '1px solid #E0E0E0'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              mb: '1rem', 
              color: '#333',
              fontSize: '1.1rem'
            }}>
              Ihr Checkout-Link:
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#E8F5E8', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              mb: '1rem',
              border: '1px solid #C8E6C9'
            }}>
              <Typography sx={{ 
                fontSize: '0.9rem', 
                color: '#2E7D32',
                fontWeight: 500
              }}>
                Website-Code: <strong>{slug}</strong>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: '1rem', mb: '1.5rem', flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                value={checkoutLink}
                fullWidth
                variant="outlined"
                InputProps={{
                  readOnly: true,
                  sx: {
                    backgroundColor: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    borderRadius: '0.75rem'
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleCopyLink}
                startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                sx={{
                  backgroundColor: copied ? '#4CAF50' : '#607D8B',
                  minWidth: '140px',
                  height: '56px',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
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
              sx={{
                color: '#607D8B',
                borderColor: '#607D8B',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                '&:hover': {
                  borderColor: '#546E7A',
                  backgroundColor: 'rgba(96, 125, 139, 0.04)',
                },
              }}
            >
              Link testen
            </Button>
          </Paper>

          {/* Anleitung */}
          <Paper elevation={2} sx={{ 
            padding: { xs: '1.5rem', md: '2rem' }, 
            borderRadius: '1.5rem', 
            border: '1px solid #E0E0E0',
            backgroundColor: '#fff'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              mb: '2rem', 
              color: '#333', 
              fontSize: '1.2rem',
              textAlign: 'center'
            }}>
              So geht's weiter:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <Box sx={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  backgroundColor: '#607D8B', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  minWidth: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  1
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: '0.5rem', fontSize: '1.1rem' }}>
                    Link in Ihre Website einbauen
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
                    Fügen Sie den Link als Button oder Textlink in Ihre Website ein. 
                    Zum Beispiel: "Jetzt Gutschein kaufen" oder "Geschenkgutschein bestellen"
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  backgroundColor: '#607D8B', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  minWidth: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  2
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: '0.5rem', fontSize: '1.1rem' }}>
                    Kunden können direkt bestellen
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
                    Ihre Kunden werden direkt zur Checkout-Seite weitergeleitet und können 
                    den Gutschein sofort kaufen - ohne Umwege.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  backgroundColor: '#607D8B', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  minWidth: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  3
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: '0.5rem', fontSize: '1.1rem' }}>
                    Automatische Überweisung
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
                    Nach dem Kauf wird der Betrag automatisch auf Ihr Konto {data.iban} überwiesen.
                  </Typography>
                </Box>
              </Box>

            </Box>
          </Paper>

          {/* Code Beispiel */}
          <Paper elevation={2} sx={{ 
            padding: { xs: '1.5rem', md: '2rem' }, 
            borderRadius: '1.5rem', 
            backgroundColor: '#F8F9FA',
            border: '1px solid #E0E0E0'
          }}>
            <Typography sx={{ 
              fontWeight: 600, 
              mb: '1.5rem', 
              color: '#333', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1.1rem'
            }}>
              <Code sx={{ color: '#607D8B' }} />
              HTML-Beispiel:
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#2D3748', 
              color: '#E2E8F0', 
              padding: '1.5rem', 
              borderRadius: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              <pre>{`<a href="${checkoutLink}" 
   style="background: #607D8B; color: white; padding: 12px 24px; 
          text-decoration: none; border-radius: 8px; display: inline-block;">
   🎁 Gutschein kaufen
</a>`}</pre>
            </Box>
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            mt: '2rem',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              variant="contained"
              onClick={handleFinish}
              sx={{
                backgroundColor: '#607D8B',
                color: '#fff',
                padding: '1rem 2rem',
                borderRadius: '2rem',
                fontSize: '1rem',
                fontWeight: 600,
                minWidth: '200px',
                '&:hover': {
                  backgroundColor: '#546E7A',
                },
              }}
            >
              Fertig
            </Button>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}