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
import { uploadPDFToStorage, saveGutscheinLink } from '../utils/firebaseStorage';

const API_URL = process.env.REACT_APP_API_URL;

function PaymentForm({ betrag, onPaymentSuccess, stripeAccountId, provision }: { betrag: number | null; onPaymentSuccess: (betrag: number, email: string) => void, stripeAccountId: string, provision: number }) {
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  const handlePayment = async () => {
    if (!betrag || !customerEmail) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // ✅ FIX: Daten VORHER in localStorage speichern
    localStorage.setItem('purchasedBetrag', betrag.toString());
    localStorage.setItem('customerEmail', customerEmail);

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

      console.log('💳 Payment Mode:', data.testMode ? 'TEST' : 'LIVE');
      
      // ✅ FIX: Test-Mode SOFORT setzen, bevor Stripe Key gewählt wird
      const testMode = data.testMode;
      setIsTestMode(testMode);

      // Richtigen Stripe Key wählen
      const stripeKey = testMode 
        ? process.env.REACT_APP_STRIPE_TEST_KEY 
        : process.env.REACT_APP_STRIPE_PUBLIC_KEY;

      const stripe = (window as any).Stripe?.(stripeKey);
      if (stripe && data.paymentUrl) {
        console.log('🚀 Redirecting to Stripe Checkout...');
        stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        window.open(data.paymentUrl, '_blank');
      }
    } catch (err: any) {
      alert('Stripe-Zahlung fehlgeschlagen: ' + (err?.message || 'Netzwerkfehler'));
    }
  };

  // ✅ NEU: Test-Mode beim ersten Laden anzeigen
  useEffect(() => {
    // Backend Test-Mode Status laden
    const checkTestMode = async () => {
      try {
        const response = await fetch(`${API_URL}/api/zahlung/test-mode-status`);
        if (response.ok) {
          const data = await response.json();
          setIsTestMode(data.testMode);
        }
      } catch (err) {
        console.log('Test-Mode Status nicht verfügbar');
      }
    };
    checkTestMode();
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      {isTestMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          🧪 TEST-MODUS: Verwenden Sie Testkarte 4242 4242 4242 4242
        </Alert>
      )}
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
          backgroundColor: isTestMode ? '#ff9800' : '#1976d2',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 3,
          '&:hover': { backgroundColor: isTestMode ? '#f57c00' : '#1565c0' },
          mt: 2,
        }}
        onClick={handlePayment}
      >
        {isTestMode ? '🧪 Test-Zahlung' : 'Zahlung abschließen'}
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
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [pdfGenerated, setPdfGenerated] = useState(false); // NEU: PDF-Status separat tracken
  const hasSentRef = useRef(false);

  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  const sentKey = `gutschein_sent_${sessionId}`;

  useEffect(() => {
    if (!sessionId || localStorage.getItem(sentKey)) return;
    if (hasSentRef.current) return;
    if (!purchasedBetrag || !customerEmail) return;
    
    hasSentRef.current = true;

    const sendGutscheinEmail = async () => {
      setIsSending(true);
      
      try {
        const gutscheinCode = generateGutscheinCode();
        
        // 1️⃣ PDF SOFORT generieren und hochladen (passiert schnell)
        console.log('🎨 Generiere PDF...');
        const pdfBlob = await generateGutscheinPDF({
          unternehmen: checkoutData.unternehmensname,
          betrag: selectedDienstleistung ? '' : purchasedBetrag.toString(),
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
          gutscheinDesignURL: checkoutData.gutscheinURL,
          designConfig: checkoutData.designConfig
        });

        console.log('📤 Lade PDF zu Firebase hoch...');
        const fileName = `${checkoutData.slug}_${gutscheinCode}_${Date.now()}.pdf`;
        const downloadURL = await uploadPDFToStorage(pdfBlob, fileName);
        
        console.log('💾 Speichere Download-Link...');
        const linkId = await saveGutscheinLink({
          gutscheinCode,
          downloadURL,
          betrag: purchasedBetrag,
          empfaengerEmail: customerEmail,
          unternehmensname: checkoutData.unternehmensname,
          slug: checkoutData.slug,
          createdAt: new Date().toISOString(),
          dienstleistung: selectedDienstleistung?.shortDesc || undefined,
          stripeSessionId: sessionId || undefined
        });

        // 2️⃣ DOWNLOAD-LINK SOFORT BEREITSTELLEN (User kann schon downloaden!)
        const publicDownloadLink = `${API_URL}/api/gutscheine/download/${linkId}`;
        setDownloadLink(publicDownloadLink);
        setPdfGenerated(true);
        console.log('✅ PDF und Download-Link bereit!');

        // 3️⃣ E-Mail ASYNCHRON im Hintergrund versenden (dauert länger)
        console.log('📧 Verschicke E-Mail im Hintergrund...');
        
        // PDF als Base64 für E-Mail konvertieren (dauert am längsten)
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
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

        // E-Mail-Versand (läuft parallel, User wartet nicht darauf)
        const emailData = {
          empfaengerEmail: customerEmail,
          unternehmensname: checkoutData.unternehmensname,
          gutscheinCode,
          betrag: purchasedBetrag,
          dienstleistung: selectedDienstleistung,
          pdfBuffer: pdfBase64,
          stripeSessionId: sessionId,
          slug: checkoutData.slug,
          downloadLink: publicDownloadLink
        };

        // E-Mail senden - aber User Interface nicht blockieren
        fetch(`${API_URL}/api/gutscheine/send-gutschein`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        })
        .then(async (response) => {
          if (response.ok) {
            console.log('✅ E-Mail erfolgreich versendet');
            setEmailSent(true);
            localStorage.setItem(sentKey, 'true');
            
            // Firebase-Speicherungen im Hintergrund
            await saveSoldGutscheinToShop({
              gutscheinCode,
              betrag: purchasedBetrag,
              kaufdatum: new Date().toISOString(),
              empfaengerEmail: customerEmail,
              slug: checkoutData.slug,
              provision: checkoutData.Provision
            });

            if (checkoutData.userId) {
              await updateUserEinnahmenStats({
                userId: checkoutData.userId,
                betrag: purchasedBetrag,
                dienstleistung: selectedDienstleistung?.shortDesc,
                isFreierBetrag: !selectedDienstleistung,
                provision: checkoutData.Provision
              });
            }

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
            console.error('❌ E-Mail-Versand fehlgeschlagen:', errorData.error);
            // Fehler anzeigen, aber Download-Link bleibt verfügbar
            alert(`E-Mail-Versand fehlgeschlagen: ${errorData.error}\nIhr Gutschein ist trotzdem verfügbar und kann heruntergeladen werden.`);
          }
        })
        .catch((error) => {
          console.error('❌ E-Mail-Versand-Fehler:', error);
          alert(`E-Mail-Versand fehlgeschlagen: ${error?.message}\nIhr Gutschein ist trotzdem verfügbar und kann heruntergeladen werden.`);
        });

      } catch (error: any) {
        console.error('❌ Fehler bei PDF-Erstellung:', error);
        alert(`Fehler bei der Gutschein-Erstellung: ${error?.message || 'Unbekannter Fehler'}`);
      } finally {
        setIsSending(false);
      }
    };

    sendGutscheinEmail();
  }, [sessionId, purchasedBetrag, customerEmail]);

  const generateGutscheinCode = () => {
    return 'GS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Download-Handler
  const handleDownload = async () => {
    if (!downloadLink) return;
    
    try {
      const response = await fetch(downloadLink);
      const data = await response.json();
      
      if (data.success && data.downloadURL) {
        window.open(data.downloadURL, '_blank');
      } else {
        alert('Download-Link nicht verfügbar');
      }
    } catch (error) {
      console.error('Download-Fehler:', error);
      alert('Fehler beim Download');
    }
  };

  // ✅ FIX: Conditional Return NACH useEffect
  if (!purchasedBetrag || !customerEmail) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#4caf50' }}>
          Zahlung erfolgreich!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'grey.600' }}>
          Ihr Gutschein wird verarbeitet...
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

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
      
      {/* NEU: Verschiedene Status-Anzeigen */}
      {isSending && !pdfGenerated && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <span>Gutschein wird erstellt...</span>
          </Box>
        </Alert>
      )}

      {/* NEU: PDF fertig, aber E-Mail wird noch versendet */}
      {isSending && pdfGenerated && !emailSent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>✅ Gutschein erstellt! E-Mail wird versendet...</span>
            <CircularProgress size={16} />
          </Box>
        </Alert>
      )}
      
      {emailSent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Gutschein wurde erfolgreich an {customerEmail} gesendet!
        </Alert>
      )}
      
      {/* NEU: Download-Button erscheint SOFORT nach PDF-Erstellung */}
      {pdfGenerated && downloadLink && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {emailSent 
              ? "Sie können Ihren Gutschein auch direkt herunterladen:" 
              : "Ihr Gutschein ist bereit zum Download (E-Mail folgt):"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleDownload}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              backgroundColor: '#1976d2',
              boxShadow: 3,
              '&:hover': { 
                backgroundColor: '#1565c0',
                boxShadow: 4
              },
            }}
          >
            📄 Gutschein jetzt herunterladen
          </Button>
          
          {!emailSent && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Der Download ist sofort verfügbar, auch wenn die E-Mail noch versendet wird.
            </Typography>
          )}
        </Box>
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

      // ✅ FIX: Lade die Stripe-Session-Daten VOR dem Success-Page Rendering
      if (sessionId && checkoutData) {
        console.log('🔍 Loading session data for:', sessionId);
        
        fetch(`${API_URL}/api/zahlung/stripe-session-info?session_id=${sessionId}&stripeAccountId=${checkoutData.StripeAccountId}`)
          .then(res => {
            console.log('📡 Session API Response:', res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            console.log('💰 Session Data:', data);
            if (data && data.amount && data.customerEmail) {
              setPurchasedBetrag(data.amount / 100);
              setCustomerEmail(data.customerEmail);
            } else {
              console.error('❌ Invalid session data:', data);
            }
          })
          .catch(error => {
            console.error('❌ Session API Error:', error);
            // ✅ FALLBACK: Daten aus localStorage falls API fehlschlägt
            const fallbackBetrag = localStorage.getItem('purchasedBetrag');
            const fallbackEmail = localStorage.getItem('customerEmail');
            if (fallbackBetrag && fallbackEmail) {
              setPurchasedBetrag(Number(fallbackBetrag));
              setCustomerEmail(fallbackEmail);
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {checkoutData.dienstleistungen.map((dienstleistung, index) => (
                            <Button
                              key={index}
                              variant={selectedDienstleistung?.shortDesc === dienstleistung.shortDesc ? "contained" : "outlined"}
                              onClick={() => handleDienstleistungSelect(dienstleistung)}
                              sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 2,
                                textTransform: 'none',
                                textAlign: 'left',
                                justifyContent: 'space-between',
                                display: 'flex',
                                fontWeight: 600,
                                width: '100%',
                                minWidth: '220px',
                                boxShadow: selectedDienstleistung?.shortDesc === dienstleistung.shortDesc ? 4 : 1,
                                borderColor: '#bdbdbd',
                                backgroundColor: selectedDienstleistung?.shortDesc === dienstleistung.shortDesc ? '#e3f2fd' : '#fff',
                                color: '#222',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: '#f5f5f5',
                                  boxShadow: 3,
                                },
                              }}
                            >
                              <span>{dienstleistung.shortDesc}</span>
                              <span style={{ fontWeight: 700 }}>{dienstleistung.price}€</span>
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
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-start' } }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="large"
                          sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontWeight: 600,
                            boxShadow: 2,
                            textTransform: 'none',
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' },
                          }}
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
              // ✅ FIX: Success Page auch ohne vollständige Daten anzeigen
              <SuccessPage 
                purchasedBetrag={purchasedBetrag} 
                selectedDienstleistung={selectedDienstleistung}
                checkoutData={checkoutData}
                customerEmail={customerEmail}
              />
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
