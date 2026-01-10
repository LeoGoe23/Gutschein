import { Box, Container, Button, Typography } from '@mui/material';
import TopBar from '../../components/home/TopBar';
import LogoTopLeft from '../../components/home/TopLeftLogo';
import Footer from '../../components/home/Footer';
import { Helmet } from 'react-helmet';

export default function GutscheinsystemYogaStudios() {

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <Helmet>
        <title>Digitales Gutscheinsystem für Yoga Studios | Gutscheinery</title>
        <meta name="description" content="Automatisierter Gutscheinverkauf für Yoga Studios. Verkaufen Sie Yoga-Gutscheine, Workshops und Retreats digital. Neue Schüler gewinnen und Liquidität sichern." />
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
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
            Digitales Gutscheinsystem für Yoga Studios
          </Typography>
          <Typography variant="h2" sx={{
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            opacity: 0.95
          }}>
            Mehr Schüler binden und Workshops einfach verkaufen
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => window.location.href = 'https://calendly.com/gutscheinfabrik/15-minute-meeting'}
              sx={{
                bgcolor: 'white',
                color: '#38f9d7',
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
              title: 'Hohe Abbruchrate nach Probestunden',
              description: 'Viele Interessenten kommen einmal und verschwinden dann. Mit Gutscheinen binden Sie neue Schüler durch Vorauszahlung und erhöhen die Verbindlichkeit.'
            },
            {
              title: 'Aufwand beim Workshop-Verkauf',
              description: 'Anmeldungen per E-Mail, Überweisungen nachverfolgen, Listen führen. Automatisieren Sie den Verkauf und sparen Sie wertvolle Zeit für Ihre Praxis.'
            },
            {
              title: 'Schwankende Teilnehmerzahlen',
              description: 'Mal volle, mal leere Kurse erschweren die Planung. Verkaufen Sie Gutscheine im Voraus und sichern Sie planbare Einnahmen für Ihr Studio.'
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
                title: 'Höhere Bindung neuer Schüler',
                description: 'Gutscheininhaber haben bereits investiert und kommen zuverlässiger. Wandeln Sie Probestunden in langfristige Mitgliedschaften um.'
              },
              {
                title: 'Workshop-Verkauf ohne Verwaltungsaufwand',
                description: 'Verkaufen Sie Workshops, Retreats und Specials automatisch online. Keine E-Mail-Korrespondenz, keine Zahlungsverfolgung mehr nötig.'
              },
              {
                title: 'Geschenkgutscheine als Marketing-Kanal',
                description: 'Jeder verschenkte Gutschein bringt potenzielle neue Schüler in Ihr Studio. Perfekt für Geburtstage, Weihnachten und besondere Anlässe.'
              },
              {
                title: 'Liquidität für Studio-Entwicklung',
                description: 'Verkaufen Sie Gutscheine im Voraus und finanzieren Sie neue Kurse, Ausstattung oder Lehrerfortbildungen aus gesichertem Kapital.'
              },
              {
                title: 'Professionelles digitales Auftreten',
                description: 'Moderne Yogis erwarten Online-Buchungsmöglichkeiten. Bieten Sie zeitgemäßen Service und positionieren Sie sich als professionelles Studio.'
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
            bgcolor: '#38f9d7',
            px: 5,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#2de0c8' }
          }}
        >
          Jetzt kostenlos starten
        </Button>
      </Container>

      <Footer />
    </Box>
  );
}
