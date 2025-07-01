import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LogoTopLeft() {
  const navigate = useNavigate();

  return (
<Box
  sx={{
    position: 'absolute',
    top: '1rem',
    left: '3%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 10,
  }}
  onClick={() => navigate('/')}
>

      <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 60, height: 60 }} />
      <Typography sx={{ marginLeft: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
        GutscheinFabrik
      </Typography>
    </Box>
  );
}
