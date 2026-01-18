import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, Switch, Link } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, Smartphone, Speed, Security, CloudSync, NotificationsActive } from '@mui/icons-material';
import TopBar from '../components/home/TopBar';
import HeroText from '../components/home/HeroText';
import HeroImage from '../components/home/HeroImage';
import ContentSection from '../components/home/ContentSection';
import Footer from '../components/home/Footer';
import LogoTopLeft from '../components/home/TopLeftLogo';
import FAQ from '../components/home/FAQ';
import LoginModal from '../components/login/LoginModal';
import useAuth from '../auth/useAuth';
import SEOHead from '../components/blog/SEOHead';
import StructuredData from '../components/StructuredData';
import KontaktModal from '../components/home/KontaktModal';

export default function HomeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null);
  const [showKontaktModal, setShowKontaktModal] = useState(false);

  // SEO für Startseite
  useEffect(() => {
    document.title = 'Gutscheinery - Digitale Gutscheine für Ihr Unternehmen';
  }, []);

  // Widget iframe Höhenanpassung
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'gutschein-widget-resize') {
        const iframe = document.getElementById('gutschein-widget-iframe') as HTMLIFrameElement;
        if (iframe && event.data.height) {
          iframe.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [showCookieDialog, setShowCookieDialog] = useState(false);
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({ statistics: true, marketing: true });

  const handleSaveCookiePreferences = () => {
    const consent = ['technical'];
    if (cookiePrefs.statistics) consent.push('statistics');
    if (cookiePrefs.marketing) consent.push('marketing');
    document.cookie = `cookieConsent=${consent.join(',')}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setShowCookieSettings(false);
    setShowCookieDialog(true);
  };

  useEffect(() => {
    const consent = document.cookie.split('; ').find(row => row.startsWith('cookieConsent='));
    if (!consent) {
      setShowCookieDialog(true);
    }
  }, []);

  const acceptAllCookies = () => {
    document.cookie = 'cookieConsent=all; path=/; max-age=' + 60 * 60 * 24 * 365;
    setShowCookieDialog(false);
    setShowCookieSettings(false);
  };

  const acceptTechnicalCookies = () => {
    document.cookie = 'cookieConsent=technical; path=/; max-age=' + 60 * 60 * 24 * 365;
    setShowCookieDialog(false);
    setShowCookieSettings(false);
  };

  // LoginModal öffnen wenn von ProtectedRoute weitergeleitet
  useEffect(() => {
    if (location.state?.from && !user) {
      setIntendedRoute(location.state.from);
      setShowLoginModal(true);
    }
  }, [location.state, user]);

  // Nach erfolgreichem Login zur ursprünglich gewünschten Route weiterleiten
  useEffect(() => {
    if (user && intendedRoute) {
      navigate(intendedRoute, { replace: true });
      setIntendedRoute(null);
    }
  }, [user, intendedRoute, navigate]);

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setIntendedRoute(null);
    // State clearen
    navigate('/', { replace: true });
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'system-ui, sans-serif', padding: { xs: '0', md: '0' } }}>
      
      {/* SEO Structured Data */}
      <StructuredData type="website" />
      <StructuredData type="organization" />
      <StructuredData type="service" />
      <StructuredData type="product" />
      
      <Box sx={{ position: 'relative', width: '100%', height: { xs: 'auto', md: '100vh' }, backgroundColor: '#f4f4f4', overflow: 'hidden', padding: { xs: '0', md: '0' } }}>
        
        <LogoTopLeft />

        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        <Box sx={{ width: '100%', height: { xs: 'auto', md: '100%' }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: { xs: '7rem 1rem', md: '0 4rem' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: { xs: '100%', md: '35%' }, marginLeft: { xs: '0', md: '8%' }, textAlign: { xs: 'center', md: 'left' } }}>
            <HeroText />
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            height: '100%',
            width: '55%',
            zIndex: 1,
            pointerEvents: 'none',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <HeroImage />
        </Box>

      </Box>

      {/* Testimonial Section */}
      {/* <Box sx={{ 
        width: '100%', 
        py: { xs: 8, md: 10 },
        backgroundColor: '#f4f4f4'
      }}>
        <Box sx={{ 
          maxWidth: '1000px', 
          mx: 'auto', 
          px: { xs: 3, md: 6 }
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4
          }}>
            <Box sx={{
              width: { xs: '160px', md: '200px' },
              height: 'auto',
              opacity: 0.9
            }}>
              <img 
                src="/recover-club.svg" 
                alt="Recover Club Logo"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Box>

          <Typography 
            variant="h4" 
            sx={{ 
              fontStyle: 'italic',
              color: '#1a202c',
              lineHeight: 1.6,
              fontSize: { xs: '1.25rem', md: '1.6rem' },
              fontWeight: 400,
              textAlign: 'center',
              mb: 4,
              maxWidth: '900px',
              mx: 'auto',
              position: 'relative',
              '&::before': {
                content: '"„"',
                position: 'absolute',
                left: { xs: '-15px', md: '-30px' },
                top: '-10px',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: '#667eea',
                opacity: 0.3,
                fontFamily: 'Georgia, serif'
              }
            }}
          >
            Mit der GutscheinFabrik können unsere Kunden endlich bequem online Gutscheine kaufen – 
            rund um die Uhr, ohne dass wir uns darum kümmern müssen. Wie ein passiver Verkäufer 
            können wir uns zurücklehnen und die automatischen Auszahlungen genießen. Die Einrichtung 
            war unkompliziert und eine echte Erleichterung für unseren Alltag!
          </Typography>

          <Box sx={{
            textAlign: 'center',
            pt: 2,
            borderTop: '2px solid #e2e8f0',
            maxWidth: '600px',
            mx: 'auto'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#1a202c',
                fontSize: '1.1rem',
                mb: 0.5
              }}
            >
              Rudolf Hilt
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#718096',
                fontSize: '0.95rem'
              }}
            >
              Inhaber •{' '}
              <Link 
                href="https://recover-club.de" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  color: '#667eea',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                recover-club.de
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box> */}

      {/* Content Section */}
      <Box sx={{ width: '100%', padding: { xs: '0', md: '0' } }}>
        <ContentSection />
      </Box>

      {/* App Section */}
      <Box sx={{ 
        width: '100%',
        backgroundColor: '#f4f4f4',
        py: { xs: 8, md: 12 }
      }}>
        <Box sx={{ 
          maxWidth: '1200px', 
          mx: 'auto', 
          px: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 10, md: 16 }
        }}>
          {/* Linke Seite - Info */}
          <Box sx={{ 
            flex: 1,
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: 2,
                color: '#667eea',
                display: 'block',
                mb: 2
              }}
            >
              JETZT VERFÜGBAR
            </Typography>
            
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                color: '#1a202c'
              }}
            >
              Gutscheine immer im Griff
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4,
                fontWeight: 400,
                color: '#4a5568',
                lineHeight: 1.7,
                fontSize: '1.15rem'
              }}
            >
              Verwalten Sie Ihre Gutscheine professionell – 
              unterwegs, in Echtzeit, von überall.
            </Typography>

            <Box sx={{ mb: 4, display: 'inline-block', textAlign: 'left' }}>
              {[
                'Alle Gutscheine auf einen Blick',
                'Einlösungen sofort erfassen',
                'Verkaufsstatistiken in Echtzeit',
                'QR-Code Scanner integriert'
              ].map((text, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2.5
                  }}
                >
                  <CheckCircle sx={{ mr: 2, color: '#667eea', fontSize: 28 }} />
                  <Typography variant="body1" sx={{ fontSize: '1.05rem', color: '#2d3748', fontWeight: 500 }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                size="large"
                component="a"
                href="https://apps.apple.com/de/app/gutschein-manager/id6757339464"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: '#667eea',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#5568d3',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Smartphone sx={{ mr: 1 }} />
                Jetzt herunterladen
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => setShowKontaktModal(true)}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    borderColor: '#667eea',
                  }
                }}
              >
                Kontakt aufnehmen
              </Button>
            </Box>
          </Box>

          {/* Rechte Seite - Phone Mockup */}
          <Box sx={{ 
            flex: 1,
            display: 'flex', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Phone Frame */}
            <Box sx={{
              position: 'relative',
              width: { xs: '280px', sm: '320px' },
              height: { xs: '560px', sm: '640px' },
              bgcolor: '#1a1a1a',
              borderRadius: '50px',
              padding: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              transform: 'perspective(1000px) rotateY(-5deg)'
            }}>
              {/* Notch */}
              <Box sx={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '28px',
                bgcolor: '#1a1a1a',
                borderRadius: '0 0 20px 20px',
                zIndex: 10
              }} />

              {/* Screen */}
              <Box sx={{
                width: '100%',
                height: '100%',
                borderRadius: '42px',
                overflow: 'hidden',
                bgcolor: 'white',
                position: 'relative'
              }}>
                <img 
                  src="/image.png" 
                  alt="GutscheinFabrik App"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* Power Button */}
              <Box sx={{
                position: 'absolute',
                right: '-4px',
                top: '120px',
                width: '4px',
                height: '60px',
                bgcolor: '#2d2d2d',
                borderRadius: '0 4px 4px 0'
              }} />

              {/* Volume Buttons */}
              <Box sx={{
                position: 'absolute',
                left: '-4px',
                top: '100px',
                width: '4px',
                height: '40px',
                bgcolor: '#2d2d2d',
                borderRadius: '4px 0 0 4px'
              }} />
              <Box sx={{
                position: 'absolute',
                left: '-4px',
                top: '150px',
                width: '4px',
                height: '40px',
                bgcolor: '#2d2d2d',
                borderRadius: '4px 0 0 4px'
              }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Widget Demo Section */}
      <Box sx={{ 
        width: '100%',
        py: { xs: 10, md: 14 },
        backgroundColor: '#f4f4f4'
      }}>
        <Box sx={{ 
          maxWidth: '1400px', 
          mx: 'auto', 
          px: { xs: 3, md: 6 }
        }}>
          {/* Heading */}
          <Box sx={{ 
            textAlign: 'center',
            mb: 6
          }}>
            <Typography 
              variant="overline" 
              sx={{ 
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: 2,
                color: '#667eea',
                display: 'block',
                mb: 2
              }}
            >
              WIDGET INTEGRATION
            </Typography>
            
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.2,
                color: '#1a202c'
              }}
            >
              So sieht es auf Ihrer Website aus
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 400,
                color: '#4a5568',
                lineHeight: 1.7,
                fontSize: '1.15rem',
                maxWidth: '700px',
                mx: 'auto'
              }}
            >
              Integrieren Sie unser Widget nahtlos in Ihre bestehende Website. 
              Mit nur zwei Zeilen Code – fertig in unter 2 Minuten.
            </Typography>
          </Box>

          {/* Widget Demo */}
          <Box sx={{
            maxWidth: '1200px',
            mx: 'auto'
          }}>
            {/* Browser Mockup */}
            <Box sx={{
              bgcolor: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)',
                transform: 'translateY(-2px)'
              }
            }}>
              {/* Browser Header */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 2,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {/* Browser Buttons */}
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                  <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                  <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: '#27c93f' }} />
                </Box>
                
                {/* URL Bar */}
                <Box sx={{
                  flex: 1,
                  ml: 2,
                  px: 3,
                  py: 1,
                  bgcolor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <Box component="span" sx={{ fontSize: '0.9rem' }}>🔒</Box>
                  <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                    ihre-website.de/gutscheine
                  </Typography>
                </Box>
              </Box>

              {/* Browser Content */}
              <Box sx={{ 
                bgcolor: 'white',
                p: { xs: 3, md: 5 }
              }}>
                {/* Nur angedeuteter Header */}
                <Box sx={{ 
                  mb: 4
                }}>
                  <Typography variant="body2" sx={{ 
                    color: '#cbd5e0',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Ihre bisherige Webseite...
                  </Typography>
                </Box>

                {/* Das Widget */}
                <iframe
                  id="gutschein-widget-iframe"
                  src="/embed/RR2H80"
                  style={{
                    width: '100%',
                    border: 'none',
                    overflow: 'hidden',
                    height: 'auto',
                    background: 'transparent',
                    display: 'block'
                  }}
                  title="Gutschein Widget Demo"
                />
              </Box>
            </Box>

            {/* Info Text */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body1" sx={{ 
                color: '#64748b', 
                fontSize: '0.95rem',
                fontWeight: 500
              }}>
                ✨ <strong style={{ color: '#10b981' }}>Einfache Integration:</strong> Widget-Code kopieren, auf Ihrer Website einfügen – fertig in 2 Minuten
              </Typography>
            </Box>
          </Box>

          {/* CTA */}
          {/* <Box sx={{ 
            textAlign: 'center',
            mt: 2
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#4a5568',
                mb: 3,
                fontSize: '1.05rem'
              }}
            >
              Überzeugt? Starten Sie noch heute mit Ihrem eigenen Gutschein-System.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/gutschein/step1')}
              sx={{
                bgcolor: '#667eea',
                color: 'white',
                px: 5,
                py: 1.75,
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#5568d3',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Jetzt kostenlos einrichten
            </Button>
          </Box> */}
        </Box>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ width: '100%', padding: { xs: '0', md: '0' } }}>
        <FAQ />
      </Box>

      <Footer />

      <LoginModal 
        open={showLoginModal} 
        onClose={handleCloseLoginModal} 
      />

      <Dialog open={showCookieDialog && !showCookieSettings} onClose={acceptTechnicalCookies}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Wir verwenden essenzielle Cookies</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir verwenden Cookies, um unsere Website nutzerfreundlich zu gestalten und fortlaufend zu verbessern. Mit Ihrer Zustimmung helfen Sie uns, unser Angebot zu optimieren. Sie können Ihre Einstellungen jederzeit ändern.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Box>
              <Button onClick={() => setShowCookieSettings(true)} sx={{ mr: 1 }} variant="outlined">Cookies verwalten</Button>
              <Button onClick={acceptAllCookies} variant="contained">Akzeptieren</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={showCookieSettings} onClose={() => setShowCookieSettings(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Cookie-Einstellungen</DialogTitle>
        <DialogContent dividers>
          <FormControlLabel
            control={<Switch checked disabled />}
            label="Technisch notwendig (immer aktiv)"
          />
          <FormControlLabel
            control={<Switch checked={cookiePrefs.statistics} onChange={(e) => setCookiePrefs({ ...cookiePrefs, statistics: e.target.checked })} />}
            label="Leistungs-Cookies"
          />
          <FormControlLabel
            control={<Switch checked={cookiePrefs.marketing} onChange={(e) => setCookiePrefs({ ...cookiePrefs, marketing: e.target.checked })} />}
            label="Personalisierungs-Cookies"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveCookiePreferences} variant="contained">
            Einstellungen speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kontakt Modal */}
      <KontaktModal 
        open={showKontaktModal} 
        onClose={() => setShowKontaktModal(false)}
        source="App-Sektion"
      />
    </Box>
  );
}
