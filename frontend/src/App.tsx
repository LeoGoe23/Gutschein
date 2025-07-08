import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Demo from './pages/Demo';
import Ueberuns from './pages/ueberuns';
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
import Checkout from './pages/checkout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/ueberuns" element={<Ueberuns />} />
        <Route path="/checkout" element={<Checkout />} />
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
      </Routes>
    </BrowserRouter>
  );
}
