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
      width: '100%',
      boxSizing: 'border-box',
      padding: { xs: '1rem', sm: '1.25rem', md: '2rem' },
      boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      minHeight: { xs: 'auto', md: 'calc(100vh - 4rem)' }, // Optional, damit Seitenhöhe konsistent wirkt
      display: 'flex',
      flexDirection: 'column',
      gap: '0rem',
      marginLeft: 0,
      marginTop: 0,
    }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.45rem', md: '1.9rem' } }}>
        {title}
      </Typography>

      {children}
    </Box>
  );
}
