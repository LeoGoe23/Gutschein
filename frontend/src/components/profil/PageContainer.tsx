import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export default function PageContainer({ title, children }: Props) {
  return (
    <Box sx={{
      backgroundColor: '#F9FAFB',
      borderRadius: '12px',
      padding: '3rem',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      minHeight: 'calc(100vh - 4rem)', // Optional, damit Seitenhöhe konsistent wirkt
      display: 'flex',
      flexDirection: 'column',
      gap: '0rem',
      marginLeft: '2rem', // Weiter rechts
      marginTop: '0rem'   // Weiter unten
    }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>

      {children}
    </Box>
  );
}
