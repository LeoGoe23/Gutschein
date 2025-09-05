import { Box, Typography, Button, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, TextField, Paper, Chip } from '@mui/material';
import { useState, useEffect } from 'react';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { CheckCircle, Email, Download, Speed, Security, Support, Star, MoneyOff, TrendingUp, Schedule } from '@mui/icons-material';

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

// Demo Payment Form - identisch zu checkoutc aber mit Demo-Verhalten
function DemoPaymentForm({ betrag, onDemoPaymentSuccess }: { betrag: number | null; onDemoPaymentSuccess: () => void }) {
  const [customerEmail, setCustomerEmail] = useState<string>('demo@beispiel.de');

  const handlePayment = async () => {
    if (!betrag || !customerEmail) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // Simuliere kurze Ladezeit für Demo
    setTimeout(() => {
      onDemoPaymentSuccess();
    }, 1000);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        🎭 DEMO: Testdaten bereits eingefügt - probieren Sie es einfach aus!
      </Alert>
      
      <TextField
        label="E-Mail-Adresse"
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        required
        fullWidth
        sx={{ mb: 2 }}
        helperText="Demo-E-Mail bereits eingefügt"
      />
      
      <Button
        variant="contained"
        size="large"
        sx={{
          borderRadius: 2,
          px: 4,
          py: 1.5,
          backgroundColor: '#ff9800',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 3,
          '&:hover': { backgroundColor: '#f57c00' },
          mt: 2,
        }}
        onClick={handlePayment}
      >
        🎭 Demo-Zahlung starten
      </Button>
    </Box>
  );
}

// Demo Success Page - professionell und sauber
function DemoSuccessPage({ 
  purchasedBetrag, 
  selectedDienstleistung, 
  demoData
}: { 
  purchasedBetrag: number, 
  selectedDienstleistung?: { shortDesc: string; longDesc: string; price: string } | null,
  demoData: DemoData
}) {

  const handleRequestRealLink = () => {
    const subject = encodeURIComponent(`Anfrage: Gutschein-System für ${demoData.name}`);
    const body = encodeURIComponent(`Hallo,

ich habe die Demo getestet und möchte ein echtes Gutschein-System.

Demo: ${demoData.name}
${selectedDienstleistung ? `Dienstleistung: ${selectedDienstleistung.shortDesc} (${selectedDienstleistung.price}€)` : `Wertgutschein: ${purchasedBetrag}€`}

Bitte kontaktieren Sie mich.

Viele Grüße`);

    window.open(`mailto:kontakt@gutschein-system.de?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Box sx={{ mt: 4, maxWidth: '500px', mx: 'auto' }}>
      {/* Success Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4
      }}>
        <CheckCircle sx={{ fontSize: 60, color: '#28a745', mb: 2 }} />
        <Typography variant="h4" sx={{ 
          fontWeight: 600, 
          mb: 1,
          color: '#333'
        }}>
          Demo erfolgreich getestet
        </Typography>
        
        <Typography variant="body1" sx={{ 
          color: '#666'
        }}>
          {selectedDienstleistung 
            ? `${selectedDienstleistung.shortDesc} Gutschein` 
            : `${purchasedBetrag}€ Wertgutschein`}
        </Typography>
      </Box>

      {/* Provision Info */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          Nur 3% Provision pro Gutschein
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Keine Grundgebühr • Keine Setup-Kosten • Sie zahlen nur bei Erfolg
        </Typography>
      </Paper>

      {/* Vorteile */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Ihr echtes Gutschein-System:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Speed sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="body2">
              Automatischer PDF-Versand per E-Mail
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Security sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="body2">
              Sichere Stripe-Zahlungsabwicklung
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Schedule sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="body2">
              Einsatzbereit in 24 Stunden
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CTA Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{
          py: 2,
          fontWeight: 600,
          textTransform: 'none',
          backgroundColor: '#28a745',
          '&:hover': { backgroundColor: '#218838' }
        }}
        onClick={handleRequestRealLink}
      >
        Jetzt echten Link anfordern
      </Button>
      
      <Typography variant="body2" sx={{ 
        textAlign: 'center',
        color: '#666',
        mt: 2
      }}>
        Ihr Link ist in 24 Stunden bereit
      </Typography>
    </Box>
  );
}

export default function DemoCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // States identisch zu checkoutc
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistung, setSelectedDienstleistung] = useState<{ shortDesc: string; longDesc: string; price: string } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [gutscheinType, setGutscheinType] = useState<'wert' | 'dienstleistung'>('wert');

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

  const handleDemoPaymentSuccess = () => {
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
              {/* Demo-Badge - dezent wie in checkoutc */}
              <Chip 
                label="🎭 Demo-Vorschau" 
                sx={{ 
                  mb: 2, 
                  backgroundColor: '#fff3e0', 
                  color: '#f57c00',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />

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

              {/* Payment Form - Demo-Version */}
              {showPaymentForm && (
                <DemoPaymentForm
                  betrag={betrag}
                  onDemoPaymentSuccess={handleDemoPaymentSuccess}
                />
              )}
            </>
          ) : (
            // Success Page mit Verkaufs-Vorteilen
            <DemoSuccessPage 
              purchasedBetrag={betrag || 0} 
              selectedDienstleistung={selectedDienstleistung}
              demoData={demoData}
            />
          )}
        </Box>
      </Box>

      {/* Hintergrundbild - identisch zu checkoutc */}
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

      {/* Dezentes Demo-Banner - identisch zum Original */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 152, 0, 0.9)',
        color: 'white',
        py: 0.5,
        textAlign: 'center',
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="caption" fontWeight={500}>
          🎭 Demo-Vorschau • Kontaktieren Sie uns für Ihr eigenes Gutschein-System
        </Typography>
      </Box>
    </Box>
  );
}