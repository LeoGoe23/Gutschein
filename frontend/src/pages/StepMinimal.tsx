import { Box, TextField, Typography, Button, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import TopBar from '../components/home/TopBar';
import LogoTopLeft from '../components/home/TopLeftLogo';

export default function StepMinimal() {
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    website: '',
  });

  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [services, setServices] = useState<{ desc: string; price: string }[]>([]);
  const [toggleMode, setToggleMode] = useState<'dienstleistung' | 'freierWert'>('dienstleistung');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = () => {
    if (serviceDesc.trim() && servicePrice.trim()) {
      setServices([...services, { desc: serviceDesc.trim(), price: servicePrice.trim() }]);
      setServiceDesc('');
      setServicePrice('');
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#f4f4f4',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header mit Logo und TopBar */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 'auto',
          padding: '1rem',
        }}
      >
        <LogoTopLeft />
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '0.5rem', md: '1.5rem' },
            right: { xs: '1rem', md: '4rem' },
            zIndex: 3,
          }}
        >
          <TopBar />
        </Box>
      </Box>

      {/* Hauptinhalt */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: '1.5rem',
          padding: '1rem',
          marginTop: '4rem', // Abstand zum Header wurde erhöht
        }}
      >
        {/* Linke Seite: Angaben */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Schnelle Angaben
          </Typography>

          <TextField
            label="Vorname"
            variant="outlined"
            required
            fullWidth
            value={formData.vorname}
            onChange={(e) => handleChange('vorname', e.target.value)}
          />

          <TextField
            label="Nachname"
            variant="outlined"
            required
            fullWidth
            value={formData.nachname}
            onChange={(e) => handleChange('nachname', e.target.value)}
          />

          <TextField
            label="E-Mail-Adresse"
            variant="outlined"
            type="email"
            required
            fullWidth
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />

          <TextField
            label="Telefonnummer (optional)"
            variant="outlined"
            type="tel"
            fullWidth
            value={formData.telefon}
            onChange={(e) => handleChange('telefon', e.target.value)}
          />

          <TextField
            label="Website"
            variant="outlined"
            required
            fullWidth
            placeholder="z. B. www.meineseite.de"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </Box>

        {/* Rechte Seite: Dienstleistungen hinzufügen */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Dienstleistungen hinzufügen
          </Typography>

          {/* Toggle zwischen Dienstleistungen und freier Wert */}
          <ToggleButtonGroup
            value={toggleMode}
            exclusive
            onChange={(_, newMode) => setToggleMode(newMode)}
            sx={{ display: 'flex', gap: '1rem' }}
          >
            <ToggleButton value="dienstleistung" sx={{ flex: 1 }}>
              Dienstleistungen eingeben
            </ToggleButton>
            <ToggleButton value="freierWert" sx={{ flex: 1 }}>
              Freier Wert
            </ToggleButton>
          </ToggleButtonGroup>

          {toggleMode === 'dienstleistung' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  sx={{ width: '120px' }}
                />
                <Button variant="contained" onClick={handleAddService}>
                  Hinzufügen
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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

          {toggleMode === 'freierWert' && (
            <Typography sx={{ color: '#555' }}>
              Der Kunde kann den Betrag selbst eingeben.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}