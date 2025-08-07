import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, Alert, TextField, Dialog, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo'; // <--- Hinzugefügt
import LoginModal from '../components/login/LoginModal';

const DEMO_BILD_URL = '/Bild1.png';

const DEMO_DLS = [
  { shortDesc: '30 Min. Massage', longDesc: 'Entspannende Teilkörpermassage', price: '39' },
  { shortDesc: '60 Min. Massage', longDesc: 'Ganzkörpermassage', price: '69' },
  { shortDesc: '90 Min. Massage', longDesc: 'Intensive Wellnessmassage', price: '99' },
];

export default function GutscheinDemoPage() {
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<typeof DEMO_DLS[0] | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [showPopup, setShowPopup] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleWeiter = () => {
    if (gutscheinType === 'wert' && (!betrag || betrag <= 0)) {
      alert('Bitte Betrag eingeben');
      return;
    }
    if (gutscheinType === 'dienstleistung' && !selectedDienstleistung) {
      alert('Bitte Dienstleistung wählen');
      return;
    }
    setShowPaymentForm(true);
  };

  const handleFakePayment = () => {
    setPurchasedBetrag(selectedDienstleistung ? Number(selectedDienstleistung.price) : betrag || 0);
    setShowSuccessPage(true);
    
    // Pop-up nach 1 Sekunde öffnen
    setTimeout(() => {
      setShowPopup(true);
    }, 1000);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <TopLeftLogo /> {/* <--- Hinzugefügt */}
      {/* Linke Seite */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 4, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: '450px', width: '100%', textAlign: { xs: 'center', md: 'left' }, mt: { xs: 8, md: 6 } }}>
          {!showSuccessPage ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#45a049' }
                  }}
                  onClick={() => window.open('https://calendly.com/gutscheinfabrik/15-minute-meeting', '_blank')}
                >
                  Sind 15min Ihrer Zeit 60€ wert?
                </Button>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 1, color: 'grey.600' }}>
                Gutschein für
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, color: 'grey.800' }}>
                Massage Studio Demo
              </Typography>
              <Typography variant="body1" sx={{ color: 'grey.700', mb: 4 }}>
                Wählen Sie zwischen Wertgutschein oder einer Massage-Dienstleistung.
              </Typography>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  value={gutscheinType}
                  exclusive
                  onChange={(_, v) => { if (v) { setGutscheinType(v); setBetrag(null); setSelectedDienstleistung(null); } }}
                  sx={{
                    mb: 2,
                    '& .MuiToggleButton-root': {
                      borderRadius: '8px',
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                    }
                  }}
                >
                  <ToggleButton value="wert">Wertgutschein</ToggleButton>
                  <ToggleButton value="dienstleistung">Dienstleistung</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {!showPaymentForm && (
                <Box sx={{ minHeight: '200px', mb: 4 }}>
                  {gutscheinType === 'wert' && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                        Welchen Betrag möchten Sie schenken?
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center' }}>
                        <input
                          type="number"
                          placeholder="Betrag eingeben"
                          value={betrag || ''}
                          onChange={e => { setBetrag(Number(e.target.value)); setSelectedDienstleistung(null); }}
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #ccc',
                            width: '250px',
                            fontSize: '1.1rem',
                            marginRight: '0.5rem',
                          }}
                        />
                        <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 600 }}>€</Typography>
                      </Box>
                    </Box>
                  )}

                  {gutscheinType === 'dienstleistung' && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                        Welche Dienstleistung möchten Sie verschenken?
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {DEMO_DLS.map((dl, idx) => (
                          <Button
                            key={idx}
                            variant={selectedDienstleistung?.shortDesc === dl.shortDesc ? "contained" : "outlined"}
                            onClick={() => { setSelectedDienstleistung(dl); setBetrag(Number(dl.price)); }}
                            sx={{
                              borderRadius: 2,
                              px: 2,
                              py: 1.5,
                              textTransform: 'none',
                              textAlign: 'left',
                              justifyContent: 'space-between',
                              display: 'flex',
                              fontWeight: 600,
                            }}
                          >
                            <span>{dl.shortDesc}</span>
                            <span>{dl.price}€</span>
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 600 }}
                      onClick={handleWeiter}
                      disabled={
                        (gutscheinType === 'wert' && (!betrag || betrag <= 0)) ||
                        (gutscheinType === 'dienstleistung' && !selectedDienstleistung)
                      }
                    >
                      Jetzt zahlen
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{ 
                        borderRadius: 2, 
                        px: 4, 
                        py: 1.5, 
                        fontWeight: 600,
                        textTransform: 'none',
                        borderColor: '#666',
                        color: '#666',
                        '&:hover': { borderColor: '#333', color: '#333' }
                      }}
                      onClick={() => setLoginModalOpen(true)}
                    >
                      Jetzt registrieren
                    </Button>
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textAlign: 'center',
                      mt: 2,
                      color: 'grey.600',
                      fontStyle: 'italic'
                    }}
                  >
                    Schneller registrieren als dein Kaffee fertig ist.
                  </Typography>
                </Box>
              )}

              {showPaymentForm && (
                <Box sx={{ mt: 4 }}>
                  <TextField
                    label="E-Mail-Adresse"
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    required
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      backgroundColor: '#e0e0e0',
                      color: '#000',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 3,
                      '&:hover': { backgroundColor: '#bdbdbd' },
                      mt: 2,
                    }}
                    onClick={handleFakePayment}
                    disabled={!customerEmail}
                  >
                    Zahlung abschließen
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#4caf50' }}>
                Vielen Dank für Ihren Einkauf!
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, color: 'grey.700' }}>
                {selectedDienstleistung
                  ? `Ihr Gutschein für: ${selectedDienstleistung.shortDesc}`
                  : `Ihr Wertgutschein über ${purchasedBetrag}€`}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'grey.600' }}>
                Der Gutschein wurde erfolgreich an {customerEmail} gesendet (Demo).
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                Zahlung erfolgreich!
              </Alert>
            </Box>
          )}
        </Box>
      </Box>

      {/* Rechte Seite: Bild */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          position: 'relative',
          backgroundImage: `url(${DEMO_BILD_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#222',
          minHeight: { xs: '300px', md: 'auto' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
        }}
      />

      {/* Pop-up Dialog */}
      <Dialog
        open={showPopup}
        onClose={() => setShowPopup(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            p: 2
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#333' }}>
            🎉 Sie haben es schon so weit geschafft!
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.700', mb: 3, lineHeight: 1.6 }}>
            Registrieren Sie sich in unter 7 min und fangen Sie an, Geld im Schlaf zu verdienen!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              sx={{
                borderColor: '#2196f3',
                color: '#2196f3',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
              }}
              onClick={() => {
                setLoginModalOpen(true);
                setShowPopup(false);
              }}
            >
              Jetzt registrieren
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#45a049' }
              }}
              onClick={() => {
                window.open('https://calendly.com/gutscheinfabrik/15-minute-meeting', '_blank');
                setShowPopup(false);
              }}
            >
              Kurzgespräch vereinbaren
            </Button>
          </Box>
          <Button
            variant="text"
            sx={{ color: 'grey.600' }}
            onClick={() => setShowPopup(false)}
          >
            Später
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login Modal für Registrierung */}
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </Box>
  );
}
