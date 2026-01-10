import { Box, Container, Button, Typography } from '@mui/material';
import TopBar from '../../components/home/TopBar';
import LogoTopLeft from '../../components/home/TopLeftLogo';
import Footer from '../../components/home/Footer';
import { Helmet } from 'react-helmet';

export default function GutscheinsystemFriseure() {

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <Helmet>
        <title>Digitales Gutscheinsystem für Friseure | Gutscheinery</title>
        <meta name="description" content="Automatischer Gutscheinverkauf für Friseursalons. Verkaufen Sie digitale Gutscheine 24/7, ohne Verwaltungsaufwand. Mehr Liquidität und planbare Einnahmen." />
      </Helmet>

      {/* Header */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 10, md: 14 },
        pt: { xs: 12, md: 16 }
      }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            mb: 3,
            textAlign: 'center'
          }}>
            Digitales Gutscheinsystem für Friseure
          </Typography>
          <Typography variant="h2" sx={{
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            opacity: 0.95
          }}>
            Mehr Umsatz durch automatisierten Gutscheinverkauf
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => window.location.href = 'https://calendly.com/gutscheinfabrik/15-minute-meeting'}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                '&:hover': { bgcolor: '#f0f0f0' }
              }}
            >
              Jetzt kostenlos starten
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Trust Section */}
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600 }}>
          Unser System ist erfolgreich bei Kunden im Einsatz
        </Typography>
      </Container>

      {/* Problems Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" sx={{
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontWeight: 800,
          textAlign: 'center',
          mb: 6,
          color: '#111827'
        }}>
          Kennen Sie diese Herausforderungen?
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
          {[
            {
              title: 'Leerlaufzeiten zwischen Terminen',
              description: 'Ungenutzte Zeitfenster bedeuten verlorenen Umsatz. Mit unserem automatisierten Gutscheinverkauf generieren Sie zusätzliche Einnahmen rund um die Uhr.'
            },
            {
              title: 'Aufwändige Gutscheinverwaltung',
              description: 'Händisches Ausfüllen, Archivieren und Nachverfolgen von Gutscheinen kostet wertvolle Zeit. Automatisieren Sie den gesamten Prozess mit wenigen Klicks.'
            },
            {
              title: 'Liquiditätsengpässe in schwachen Monaten',
              description: 'Saisonale Schwankungen belasten Ihre Finanzplanung. Verkaufen Sie Gutscheine im Voraus und sichern Sie sich planbare Einnahmen.'
            }
          ].map((problem, index) => (
            <Box key={index} sx={{
              p: 4,
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#111827' }}>
                {problem.title}
              </Typography>
              <Typography sx={{ color: '#6b7280', lineHeight: 1.7 }}>
                {problem.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: '#f9fafb', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 800,
            textAlign: 'center',
            mb: 6,
            color: '#111827'
          }}>
            Ihre Vorteile mit Gutscheinery
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            {[
              {
                title: 'Automatischer Gutscheinverkauf rund um die Uhr',
                description: 'Verkaufen Sie Gutscheine 24/7 – auch wenn Ihr Salon geschlossen ist. Ihre Kunden können jederzeit online Gutscheine kaufen.'
              },
              {
                title: 'Sofortige Liquidität vor Leistungserbringung',
                description: 'Sie erhalten das Geld direkt bei Gutscheinkauf – lange bevor die Dienstleistung erbracht wird.'
              },
              {
                title: 'Neue Kunden durch Geschenkgutscheine',
                description: 'Gutscheinkäufer verschenken Ihre Leistungen weiter. Jeder eingelöste Gutschein bringt potenzielle Neukunden in Ihren Salon.'
              },
              {
                title: 'Keine technischen Vorkenntnisse erforderlich',
                description: 'Intuitive Bedienung ohne Schulungsaufwand. In 5 Minuten eingerichtet und sofort einsatzbereit.'
              },
              {
                title: 'Professionelles Erscheinungsbild',
                description: 'Hochwertig gestaltete Gutscheine in Ihrem Corporate Design stärken Ihre Marke und hinterlassen einen bleibenden Eindruck.'
              }
            ].map((benefit, index) => (
              <Box key={index} sx={{
                p: 4,
                bgcolor: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#111827' }}>
                  {benefit.title}
                </Typography>
                <Typography sx={{ color: '#6b7280', lineHeight: 1.7 }}>
                  {benefit.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h2" sx={{
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontWeight: 800,
          mb: 3,
          color: '#111827'
        }}>
          Bereit für mehr Umsatz?
        </Typography>
        <Typography sx={{ fontSize: '1.125rem', color: '#6b7280', mb: 4 }}>
          Starten Sie noch heute und verkaufen Sie Ihre ersten digitalen Gutscheine.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => window.location.href = 'https://calendly.com/gutscheinfabrik/15-minute-meeting'}
          sx={{
            bgcolor: '#667eea',
            px: 5,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#5568d3' }
          }}
        >
          Jetzt kostenlos starten
        </Button>
      </Container>

      <Footer />
    </Box>
  );
}
