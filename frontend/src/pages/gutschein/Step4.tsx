import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useGutschein } from '../../context/GutscheinContext'; // Importiere den Kontext

export default function Zahlungsdaten() {
  const { data, setData } = useGutschein(); // Hole den Kontext
  const [payoutLimit, setPayoutLimit] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setData({ [field]: value }); // Aktualisiere den Kontext
  };

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
        value={data.kontoinhaber} // Wert aus dem Kontext
        onChange={(e) => handleInputChange('kontoinhaber', e.target.value)} // Kontext aktualisieren
      />

      <TextField 
        label="IBAN" 
        variant="outlined" 
        required 
        fullWidth 
        placeholder="DE..."
        value={data.iban} // Wert aus dem Kontext
        onChange={(e) => handleInputChange('iban', e.target.value)} // Kontext aktualisieren
      />

    </Box>
  );
}
