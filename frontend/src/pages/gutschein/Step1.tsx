import { Box, TextField, Typography, Button } from '@mui/material';
import { useState } from 'react';
import { useGutschein } from '../../context/GutscheinContext';

export default function Step1() {
  const { data, setData } = useGutschein();
  const [websiteError, setWebsiteError] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setData({ ...data, image: file });
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setData({ ...data, website: url });

    // Simple URL validation
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*$/;
    setWebsiteError(!urlPattern.test(url));
  };

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Persönliche Daten
      </Typography>

      <Typography sx={{ color: '#555', mb: '1rem' }}>
        Bitte füllen Sie die folgenden Angaben zu Ihrer Person/ Ihrem Unternehmen aus.
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
        label="Website-Link" 
        variant="outlined" 
        type="url" 
        required 
        fullWidth 
        value={data.website}
        onChange={handleWebsiteChange}
        error={websiteError}
        helperText={websiteError ? 'Bitte geben Sie eine gültige URL ein.' : ''}
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

      <Typography sx={{ color: '#555', mt: '1rem' }}>
        Unternehmensbild hochladen: (Für die Darstellung auf der Website)
      </Typography>
      <Button variant="contained" component="label">
        Bild auswählen
        <input 
          type="file" 
          accept="image/*" 
          hidden 
          onChange={handleImageUpload} 
        />
      </Button>

      {imagePreview && (
        <Box sx={{ mt: '1rem', textAlign: 'center' }}>
          <Typography sx={{ color: '#555', mb: '0.5rem' }}>Vorschau:</Typography>
          <img 
            src={imagePreview} 
            alt="Bildvorschau" 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} 
          />
        </Box>
      )}
    </Box>
  );
}
