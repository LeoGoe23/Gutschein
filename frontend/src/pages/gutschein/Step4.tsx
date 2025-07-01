import { Box, TextField, Typography, MenuItem } from '@mui/material';
import { useState } from 'react';

export default function Zahlungsdaten() {
  const [payoutLimit, setPayoutLimit] = useState('');
  const [payoutFrequency, setPayoutFrequency] = useState('');

  const frequencyOptions = [
    { label: 'Sofort bei jeder Bestellung', value: 'sofort' },
    { label: 'Wöchentlich', value: 'woche' },
    { label: 'Monatlich', value: 'monat' },
  ];

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

      <Typography sx={{ fontWeight: 500, mt: '1rem' }}>
        Auszahlungseinstellungen
      </Typography>

      <TextField 
        label="Mindestauszahlungsbetrag in €" 
        variant="outlined" 
        type="number" 
        value={payoutLimit}
        onChange={(e) => setPayoutLimit(e.target.value)}
        fullWidth 
        placeholder="z. B. 50"
      />

      <TextField
        select
        label="Auszahlungsintervall"
        value={payoutFrequency}
        onChange={(e) => setPayoutFrequency(e.target.value)}
        required
        fullWidth
      >
        {frequencyOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

    </Box>
  );
}
