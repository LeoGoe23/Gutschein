import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, TextField } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams, useLocation } from 'react-router-dom';
import { loadCheckoutDataBySlug, CheckoutData } from '../utils/loadCheckoutData';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';
import { saveSoldGutscheinToShop, updateUserEinnahmenStats } from '../utils/saveSoldGutscheinToShop';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { saveAdminStats, saveAdminHit } from '../utils/saveAdminStats';

const API_URL = process.env.REACT_APP_API_URL;

function PaymentForm({ betrag, onPaymentSuccess, stripeAccountId, provision }: { betrag: number | null; onPaymentSuccess: (betrag: number, email: string) => void, stripeAccountId: string, provision: number }) {
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const handlePayment = async () => {
    console.log('DEBUG Payment:', {
      betrag,
      customerEmail,
      stripeAccountId
    });

    if (!betrag || !customerEmail) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // Immer Stripe verwenden
    try {
      const slug = window.location.pathname.split('/').pop();

      const response = await fetch(`${API_URL}/api/zahlung/create-stripe-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betrag * 100,
          customerEmail,
          stripeAccountId,
          slug,
          provision
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert('Zahlung fehlgeschlagen: ' + (data?.error || 'Unbekannter Fehler'));
        return;
      }
      const stripe = (window as any).Stripe?.(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
      if (stripe && data.paymentUrl) {
        stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        window.open(data.paymentUrl, '_blank');
      }
    } catch (err: any) {
      alert('Stripe-Zahlung fehlgeschlagen: ' + (err?.message || 'Netzwerkfehler'));
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <TextField
        label="E-Mail-Adresse"
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
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
        onClick={handlePayment}
      >
        Zahlung abschließen
      </Button>
    </Box>
  );
}

function SuccessPage({ 
  purchasedBetrag, 
  selectedDienstleistung, 
  checkoutData,
  customerEmail
}: { 
  purchasedBetrag: number, 
  selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } | null,
  checkoutData: CheckoutData,
  customerEmail: string
}) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const hasSentRef = useRef(false);

  // NEU: Session-ID aus URL holen
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  const sentKey = `gutschein_sent_${sessionId}`;

  const generateGutscheinCode = () => {
    return 'GS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  useEffect(() => {
    // Prüfe, ob für diese Session schon ein Gutschein verschickt wurde
    if (!sessionId || localStorage.getItem(sentKey)) return; // <--- Hier wird abgebrochen, wenn schon verschickt
    if (hasSentRef.current) return;
    hasSentRef.current = true;

    const sendGutscheinEmail = async () => {
      setIsSending(true);
      try {
        const gutscheinCode = generateGutscheinCode();
        // PDF generieren
        const pdfBlob = await generateGutscheinPDF({
          unternehmen: checkoutData.unternehmensname,
          betrag: selectedDienstleistung ? '' : purchasedBetrag.toString(), // <--- Betrag nur bei Wertgutschein!
          gutscheinCode,
          ausstelltAm: new Date().toLocaleDateString(),
          website: checkoutData.website,
          bildURL: checkoutData.bildURL,
          dienstleistung: selectedDienstleistung
            ? {
                shortDesc: selectedDienstleistung.shortDesc,
                longDesc: selectedDienstleistung.longDesc,
              }
            : undefined,
        });

        // PDF als Base64
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        
        // PDF als Base64 (sicher, ohne Stack Overflow)
        function arrayBufferToBase64(buffer: ArrayBuffer) {
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        }
        const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

        const emailData = {
          empfaengerEmail: customerEmail,
          unternehmensname: checkoutData.unternehmensname,
          gutscheinCode,
          betrag: purchasedBetrag,
          dienstleistung: selectedDienstleistung,
          pdfBuffer: pdfBase64,
          stripeSessionId: sessionId, // <--- NEU!
        };

        const response = await fetch(`${API_URL}/api/gutscheine/send-gutschein`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });

        if (response.ok) {
          setEmailSent(true);
          localStorage.setItem(sentKey, 'true');
          // Gutschein in Firebase speichern
          await saveSoldGutscheinToShop({
            gutscheinCode,
            betrag: purchasedBetrag,
            kaufdatum: new Date().toISOString(),
            empfaengerEmail: customerEmail,
            slug: checkoutData.slug,
            provision: checkoutData.Provision // <--- NEU: Provision wirklich mitschicken!
          });

          // Statistiken beim User updaten
          if (checkoutData.userId) {
            await updateUserEinnahmenStats({
              userId: checkoutData.userId,
              betrag: purchasedBetrag,
              dienstleistung: selectedDienstleistung?.shortDesc,
              isFreierBetrag: !selectedDienstleistung,
              provision: checkoutData.Provision // <-- Hinzugefügt
            });
          }

          // Nach Gutscheinverkauf:
          await saveAdminStats({
            adminId: 'globalAdmin',
            gutschein: {
              gutscheinCode,
              betrag: purchasedBetrag,
              kaufdatum: new Date().toISOString(),
              empfaengerEmail: customerEmail,
              dienstleistung: selectedDienstleistung?.shortDesc,
            }
          });
        } else {
          const errorData = await response.json();
          alert(`E-Mail-Versand fehlgeschlagen: ${errorData.error}`);
        }
      } catch (error: any) {
        alert(`Fehler beim E-Mail-Versand: ${error?.message || 'Unbekannter Fehler'}`);
      } finally {
        setIsSending(false);
      }
    };

    sendGutscheinEmail();
  }, [sessionId]);

  return (
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
        Wir freuen uns auf Ihren Besuch!
      </Typography>
      {isSending && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Gutschein wird verschickt...
        </Alert>
      )}
      {emailSent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Gutschein wurde erfolgreich an {customerEmail} gesendet!
        </Alert>
      )}
    </Box>
  );
}

// Hilfsfunktion für Hit-Tracking
const trackWebsiteHit = async (userId: string) => {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    'Einnahmen.gesamtHits': increment(1),
    [`Einnahmen.monatlich.${monat}.hits`]: increment(1),
  });
  await saveAdminHit('globalAdmin'); // <--- NEU: Admin-Hit speichern
};

export default function GutscheinLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');
  const [customerEmail, setCustomerEmail] = useState<string>(''); // <- Neue State
  const hitTrackedRef = useRef(false); // <--- NEU

  // Lade Daten basierend auf Slug
  useEffect(() => {
    const loadData = async () => {
      if (!slug) {
        setError('Kein Slug in der URL gefunden');
        setLoading(false);
        return;
      }

      try {
        const data = await loadCheckoutDataBySlug(slug);
        if (data) {
          setCheckoutData(data);
          // Nur Hit zählen, wenn KEIN Stripe-Redirect (success) vorliegt und noch nicht getrackt
          const params = new URLSearchParams(window.location.search);
          if (!params.get('success') && data.userId && !hitTrackedRef.current) {
            hitTrackedRef.current = true;
            trackWebsiteHit(data.userId);
          }
        } else {
          setError('Unternehmen nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden der Checkout-Daten:', err);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Prüfe Stripe-Redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      const sessionId = params.get('session_id');
      setShowSuccessPage(true);

      // Dienstleistung aus LocalStorage wiederherstellen
      const dienstleistungStr = localStorage.getItem('selectedDienstleistung');
      if (dienstleistungStr) {
        setSelectedDienstleistung(JSON.parse(dienstleistungStr));
        localStorage.removeItem('selectedDienstleistung');
      }

      // Lade die Stripe-Session-Daten vom Backend
      if (sessionId && checkoutData) {
        fetch(`${API_URL}/api/zahlung/stripe-session-info?session_id=${sessionId}&stripeAccountId=${checkoutData.StripeAccountId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.amount && data.customerEmail) {
              setPurchasedBetrag(data.amount / 100);
              setCustomerEmail(data.customerEmail);
            }
          });
      }
    }
  }, [location, checkoutData]);

  // Loading State
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Lade Gutschein-Daten...</Typography>
      </Box>
    );
  }

  // Error State
  if (error || !checkoutData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Alert severity="error">{error || 'Unternehmen nicht gefunden'}</Alert>
        <Typography>Bitte überprüfen Sie die URL</Typography>
      </Box>
    );
  }

  // Prüfe verfügbare Optionen
  const hasWertGutschein = checkoutData.customValue;
  const hasDienstleistungGutschein = checkoutData.dienstleistungen.length > 0;
  const hasBoth = hasWertGutschein && hasDienstleistungGutschein;

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

  const handleWeiterZurBestellung = () => {
    if (!betrag) {
      alert('Bitte wählen Sie einen Betrag oder eine Dienstleistung aus.');
      return;
    }
    // Dienstleistung im LocalStorage sichern
    if (selectedDienstleistung) {
      localStorage.setItem('selectedDienstleistung', JSON.stringify(selectedDienstleistung));
    } else {
      localStorage.removeItem('selectedDienstleistung');
    }
    setShowPaymentForm(true);
  };

  const handleDienstleistungSelect = (dienstleistung: { shortDesc: string; longDesc: string; price: string }) => {
    setBetrag(Number(dienstleistung.price));
    setSelectedDienstleistung(dienstleistung);
  };

  const handleToggleChange = (event: React.MouseEvent<HTMLElement>, newType: 'wert' | 'dienstleistung') => {
    if (newType) {
      setGutscheinType(newType);
      setBetrag(null);
      setSelectedDienstleistung(null);
    }
  };

  const handlePaymentSuccess = (betrag: number, email: string) => { // <- E-Mail-Parameter hinzufügen
    setPurchasedBetrag(betrag);
    setCustomerEmail(email); // <- E-Mail speichern
    setShowSuccessPage(true);
  };

  return (
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
            {!showSuccessPage ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 500, mb: 1, color: 'grey.600' }}>
                  Gutschein für
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, color: 'grey.800' }}>
                  {checkoutData.unternehmensname}
                </Typography>

                <Typography variant="body1" sx={{ color: 'grey.700', mb: 4, lineHeight: 1.6 }}>
                  {getBeschreibung()}
                </Typography>

                {/* Toggle für beide Optionen */}
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
                      <ToggleButton value="wert">Wertgutschein</ToggleButton>
                      <ToggleButton value="dienstleistung">Dienstleistung</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}

                {!showPaymentForm && (
                  <Box sx={{ minHeight: '200px', mb: 4 }}>
                    {/* Wertgutschein */}
                    {gutscheinType === 'wert' && hasWertGutschein && (
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                          Welchen Betrag möchten Sie schenken?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Betrag eingeben"
                            value={betrag || ''}
                            onChange={(e) => {
                              setBetrag(Number(e.target.value));
                              setSelectedDienstleistung(null);
                            }}
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

                    {/* Dienstleistungen */}
                    {((hasBoth && gutscheinType === 'dienstleistung') || (!hasWertGutschein && hasDienstleistungGutschein)) && (
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                          Welche Dienstleistung möchten Sie verschenken?
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {checkoutData.dienstleistungen.map((dienstleistung, index) => (
                            <Button
                              key={index}
                              variant={selectedDienstleistung?.shortDesc === dienstleistung.shortDesc ? "contained" : "outlined"}
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

                    {/* Hinweis, falls nichts verfügbar */}
                    {!hasWertGutschein && !hasDienstleistungGutschein && (
                      <Typography variant="body2" color="text.secondary">
                        Es sind aktuell keine Gutscheine verfügbar.
                      </Typography>
                    )}

                    {/* Weiter zur Bestellung Button */}
                    {!showPaymentForm && (
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="large"
                          sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 600 }}
                          onClick={handleWeiterZurBestellung}
                          disabled={
                            (gutscheinType === 'wert' && (!betrag || betrag <= 0)) ||
                            (gutscheinType === 'dienstleistung' && !selectedDienstleistung)
                          }
                        >
                          Jetzt zahlen
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {showPaymentForm && (
                  <PaymentForm
                    betrag={betrag}
                    onPaymentSuccess={handlePaymentSuccess}
                    stripeAccountId={checkoutData.StripeAccountId}
                    provision={checkoutData.Provision || 0.08} // <--- NEU
                  />
                )}
              </>
            ) : (
              purchasedBetrag > 0 && customerEmail ? (
                <SuccessPage 
                  purchasedBetrag={purchasedBetrag} 
                  selectedDienstleistung={selectedDienstleistung}
                  checkoutData={checkoutData}
                  customerEmail={customerEmail}
                />
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Zahlungsdaten werden geladen...</Typography>
                </Box>
              )
            )}
          </Box>
        </Box>

        {/* Hintergrundbild */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            position: 'relative',
            backgroundImage: checkoutData.bildURL ? `url(${checkoutData.bildURL})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#222',
            minHeight: checkoutData.bildURL ? { xs: '300px', md: 'auto' } : { xs: '0', md: 'auto' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
        >
        </Box>
      </Box>
  );
}
