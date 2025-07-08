import { Box, TextField, Typography, Switch, Button, Chip, Paper } from '@mui/material';
import { useState } from 'react';

export default function GutscheinDetails() {
  const [enableFreeValue, setEnableFreeValue] = useState(false);
  const [enableServices, setEnableServices] = useState(false);
  const [serviceShortDesc, setServiceShortDesc] = useState('');
  const [serviceLongDesc, setServiceLongDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [services, setServices] = useState<{ shortDesc: string; longDesc: string; price: string }[]>([]);

  const handleAddService = () => {
    if (serviceShortDesc.trim() && servicePrice.trim()) {
      setServices([
        ...services,
        { shortDesc: serviceShortDesc.trim(), longDesc: serviceLongDesc.trim(), price: servicePrice.trim() },
      ]);
      setServiceShortDesc('');
      setServiceLongDesc('');
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Typography sx={{ fontWeight: 500 }}>Freie Wertangabe möglich</Typography>
        <Switch
          checked={enableFreeValue}
          onChange={(e) => setEnableFreeValue(e.target.checked)}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Typography sx={{ fontWeight: 500 }}>Feste Dienstleistungen</Typography>
        <Switch
          checked={enableServices}
          onChange={(e) => setEnableServices(e.target.checked)}
        />
      </Box>

      {enableServices && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Typography>
            Fügen Sie mögliche Dienstleistungen hinzu:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <TextField 
                label="Kurzbeschreibung" 
                variant="outlined" 
                value={serviceShortDesc}
                onChange={(e) => setServiceShortDesc(e.target.value)}
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
            </Box>
            <TextField 
              label="Längere Beschreibung (optional)" 
              variant="outlined" 
              value={serviceLongDesc}
              onChange={(e) => setServiceLongDesc(e.target.value)}
              fullWidth 
            />
            <Button variant="contained" onClick={handleAddService}>
              Hinzufügen
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {services.map((serv, index) => (
              <Paper key={index} sx={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography sx={{ fontWeight: 500 }}>
                  {serv.shortDesc} – {serv.price} €
                </Typography>
                {serv.longDesc && (
                  <Typography sx={{ color: '#555' }}>
                    {serv.longDesc}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outlined" onClick={() => alert(`Details: ${serv.longDesc}`)}>
                    Details anzeigen
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => setServices(services.filter((_, i) => i !== index))}>
                    Löschen
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

    </Box>
  );
}
