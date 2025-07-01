import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface SidebarProps {
  activeStep: number;
}

const steps = [
  'Unternehmensdaten',
  'Gutschein-Details',
  'Gutschein-Design',
  'Zahlungsdaten',
  'Bestätigung',
];

export default function Sidebar({ activeStep }: SidebarProps) {
  return (
    <Box
      sx={{
        width: '280px',
        backgroundColor: '#EAF4F2',
        padding: '4rem 2rem 8rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '1rem',
        alignItems: 'center',
        minHeight: '100vh',
        position: 'relative',
      }}
    >

      <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, mb: '4rem', mt: '6rem', color: '#111' }}>
        Onboarding
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative', alignItems: 'flex-start' }}>
        
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep === stepNumber;
          const isCompleted = activeStep > stepNumber;
          const isLast = index === steps.length - 1;

          return (
            <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative', mb: isLast ? 0 : '3.5rem' }}>
              
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
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
