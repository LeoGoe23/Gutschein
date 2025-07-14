import { Box, Typography, Button, IconButton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { storage } from '../auth/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import PayPalIcon from '@mui/icons-material/AccountBalanceWallet';
import { useGutschein } from '../context/GutscheinContext';

const stripePromise = loadStripe('your-publishable-key-here');

function PaymentOptions({ onSelect }: { onSelect: (method: string) => void }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
      <Button
        variant="outlined"
        startIcon={<CreditCardIcon />}
        onClick={() => onSelect('card')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textTransform: 'none',
          boxShadow: 1,
          flex: 1,
        }}
      >
        Kredit-/ Debit
      </Button>
      <Button
        variant="outlined"
        startIcon={<AppleIcon />}
        onClick={() => onSelect('apple_pay')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textTransform: 'none',
          boxShadow: 1,
          flex: 1,
        }}
      >
        Apple Pay
      </Button>
      <Button
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={() => onSelect('google_pay')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textTransform: 'none',
          boxShadow: 1,
          flex: 1,
        }}
      >
        Google Pay
      </Button>
      <Button
        variant="outlined"
        startIcon={<PayPalIcon />}
        onClick={() => onSelect('paypal')}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textTransform: 'none',
          boxShadow: 1,
          flex: 1,
        }}
      >
        PayPal
      </Button>
    </Box>
  );
}

function PaymentForm({ betrag }: { betrag: number | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!stripe || !elements || !betrag || !paymentMethod) {
      alert('Bitte wählen Sie eine Zahlungsmethode und geben Sie einen Betrag ein.');
      return;
    }

    const response = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: betrag * 100, paymentMethod }),
    });

    const { clientSecret } = await response.json();

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: 'http://localhost:3000/success',
      },
    });

    if (result.error) {
      alert(`Zahlung fehlgeschlagen: ${result.error.message}`);
    } else {
      alert('Zahlung erfolgreich!');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Wählen Sie Ihre Zahlungsmethode:
      </Typography>
      <PaymentOptions onSelect={setPaymentMethod} />
      {paymentMethod === 'card' && (
        <Box sx={{ border: '1px solid #ccc', borderRadius: '8px', p: 2, mb: 4, mt: 2 }}>
          <CardElement options={{ hidePostalCode: true }} />
        </Box>
      )}
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
        onClick={handlePayment}
      >
        Zahlung abschließen
      </Button>
    </Box>
  );
}

export default function GutscheinLandingPage() {
  const { data } = useGutschein();
  const [hintergrundBild, setHintergrundBild] = useState<string | null>(null);
  const [betrag, setBetrag] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');

  // Verwende Daten aus dem Kontext
  const kundenName = data.unternehmensname || data.name || "Ihr Unternehmen";
  
  // Prüfe ob sowohl Wert- als auch Dienstleistungsgutscheine verfügbar sind
  const hasWertGutschein = data.customValue; // Wertgutschein ist verfügbar wenn customValue aktiviert ist
  const hasDienstleistungGutschein = data.dienstleistungen && data.dienstleistungen.length > 0;
  const hasBoth = hasWertGutschein && hasDienstleistungGutschein;

  // Dynamische Beschreibung basierend auf verfügbaren Optionen
  const getBeschreibung = () => {
    if (hasBoth) {
      return gutscheinType === 'wert' 
        ? "Geben Sie einen beliebigen Betrag für Ihren Wertgutschein ein. Für alle Angebote möglich."
        : "Verschenken Sie eine spezifische Dienstleistung - der perfekte Gutschein für jeden Anlass.";
    } else if (hasWertGutschein) {
      return "Geben Sie einen beliebigen Betrag für Ihren Wertgutschein ein. Kann für alle Produkte und Dienstleistungen verwendet werden.";
    } else if (hasDienstleistungGutschein) {
      return "Verschenken Sie eine spezifische Dienstleistung - der perfekte Gutschein für jeden Anlass.";
    }
    return "Ihr Gutschein kann direkt nach dem Kauf per E-Mail versendet oder ausgedruckt werden.";
  };

  // Setze initial den verfügbaren Typ
  useEffect(() => {
    if (hasBoth) {
      // Wenn beide verfügbar sind, setze auf 'wert' als default
      setGutscheinType('wert');
    } else if (hasDienstleistungGutschein && !hasWertGutschein) {
      setGutscheinType('dienstleistung');
    } else if (hasWertGutschein && !hasDienstleistungGutschein) {
      setGutscheinType('wert');
    }
  }, [hasWertGutschein, hasDienstleistungGutschein, hasBoth]);

  // Verwende das hochgeladene Bild aus dem Kontext
  useEffect(() => {
    if (data.bild) {
      if (typeof data.bild === 'string') {
        setHintergrundBild(data.bild);
      } else {
        setHintergrundBild(URL.createObjectURL(data.bild));
      }
    } else {
      // Fallback zu Firebase Bild
      const loadStartImage = async () => {
        try {
          const imageRef = ref(storage, 'start.jpg');
          const imageUrl = await getDownloadURL(imageRef);
          setHintergrundBild(imageUrl);
        } catch (error) {
          console.error('Fehler beim Laden des Bildes:', error);
        }
      };
      loadStartImage();
    }
  }, [data.bild]);

  const handleWeiterZurBestellung = () => {
    if (!betrag) {
      alert('Bitte wählen Sie einen Betrag oder eine Dienstleistung aus.');
      return;
    }
    setShowPaymentForm(true);
  };

  const handleDienstleistungSelect = (dienstleistung: { shortDesc: string; longDesc: string; price: string }) => {
    setBetrag(Number(dienstleistung.price));
  };

  const handleToggleChange = (event: React.MouseEvent<HTMLElement>, newType: 'wert' | 'dienstleistung') => {
    if (newType) {
      setGutscheinType(newType);
      setBetrag(null); // Reset Betrag beim Wechsel
    }
  };

  console.log('=== GUTSCHEIN CONTEXT DATA ===');
  console.log('Unternehmensname:', data.unternehmensname);
  console.log('Name:', data.name);
  console.log('Art:', data.art);
  console.log('Beträge:', data.betraege);
  console.log('Dienstleistungen:', data.dienstleistungen);
  console.log('Bild:', data.bild);
  console.log('hasWertGutschein:', hasWertGutschein);
  console.log('hasDienstleistungGutschein:', hasDienstleistungGutschein);
  console.log('hasBoth:', hasBoth);
  console.log('currentType:', gutscheinType);
  console.log('=== END ===');

  return (
    <Elements stripe={stripePromise}>
      <Box sx={{ minHeight: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <TopLeftLogo />

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
          <Box sx={{ maxWidth: '450px', width: '100%', textAlign: { xs: 'center', md: 'left' }, mt: { xs: 12, md: 6 } }}>
            <Typography variant="h5" sx={{ fontWeight: 500, mb: 1, color: 'grey.600' }}>
              Gutschein für
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, color: 'grey.800' }}>
              {kundenName}
            </Typography>

            <Typography variant="body1" sx={{ color: 'grey.700', mb: 4, lineHeight: 1.6 }}>
              {getBeschreibung()}
            </Typography>

            {/* Toggle zwischen Wert- und Dienstleistungsgutschein falls beide verfügbar */}
            {hasBoth && (
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <ToggleButtonGroup
                  value={gutscheinType}
                  exclusive
                  onChange={handleToggleChange}
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
                  <ToggleButton value="wert">
                    Wertgutschein
                  </ToggleButton>
                  <ToggleButton value="dienstleistung">
                    Dienstleistung
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {!showPaymentForm && (
              <>
                {/* Container mit fester Höhe für beide Content-Typen */}
                <Box sx={{ minHeight: '200px', mb: 4 }}>
                  {gutscheinType === 'wert' && hasWertGutschein && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                        Welchen Betrag möchten Sie schenken?
                      </Typography>

                      {/* Freie Betragsangabe */}
                      <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center' }}>
                        <input
                          type="number"
                          placeholder="Betrag eingeben"
                          value={betrag || ''}
                          onChange={(e) => setBetrag(Number(e.target.value))}
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

                  {gutscheinType === 'dienstleistung' && hasDienstleistungGutschein && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                        Welche Dienstleistung möchten Sie verschenken?
                      </Typography>

                      {/* Zeige verfügbare Dienstleistungen */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {data.dienstleistungen.map((dienstleistung: { shortDesc: string; longDesc: string; price: string }, index: number) => (
                          <Button
                            key={index}
                            variant={betrag === Number(dienstleistung.price) ? "contained" : "outlined"}
                            onClick={() => handleDienstleistungSelect(dienstleistung)}
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
                            <span>{dienstleistung.shortDesc}</span>
                            <span>{dienstleistung.price}€</span>
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    backgroundColor: '#607D8B',
                    color: '#fff',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 3,
                    '&:hover': { backgroundColor: '#546E7A' },
                  }}
                  endIcon={<ArrowForwardIosIcon />}
                  onClick={handleWeiterZurBestellung}
                >
                  Weiter zur Bestellung
                </Button>
              </>
            )}

            {showPaymentForm && <PaymentForm betrag={betrag} />}
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            position: 'relative',
            backgroundImage: hintergrundBild ? `url(${hintergrundBild})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#222',
            minHeight: hintergrundBild ? { xs: '300px', md: 'auto' } : { xs: '0', md: 'auto' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
        >
        </Box>
      </Box>
    </Elements>
  );
}
