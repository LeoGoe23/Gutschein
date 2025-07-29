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

  // Nur maxStep erhöhen, wenn der User wirklich fortschreitet
  // Nicht beim ersten Laden einer höheren Step-Nummer
  const currentMaxStep = data.maxStep || 1;
  
  // Nur wenn der activeStep höher ist als der gespeicherte maxStep, dann erhöhen
  if (activeStep > currentMaxStep) {
    setData({ maxStep: activeStep });
  }

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
        if (data.gutscheinDesign?.modus === 'eigenes') {
          return !!(data.gutscheinDesign.hintergrund);
        }
        return true;
      case 4:
        return !!(data.stripeAccountId);
      case 5:
        // Step 5 ist nur gültig, wenn die AGB akzeptiert wurden
        return !!data.agbAccepted;
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
          
          // Step 5 ist nur completed, wenn validiert UND besucht
          const isCompleted = stepNumber === 5 
            ? currentMaxStep >= 5 && isValid
            : currentMaxStep > stepNumber && isValid;
          
          // Zeige Fehler wenn Step bereits erreicht wurde (currentMaxStep > stepNumber) UND invalid ist
          // Aber niemals für Step 5
          const showError = stepNumber !== 5 && !isValid && currentMaxStep > stepNumber;
          
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
