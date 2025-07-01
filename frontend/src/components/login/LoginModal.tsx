import { Modal, Box, Typography, TextField, Button, Divider, Link } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: 24,
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Willkommen zurück
        </Typography>

        <Typography sx={{ textAlign: 'center', color: '#666', fontSize: '0.95rem', mb: 2 }}>
          Melde dich an, um deine Gutscheine einfach zu verwalten.
        </Typography>

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="E-Mail"
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
              },
            }}
          />

          <TextField
            label="Passwort"
            type="password"
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
              },
            }}
          />

          <Box sx={{ textAlign: 'right', mt: '-0.5rem' }}>
            <Link href="#" underline="hover" sx={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}>
              Passwort vergessen?
            </Link>
          </Box>
        </Box>

        <Button
          fullWidth
          sx={{
            backgroundColor: '#4F46E5',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            padding: '0.9rem',
            borderRadius: 3,
            mt: 1,
            '&:hover': { backgroundColor: '#4338CA' },
          }}
        >
          Jetzt einloggen
        </Button>

        <Divider sx={{ width: '100%', my: 2 }} />

        <Typography sx={{ fontSize: '0.9rem', color: '#555' }}>
          Du hast noch kein Konto?{' '}
          <span style={{ color: '#4F46E5', cursor: 'pointer', fontWeight: 600 }}>
            Registrieren
          </span>
        </Typography>
      </Box>
    </Modal>
  );
}
