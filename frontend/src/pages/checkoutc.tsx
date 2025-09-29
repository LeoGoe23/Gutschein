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
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentElement, setPaymentElement] = useState<any>(null);
  const [error, setError] = useState<string>(''); // ✅ NEU: Error State

  // ✅ VERBESSERTE Stripe-Initialisierung
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        console.log('🔄 Initialisiere Stripe...');
        console.log('🌍 Window.Stripe verfügbar:', !!(window as any).Stripe);
        
        // ✅ WARTEN bis Stripe geladen ist
        let attempts = 0;
        while (!(window as any).Stripe && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!(window as any).Stripe) {
          setError('Stripe JS konnte nicht geladen werden. Bitte Seite neu laden.');
          return;
        }

        // Test-Mode Status abrufen
        const response = await fetch(`${API_URL}/api/zahlung/test-mode-status`);
        console.log('📡 Test-Mode Request zu:', `${API_URL}/api/zahlung/test-mode-status`);
        console.log('📡 Response Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Test-Mode Response:', data);
          setIsTestMode(data.testMode);
          
          // Richtigen Stripe Key wählen
          const stripeKey = data.testMode 
            ? process.env.REACT_APP_STRIPE_TEST_KEY 
            : process.env.REACT_APP_STRIPE_PUBLIC_KEY;

          console.log('🔑 Stripe Key Status:', {
            testMode: data.testMode,
            keyExists: !!stripeKey,
            keyPrefix: stripeKey?.substring(0, 7)
          });

          if (!stripeKey) {
            setError(`Stripe Key fehlt für ${data.testMode ? 'Test' : 'Live'} Modus`);
            return;
          }

          // Stripe laden
          const stripeInstance = (window as any).Stripe(stripeKey);
          console.log('🎯 Stripe Instance:', stripeInstance ? 'Geladen' : 'Fehler!');
          setStripe(stripeInstance);
        } else {
          const errorText = await response.text();
          console.error('❌ Test-Mode Status Fehler:', response.status, errorText);
          setError(`Backend nicht erreichbar: ${response.status}`);
        }
      } catch (err) {
        console.error('❌ Fehler beim Initialisieren von Stripe:', err);
        setError(`Netzwerkfehler: ${err}`);
      }
    };

    initializeStripe();
  }, []);

  // ✅ DEBUG: Payment Intent erstellen
  useEffect(() => {
    if (!stripe || !betrag || !customerEmail) {
      console.log('⏳ Warte auf:', { 
        stripe: !!stripe, 
        betrag: !!betrag, 
        customerEmail: !!customerEmail 
      });
      return;
    }

    const createPaymentIntent = async () => {
      try {
        console.log('💳 Erstelle Payment Intent...');
        const slug = window.location.pathname.split('/').pop();

        // ✅ FIX: Amount Validation im Frontend
        if (!betrag || betrag <= 0) {
          console.error('❌ Ungültiger Betrag:', betrag);
          setError('Ungültiger Betrag');
          return;
        }

        const amountInCents = Math.round(betrag * 100);
        
        const requestData = {
          amount: amountInCents,
          customerEmail,
          stripeAccountId: isTestMode ? null : stripeAccountId,
          slug,
          provision
        };

        console.log('📤 Request Data:', {
          ...requestData,
          amountOriginal: betrag,
          amountInCents: amountInCents
        });

        const response = await fetch(`${API_URL}/api/zahlung/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        console.log('📥 Response Status:', response.status);

        const data = await response.json();
        console.log('📥 Response Data:', data);

        if (!response.ok) {
          console.error('❌ Payment Intent Fehler:', data.error);
          setError(`Payment Intent Fehler: ${data.error}`);
          return;
        }

        if (!data.clientSecret) {
          console.error('❌ Kein Client Secret erhalten');
          setError('Kein Client Secret erhalten');
          return;
        }

        setClientSecret(data.clientSecret);
        console.log('✅ Client Secret erhalten:', data.clientSecret.substring(0, 20) + '...');

        // ✅ FIX: Einfache Elements Konfiguration OHNE stripeAccount
        const elementsConfig = {
          clientSecret: data.clientSecret,
          appearance: {
            theme: 'stripe' as const,
            variables: { 
              colorPrimary: '#1976d2',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: '8px'
            }
          },
          loader: 'auto' as const
        };

        // ✅ WICHTIG: KEINE stripeAccount Config in Elements!
        // Das Client Secret ist bereits für den Connect Account erstellt
        console.log('🎯 Elements Config (ohne stripeAccount):', {
          hasClientSecret: !!elementsConfig.clientSecret,
          testMode: isTestMode
        });

        const elementsInstance = stripe.elements(elementsConfig);
        setElements(elementsInstance);

      } catch (err) {
        console.error('❌ Fehler beim Erstellen des Payment Intent:', err);
        setError(`Fehler: ${err}`);
      }
    };

    createPaymentIntent();
  }, [stripe, betrag, customerEmail, stripeAccountId, isTestMode]);

  // ✅ BESSER: Separater useEffect für Payment Element
  useEffect(() => {
    if (!elements || !clientSecret) return;
    
    const container = document.getElementById('payment-element');
    if (!container) return;
    
    console.log('🎯 Erstelle Payment Element...');
    
    // ✅ FIX: Entweder address sammeln ODER beim confirmPayment übergeben
    const paymentElementInstance = elements.create('payment', {
      layout: { 
        type: 'tabs',
        defaultCollapsed: false,
        radios: false,
        spacedAccordionItems: true
      },
      fields: {
        billingDetails: {
          name: 'auto',
          email: 'auto',
          address: 'auto' // ✅ ÄNDERN: 'auto' statt 'never'
        }
      },
      terms: {
        sepaDebit: 'always'
      },
      wallets: {
        applePay: 'never',
        googlePay: 'never'
      }
    });
    
    paymentElementInstance.mount('#payment-element');
    setPaymentElement(paymentElementInstance);
    
    console.log('✅ Payment Element gemountet');
    
    return () => {
      try {
        paymentElementInstance.unmount();
      } catch (e) {
        // Element bereits unmounted
      }
    };
  }, [elements, clientSecret]);

  // ✅ ALTERNATIVE: Billing Details manuell übergeben
  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      alert('Stripe ist noch nicht bereit. Bitte warten Sie einen Moment.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💳 Starte Payment Confirmation...');
      
      // ✅ FIX: Billing Details explizit übergeben wenn address: 'never'
      const confirmConfig = {
        elements,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: customerEmail,
          // ✅ HINZUFÜGEN: Billing Details wenn address: 'never'
          payment_method_data: {
            billing_details: {
              email: customerEmail,
              // Minimale Adresse für Stripe-Compliance
              address: {
                country: 'DE' // Deutschland als Standard
              }
            }
          }
        },
        redirect: 'if_required' as const
      };

      console.log('🔗 Payment Config:', {
        hasElements: !!confirmConfig.elements,
        returnUrl: confirmConfig.confirmParams.return_url,
        email: confirmConfig.confirmParams.receipt_email
      });
      
      const { error, paymentIntent } = await stripe.confirmPayment(confirmConfig);
      
      if (error) {
        console.error('❌ Payment Error:', error);
        setError(`Zahlung fehlgeschlagen: ${error.message}`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment successful:', paymentIntent.id);
        onPaymentSuccess(betrag!, customerEmail);
      } else {
        console.log('⏳ Payment Status:', paymentIntent?.status);
        if (paymentIntent?.status === 'processing') {
          onPaymentSuccess(betrag!, customerEmail);
        }
      }
    } catch (err: any) {
      console.error('❌ Payment Exception:', err);
      setError('Zahlung fehlgeschlagen: ' + (err?.message || 'Unbekannter Fehler'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* ✅ DEBUG: Error-Anzeige */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ✅ DEBUG: Loading-Anzeige */}
      {!stripe && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <span>Lade Stripe...</span>
          </Box>
        </Alert>
      )}

      {isTestMode && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2,
            backgroundColor: '#fff3e0',
            borderColor: '#ff9800',
            '& .MuiAlert-icon': { color: '#ff9800' }
          }}
        >
          🧪 <strong>TEST-MODUS</strong>: Verwenden Sie Testkarte <code>4242 4242 4242 4242</code>
        </Alert>
      )}
      
      <TextField
        label="E-Mail-Adresse"
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        required
        fullWidth
        sx={{ mb: 3 }}
      />

      {/* Stripe Payment Element Container */}
      {clientSecret && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Zahlungsmethode wählen
          </Typography>
          <Box 
            id="payment-element"
            sx={{
              padding: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fafafa',
              minHeight: '200px' // ✅ NEU: Mindesthöhe für bessere Sichtbarkeit
            }}
          />
        </Box>
      )}
      
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
          '&:hover': { 
            backgroundColor: isTestMode ? '#f57c00' : '#1565c0',
            boxShadow: 4
          },
          '&:disabled': {
            backgroundColor: '#ccc',
            color: '#666'
          },
          mt: 2,
          width: '100%'
        }}
        onClick={handlePayment}
        disabled={isProcessing || !clientSecret || !customerEmail || !!error}
      >
        {isProcessing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} color="inherit" />
            Zahlung wird verarbeitet...
          </Box>
        ) : (
          <>
            {isTestMode ? '🧪 Test-Zahlung durchführen' : '💳 Zahlung abschließen'}
            {betrag && ` (${betrag}€)`}
          </>
        )}
      </Button>
      
      {isTestMode && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 1, 
            color: '#ff9800',
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          Dies ist eine Test-Transaktion - kein echtes Geld wird abgebucht
        </Typography>
      )}
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
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const hasSentRef = useRef(false);

  // ✅ ÄNDERUNG: Keine sessionId mehr - verwende paymentIntentId oder Timestamp
  const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sentKey = `gutschein_sent_${paymentId}`;

  useEffect(() => {
    // ✅ ÄNDERUNG: Keine sessionId-Checks mehr
    if (localStorage.getItem(sentKey)) return;
    if (hasSentRef.current) return;
    if (!purchasedBetrag || !customerEmail) return;
    
    hasSentRef.current = true;

    const sendGutscheinEmail = async () => {
      setIsSending(true);
      
      try {
        const gutscheinCode = generateGutscheinCode();
        
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
          paymentIntentId: paymentId // ✅ ÄNDERUNG: paymentIntentId statt sessionId
        });

        const publicDownloadLink = `${API_URL}/api/gutscheine/download/${linkId}`;
        setDownloadLink(publicDownloadLink);
        setPdfGenerated(true);

        // E-Mail-Versand mit deiner Provision (bleibt gleich!)
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

        const emailData = {
          empfaengerEmail: customerEmail,
          unternehmensname: checkoutData.unternehmensname,
          gutscheinCode,
          betrag: purchasedBetrag,
          dienstleistung: selectedDienstleistung,
          pdfBuffer: pdfBase64,
          paymentIntentId: paymentId, // ✅ ÄNDERUNG: paymentIntentId statt stripeSessionId
          slug: checkoutData.slug,
          downloadLink: publicDownloadLink
        };

        // E-Mail senden (gleich wie vorher)
        fetch(`${API_URL}/api/gutscheine/send-gutschein`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        })
        .then(async (response) => {
          if (response.ok) {
            setEmailSent(true);
            localStorage.setItem(sentKey, 'true');
            
            // ✅ PROVISION: Deine bestehende Logik bleibt gleich!
            await saveSoldGutscheinToShop({
              gutscheinCode,
              betrag: purchasedBetrag,
              kaufdatum: new Date().toISOString(),
              empfaengerEmail: customerEmail,
              slug: checkoutData.slug,
              provision: checkoutData.Provision // ✅ Provision bleibt gleich
            });

            if (checkoutData.userId) {
              await updateUserEinnahmenStats({
                userId: checkoutData.userId,
                betrag: purchasedBetrag,
                dienstleistung: selectedDienstleistung?.shortDesc,
                isFreierBetrag: !selectedDienstleistung,
                provision: checkoutData.Provision // ✅ Provision bleibt gleich
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
          }
        });

      } catch (error: any) {
        console.error('❌ Fehler bei PDF-Erstellung:', error);
      } finally {
        setIsSending(false);
      }
    };

    sendGutscheinEmail();
  }, [purchasedBetrag, customerEmail]); // ✅ ÄNDERUNG: sessionId dependency entfernt

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
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const hitTrackedRef = useRef(false);

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

  // ✅ LÖSCHEN: Diesen kompletten useEffect entfernen!
  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);
  //   if (params.get('success') === 'true') {
  //     const sessionId = params.get('session_id');
  //     setShowSuccessPage(true);
  //     // ... ganze Logic weg
  //   }
  // }, [location, checkoutData]);

  // ✅ NEU: Einfacher Payment Success Handler
  const handlePaymentSuccess = (betrag: number, email: string) => {
    setPurchasedBetrag(betrag);
    setCustomerEmail(email);
    setShowSuccessPage(true);
    // Keine URL-Parameter oder Session-Handling mehr nötig!
  };

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
            position: { xs: 'relative', md: 'fixed' }, // Fixed on desktop, relative on mobile
            right: { md: 0 }, // Stick to right side on desktop
            top: { md: 0 }, // Start from top on desktop
            height: { xs: '300px', md: '100vh' }, // Full viewport height on desktop
            backgroundImage: checkoutData.bildURL ? `url(${checkoutData.bildURL})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#222',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            zIndex: 1, // Keep
          }}
        >
        </Box>
      </Box>
  );
}

// Falls Sie eine Funktion haben, die alle Gutscheinarten lädt:
const loadAllGutscheinarten = (gutscheinarten: any) => {
  const items = Object.keys(gutscheinarten).map(key => ({
    id: key,
    ...gutscheinarten[key],
    reihenfolge: gutscheinarten[key].reihenfolge || 0
  }));
  
  // Nach Reihenfolge sortieren
  items.sort((a, b) => a.reihenfolge - b.reihenfolge);
  
  return items;
};
