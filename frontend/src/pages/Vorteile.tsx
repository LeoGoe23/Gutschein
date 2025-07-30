import React, { useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material'
import { useTheme, useMediaQuery } from '@mui/material';
import Footer from '../components/home/Footer';
import FAQ from '../components/home/FAQ';
import LogoTopLeft from '../components/home/TopLeftLogo';

const pathImageUrl = '/path.png';

const benefits = [
  {
    title: 'Neue Kunden gewinnen',
    description: 'Erreiche neue Zielgruppen durch attraktive Gutscheinaktionen und erhöhe deine Markenbekanntheit.',
  },
  {
    title: 'Digitale Gutscheine verwalten',
    description: 'Erstelle, verwalte und verfolge deine Gutscheine zentral und effizient auf unserer Plattform.',
  },
  {
    title: 'Nicht eingelöste Gutscheine monetarisieren',
    description: 'Nicht eingelöste Gutscheine generieren dir wiederkehrende Umsätze ohne zusätzlichen Aufwand.',
  },
  {
    title: 'Einfache Integration & Nutzung',
    description: 'Unsere Plattform lässt sich mühelos in deinen bestehenden Betrieb integrieren – ganz ohne technische Vorkenntnisse.',
  },
]

export default function Vorteile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1 }}>
        <LogoTopLeft />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '100vw',
              height: '100%',
              transform: 'translateX(-50%)',
              backgroundImage: `url(${pathImageUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              opacity: 0.1,
              zIndex: 0,
            }}
          />
          <Box sx={{ zIndex: 1 }}>
            <Container sx={{ pt: '6rem', px: 2, maxWidth: 800, mx: 'auto', position: 'relative', flex: 1 }}>
              <Typography variant="h4" gutterBottom align="center">
                Deine Vorteile mit GutscheinFabrik
              </Typography>
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
                  {benefits.map((b, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: '100%',
                        p: 3,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        borderRadius: 2,
                        textAlign: 'left',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {b.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {b.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                (() => {
                  const positions = [
                    { top: '15%', left: '3%' },
                    { top: '31%', right: '-5%' },
                    { top: '52%', left: '-2%' },
                    { top: '78%', right: '-7%' },
                  ];
                  return (
                    <Box sx={{ position: 'relative', height: '1000px' }}>
                      {benefits.map((b, i) => {
                        const pos = positions[i];
                        return (
                          <Box
                            key={i}
                            sx={{
                              position: 'absolute',
                              ...pos,
                              width: { xs: '90%', md: '40%' },
                              p: 3,
                              bgcolor: 'background.paper',
                              boxShadow: 3,
                              borderRadius: 2,
                              textAlign: 'left',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: '1rem',
                                [pos.left ? 'right' : 'left']: '-12px',
                                width: '24px',
                                height: '24px',
                                bgcolor: '#4F46E5',
                                borderRadius: '50%',
                              },
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {b.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {b.description}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })()
              )}
            </Container>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}