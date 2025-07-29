import { Box, Button, Typography } from '@mui/material';
import Sidebar from '../components/gutschein/sidebar';
import LogoTopLeft from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GutscheinProvider, useGutschein } from '../context/GutscheinContext';
import { saveGutscheinData } from '../utils/saveToFirebase';
import { saveAdminNewShop } from '../utils/saveAdminStats';
import { useState } from 'react';
import { auth } from '../auth/firebase';

function GutscheinContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, clearData } = useGutschein();
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    '/gutschein/step1',
    '/gutschein/step2',
    '/gutschein/step3',
    '/gutschein/step4',
    '/gutschein/step5',
  ];

  const currentIndex = steps.indexOf(location.pathname);

  // Validierungsfunktionen für jeden Step
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(data.vorname && data.nachname && data.email && data.unternehmensname && data.website && data.geschaeftsart && data.bild);
      case 2:
        const hasCustomValue = data.customValue;
        const hasServices = data.dienstleistungen && data.dienstleistungen.length > 0;
        return hasCustomValue || hasServices;
      case 3:
        // Wenn "eigenes" Design gewählt wurde, muss ein Hintergrund hochgeladen werden
        if (data.gutscheinDesign?.modus === 'eigenes') {
          return !!(data.gutscheinDesign.hintergrund);
        }
        return true;
      case 4:
        return true; // Zahlungsinformationen sind nicht mehr Pflicht
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Prüfe alle Steps für Abschließen
  const getMissingFields = () => {
    const missing = [];
    
    // Step 1
    if (!validateStep(1)) {
      const step1Missing = [];
      if (!data.vorname) step1Missing.push('Vorname');
      if (!data.nachname) step1Missing.push('Nachname');
      if (!data.email) step1Missing.push('E-Mail');
      if (!data.unternehmensname) step1Missing.push('Unternehmensname');
      if (!data.website) step1Missing.push('Website');
      if (!data.geschaeftsart) step1Missing.push('Geschäftsart');
      if (!data.bild) step1Missing.push('Unternehmensbild');
      
      if (step1Missing.length > 0) {
        missing.push(`Step 1 - Unternehmensdaten: ${step1Missing.join(', ')}`);
      }
    }

    // Step 2
    if (!validateStep(2)) {
      missing.push('Step 2 - Gutschein-Details: Mindestens eine Option (Freie Wertangabe oder Dienstleistungen) aktivieren');
    }

    // Step 3
    if (!validateStep(3)) {
      missing.push('Step 3 - Gutschein-Design: Bild für eigenes Design hochladen');
    }

    if (!data.agbAccepted) {
      missing.push('AGB müssen akzeptiert werden');
    }
    return missing;
  };

  const isAllValid = () => {
    return validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4) && !!data.agbAccepted;
  };

  const nextStep = () => {
    if (currentIndex < steps.length - 1) navigate(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    if (currentIndex > 0) navigate(steps[currentIndex - 1]);
  };

  const handleComplete = async () => {
    if (isAllValid()) {
      console.log('🔄 Starting completion process...');
      console.log('📋 Current context data:', data);

      setIsLoading(true);
      try {
        const result = await saveGutscheinData(data);

        // Admin-Statistik für neuen Shop aktualisieren
        await saveAdminNewShop('globalAdmin');

        console.log('✅ Gutschein-Setup abgeschlossen:', result);

        clearData();
        navigate('/Success');

      } catch (error) {
        console.error('❌ Fehler beim Abschließen:', error);
        
        let errorMessage = 'Unbekannter Fehler beim Speichern.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        alert(`Fehler beim Speichern: ${errorMessage}\n\nBitte versuchen Sie es erneut oder kontaktieren Sie den Support.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const missingFields = getMissingFields();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#fff', position: 'relative' }}>
      
      <Sidebar activeStep={currentIndex + 1} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TopBar genau wie bei Home */}
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>

        <Box sx={{ flex: 1, padding: '4rem', overflow: 'auto' }}>
          <Outlet />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '4rem', paddingTop: '2rem' }}>
          
          {/* Fehlende Felder Anzeige */}
          {currentIndex === steps.length - 1 && !isAllValid() && (
            <Box sx={{ 
              backgroundColor: '#ffebee', 
              border: '1px solid #f44336', 
              borderRadius: '0.5rem', 
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <Typography sx={{ fontWeight: 600, color: '#d32f2f', marginBottom: '0.5rem' }}>
                Es fehlen noch folgende Pflichtfelder:
              </Typography>
              {missingFields.map((field, index) => (
                <Typography key={index} sx={{ color: '#d32f2f', fontSize: '0.9rem', marginLeft: '1rem' }}>
                  • {field}
                </Typography>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            {currentIndex > 0 && (
              <Button variant="outlined" onClick={prevStep}>
                Zurück
              </Button>
            )}

            {currentIndex < steps.length - 1 && (
              <Button variant="contained" sx={{ backgroundColor: '#2E7D66' }} onClick={nextStep}>
                Weiter
              </Button>
            )}

            {currentIndex === steps.length - 1 && (
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: isAllValid() ? '#2E7D66' : '#ccc',
                  '&:hover': {
                    backgroundColor: isAllValid() ? '#245a4f' : '#ccc',
                  }
                }} 
                onClick={handleComplete}
                disabled={!isAllValid() || isLoading}
              >
                {isLoading ? 'Speichere...' : 'Abschließen'}
              </Button>
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

export default function Gutschein() {
  return (
    <GutscheinProvider>
      <GutscheinContent />
    </GutscheinProvider>
  );
}
