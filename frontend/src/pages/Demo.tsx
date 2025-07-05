import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Modal,
} from '@mui/material';
import { useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';

export default function MassageVoucher() {
  const [selectedValue, setSelectedValue] = useState('90');
  const [step, setStep] = useState(1); // Schritt-Status (1 = Auswahl, 2 = Details, 3 = Zahlung)
  const [specialMessage, setSpecialMessage] = useState('');
  const [fromName, setFromName] = useState(''); // 'Von' Name
  const [forName, setForName] = useState(''); // 'Für' Name
  const [loading, setLoading] = useState(false); // Ladezustand für Download
  const [infoOpen, setInfoOpen] = useState(false); // Modal-Öffnung für Info
  const navigate = useNavigate(); // navigate Hook verwenden

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2); // Weiter zum nächsten Schritt (Details eingeben)
    } else if (step === 2) {
      setStep(3); // Weiter zur Zahlungsbestätigung
    }
  };

  const handleSpecialMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpecialMessage(event.target.value);
  };

  const handleFromNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFromName(event.target.value);
  };

  const handleForNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForName(event.target.value);
  };

  const handleDownload = () => {
    setLoading(true);
    // Simulieren des Download-Prozesses (hier könnte eine Funktion zum Herunterladen des Gutscheins stehen)
    setTimeout(() => {
      setLoading(false);
      // Optional: Hier könntest du den Download-Link auslösen
      // window.location.href = '/path/to/your/downloadable/voucher.pdf';
    }, 2000); // Beispiel: 2 Sekunden warten
  };

  const handleBuy = () => {
    // Navigiere zur Startseite
    navigate('/');
  };

  const handleInfoClick = () => {
    setInfoOpen(true); // Modal öffnen
  };

  const handleInfoClose = () => {
    setInfoOpen(false); // Modal schließen
  };

  return (
    <Box
      sx={{
        position: 'relative',
        paddingTop: '4rem',
        backgroundColor: '#fdfdfd',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Logo + Titel oben links */}
      <Box
        sx={{
          position: 'absolute',
          top: '2rem',
          left: '3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <img
          src="/demologo.png"
          alt="Demo Logo"
          style={{ width: '40px', height: '40px', borderRadius: '0.5rem' }}
        />
        <Typography fontWeight="bold" fontSize="1.1rem" color="#333">
          MassageSalon_Demo
        </Typography>
      </Box>

      {/* Info Button oben rechts */}
      <Box
        sx={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          zIndex: 2,
        }}
      >
        <IconButton
          onClick={handleInfoClick} // Modal öffnen
          sx={{
            backgroundColor: '#fff',
            borderRadius: '50%',
            boxShadow: 2,
            p: 1,
            color: '#0b3c4c',
            '&:hover': {
              backgroundColor: '#f4f4f4',
            },
          }}
        >
          <InfoIcon />
        </IconButton>
      </Box>

      {/* Modal für Info */}
      <Modal
        open={infoOpen}
        onClose={handleInfoClose}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
            Demo
          </Typography>

          <Typography variant="body1" sx={{ marginBottom: '1rem' }}>
            Dies ist eine Testseite, die zeigt, was Ihr Kunde letztendlich sehen wird.
          </Typography>

          <Button
            variant="contained"
            onClick={handleInfoClose}
            sx={{
              backgroundColor: '#4F46E5',
              fontSize: '1.1rem',
              padding: '1rem 2.2rem',
              borderRadius: '1rem',
              boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#4338CA',
                boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
              },
            }}
          >
            Schließen
          </Button>
        </Box>
      </Modal>

      {/* Hauptinhalt */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: '6rem', md: '8rem' },
          padding: '6rem 5% 4rem',
        }}
      >
        {/* Textbereich */}
        <Box
          sx={{
            maxWidth: '460px',
            flex: '1',
            textAlign: { xs: 'center', md: 'left' },
            marginTop: '-2rem',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {step === 1
              ? 'Welchen Gutschein möchten Sie kaufen?'
              : step === 2
              ? 'Besondere Nachricht (Optional)'
              : 'Zahlung erfolgreich!'}
          </Typography>

          {step === 1 ? (
            <>
              <FormControl sx={{ mt: 4, width: '100%' }}>
                <RadioGroup
                  value={selectedValue}
                  onChange={handleChange}
                  sx={{ gap: '1.5rem', alignItems: 'flex-start' }}
                >
                  {[
                    { label: '90 min Massage', price: '90€' },
                    { label: '60 min Massage', price: '70€' },
                    { label: '120 min Massage', price: '120€' },
                    { label: 'Massage für Zwei', price: '150€' },
                  ].map((item, index) => (
                    <FormControlLabel
                      key={index}
                      value={item.label}
                      control={<Radio sx={{ color: '#5548F2' }} />}
                      label={
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            maxWidth: '320px',
                          }}
                        >
                          <Typography>{item.label}</Typography>
                          <Typography
                            fontWeight={600}
                            sx={{
                              textAlign: 'right',
                              width: '90px',
                            }}
                          >
                            {item.price}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </>
          ) : step === 2 ? (
            <>
              <TextField
                label="Besondere Nachricht"
                variant="outlined"
                value={specialMessage}
                onChange={handleSpecialMessageChange}
                sx={{ width: '100%', mt: 2 }}
                multiline
                rows={4}
              />
              <TextField
                label="Von"
                variant="outlined"
                value={fromName}
                onChange={handleFromNameChange}
                sx={{ width: '100%', mt: 2 }}
              />
              <TextField
                label="Für"
                variant="outlined"
                value={forName}
                onChange={handleForNameChange}
                sx={{ width: '100%', mt: 2 }}
              />
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Ihr Gutschein ist jetzt bereit. Klicken Sie unten, um ihn herunterzuladen.
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Der Gutschein wird Ihnen ebenfalls per E-Mail zugeschickt.
              </Typography>
              <Button
                variant="contained"
                sx={{
                  mt: 5,
                  backgroundColor: '#5548F2',
                  padding: '0.6rem 2rem', // Größe des Buttons reduziert
                  fontSize: '1rem', // Schriftgröße angepasst
                  borderRadius: '0.8rem',
                  boxShadow: 3,
                  textTransform: 'none',
                  width: '100%',
                }}
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Gutschein herunterladen'}
              </Button>
            </>
          )}

          <Button
            variant="outlined" // Hier für den blauen Rand mit weißem Hintergrund
            sx={{
              mt: 5,
              padding: '0.9rem 4rem',
              fontSize: '1.1rem',
              borderRadius: '1rem',
              border: '2px solid #5548F2', // Blauer Rand
              color: '#5548F2', // Blauer Text
              backgroundColor: 'white', // Weißer Hintergrund
              boxShadow: 3,
              textTransform: 'none',
              width: '100%',
              '&:hover': {
                backgroundColor: '#f4f4f4', // Hover-Effekt
              },
            }}
            onClick={step === 1 || step === 2 ? handleNextStep : handleBuy}
          >
            {step === 1 || step === 2 ? 'Weiter' : 'Zurück zur Startseite'}
          </Button>
        </Box>

        {/* Bildbereich */}
        <Box
          sx={{
            width: { xs: '100%', md: '480px' },
            position: 'relative',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: 3,
          }}
        >
          <img
            src="/demologo.png"
            alt="Massage Illustration"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              backgroundColor: '#fff',
              color: '#444',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              borderRadius: '0.5rem',
              boxShadow: 2,
            }}
          >
            Beispielbild
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
