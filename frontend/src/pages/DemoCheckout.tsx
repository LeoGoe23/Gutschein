import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, TextField, Chip } from '@mui/material';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import { useState, useEffect, useRef } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';

const API_URL = ((globalThis as any).process?.env?.REACT_APP_API_URL as string | undefined) || '';

interface RabattCode {
  code: string;
  percent: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

interface AppliedRabatt {
  code: string;
  percent: number;
  rabattBetrag: number;
  finalBetrag: number;
}

interface DemoData {
  name: string;
  bildURL: string;
  customValue: boolean;
  rabattcodes?: RabattCode[];
  dienstleistungen: Array<{
    shortDesc: string;
    longDesc: string;
    price: string;
  }>;
  slug: string;
}

// Demo Payment Form - mit echtem E-Mail-Versand
function DemoPaymentForm({
  finalBetrag,
  selectedDienstleistung,
  onPaymentComplete,
  rabattCodeInput,
  setRabattCodeInput,
  aktiveRabattcodes,
  applyRabattCode,
  removeRabattCode,
  appliedRabatt,
  rabattMessage,
}: {
  finalBetrag: number | null;
  selectedDienstleistung: { shortDesc: string; longDesc: string; price: string } | null;
  onPaymentComplete: (email: string) => void;
  rabattCodeInput: string;
  setRabattCodeInput: (v: string) => void;
  aktiveRabattcodes: RabattCode[];
  applyRabattCode: () => void;
  removeRabattCode: () => void;
  appliedRabatt: AppliedRabatt | null;
  rabattMessage: string;
}) {
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const handlePayment = () => {
    if (!finalBetrag || !customerEmail) {
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

      {/* Rabattcode-Bereich jetzt hier */}
      {aktiveRabattcodes.length > 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2.75,
            border: '1px solid #cfe3ff',
            borderRadius: 3,
            background: 'linear-gradient(130deg, #f8fbff 0%, #eef5ff 60%, #f9fcff 100%)',
            boxShadow: '0 12px 28px rgba(25,118,210,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalOfferOutlined sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontWeight: 800 }}>
              Rabattcode einlösen
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {aktiveRabattcodes.slice(0, 4).map((code) => (
              <Button
                key={code.code}
                onClick={() => setRabattCodeInput(code.code)}
                variant="text"
                sx={{
                  minWidth: 0,
                  px: 1.5,
                  py: 0.5,
                  border: '1px solid #90caf9',
                  borderRadius: '16px',
                  backgroundColor: '#fff',
                  color: '#222',
                  fontWeight: 400,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#f5faff',
                    boxShadow: 'none',
                  },
                }}
              >
                {code.code}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Code"
              value={rabattCodeInput}
              onChange={(e) => setRabattCodeInput(e.target.value.toUpperCase())}
              size="small"
              placeholder="z.B. OPEN10"
              sx={{
                flex: '1 1 200px',
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={applyRabattCode}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 2,
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
              }}
            >
              Einlösen
            </Button>
            {appliedRabatt && (
              <Button variant="text" color="inherit" onClick={removeRabattCode} sx={{ textTransform: 'none' }}>
                Entfernen
              </Button>
            )}
          </Box>
          {rabattMessage && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: appliedRabatt ? 'success.main' : 'text.secondary', fontWeight: 700 }}>
              {rabattMessage}
            </Typography>
          )}

          {appliedRabatt && finalBetrag && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.25,
                borderRadius: 2,
                backgroundColor: '#fff',
                border: '1px solid #cfe3ff',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                  {(appliedRabatt.finalBetrag + appliedRabatt.rabattBetrag).toFixed(2)}€
                </Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 800, lineHeight: 1 }}>
                  {appliedRabatt.finalBetrag.toFixed(2)}€
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

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
        💳 Zahlung abschließen ({(finalBetrag ?? 0).toFixed(2)}€)
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
  emailSent,
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
  const location = useLocation();
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoDocId, setDemoDocId] = useState<string>('');
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
  const [rabattCodeInput, setRabattCodeInput] = useState('');
  const [appliedRabatt, setAppliedRabatt] = useState<AppliedRabatt | null>(null);
  const [rabattMessage, setRabattMessage] = useState('');
  const hasSentRef = useRef(false);

  const aktiveRabattcodes = (demoData?.rabattcodes || []).filter(
    (code) => code.isActive && (code.usedCount || 0) < code.maxUses
  );

  const getBasisBetrag = () => {
    if (selectedDienstleistung) return Number(selectedDienstleistung.price);
    return betrag;
  };

  const calculateFinalAmount = (base: number | null, discountPercent?: number) => {
    if (!base || base <= 0) return null;
    if (!discountPercent || discountPercent <= 0) return Number(base.toFixed(2));

    const reduced = base - (base * discountPercent) / 100;
    return Number(Math.max(0, reduced).toFixed(2));
  };

  const finalBetrag = calculateFinalAmount(getBasisBetrag(), appliedRabatt?.percent);

  const getReducedPrice = (price: number) => {
    return calculateFinalAmount(price, appliedRabatt?.percent) ?? price;
  };

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
          const search = location.search || '';
          window.location.replace(`/checkout/${encodeURIComponent(slug)}${search}`);
          return;
        } else {
          const demoDoc = querySnapshot.docs[0];
          const rawData = demoDoc.data() as any;
          setDemoDocId(demoDoc.id);
          setDemoData({
            ...rawData,
            rabattcodes: Array.isArray(rawData.rabattcodes) ? rawData.rabattcodes : [],
          } as DemoData);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Demo-Daten:', err);
        setError('Fehler beim Laden der Demo');
      } finally {
        setLoading(false);
      }
    };

    loadDemoData();
  }, [slug, location.search]);

  useEffect(() => {
    if (!demoData) return;

    const params = new URLSearchParams(location.search);
    const betragParam = params.get('betrag');
    const titelParam = params.get('titel');
    const shouldOpenPayment = params.get('openPayment') === '1';

    if (titelParam) {
      const matchedDienstleistung = demoData.dienstleistungen.find((dl) =>
        dl.shortDesc.toLowerCase() === titelParam.toLowerCase()
      );

      if (matchedDienstleistung) {
        setGutscheinType('dienstleistung');
        setSelectedDienstleistung(matchedDienstleistung);
        setBetrag(Number(matchedDienstleistung.price));
        setShowPaymentForm(shouldOpenPayment);
        return;
      }
    }

    if (betragParam) {
      const parsedBetrag = Number(betragParam);
      if (Number.isFinite(parsedBetrag) && parsedBetrag > 0) {
        setGutscheinType('wert');
        setBetrag(parsedBetrag);
        setSelectedDienstleistung(null);
        setShowPaymentForm(shouldOpenPayment);
      }
    }
  }, [demoData, location.search]);

  // Voreinstellung: Ersten verfuegbaren Rabattcode automatisch anzeigen
  useEffect(() => {
    if (!rabattCodeInput && aktiveRabattcodes.length > 0) {
      setRabattCodeInput(aktiveRabattcodes[0].code);
      setRabattMessage(`Tipp: Code ${aktiveRabattcodes[0].code} ist aktuell verfuegbar.`);
    }
  }, [aktiveRabattcodes, rabattCodeInput]);

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
    setRabattMessage('');
  };

  const handleToggleChange = (event: React.MouseEvent<HTMLElement>, newType: 'wert' | 'dienstleistung') => {
    if (newType) {
      setGutscheinType(newType);
      setBetrag(null);
      setSelectedDienstleistung(null);
      setAppliedRabatt(null);
      setRabattMessage('');
    }
  };

  const applyRabattCode = () => {
    const enteredCode = rabattCodeInput.trim().toUpperCase();
    const basisBetrag = getBasisBetrag();

    if (!basisBetrag || basisBetrag <= 0) {
      setRabattMessage('Bitte zuerst Betrag oder Dienstleistung auswählen.');
      return;
    }

    if (!enteredCode) {
      setRabattMessage('Bitte einen Rabattcode eingeben.');
      return;
    }

    const availableCodes = demoData?.rabattcodes || [];
    const match = availableCodes.find((c) => c.code?.toUpperCase() === enteredCode);

    if (!match) {
      setAppliedRabatt(null);
      setRabattMessage('Dieser Rabattcode ist nicht gültig.');
      return;
    }
    if (!match.isActive) {
      setAppliedRabatt(null);
      setRabattMessage('Dieser Rabattcode ist aktuell deaktiviert.');
      return;
    }
    if ((match.usedCount || 0) >= match.maxUses) {
      setAppliedRabatt(null);
      setRabattMessage('Dieser Rabattcode ist bereits ausgeschöpft.');
      return;
    }

    const finalAmount = calculateFinalAmount(basisBetrag, match.percent);
    if (!finalAmount) {
      setAppliedRabatt(null);
      setRabattMessage('Rabatt konnte nicht berechnet werden.');
      return;
    }

    const rabattBetrag = Number((basisBetrag - finalAmount).toFixed(2));
    const remaining = Math.max(0, match.maxUses - (match.usedCount || 0));

    setAppliedRabatt({
      code: match.code,
      percent: match.percent,
      rabattBetrag,
      finalBetrag: finalAmount,
    });
    setRabattMessage(
      `Code aktiv: ${match.code}. Sie sparen ${rabattBetrag.toFixed(2)}€ (${match.percent}%) - von ${basisBetrag.toFixed(2)}€ auf ${finalAmount.toFixed(2)}€. Noch ${remaining} verfügbar.`
    );
  };

  const removeRabattCode = () => {
    setAppliedRabatt(null);
    setRabattCodeInput('');
    setRabattMessage('Rabattcode entfernt.');
  };

  const handleWeiterZurBestellung = () => {
    if (!finalBetrag || finalBetrag <= 0) {
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
    const finalBetragToCharge = finalBetrag || 0;
    setPurchasedBetrag(finalBetragToCharge);
    setShowSuccessPage(true);
    setIsSending(true);

    try {
      const gutscheinCode = generateGutscheinCode();
      console.log('🎨 Erstelle Demo-Gutschein...');
      
      // PDF erstellen
      const { jsPDF } = await import('jspdf');
      const pdfDoc = new jsPDF();
      
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
        
        pdfDoc.addImage(bildBase64, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
      }

      // Text zentriert
      pdfDoc.setFontSize(32);
      pdfDoc.setTextColor(211, 47, 47);
      pdfDoc.text('Geschenk Gutschein', 105, 100, { align: 'center' });

      pdfDoc.setFontSize(18);
      pdfDoc.setTextColor(51, 51, 51);
      pdfDoc.text('über', 105, 115, { align: 'center' });

      // Betrag
      pdfDoc.setFontSize(52);
      pdfDoc.setTextColor(0, 0, 0);
      const betragText = selectedDienstleistung 
        ? selectedDienstleistung.shortDesc 
        : `€ ${finalBetrag}`;
      pdfDoc.text(betragText, 105, 145, { align: 'center' });

      // Gutscheincode
      pdfDoc.setFontSize(20);
      pdfDoc.setFont('courier', 'bold');
      pdfDoc.text(gutscheinCode, 105, 170, { align: 'center' });

      // Linie
      pdfDoc.setDrawColor(211, 47, 47);
      pdfDoc.setLineWidth(1);
      pdfDoc.line(80, 180, 130, 180);

      // Unternehmen
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(14);
      pdfDoc.setTextColor(211, 47, 47);
      pdfDoc.text(demoData?.name || 'Demo', 105, 200, { align: 'center' });

      const pdfBlob = pdfDoc.output('blob');
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
        betrag: finalBetragToCharge,
        dienstleistung: selectedDienstleistung,
        pdfBuffer: pdfBase64,
        isDemoMode: true,
        rabattCode: appliedRabatt?.code || null,
        rabattProzent: appliedRabatt?.percent || null
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
            betrag: finalBetragToCharge,
            originalBetrag: getBasisBetrag(),
            rabattCode: appliedRabatt?.code || null,
            rabattProzent: appliedRabatt?.percent || null,
            rabattBetrag: appliedRabatt?.rabattBetrag || 0,
            customerEmail: email,
            dienstleistung: selectedDienstleistung?.shortDesc || null,
            kaufdatum: new Date().toISOString(),
            unternehmensname: demoData?.name || 'Demo',
            slug: slug
          });
          console.log('✅ Demo-Gutschein in Firebase gespeichert');

          if (appliedRabatt && demoDocId) {
            try {
              const demoRef = doc(db, 'demos', demoDocId);
              const latestSnap = await getDoc(demoRef);
              if (latestSnap.exists()) {
                const latestData = latestSnap.data() as any;
                const latestCodes: RabattCode[] = Array.isArray(latestData.rabattcodes) ? latestData.rabattcodes : [];
                const updatedCodes = latestCodes.map((code) => {
                  if (code.code?.toUpperCase() !== appliedRabatt.code.toUpperCase()) return code;
                  const usedCount = Number(code.usedCount || 0);
                  return {
                    ...code,
                    usedCount: usedCount + 1,
                  };
                });

                await updateDoc(demoRef, { rabattcodes: updatedCodes });
                setDemoData((prev) => (prev ? { ...prev, rabattcodes: updatedCodes } : prev));
              }
            } catch (usageError) {
              console.warn('Rabattcode-Nutzung konnte nicht aktualisiert werden:', usageError);
            }
          }
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

              {/* Rabattcode-Einlösung nur im Zahlungsformular */}

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
                          (() => {
                            const originalPrice = Number(dienstleistung.price);
                            const reducedPrice = getReducedPrice(originalPrice);
                            return (
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
                            {!appliedRabatt ? (
                              <span style={{ fontWeight: 700 }}>{dienstleistung.price}€</span>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.95rem', fontWeight: 500 }}>
                                  {originalPrice.toFixed(2)}€
                                </Typography>
                                <Typography sx={{ color: 'success.main', fontWeight: 800, fontSize: '1rem' }}>
                                  {reducedPrice.toFixed(2)}€
                                </Typography>
                              </Box>
                            )}
                          </Button>
                            );
                          })()
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

                  {getBasisBetrag() && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e3eefc' }}>
                      {!appliedRabatt ? (
                        <Typography variant="body2" color="text.secondary">
                          Preis: {Number(getBasisBetrag()).toFixed(2)}€
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            {Number(getBasisBetrag()).toFixed(2)}€
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 800 }}>
                            {appliedRabatt.finalBetrag.toFixed(2)}€
                          </Typography>
                        </Box>
                      )}
                      {appliedRabatt && (
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                          Mit Code {appliedRabatt.code}: {appliedRabatt.finalBetrag.toFixed(2)}€ (-{appliedRabatt.rabattBetrag.toFixed(2)}€)
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {/* Payment Form */}
              {showPaymentForm && (
                <DemoPaymentForm
                  finalBetrag={finalBetrag}
                  selectedDienstleistung={selectedDienstleistung}
                  onPaymentComplete={handlePaymentComplete}
                  rabattCodeInput={rabattCodeInput}
                  setRabattCodeInput={setRabattCodeInput}
                  aktiveRabattcodes={aktiveRabattcodes}
                  applyRabattCode={applyRabattCode}
                  removeRabattCode={removeRabattCode}
                  appliedRabatt={appliedRabatt}
                  rabattMessage={rabattMessage}
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