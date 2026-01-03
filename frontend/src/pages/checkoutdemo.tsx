import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, Alert, TextField, Dialog, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { useState, useRef } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import LoginModal from '../components/login/LoginModal';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';

const DEMO_BILD_URL = '/Bild1.png';
const API_URL = process.env.REACT_APP_API_URL;

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
  const [isSending, setIsSending] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const hasSentRef = useRef(false);
  const [kontaktName, setKontaktName] = useState('');
  const [kontaktEmail, setKontaktEmail] = useState('');
  const [kontaktTelefon, setKontaktTelefon] = useState('');
  const [kontaktNachricht, setKontaktNachricht] = useState('');
  const [kontaktSending, setKontaktSending] = useState(false);

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

  const generateGutscheinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleFakePayment = async () => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;

    const finalBetrag = selectedDienstleistung ? Number(selectedDienstleistung.price) : betrag || 0;
    setPurchasedBetrag(finalBetrag);
    setShowSuccessPage(true);
    setIsSending(true);

    try {
      const gutscheinCode = generateGutscheinCode();

      console.log('🎨 Erstelle Demo-Gutschein...');
      
      // Für die Demo: Einfaches PDF direkt erstellen (ohne DOM-Rendering)
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Bild laden
      let bildBase64 = '';
      try {
        const response = await fetch(DEMO_BILD_URL);
        const blob = await response.blob();
        bildBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (imgError) {
        console.warn('⚠️ Bild-Konvertierung fehlgeschlagen:', imgError);
      }

      // Bild im oberen Viertel (A4 = 210mm breit, 297mm hoch) - cover fit
      if (bildBase64) {
        // Bild wird abgeschnitten aber nicht gestreckt (wie CSS object-fit: cover)
        const img = new Image();
        img.src = bildBase64;
        await new Promise(resolve => { img.onload = resolve; });
        
        const imgRatio = img.width / img.height;
        const containerRatio = 210 / 74;
        
        let imgWidth, imgHeight, offsetX, offsetY;
        
        if (imgRatio > containerRatio) {
          // Bild ist breiter - Höhe passt, Breite wird abgeschnitten
          imgHeight = 74;
          imgWidth = 74 * imgRatio;
          offsetX = -(imgWidth - 210) / 2;
          offsetY = 0;
        } else {
          // Bild ist höher - Breite passt, Höhe wird abgeschnitten
          imgWidth = 210;
          imgHeight = 210 / imgRatio;
          offsetX = 0;
          offsetY = -(imgHeight - 74) / 2;
        }
        
        doc.addImage(bildBase64, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
      }

      // Text zentriert
      doc.setFontSize(32);
      doc.setTextColor(211, 47, 47); // Rot
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
      doc.text('Massage Studio Demo', 105, 200, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102);
      doc.text('www.massage-studio-demo.de', 105, 210, { align: 'center' });

      // PDF als Blob
      const pdfBlob = doc.output('blob');
      setPdfGenerated(true);

      // PDF zu Base64 konvertieren
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
        empfaengerEmail: customerEmail,
        unternehmensname: 'Massage Studio Demo',
        gutscheinCode,
        betrag: finalBetrag,
        dienstleistung: selectedDienstleistung,
        pdfBuffer: pdfBase64,
        isDemoMode: true
      };

      console.log('📧 Sende Demo-Email...');
      console.log('📦 Email-Daten:', {
        empfaengerEmail: customerEmail,
        unternehmensname: 'Massage Studio Demo',
        gutscheinCode,
        betrag: finalBetrag,
        pdfBufferLength: pdfBase64.length
      });
      
      const response = await fetch(`${API_URL}/api/gutscheine/demo/send-gutschein`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      console.log('📥 Response Status:', response.status);
      const responseData = await response.json();
      console.log('📥 Response Data:', responseData);

      if (response.ok) {
        setEmailSent(true);
        console.log('✅ Demo-Email erfolgreich versendet');

        // In Firebase speichern
        try {
          await addDoc(collection(db, 'demo-gutscheine'), {
            gutscheinCode,
            betrag: finalBetrag,
            empfaengerEmail: customerEmail,
            dienstleistung: selectedDienstleistung?.shortDesc || null,
            erstelltAm: new Date().toISOString(),
            unternehmensname: 'Massage Studio Demo',
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
      // Pop-up nach 1 Sekunde öffnen
      setTimeout(() => {
        setShowPopup(true);
      }, 1000);
    }
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

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
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
                  </Box>
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
                    sx={{ mb: 3 }}
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
                      '&:hover': { backgroundColor: '#1565c0', boxShadow: 4 },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                        color: '#666'
                      }
                    }}
                    onClick={handleFakePayment}
                    disabled={!customerEmail || isSending}
                  >
                    {isSending ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Wird verarbeitet...
                      </Box>
                    ) : (
                      `💳 Zahlung abschließen (${selectedDienstleistung ? selectedDienstleistung.price : betrag}€)`
                    )}
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
                Wir freuen uns auf Ihren Besuch!
              </Typography>

              {/* Status-Anzeigen mit fester Höhe gegen Wackeln */}
              <Box sx={{ minHeight: '70px', mb: 2 }}>
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
        <DialogContent sx={{ py: 5, px: 5, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#1a1a1a' }}>
            Jetzt durchstarten!
          </Typography>
          <Box sx={{ 
            backgroundColor: '#f0f7ff', 
            borderRadius: 2, 
            py: 2.5, 
            px: 3, 
            mb: 4,
            border: '2px solid #1976d2'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', lineHeight: 1.6, fontSize: '1.15rem' }}>
              Nur 3% Provision • Keine Fixkosten
            </Typography>
          </Box>

          {/* Zwei einfache Felder */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 4 }}>
            <TextField
              label="Ihre Kontaktmöglichkeit"
              value={kontaktEmail}
              onChange={(e) => setKontaktEmail(e.target.value)}
              fullWidth
              placeholder="E-Mail oder Telefonnummer"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Ihre Nachricht (optional)"
              value={kontaktNachricht}
              onChange={(e) => setKontaktNachricht(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Was möchten Sie uns mitteilen?"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 5, flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!kontaktEmail || kontaktSending}
            sx={{
              backgroundColor: '#1976d2',
              color: 'white',
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': { backgroundColor: '#1565c0' },
              '&:disabled': { backgroundColor: '#e0e0e0', color: '#999' }
            }}
            onClick={async () => {
              setKontaktSending(true);
              try {
                await addDoc(collection(db, 'kontaktanfragen'), {
                  kontakt: kontaktEmail,
                  nachricht: kontaktNachricht,
                  erstelltAm: new Date().toISOString(),
                  quelle: 'Demo-Checkout'
                });
                alert('✅ Vielen Dank! Wir melden uns in Kürze bei Ihnen.');
                setShowPopup(false);
                setKontaktEmail('');
                setKontaktNachricht('');
              } catch (error) {
                console.error('Fehler beim Senden:', error);
                alert('❌ Es gab einen Fehler. Bitte versuchen Sie es erneut.');
              } finally {
                setKontaktSending(false);
              }
            }}
          >
            {kontaktSending ? 'Wird gesendet...' : 'Kontaktanfrage senden'}
          </Button>
          <Button
            variant="text"
            sx={{ color: 'grey.500', textTransform: 'none', fontSize: '0.9rem' }}
            onClick={() => setShowPopup(false)}
          >
            Vielleicht später
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login Modal für Registrierung */}
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </Box>
  );
}
