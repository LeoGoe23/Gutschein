import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Gutschein from './pages/Gutschein';
import Profil from './pages/Profile';
import Step1 from './pages/gutschein/Step1';
import Step2 from './pages/gutschein/Step2';
import Step3 from './pages/gutschein/Step3';
import Step4 from './pages/gutschein/Step4';
import Step5 from './pages/gutschein/Step5';
import GutscheinePage from './pages/profil/Gutscheine';
import EinnahmenPage from './pages/profil/Einnahmen';
import EinstellungenPage from './pages/profil/Einstellungen';
import SelbstDesign from './pages/profil/design';
import Checkout from './pages/checkoutdemo';
import CheckoutC from './pages/checkoutc';
import Success from './pages/link';
import { GutscheinProvider } from './context/GutscheinContext';
import AGB from './components/home/legal/AGB';
import Datenschutz from './components/home/legal/Datenschutz';
import Impressum from './components/home/legal/Impressum';
import AdminPage from './pages/Admin';
import Kontakt from './pages/Kontakt';
import Vorteile from './pages/Vorteile';
import GutscheinDesignAdminEdit from './pages/GutscheinDesignAdminEdit';
import CheckoutAdmin from './pages/checkoutadmin';
import AdminGutscheinVerwaltung from './pages/AdminGutscheinVerwaltung';
import AdminDemosPage from './pages/AdminDemos';
import DemoCheckoutPage from './pages/DemoCheckout';

// Google Analytics Tracking
const GOOGLE_ANALYTICS_ID = 'G-YQ4CHJ8FVG';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

// Hook für Route-Tracking
function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Google Analytics Script laden
    if (!window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
      document.head.appendChild(script);

      script.onload = () => {
        window.gtag = function gtag() {
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push(arguments);
        };
        
        window.gtag('js', 'date');
        window.gtag('config', GOOGLE_ANALYTICS_ID, {
          page_title: document.title,
          page_location: window.location.href
        });
      };
    }
  }, []);

  useEffect(() => {
    // Seitenaufrufe tracken
    if (window.gtag) {
      window.gtag('config', GOOGLE_ANALYTICS_ID, {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname
      });
    }
  }, [location]);
}

function AppContent() {
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/checkoutdemo" element={<Checkout />} />
      <Route path="/checkout/:slug" element={<CheckoutC />} />
      <Route path="/success" element={
        <GutscheinProvider>
          <Success />
        </GutscheinProvider>
      } />
      <Route path="/profil" element={<Profil />}>
        <Route path="gutscheine" element={<GutscheinePage />} />
        <Route path="einnahmen" element={<EinnahmenPage />} />
        <Route path="einstellungen" element={<EinstellungenPage />} />
        <Route path="selbstdesign" element={<SelbstDesign />} />
      </Route>
      <Route path="/gutschein" element={<Gutschein />}>
        <Route path="step1" element={<Step1 />} />
        <Route path="step2" element={<Step2 />} />
        <Route path="step3" element={<Step3 />} />
        <Route path="step4" element={<Step4 />} />
        <Route path="step5" element={<Step5 />} />
      </Route>
      <Route path="/agb" element={<AGB />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/kontakt" element={<Kontakt />} />
      <Route path="/vorteile" element={<Vorteile />} />
      <Route path="/admin/shop/:shopId/design" element={<GutscheinDesignAdminEdit />} />
      <Route path="/checkoutadmin/:slug" element={<CheckoutAdmin />} />
      <Route path="/admin/gutscheine" element={<AdminGutscheinVerwaltung />} />
      <Route path="/admin/demos" element={<AdminDemosPage />} />
      <Route path="/demo/:slug" element={<DemoCheckoutPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
