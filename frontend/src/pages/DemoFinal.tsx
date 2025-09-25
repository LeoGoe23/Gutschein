import { Box, Typography, Button, Alert, TextField, CircularProgress, Card, CardContent, InputAdornment } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams } from 'react-router-dom';
import { loadDemoDataBySlug, DemoCheckoutData } from '../utils/loadDemoData';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';

const API_URL = process.env.REACT_APP_API_URL;

// Fake Payment Component - sieht aus wie echte Zahlung
function DemoPaymentForm({ 
  betrag, 
  onPaymentSuccess, 
  customerEmail, 
  setCustomerEmail 
}: { 
  betrag: number | null; 
  onPaymentSuccess: (betrag: number, email: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDemoPayment = async () => {
    if (!customerEmail) {
      alert('Bitte E-Mail eingeben');
      return;
    }
    
    if (!betrag) {
      alert('Bitte Betrag auswählen');
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(betrag, customerEmail);
    }, 2500);
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Kleinerer Demo-Hinweis */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd'
        }}
      >
        ℹ️ Vorschau-Modus: Keine echte Zahlung erforderlich
      </Alert>
      
      <TextField
        label="E-Mail-Adresse"
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        required
        fullWidth
        sx={{ mb: 3 }}
      />

      {/* Vereinfachtes Payment Element */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Zahlungsmethode
        </Typography>
        <Box 
          sx={{
            padding: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fafafa',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            💳 Zahlungsformular wird geladen...
          </Typography>
        </Box>
      </Box>
      
      <Button
        variant="contained"
        size="large"
        sx={{
          borderRadius: 2,
          px: 4,
          py: 1.5,
          backgroundColor: '#1976d2',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 3,
          '&:hover': { 
            backgroundColor: '#1565c0',
            boxShadow: 4
          },
          mt: 2,
          width: '100%'
        }}
        onClick={handleDemoPayment}
        disabled={isProcessing || !customerEmail}
      >
        {isProcessing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} color="inherit" />
            Zahlung wird verarbeitet...
          </Box>
        ) : (
          `Jetzt kaufen (${betrag}€)`
        )}
      </Button>
    </Box>
  );
}

// Success Page für Demo
function DemoSuccessPage({ 
  purchasedBetrag, 
  selectedDienstleistung, 
  checkoutData, 
  customerEmail 
}: { 
  purchasedBetrag: number;
  selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } | null;
  checkoutData: DemoCheckoutData;
  customerEmail: string;
}) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  useEffect(() => {
    const sendDemoEmail = async () => {
      if (isSending || emailSent) {
        return;
      }

      if (!purchasedBetrag || !customerEmail || !checkoutData?.unternehmensname) {
        return;
      }
      
      setIsSending(true);
      
      try {
        const gutscheinCode = 'GS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const pdfBlob = await generateGutscheinPDF({
          unternehmen: checkoutData.unternehmensname,
          betrag: selectedDienstleistung ? '' : purchasedBetrag.toString(),
          gutscheinCode,
          ausstelltAm: new Date().toLocaleDateString(),
          website: checkoutData.website,
          bildURL: '',
          dienstleistung: selectedDienstleistung
            ? { shortDesc: selectedDienstleistung.shortDesc, longDesc: selectedDienstleistung.longDesc }
            : undefined,
          gutscheinDesignURL: checkoutData.gutscheinURL,
          designConfig: checkoutData.designConfig,
          isDemoMode: false
        });

        // 🔥 FIX: Korrekte ArrayBuffer zu Base64 Konvertierung
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        
        // Korrekte Methode für ArrayBuffer zu Base64
        function arrayBufferToBase64(buffer: ArrayBuffer): string {
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        }
        
        const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);

        console.log('🚀 Sende Demo-E-Mail...'); // Debug

        const response = await fetch(`${API_URL}/api/gutscheine/demo/send-gutschein`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empfaengerEmail: customerEmail,
            unternehmensname: checkoutData.unternehmensname,
            gutscheinCode,
            betrag: purchasedBetrag,
            dienstleistung: selectedDienstleistung,
            pdfBuffer: pdfBase64,
            isDemoMode: true
          }),
        });

        const responseData = await response.json(); // 🔥 Response lesen
        console.log('📧 Backend Response:', responseData); // Debug

        if (response.ok) {
          console.log('✅ E-Mail erfolgreich versendet');
          setEmailSent(true);
        } else {
          console.error('❌ Backend Fehler:', responseData);
          throw new Error(`HTTP ${response.status}: ${responseData.error || 'Unbekannter Fehler'}`);
        }
        
      } catch (error) {
        console.error('❌ Demo-E-Mail Fehler:', error);
        // 🔥 Bei Fehler NICHT als "sent" markieren, damit User es sieht
        alert('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
      } finally {
        setIsSending(false);
      }
    };

    if (purchasedBetrag && customerEmail && checkoutData?.unternehmensname) {
      sendDemoEmail();
    }
  }, [purchasedBetrag, customerEmail, checkoutData?.unternehmensname, isSending, emailSent]);

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#4caf50' }}>
        ✅ Vielen Dank!
      </Typography>
      <Typography variant="h6" sx={{ mb: 2, color: 'grey.700' }}>
        {selectedDienstleistung 
          ? `Ihr Gutschein für: ${selectedDienstleistung.shortDesc}` 
          : `Ihr Wertgutschein über ${purchasedBetrag} €`}
      </Typography>
      
      {isSending && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <span>Gutschein wird erstellt und per E-Mail versendet...</span>
          </Box>
        </Alert>
      )}
      
      {emailSent && !isSending && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Gutschein wurde erfolgreich an {customerEmail} gesendet!
        </Alert>
      )}
      
      {/* Kleinerer Hinweis */}
      <Alert severity="info" sx={{ mt: 3, backgroundColor: '#f5f5f5' }}>
        Dies war eine Vorschau Ihres Gutschein-Systems.
      </Alert>
    </Box>
  );
}

// Hauptkomponente
export default function DemoFinalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [checkoutData, setCheckoutData] = useState<DemoCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // UI States
  const [betrag, setBetrag] = useState<number | null>(null);
  const [customBetrag, setCustomBetrag] = useState<string>('');
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Demo-Daten laden
  useEffect(() => {
    const loadData = async () => {
      if (!slug) {
        setError('Kein Demo-Slug gefunden');
        setLoading(false);
        return;
      }

      try {
        const data = await loadDemoDataBySlug(slug);
        if (data) {
          setCheckoutData(data);
          
          // 🔥 FIX: Standard-Werte setzen - BETRAG hat Priorität
          if (data.customValue) {
            setGutscheinType('wert'); // 🔥 Betrag als Standard
          } else if (data.dienstleistungen.length > 0) {
            setGutscheinType('dienstleistung'); // Nur wenn kein Betrag verfügbar
          }
        } else {
          setError('Demo nicht gefunden oder abgelaufen');
        }
      } catch (err) {
        console.error('Fehler beim Laden der Demo-Daten:', err);
        setError('Fehler beim Laden der Demo-Daten');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  const handlePaymentSuccess = (betrag: number, email: string) => {
    setPurchasedBetrag(betrag);
    setCustomerEmail(email);
    setShowPaymentForm(false);
    setShowSuccessPage(true);
  };

  const handleWeiterClick = () => {
    if (gutscheinType === 'wert') {
      const betragValue = customBetrag ? parseFloat(customBetrag) : null;
      if (!betragValue || betragValue <= 0) {
        alert('Bitte geben Sie einen gültigen Betrag ein');
        return;
      }
      setBetrag(betragValue);
      setSelectedDienstleistung(null);
    } else if (gutscheinType === 'dienstleistung' && selectedDienstleistung) {
      setBetrag(parseFloat(selectedDienstleistung.price));
    } else {
      alert('Bitte wählen Sie eine Dienstleistung aus');
      return;
    }
    
    setShowPaymentForm(true);
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error State
  if (error || !checkoutData) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 4
      }}>
        <Card sx={{ maxWidth: 500 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Demo nicht verfügbar
            </Typography>
            <Typography variant="body1">
              {error || 'Die angeforderte Demo konnte nicht gefunden werden.'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Prüfe verfügbare Optionen
  const hasWertGutschein = checkoutData.customValue;
  const hasDienstleistungGutschein = checkoutData.dienstleistungen.length > 0;

  if (!hasWertGutschein && !hasDienstleistungGutschein) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 4
      }}>
        <Card sx={{ maxWidth: 500 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="warning.main" gutterBottom>
              Keine Gutscheine verfügbar
            </Typography>
            <Typography variant="body1">
              Für diese Demo sind noch keine Gutscheine konfiguriert.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <TopLeftLogo />

      {/* Demo-Banner entfernt */}

      {/* Hauptinhalt */}
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 4, md: 8 },
        pt: { xs: 6, md: 8 }, // Weniger Platz oben
        minHeight: '100vh'
      }}>
        <Box sx={{ width: '100%', maxWidth: 500 }}>
          {showSuccessPage ? (
            <DemoSuccessPage
              purchasedBetrag={purchasedBetrag} 
              selectedDienstleistung={selectedDienstleistung}
              checkoutData={checkoutData}
              customerEmail={customerEmail}
            />
          ) : showPaymentForm ? (
            <DemoPaymentForm
              betrag={betrag}
              onPaymentSuccess={handlePaymentSuccess}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
            />
          ) : (
            <>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'grey.800' }}>
                {checkoutData.unternehmensname}
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'grey.600' }}>
                Wählen Sie Ihren Gutschein
              </Typography>

              {/* Gutschein-Type Auswahl */}
              {hasWertGutschein && hasDienstleistungGutschein && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Was möchten Sie verschenken?</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={gutscheinType === 'wert' ? 'contained' : 'outlined'}
                      onClick={() => setGutscheinType('wert')}
                      sx={{ flex: 1 }}
                    >
                      Wertgutschein
                    </Button>
                    <Button
                      variant={gutscheinType === 'dienstleistung' ? 'contained' : 'outlined'}
                      onClick={() => setGutscheinType('dienstleistung')}
                      sx={{ flex: 1 }}
                    >
                      Dienstleistung
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Wertgutschein */}
              {gutscheinType === 'wert' && hasWertGutschein && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Betrag wählen</Typography>
                  <TextField
                    label="Gewünschter Betrag"
                    type="number"
                    value={customBetrag}
                    onChange={(e) => setCustomBetrag(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">€</InputAdornment> // ✅ FIX: InputAdornment verwenden
                    }}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </Box>
              )}

              {/* Dienstleistungen */}
              {gutscheinType === 'dienstleistung' && hasDienstleistungGutschein && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Dienstleistung wählen</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {checkoutData.dienstleistungen.map(
                      (
                        service: { shortDesc: string; longDesc: string; price: string },
                        index: number
                      ) => (
                      <Card 
                        key={index}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedDienstleistung?.shortDesc === service.shortDesc ? '2px solid #1976d2' : '1px solid #ddd',
                          '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => setSelectedDienstleistung(service)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6">{service.shortDesc}</Typography>
                              {service.longDesc && service.longDesc !== service.shortDesc && (
                                <Typography variant="body2" color="text.secondary">
                                  {service.longDesc}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="h6" color="primary">
                              {service.price}€
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Weiter Button - weniger Demo-Hinweis */}
              <Button
                variant="contained"
                size="large"
                onClick={handleWeiterClick}
                disabled={
                  (gutscheinType === 'wert' && (!customBetrag || parseFloat(customBetrag) <= 0)) ||
                  (gutscheinType === 'dienstleistung' && !selectedDienstleistung)
                }
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 3,
                  width: '100%'
                }}
              >
                Weiter zur Bestellung
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Hintergrundbild bleibt gleich */}
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        position: { xs: 'relative', md: 'fixed' },
        right: { md: 0 },
        top: { md: 0 },
        height: { xs: '300px', md: '100vh' },
        backgroundImage: checkoutData?.bildURL ? `url(${checkoutData.bildURL})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#222',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        zIndex: 1,
      }}>
        {!checkoutData?.bildURL && (
          <Typography variant="h4" sx={{ color: 'white', textAlign: 'center' }}>
            {checkoutData?.unternehmensname}
          </Typography>
        )}
      </Box>
    </Box>
  );
}