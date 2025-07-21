import { Box, Typography, Button, IconButton, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DownloadIcon from '@mui/icons-material/Download';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { storage } from '../auth/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google';
import PayPalIcon from '@mui/icons-material/AccountBalanceWallet';
import { useGutschein } from '../context/GutscheinContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

function PaymentForm({ betrag, customerEmail }: { betrag: number | null; customerEmail: string }) {
  const [method, setMethod] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!betrag || !method) {
      alert('Bitte wählen Sie eine Zahlungsmethode und geben Sie einen Betrag ein.');
      return;
    }

    const response = await fetch('https://gutscheinery.de/api/zahlung/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: betrag * 100, customerEmail, method }),
    });

    if (!response.ok) {
      alert('Zahlung fehlgeschlagen');
      return;
    }

    const { paymentUrl } = await response.json();
    window.location.href = paymentUrl;
  };

  return (
    <Box sx={{ mt: 4 }}>
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

function SuccessPage({ purchasedBetrag, selectedDienstleistung }: { purchasedBetrag: number, selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } }) {
  const { data } = useGutschein();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateGutscheinCode = () => {
    return 'GS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleDownloadGutschein = async () => {
    setIsGenerating(true);
    
    try {
      const gutscheinCode = generateGutscheinCode();
      
      const pdfContent = document.createElement('div');
      pdfContent.style.cssText = `
        width: 595px;
        height: 842px;
        position: absolute;
        top: -9999px;
        left: -9999px;
        background: white;
      `;
      
      let contentHtml = '';
      
      if (data.gutscheinDesign.modus === 'eigenes' && data.gutscheinDesign.hintergrund) {
        contentHtml = `
          <div style="position: relative; width: 595px; height: 842px;">
            <img src="${data.gutscheinDesign.hintergrund}" 
                 style="width: 100%; height: 100%; object-fit: contain; object-position: center;" />
            
            ${data.gutscheinDesign.felder.map((feld: { typ: string; text: string; x: any; y: any; width: number; height: number; }) => {
              let feldContent = '';
              
              if (feld.typ === 'CODE') {
                feldContent = gutscheinCode;
              } else if (feld.typ === 'BETRAG') {
                // Dynamischer Inhalt basierend auf Kundenauswahl
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
            }).join('')}
          </div>
        `;
      } else if (data.gutscheinDesign.modus === 'designen') {
        // Dynamischer Inhalt für "Wir designen" Modus
        const gutscheinInhalt = selectedDienstleistung 
          ? `<div style="font-size: 18px; color: #666; margin-bottom: 10px;">Dienstleistung:</div>
             <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px;">${selectedDienstleistung.shortDesc}</div>
             <div style="font-size: 16px; color: #666; margin-bottom: 10px;">${selectedDienstleistung.longDesc}</div>
             <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${selectedDienstleistung.price}€</div>`
          : `<div style="font-size: 18px; color: #666; margin-bottom: 10px;">Wert:</div>
             <div style="font-size: 32px; font-weight: bold; color: #4caf50;">${purchasedBetrag}€</div>`;

        contentHtml = `
          <div style="position: relative; width: 595px; height: 842px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 36px; color: #fff; margin-bottom: 10px;">GUTSCHEIN</h1>
              <h2 style="font-size: 24px; color: #fff; margin-bottom: 20px;">${data.unternehmensname || data.name || 'Ihr Unternehmen'}</h2>
            </div>
            
            <div style="background: rgba(255,255,255,0.9); padding: 30px; border-radius: 10px; margin: 20px 0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">Gutschein-Code:</div>
                <div style="font-size: 24px; font-weight: bold; color: #333; background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${gutscheinCode}</div>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                ${gutscheinInhalt}
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 16px; color: #666;">Gültig bis: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <div style="font-size: 14px; color: #fff; line-height: 1.4;">
                ${data.website ? `<div>Website: ${data.website}</div>` : ''}
                <div style="margin-top: 10px;">Vielen Dank für Ihren Einkauf!</div>
                <div>Wir freuen uns auf Ihren Besuch!</div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Fallback mit dynamischem Inhalt
        const gutscheinInhalt = selectedDienstleistung 
          ? `<div style="font-size: 18px; color: #666; margin-bottom: 10px;">Dienstleistung:</div>
             <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px;">${selectedDienstleistung.shortDesc}</div>
             <div style="font-size: 16px; color: #666; margin-bottom: 10px;">${selectedDienstleistung.longDesc}</div>
             <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${selectedDienstleistung.price}€</div>`
          : `<div style="font-size: 18px; color: #666; margin-bottom: 10px;">Wert:</div>
             <div style="font-size: 32px; font-weight: bold; color: #4caf50;">${purchasedBetrag}€</div>`;

        contentHtml = `
          <div style="position: relative; width: 595px; height: 842px; background: #f5f5f5; padding: 40px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 36px; color: #333; margin-bottom: 10px;">GUTSCHEIN</h1>
              <h2 style="font-size: 24px; color: #666; margin-bottom: 20px;">${data.unternehmensname || data.name || 'Ihr Unternehmen'}</h2>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0; border: 2px solid #ddd;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 18px; color: #666; margin-bottom: 10px;">Gutschein-Code:</div>
                <div style="font-size: 24px; font-weight: bold; color: #333; background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${gutscheinCode}</div>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                ${gutscheinInhalt}
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 16px; color: #666;">Gültig bis: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <div style="font-size: 14px; color: #666; line-height: 1.4;">
                ${data.website ? `<div>Website: ${data.website}</div>` : ''}
                <div style="margin-top: 10px;">Vielen Dank für Ihren Einkauf!</div>
                <div>Wir freuen uns auf Ihren Besuch!</div>
              </div>
            </div>
          </div>
        `;
      }
      
      pdfContent.innerHTML = contentHtml;
      document.body.appendChild(pdfContent);
      
      // Konvertiere zu Canvas
      const canvas = await html2canvas(pdfContent, {
        width: 595,
        height: 842,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Erstelle PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [595, 842]
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);
      
      // Download PDF
      const fileName = `Gutschein_${data.unternehmensname || 'Unternehmen'}_${gutscheinCode}.pdf`;
      pdf.save(fileName);
      
      // Cleanup
      document.body.removeChild(pdfContent);
      
      console.log('Gutschein PDF generiert mit Kundenauswahl:', {
        code: gutscheinCode,
        betrag: purchasedBetrag,
        dienstleistung: selectedDienstleistung,
        unternehmen: data.unternehmensname,
        designModus: data.gutscheinDesign.modus
      });
      
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
        startIcon={<DownloadIcon />}
        onClick={handleDownloadGutschein}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generiere PDF...' : 'Gutschein herunterladen'}
      </Button>
    </Box>
  );
}

function CheckoutDemo() {
  const { data } = useGutschein();

  const selectedBetrag = data.selectedBetrag || '0';
  const selectedDienstleistung = data.selectedDienstleistung;

  return (
    <Box>
      <Typography variant="h5">Checkout</Typography>
      <Typography variant="body1">
        {selectedDienstleistung
          ? `Dienstleistung: ${selectedDienstleistung.shortDesc} (${selectedDienstleistung.price}€)`
          : `Betrag: ${selectedBetrag}€`}
      </Typography>
    </Box>
  );
}

export default function GutscheinLandingPage() {
  const { data } = useGutschein();
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [purchasedBetrag, setPurchasedBetrag] = useState<number>(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');

  // Verwende Daten aus dem Kontext
  const kundenName = data.unternehmensname || data.name || "Ihr Unternehmen";
  
  // Für das Hintergrundbild verwenden wir einfach data.bild
  const hintergrundBild = data.bild ? (typeof data.bild === 'string' ? data.bild : URL.createObjectURL(data.bild)) : null;
  
  // Prüfe ob sowohl Wert- als auch Dienstleistungsgutscheine verfügbar sind
  const hasWertGutschein = data.customValue;
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
      setSelectedDienstleistung(null); // Reset auch die Dienstleistung
    }
  };

  // Überwache URL-Hash für Success-Page
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#success') {
        setShowSuccessPage(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Prüfe initial Hash
    if (window.location.hash === '#success') {
      setShowSuccessPage(true);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

  const handlePaymentSuccess = (betrag: number) => {
    setPurchasedBetrag(betrag);
    setShowSuccessPage(true);
  };

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
            {!showSuccessPage ? (
              <>
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
                              onChange={(e) => {
                                setBetrag(Number(e.target.value));
                                setSelectedDienstleistung(null); // Reset Dienstleistung bei Betragseingabe
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

                {showPaymentForm && <PaymentForm betrag={betrag} onPaymentSuccess={handlePaymentSuccess} />}
              </>
            ) : (
              <SuccessPage purchasedBetrag={purchasedBetrag} />
            )}
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
