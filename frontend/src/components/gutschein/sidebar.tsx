import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';

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

  return (
    <Box
      sx={{
        width: '280px',
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
      {/* Logo hinzufügen */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '0rem',
        }}
        onClick={() => navigate('/')}
      >
        <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 60, height: 60 }} />
      </Box>

      <Typography
        variant="h6"
        sx={{
          color: 'black',
          marginBottom: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => window.location.href = '/'}
      >
        Gutscheinfabrik
      </Typography>

      <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, mb: '4rem', mt: '0rem', color: '#111' }}>
        Onboarding
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'flex-start' }}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep === stepNumber;
          const isCompleted = activeStep > stepNumber;
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
                    backgroundColor: isCompleted || isActive ? '#2E7D66' : '#ccc',
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
                  {isCompleted ? <CheckIcon sx={{ fontSize: '1.2rem' }} /> : stepNumber}
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
                  color: isActive ? '#2E7D66' : '#555',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
