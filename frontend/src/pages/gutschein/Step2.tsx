import { Box, TextField, Typography, ToggleButton, ToggleButtonGroup, Button, Chip } from '@mui/material';
import { useState } from 'react';

export default function GutscheinDetails() {
  const [type, setType] = useState<'wert' | 'dienstleistung' | ''>('');
  const [valueInput, setValueInput] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [allowCustomValue, setAllowCustomValue] = useState(false);

  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [services, setServices] = useState<{ desc: string; price: string }[]>([]);

  const handleAddValue = () => {
    if (valueInput.trim()) {
      setValues([...values, valueInput.trim()]);
      setValueInput('');
    }
  };

  const handleAddService = () => {
    if (serviceDesc.trim() && servicePrice.trim()) {
      setServices([...services, { desc: serviceDesc.trim(), price: servicePrice.trim() }]);
      setServiceDesc('');
      setServicePrice('');
    }
  };

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutschein Details
      </Typography>

      <Typography sx={{ color: '#555', mb: '1rem' }}>
        Bitte legen Sie die Details für den Gutschein fest.
      </Typography>

      <TextField 
        label="Name des Gutscheins" 
        variant="outlined" 
        required 
        fullWidth 
        placeholder="z. B. Wellness-Gutschein, Abendessen, etc."
      />

      <Typography sx={{ mt: '0.5rem', fontWeight: 500 }}>
        Art des Gutscheins
      </Typography>

      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={(_, newType) => setType(newType)}
        sx={{ display: 'flex', gap: '1rem' }}
      >
        <ToggleButton value="wert" sx={{ flex: 1 }}>
          Wert-Gutschein
        </ToggleButton>
        <ToggleButton value="dienstleistung" sx={{ flex: 1 }}>
          Dienstleistung
        </ToggleButton>
      </ToggleButtonGroup>

      {type === 'wert' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Typography>
            Fügen Sie feste Gutscheinwerte hinzu:
          </Typography>

          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <TextField 
              label="Betrag in €" 
              variant="outlined" 
              type="number" 
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              fullWidth 
            />
            <Button variant="contained" onClick={handleAddValue}>
              Hinzufügen
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {values.map((val, index) => (
              <Chip 
                key={index} 
                label={`${val} €`} 
                onDelete={() => setValues(values.filter((_, i) => i !== index))} 
              />
            ))}
          </Box>

        </Box>
      )}

      {type === 'dienstleistung' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Typography>
            Fügen Sie mögliche Dienstleistungen hinzu:
          </Typography>

          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <TextField 
              label="Beschreibung" 
              variant="outlined" 
              value={serviceDesc}
              onChange={(e) => setServiceDesc(e.target.value)}
              fullWidth 
            />
            <TextField 
              label="Preis in €" 
              variant="outlined" 
              type="number"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              sx={{ width: '150px' }}
            />
            <Button variant="contained" onClick={handleAddService}>
              Hinzufügen
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {services.map((serv, index) => (
              <Chip 
                key={index} 
                label={`${serv.desc} – ${serv.price} €`} 
                onDelete={() => setServices(services.filter((_, i) => i !== index))} 
              />
            ))}
          </Box>

        </Box>
      )}

    </Box>
  );
}
