import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DownloadIcon from '@mui/icons-material/Download';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useParams } from 'react-router-dom';
import { loadCheckoutDataBySlug, CheckoutData } from '../utils/loadCheckoutData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const stripePromise = loadStripe('your-publishable-key-here');

function PaymentOptions({ onSelect }: { onSelect: (method: string) => void }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowForwardIosIcon />}
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
        startIcon={<DownloadIcon />}
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
        startIcon={<ArrowForwardIosIcon />}
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
        startIcon={<DownloadIcon />}
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

function PaymentForm({ betrag, onPaymentSuccess }: { betrag: number | null, onPaymentSuccess: (betrag: number) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!stripe || !elements || !betrag || !paymentMethod) {
      alert('Bitte wählen Sie eine Zahlungsmethode und geben Sie einen Betrag ein.');
      return;
    }

    // Simuliere erfolgreiche Zahlung für Demo
    alert('Zahlung erfolgreich!');
    
    // Übergebe den Betrag an die Parent-Komponente
    onPaymentSuccess(betrag);
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
      
      if (checkoutData.gutscheinDesign.modus === 'eigenes' && checkoutData.gutscheinURL) {
        contentHtml = `
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
      } else {
        // Fallback Design
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
              <h2 style="font-size: 24px; color: #fff; margin-bottom: 20px;">${checkoutData.unternehmensname}</h2>
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
                ${checkoutData.website ? `<div>Website: ${checkoutData.website}</div>` : ''}
                <div style="margin-top: 10px;">Vielen Dank für Ihren Einkauf!</div>
                <div>Wir freuen uns auf Ihren Besuch!</div>
              </div>
            </div>
          </div>
        `;
      }
      
      pdfContent.innerHTML = contentHtml;
      document.body.appendChild(pdfContent);
      
      // PDF erstellen
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
    </Elements>
  );
}
