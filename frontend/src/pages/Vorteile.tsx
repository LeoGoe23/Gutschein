import React from 'react'
import { Box, Container, Typography } from '@mui/material'

// Pfad zum S-förmigen Weg (Firebase Download-URL)
const pathImageUrl = 'https://firebasestorage.googleapis.com/v0/b/gutscheinfabrik-1c985.firebasestorage.app/o/20250727_1950_S-f%C3%B6rmiger%20Weg_remix_01k16fy7prepmtj52hmrwv9d3z.png?alt=media';

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
  return (
    <Container sx={{ position: 'relative', py: 6, overflow: 'hidden' }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#4F46E5', textAlign: 'center' }}
      >
        Deine Vorteile mit GutscheinFabrik
      </Typography>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '100%',
          backgroundImage: `url(${pathImageUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {benefits.map((b, i) => {
          const isLeft = i % 2 === 0
          return (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
                mb: 8,
                '&:last-of-type': { mb: 0 },
              }}
            >
              <Box
                sx={{
                  width: { xs: '100%', md: '45%' },
                  p: 3,
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  borderRadius: 2,
                  textAlign: 'left',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '1rem',
                    [isLeft ? 'right' : 'left']: '-12px',
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
            </Box>
          )
        })}
      </Box>
    </Container>
  )
}