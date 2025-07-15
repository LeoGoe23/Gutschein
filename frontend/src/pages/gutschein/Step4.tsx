import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useGutschein } from '../../context/GutscheinContext'; // Importiere den Kontext

export default function Zahlungsdaten() {
  const { data, setData } = useGutschein(); // Hole den Kontext
  const [ibanError, setIbanError] = useState(false); // Fehlerstatus für IBAN

  const handleInputChange = (field: string, value: string) => {
    if (field === 'iban') {
      const formattedIban = formatIban(value); // IBAN formatieren
      setData({ [field]: formattedIban }); // Aktualisiere den Kontext
    } else {
      setData({ [field]: value }); // Aktualisiere den Kontext
    }
  };

  const handleBlur = (field: string, value: string) => {
    if (field === 'iban') {
      const plainIban = value.replace(/\s+/g, ''); // Entferne Leerzeichen
      setIbanError(!validateIban(plainIban)); // Validierung prüfen
      setData({ [field]: plainIban }); // Speichere IBAN ohne Leerzeichen
    }
  };

  const formatIban = (iban: string) => {
    // Entferne alle Leerzeichen und füge nach 4 Zeichen ein Leerzeichen hinzu
    return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const validateIban = (iban: string) => {
    // Entferne Leerzeichen für die Validierung
    const plainIban = iban.replace(/\s+/g, '');

    // Prüfe, ob die IBAN 22 Zeichen lang ist und mit "DE" beginnt
    const isCorrectLength = plainIban.length === 22;
    const startsWithDE = plainIban.startsWith('DE');

    return isCorrectLength && startsWithDE;
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
        onBlur={(e) => handleBlur('iban', e.target.value)} // Validierung beim Verlassen des Feldes
        error={ibanError} // Fehlerstatus anzeigen
        helperText={ibanError ? 'Bitte geben Sie eine gültige IBAN ein.' : ''} // Fehlermeldung
      />

    </Box>
  );
}
