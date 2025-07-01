import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import LoginModal from '../../components/login/LoginModal';

export default function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        
        <Typography sx={{ cursor: 'pointer', fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
          Über uns
        </Typography>

        <Typography sx={{ cursor: 'pointer', fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
          Funktionen
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{
            color: '#4F46E5',
            borderColor: '#4F46E5',
            backgroundColor: 'white',
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 20,
            padding: '1rem 1.6rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            fontSize: '1rem',
            '&:hover': { backgroundColor: '#f0f0f0' },
          }}
        >
          Einloggen
        </Button>
      </Box>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
