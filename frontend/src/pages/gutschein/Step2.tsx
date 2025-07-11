import { Box, TextField, Typography, Switch, Button, Paper } from '@mui/material';
import { useState } from 'react';
import { useGutschein } from '../../context/GutscheinContext';

interface Dienstleistung {
  shortDesc: string;
  longDesc: string;
  price: string;
}

export default function GutscheinDetails() {
  const { data, setData } = useGutschein();
  const [serviceShortDesc, setServiceShortDesc] = useState('');
  const [serviceLongDesc, setServiceLongDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const handleAddService = () => {
    if (serviceShortDesc.trim() && servicePrice.trim()) {
      const newService = {
        shortDesc: serviceShortDesc.trim(),
        longDesc: serviceLongDesc.trim(),
        price: servicePrice.trim(),
      };
      setData({
        ...data,
        dienstleistungen: [...data.dienstleistungen, newService],
      });
      setServiceShortDesc('');
      setServiceLongDesc('');
      setServicePrice('');
    }
  };

  const handleToggleFreeValue = (checked: boolean) => {
    setData({ ...data, customValue: checked });
  };

  const handleToggleServices = (checked: boolean) => {
    setData({ ...data, art: checked ? 'dienstleistung' : 'wert' });
  };

  const handleDeleteService = (index: number) => {
    const updatedServices = data.dienstleistungen.filter((_: any, i: number) => i !== index);
    setData({ ...data, dienstleistungen: updatedServices });
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
          checked={data.customValue}
          onChange={(e) => handleToggleFreeValue(e.target.checked)}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Typography sx={{ fontWeight: 500 }}>Feste Dienstleistungen</Typography>
        <Switch
          checked={data.art === 'dienstleistung'}
          onChange={(e) => handleToggleServices(e.target.checked)}
        />
      </Box>

      {data.art === 'dienstleistung' && (
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
            {data.dienstleistungen.map((serv: Dienstleistung, index: number) => (
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
                <Button variant="outlined" color="error" onClick={() => handleDeleteService(index)}>
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
