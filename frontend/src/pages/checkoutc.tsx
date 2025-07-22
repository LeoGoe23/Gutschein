import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DownloadIcon from '@mui/icons-material/Download';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams } from 'react-router-dom';
import { loadCheckoutDataBySlug, CheckoutData } from '../utils/loadCheckoutData';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function PaymentOptions({ onSelect }: { onSelect: (method: string) => void }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
      <Button variant="outlined" startIcon={<CreditCardIcon />} onClick={() => onSelect('creditcard')} sx={{ flex: 1 }}>
        Kreditkarte
      </Button>
      <Button variant="outlined" startIcon={<AppleIcon />} onClick={() => onSelect('applepay')} sx={{ flex: 1 }}>
        Apple Pay
      </Button>
      <Button variant="outlined" startIcon={<GoogleIcon />} onClick={() => onSelect('googlepay')} sx={{ flex: 1 }}>
        Google Pay
      </Button>
    </Box>
  );
}

function PaymentForm({ betrag, onPaymentSuccess }: { betrag: number | null; onPaymentSuccess: (betrag: number) => void }) {
  const [method, setMethod] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');

  const handlePayment = async () => {
    if (!betrag || !method || !customerEmail) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // DEVELOPMENT: Zahlung umgehen - direkt erfolgreich
    console.log('Zahlung simuliert für:', { betrag, method, customerEmail });
    alert('Zahlung erfolgreich! (Development Mode)');
    onPaymentSuccess(betrag);
    return;

    // PRODUCTION: Echte Zahlung (auskommentiert)
    /*
    const response = await fetch('https://gutscheinery.de/api/zahlung/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: betrag * 100, 
        method,
        customerEmail
      }),
    });

    if (!response.ok) {
      alert('Zahlung fehlgeschlagen');
      return;
    }

    const { paymentUrl } = await response.json();
    window.location.href = paymentUrl;
    */
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
      <Typography variant="body1" sx={{ mb: 2 }}>
        Zahlungsmethode wählen:
      </Typography>
      <PaymentOptions onSelect={setMethod} />
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
  checkoutData 
}: { 
  purchasedBetrag: number, 
  selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } | null,
  checkoutData: CheckoutData
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateGutscheinCode = () => {
    return 'GS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleDownloadGutschein = async () => {
    setIsGenerating(true);
    
    try {
      const gutscheinCode = generateGutscheinCode();
      const gueltigBis = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE');
      
      // Prüfe den Modus und verwende entsprechende Generierung
      if (checkoutData.gutscheinDesign.modus === 'unser-design' && checkoutData.gutscheinURL) {
        
        console.log('Loading PDF template from:', checkoutData.gutscheinURL);
        
        try {
          // 1. PDF Template von Firebase laden
          const response = await fetch(checkoutData.gutscheinURL);
          if (!response.ok) {
            throw new Error('PDF Template konnte nicht geladen werden');
          }
          
          const pdfArrayBuffer = await response.arrayBuffer();
          const pdfText = new TextDecoder().decode(pdfArrayBuffer);
          
          // 2. Platzhalter durch echte Werte ersetzen
          let modifiedPdfText = pdfText
            .replace(/\{\{BETRAG\}\}/g, selectedDienstleistung ? selectedDienstleistung.price : purchasedBetrag.toString())
            .replace(/\{\{CODE\}\}/g, gutscheinCode)
            .replace(/\{\{GUELTIG_BIS\}\}/g, gueltigBis);
          
          // 3. Modifiziertes PDF als Blob erstellen
          const modifiedPdfBlob = new Blob([new TextEncoder().encode(modifiedPdfText)], { 
            type: 'application/pdf' 
          });
          
          // 4. Download
          const url = window.URL.createObjectURL(modifiedPdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Gutschein_${checkoutData.unternehmensname}_${gutscheinCode}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('PDF mit dynamischen Werten erfolgreich heruntergeladen');
          
        } catch (error) {
          console.error('Fehler beim Verarbeiten des PDF-Templates:', error);
          throw new Error('PDF-Template konnte nicht verarbeitet werden');
        }
        
      } else if (checkoutData.gutscheinDesign.modus === 'eigenes' && checkoutData.gutscheinURL) {
        // Bestehende Logik für eigenes Design bleibt unverändert
        const pdfContent = document.createElement('div');
        pdfContent.style.cssText = `
          width: 595px;
          height: 842px;
          position: absolute;
          top: -9999px;
          left: -9999px;
          background: white;
        `;
        
        const contentHtml = `
          <div style="position: relative; width: 595px; height: 842px;">
            <img src="${checkoutData.gutscheinURL}" 
                 style="width: 100%; height: 100%; object-fit: contain; object-position: center;" />
            
            ${checkoutData.gutscheinDesign.felder ? checkoutData.gutscheinDesign.felder.map((feld: any) => {
              let feldContent = '';
              
              if (feld.typ === 'CODE') {
                feldContent = gutscheinCode;
              } else if (feld.typ === 'BETRAG') {
                if (selectedDienstleistung) {
                  feldContent = `${selectedDienstleistung.shortDesc} (${selectedDienstleistung.price}€)`;
                } else {
                  feldContent = `${purchasedBetrag}€`;
                }
              } else if (feld.typ === 'DIENSTLEISTUNG') {
                feldContent = selectedDienstleistung ? selectedDienstleistung.longDesc || selectedDienstleistung.shortDesc : `Wert: ${purchasedBetrag}€`;
              } else {
                feldContent = feld.text;
              }
              
              return `
                <div style="
                  position: absolute;
                  left: ${feld.x}px;
                  top: ${feld.y}px;
                  width: ${feld.width}px;
                  height: ${feld.height}px;
                  background: rgba(255,255,255,0.9);
                  border: 1px solid #ccc;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${Math.min(feld.width / 8, feld.height / 2)}px;
                  font-weight: bold;
                  color: #333;
                  text-align: center;
                  border-radius: 4px;
                ">
                  ${feldContent}
                </div>
              `;
            }).join('') : ''}
          </div>
        `;
        
        pdfContent.innerHTML = contentHtml;
        document.body.appendChild(pdfContent);
        
        const canvas = await html2canvas(pdfContent, {
          width: 595,
          height: 842,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [595, 842]
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);
        
        const fileName = `Gutschein_${checkoutData.unternehmensname}_${gutscheinCode}.pdf`;
        pdf.save(fileName);
        
        document.body.removeChild(pdfContent);
        
      } else {
        // ✅ NEUES DESIGN - Verwende ausgelagerte Funktion
        const gutscheinData = {
          unternehmen: checkoutData.unternehmensname,
          betrag: selectedDienstleistung ? selectedDienstleistung.price : purchasedBetrag.toString(),
          gutscheinCode: gutscheinCode,
          ausstelltAm: new Date().toLocaleDateString('de-DE'),
          website: checkoutData.website,
          bildURL: checkoutData.bildURL,
          dienstleistung: selectedDienstleistung ? {
            shortDesc: selectedDienstleistung.shortDesc,
            longDesc: selectedDienstleistung.longDesc
          } : undefined
        };
        
        await generateGutscheinPDF(gutscheinData);
      }
      
    } catch (error) {
      console.error('Fehler beim Generieren des Gutscheins:', error);
      alert('Fehler beim Generieren des Gutscheins. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };

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
      
      <Button
        variant="contained"
        size="large"
        onClick={handleDownloadGutschein}
        disabled={isGenerating}
        startIcon={<DownloadIcon />}
        sx={{
          borderRadius: 2,
          px: 4,
          py: 1.5,
          backgroundColor: '#4caf50',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 3,
          '&:hover': { backgroundColor: '#45a049' },
          '&:disabled': { backgroundColor: '#ccc' },
        }}
      >
        {isGenerating ? 'Generiere PDF...' : 'Gutschein herunterladen'}
      </Button>
    </Box>
  );
}

export default function GutscheinLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');

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

  const handlePaymentSuccess = (betrag: number) => {
    setPurchasedBetrag(betrag);
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
                  <>
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
                      {gutscheinType === 'dienstleistung' && hasDienstleistungGutschein && (
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
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleWeiterZurBestellung}
                      endIcon={<ArrowForwardIosIcon />}
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
                    >
                      Weiter zur Bestellung
                    </Button>
                  </>
                )}

                {showPaymentForm && <PaymentForm betrag={betrag} onPaymentSuccess={handlePaymentSuccess} />}
              </>
            ) : (
              <SuccessPage 
                purchasedBetrag={purchasedBetrag} 
                selectedDienstleistung={selectedDienstleistung}
                checkoutData={checkoutData}
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
