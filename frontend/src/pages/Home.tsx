import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, Switch } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TopBar from '../components/home/TopBar';
import HeroText from '../components/home/HeroText';
import HeroImage from '../components/home/HeroImage';
import ContentSection from '../components/home/ContentSection';
import Footer from '../components/home/Footer';
import LogoTopLeft from '../components/home/TopLeftLogo';
import FAQ from '../components/home/FAQ';
import LoginModal from '../components/login/LoginModal';
import useAuth from '../auth/useAuth';

export default function HomeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null);

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
            maxWidth: '50%',
            zIndex: 1,
            pointerEvents: 'none',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <HeroImage />
        </Box>

      </Box>

      {/* Content Section */}
      <Box sx={{ width: '100%', padding: { xs: '0', md: '0' } }}>
        <ContentSection />
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
    </Box>
  );
}
