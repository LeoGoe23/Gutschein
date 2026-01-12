import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert, Box } from '@mui/material';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

interface KontaktModalProps {
  open: boolean;
  onClose: () => void;
  source?: string; // z.B. "Startseite", "Widget", "Demo" etc.
}

export default function KontaktModal({ open, onClose, source = 'Allgemein' }: KontaktModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validierung
    if (!name || !email) {
      setError('Bitte Name und E-Mail ausfüllen');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte gültige E-Mail-Adresse eingeben');
      return;
    }

    setSending(true);
    setError('');

    try {
      await addDoc(collection(db, 'kontaktanfragen'), {
        name,
        email,
        telefon,
        nachricht,
        source,
        timestamp: new Date().toISOString(),
        status: 'neu'
      });

      setSuccess(true);
      
      // Nach 2 Sekunden Modal schließen und zurücksetzen
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Fehler beim Senden der Kontaktanfrage:', err);
      setError('Fehler beim Senden. Bitte versuchen Sie es erneut.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setTelefon('');
    setNachricht('');
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: '1rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: '1.75rem', 
        fontWeight: 700,
        color: '#1a202c',
        pb: 1,
        pt: 2
      }}>
        Kontaktieren Sie uns
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {success ? (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              borderRadius: '12px',
              fontSize: '1rem'
            }}
          >
            Vielen Dank! Wir melden uns in Kürze bei Ihnen.
          </Alert>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  fontSize: '1rem'
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              label="Name *"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
              disabled={sending}
            />

            <TextField
              label="E-Mail *"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
              disabled={sending}
            />

            <TextField
              label="Telefon (optional)"
              fullWidth
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
              disabled={sending}
            />

            <TextField
              label="Nachricht (optional)"
              fullWidth
              multiline
              rows={4}
              value={nachricht}
              onChange={(e) => setNachricht(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
              disabled={sending}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={sending}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            color: '#4a5568'
          }}
        >
          Abbrechen
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={sending || success}
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            bgcolor: '#667eea',
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              bgcolor: '#5568d3',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
            },
            '&:disabled': {
              bgcolor: '#cbd5e0'
            }
          }}
        >
          {sending ? 'Wird gesendet...' : 'Absenden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
