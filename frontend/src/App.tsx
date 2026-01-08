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
import GutscheinDesignAdminEdit from './pages/GutscheinDesignAdminEdit';
import CheckoutAdmin from './pages/checkoutadmin';
import AdminGutscheinVerwaltung from './pages/AdminGutscheinVerwaltung';
import AdminDemosPage from './pages/AdminDemos';
import DemoCheckoutPage from './pages/DemoCheckout';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AdminBlog from './pages/admin/AdminBlog';
import AdminBlogEditor from './pages/admin/AdminBlogEditor';
// import WidgetDemo from './pages/WidgetDemo';
import EmbedWidget from './pages/EmbedWidget';

// Google Analytics Tracking
const GOOGLE_ANALYTICS_ID = 'G-YQ4CHJ8FVG';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Hook für Route-Tracking
function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // DataLayer initialisieren
    window.dataLayer = window.dataLayer || [];
    
    // gtag Funktion definieren
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    // Google Analytics Script laden
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
      document.head.appendChild(script);

      script.onload = () => {
        window.gtag('js', new Date());
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
      <Route path="/admin/shop/:shopId/design" element={<GutscheinDesignAdminEdit />} />
      <Route path="/checkoutadmin/:slug" element={<CheckoutAdmin />} />
      <Route path="/admin/gutscheine" element={<AdminGutscheinVerwaltung />} />
      <Route path="/admin/demos" element={<AdminDemosPage />} />
      <Route path="/demo/:slug" element={<DemoCheckoutPage />} />

      {/* Blog Routes */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      {/* Widget Routes */}
      {/* <Route path="/widget-demo" element={<WidgetDemo />} /> */}
      <Route path="/embed/:slug" element={<EmbedWidget />} />

      {/* Admin Blog Routes */}
      <Route path="/admin/blog" element={<AdminBlog />} />
      <Route path="/admin/blog/new" element={<AdminBlogEditor />} />
      <Route path="/admin/blog/edit/:id" element={<AdminBlogEditor />} />
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
