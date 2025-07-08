import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export default function Zahlungsdaten() {
  const [payoutLimit, setPayoutLimit] = useState('');

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zahlungsdaten
      </Typography>

      <Typography sx={{ color: '#555', mb: '1rem' }}>
        Bitte hinterlegen Sie Ihre Bankverbindung für die Auszahlung der Gutscheinbeträge.
      </Typography>

      <TextField 
        label="Kontoinhaber" 
        variant="outlined" 
        required 
        fullWidth 
      />

      <TextField 
        label="IBAN" 
        variant="outlined" 
        required 
        fullWidth 
        placeholder="DE..."
      />

    </Box>
  );
}
