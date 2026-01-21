import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, TextField } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';

const API_URL = process.env.REACT_APP_API_URL;

interface DemoData {
  name: string;
  bildURL: string;
  customValue: boolean;
  dienstleistungen: Array<{
    shortDesc: string;
    longDesc: string;
    price: string;
  }>;
  slug: string;
}

// Demo Payment Form - mit echtem E-Mail-Versand
function DemoPaymentForm({ 
  betrag, 
  selectedDienstleistung,
  demoData,
  onPaymentComplete 
}: { 
  betrag: number | null; 
  selectedDienstleistung: { shortDesc: string; longDesc: string; price: string } | null;
  demoData: DemoData;
  onPaymentComplete: (email: string) => void;
}) {
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const handlePayment = async () => {
    if (!betrag || !customerEmail) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }
    onPaymentComplete(customerEmail);
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
        sx={{ mb: 3 }}
        placeholder="ihre@email.de"
      />
      
      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{
          borderRadius: 2,
          px: 4,
          py: 1.5,
          backgroundColor: '#1976d2',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 3,
          '&:hover': { backgroundColor: '#1565c0' },
        }}
        onClick={handlePayment}
        disabled={!customerEmail}
      >
        💳 Zahlung abschließen ({selectedDienstleistung ? selectedDienstleistung.price : betrag}€)
      </Button>
    </Box>
  );
}

// Demo Success Page - mit Status-Updates
function DemoSuccessPage({ 
  purchasedBetrag, 
  selectedDienstleistung, 
  customerEmail,
  isSending,
  pdfGenerated,
  emailSent
}: { 
  purchasedBetrag: number;
  selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } | null;
  customerEmail: string;
  isSending: boolean;
  pdfGenerated: boolean;
  emailSent: boolean;
}) {
  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#4caf50' }}>
        Vielen Dank!
      </Typography>
      <Typography variant="h6" sx={{ mb: 2, color: 'grey.700' }}>
        {selectedDienstleistung
          ? `Ihr Gutschein für: ${selectedDienstleistung.shortDesc}`
          : `Ihr Wertgutschein über ${purchasedBetrag}€`}
      </Typography>

      {/* Status-Anzeigen mit fester Höhe gegen Wackeln */}
      <Box sx={{ minHeight: '70px', mb: 2, mt: 4 }}>
        {isSending && !pdfGenerated && (
          <Alert severity="info">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <span>Gutschein wird erstellt...</span>
            </Box>
          </Alert>
        )}

        {isSending && pdfGenerated && !emailSent && (
          <Alert severity="success">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>✅ Gutschein erstellt! E-Mail wird versendet...</span>
              <CircularProgress size={16} />
            </Box>
          </Alert>
        )}

        {emailSent && (
          <Alert severity="success">
            ✅ Gutschein wurde erfolgreich an {customerEmail} gesendet!
          </Alert>
        )}

        {!emailSent && !isSending && (
          <Alert severity="success">
            Zahlung erfolgreich!
          </Alert>
        )}
      </Box>

      {/* Danke-Nachricht nach E-Mail-Versand */}
      {emailSent && (
        <Typography variant="body1" sx={{ color: 'grey.600', mt: 3, fontStyle: 'italic' }}>
          Vielen Dank fürs Ausprobieren unserer Demo! 🎉
        </Typography>
      )}
    </Box>
  );
}

export default function DemoCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');
  
  // Neue States für echten Versand
  const [customerEmail, setCustomerEmail] = useState('');
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const hasSentRef = useRef(false);

  // Lade Demo-Daten basierend auf Slug
  useEffect(() => {
    const loadDemoData = async () => {
      if (!slug) {
        setError('Kein Demo-Slug in der URL gefunden');
        setLoading(false);
        return;
      }

      try {
        const demosRef = collection(db, 'demos');
        const q = query(demosRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Demo nicht gefunden');
        } else {
          const demoDoc = querySnapshot.docs[0];
          setDemoData(demoDoc.data() as DemoData);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Demo-Daten:', err);
        setError('Fehler beim Laden der Demo');
      } finally {
        setLoading(false);
      }
    };

    loadDemoData();
  }, [slug]);

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
        <Typography>Lade Demo-Daten...</Typography>
      </Box>
    );
  }

  // Error State
  if (error || !demoData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Alert severity="error">{error || 'Demo nicht gefunden'}</Alert>
        <Typography>Bitte überprüfen Sie die URL</Typography>
      </Box>
    );
  }

  // Prüfe verfügbare Optionen
  const hasWertGutschein = demoData.customValue;
  const hasDienstleistungGutschein = demoData.dienstleistungen.length > 0;
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

  const handleWeiterZurBestellung = () => {
    if (!betrag) {
      alert('Bitte wählen Sie einen Betrag oder eine Dienstleistung aus.');
      return;
    }
    setShowPaymentForm(true);
  };

  // Gutschein-Code generieren
  const generateGutscheinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handlePaymentComplete = async (email: string) => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;

    setCustomerEmail(email);
    const finalBetrag = selectedDienstleistung ? Number(selectedDienstleistung.price) : betrag || 0;
    setPurchasedBetrag(finalBetrag);
    setShowSuccessPage(true);
    setIsSending(true);

    try {
      const gutscheinCode = generateGutscheinCode();
      console.log('🎨 Erstelle Demo-Gutschein...');
      
      // PDF erstellen
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Bild laden
      let bildBase64 = '';
      if (demoData?.bildURL) {
        try {
          const response = await fetch(demoData.bildURL);
          const blob = await response.blob();
          bildBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (imgError) {
          console.warn('⚠️ Bild-Konvertierung fehlgeschlagen:', imgError);
        }
      }

      // Bild im oberen Viertel mit cover fit
      if (bildBase64) {
        const img = new Image();
        img.src = bildBase64;
        await new Promise(resolve => { img.onload = resolve; });
        
        const imgRatio = img.width / img.height;
        const containerRatio = 210 / 74;
        
        let imgWidth, imgHeight, offsetX, offsetY;
        
        if (imgRatio > containerRatio) {
          imgHeight = 74;
          imgWidth = 74 * imgRatio;
          offsetX = -(imgWidth - 210) / 2;
          offsetY = 0;
        } else {
          imgWidth = 210;
          imgHeight = 210 / imgRatio;
          offsetX = 0;
          offsetY = -(imgHeight - 74) / 2;
        }
        
        doc.addImage(bildBase64, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
      }

      // Text zentriert
      doc.setFontSize(32);
      doc.setTextColor(211, 47, 47);
      doc.text('Geschenk Gutschein', 105, 100, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(51, 51, 51);
      doc.text('über', 105, 115, { align: 'center' });

      // Betrag
      doc.setFontSize(52);
      doc.setTextColor(0, 0, 0);
      const betragText = selectedDienstleistung 
        ? selectedDienstleistung.shortDesc 
        : `€ ${finalBetrag}`;
      doc.text(betragText, 105, 145, { align: 'center' });

      // Gutscheincode
      doc.setFontSize(20);
      doc.setFont('courier', 'bold');
      doc.text(gutscheinCode, 105, 170, { align: 'center' });

      // Linie
      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(1);
      doc.line(80, 180, 130, 180);

      // Unternehmen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(211, 47, 47);
      doc.text(demoData?.name || 'Demo', 105, 200, { align: 'center' });

      const pdfBlob = doc.output('blob');
      setPdfGenerated(true);

      // PDF zu Base64
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

      // E-Mail versenden
      const emailData = {
        empfaengerEmail: email,
        unternehmensname: demoData?.name || 'Demo',
        gutscheinCode,
        betrag: finalBetrag,
        dienstleistung: selectedDienstleistung,
        pdfBuffer: pdfBase64,
        isDemoMode: true
      };

      console.log('📧 Sende Demo-Email...');
      
      const response = await fetch(`${API_URL}/api/gutscheine/demo/send-gutschein`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const responseData = await response.json();
      console.log('📥 Response:', responseData);

      if (response.ok) {
        setEmailSent(true);
        console.log('✅ Demo-Email erfolgreich versendet');

        // In Firebase speichern
        try {
          await addDoc(collection(db, 'demo-gutscheine'), {
            gutscheinCode,
            betrag: finalBetrag,
            customerEmail: email,
            dienstleistung: selectedDienstleistung?.shortDesc || null,
            kaufdatum: new Date().toISOString(),
            unternehmensname: demoData?.name || 'Demo',
            slug: slug
          });
          console.log('✅ Demo-Gutschein in Firebase gespeichert');
        } catch (fbError) {
          console.error('❌ Firebase-Fehler:', fbError);
        }
      } else {
        console.error('❌ Email-Versand fehlgeschlagen:', responseData);
      }
    } catch (error) {
      console.error('❌ Fehler beim Demo-Checkout:', error);
    } finally {
      setIsSending(false);
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
                {demoData.name}
              </Typography>

              <Typography variant="body1" sx={{ color: 'grey.700', mb: 4, lineHeight: 1.6 }}>
                {getBeschreibung()}
              </Typography>

              {/* Toggle für beide Optionen - identisch zu checkoutc */}
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
                  {/* Wertgutschein - identisch zu checkoutc */}
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

                  {/* Dienstleistungen - identisch zu checkoutc */}
                  {((hasBoth && gutscheinType === 'dienstleistung') || (!hasWertGutschein && hasDienstleistungGutschein)) && (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>
                        Welche Dienstleistung möchten Sie verschenken?
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {demoData.dienstleistungen.map((dienstleistung, index) => (
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

                  {/* Weiter zur Bestellung Button - identisch zu checkoutc */}
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
                </Box>
              )}

              {/* Payment Form */}
              {showPaymentForm && (
                <DemoPaymentForm
                  betrag={betrag}
                  selectedDienstleistung={selectedDienstleistung}
                  demoData={demoData}
                  onPaymentComplete={handlePaymentComplete}
                />
              )}
            </>
          ) : (
            // Success Page mit Status-Updates
            <DemoSuccessPage 
              purchasedBetrag={purchasedBetrag} 
              selectedDienstleistung={selectedDienstleistung}
              customerEmail={customerEmail}
              isSending={isSending}
              pdfGenerated={pdfGenerated}
              emailSent={emailSent}
            />
          )}
        </Box>
      </Box>

      {/* Hintergrundbild */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          position: { xs: 'relative', md: 'fixed' },
          right: { md: 0 },
          top: { md: 0 },
          height: { xs: '300px', md: '100vh' },
          backgroundImage: demoData.bildURL ? `url(${demoData.bildURL})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#222',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          zIndex: 1,
        }}
      >
        {!demoData.bildURL && (
          <Typography variant="h4" color="white" textAlign="center">
            {demoData.name}
          </Typography>
        )}
      </Box>


    </Box>
  );
}