import { Box, TextField, Typography } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';

export default function Step1() {
  const { data, setData } = useGutschein();

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Persönliche Daten
      </Typography>

      <Typography sx={{ color: '#555', mb: '1rem' }}>
        Bitte füllen Sie die folgenden Angaben zu Ihrer Person aus.
      </Typography>

      <TextField 
        label="Vorname" 
        variant="outlined" 
        required 
        fullWidth 
        value={data.vorname}
        onChange={(e) => setData({ ...data, vorname: e.target.value })}
      />

      <TextField 
        label="Nachname" 
        variant="outlined" 
        required 
        fullWidth 
        value={data.nachname}
        onChange={(e) => setData({ ...data, nachname: e.target.value })}
      />

      <TextField 
        label="E-Mail-Adresse" 
        variant="outlined" 
        type="email" 
        required 
        fullWidth 
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
      />

      <TextField 
        label="Telefonnummer (optional)" 
        variant="outlined" 
        type="tel" 
        fullWidth 
        value={data.telefon}
        onChange={(e) => setData({ ...data, telefon: e.target.value })}
      />

      <TextField 
        label="Art des Geschäfts" 
        variant="outlined" 
        required 
        fullWidth 
        value={data.geschaeftsart}
        onChange={(e) => setData({ ...data, geschaeftsart: e.target.value })}
      />

    </Box>
  );
}
