import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import { useGutschein } from '../../context/GutscheinContext';
import TopLeftLogo from '../home/TopLeftLogo';

interface SidebarProps {
  activeStep: number;
}

const steps = [
  { label: 'Unternehmensdaten', path: '/gutschein/step1' },
  { label: 'Gutschein-Details', path: '/gutschein/step2' },
  { label: 'Gutschein-Design', path: '/gutschein/step3' },
  { label: 'Zahlungsdaten', path: '/gutschein/step4' },
  { label: 'Bestätigung', path: '/gutschein/step5' },
];

export default function Sidebar({ activeStep }: SidebarProps) {
  const navigate = useNavigate();
  const { data, setData } = useGutschein();

  // Aktualisiere den maxStep wenn nötig
  const maxStep = Math.max(data.maxStep || 1, activeStep);
  if (maxStep !== data.maxStep) {
    setData({ maxStep });
  }

  // Validierungsfunktionen für jeden Step
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(data.vorname && data.nachname && data.email && data.unternehmensname && data.website && data.geschaeftsart);
      case 2:
        // Mindestens eine Option muss aktiviert sein
        const hasCustomValue = data.customValue;
        const hasServices = data.dienstleistungen && data.dienstleistungen.length > 0;
        
        // Mindestens eine der beiden Optionen muss aktiviert/ausgefüllt sein
        return hasCustomValue || hasServices;
      case 3:
        // Step 3 hat keine Pflichtfelder, da alle Modi gültig sind
        return true;
      case 4:
        return !!(data.kontoinhaber && data.iban);
      case 5:
        return true; // Zusammenfassung hat keine Pflichtfelder
      default:
        return false;
    }
  };

  return (
    <Box
      sx={{
        width: '400px',
        backgroundColor: '#EAF4F2',
        padding: '4rem 2rem 8rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0 1rem 1rem 0',
        alignItems: 'center',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* TopLeftLogo hinzufügen */}
      <Box sx={{ position: 'absolute', top: '0rem', left: '3rem', zIndex: 3 }}>
        <TopLeftLogo />
      </Box>

      <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, mb: '4rem', mt: '5rem', color: '#111' }}>
        Onboarding
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'flex-start' }}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep === stepNumber;
          const isValid = validateStep(stepNumber);
          
          // Step 5 ist immer completed wenn einmal besucht
          const isCompleted = stepNumber === 5 
            ? maxStep >= 5 
            : maxStep > stepNumber && isValid;
          
          // Zeige Fehler wenn Step bereits erreicht wurde (maxStep > stepNumber) UND invalid ist
          // Aber niemals für Step 5
          const showError = stepNumber !== 5 && !isValid && maxStep > stepNumber;
          
          const isLast = index === steps.length - 1;

          return (
            <Box
              key={step.label}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                position: 'relative',
                mb: isLast ? 0 : '3.5rem',
                cursor: 'pointer',
              }}
              onClick={() => navigate(step.path)}
            >
              <Box sx={{ position: 'relative', width: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                <Box
                  sx={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: showError ? '#d32f2f' : (isCompleted || isActive ? '#2E7D66' : '#ccc'),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    letterSpacing: '0.5px',
                    zIndex: 1,
                  }}
                >
                  {showError ? (
                    <ErrorIcon sx={{ fontSize: '1.2rem' }} />
                  ) : isCompleted ? (
                    <CheckIcon sx={{ fontSize: '1.2rem' }} />
                  ) : (
                    stepNumber
                  )}
                </Box>

                {!isLast && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '36px',
                      width: '2px',
                      height: 'calc(100% + 3.5rem - 36px - 12px)',
                      backgroundColor: isCompleted ? '#2E7D66' : '#ccc',
                      marginTop: '6px',
                    }}
                  />
                )}
              </Box>

              <Typography
                sx={{
                  ml: '1rem',
                  mt: '0.4rem',
                  color: showError ? '#d32f2f' : (isActive ? '#2E7D66' : '#555'),
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {step.label}
                {showError && (
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#d32f2f',
                      fontWeight: 400,
                      mt: '0.25rem',
                    }}
                  >
                    Fehlende Angaben
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
