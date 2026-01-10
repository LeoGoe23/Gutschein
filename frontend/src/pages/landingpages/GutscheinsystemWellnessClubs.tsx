import { Box, Container, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/home/TopBar';
import LogoTopLeft from '../../components/home/TopLeftLogo';
import Footer from '../../components/home/Footer';
import { Helmet } from 'react-helmet';

export default function GutscheinsystemWellnessClubs() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <Helmet>
        <title>Digitales Gutscheinsystem für Wellness-Clubs | Gutscheinery</title>
        <meta name="description" content="Verkaufen Sie Wellness-Gutscheine automatisiert. Perfekt für Fitness-Studios, Spa-Bereiche und Wellness-Clubs. Mehr Liquidität und neue Kunden gewinnen." />
      </Helmet>

      {/* Header */}
      <Box sx={{ position: 'relative', backgroundColor: 'transparent' }}>
        <LogoTopLeft />
        <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
          <TopBar />
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        color: '#111827',
        py: { xs: 8, md: 12 },
        mt: { xs: 8, md: 10 }
      }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            mb: 3,
            textAlign: 'center'
          }}>
            Digitales Gutscheinsystem für Wellness-Clubs
          </Typography>
          <Typography variant="h2" sx={{
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            opacity: 0.85
          }}>
            Mehr Mitglieder und planbare Liquidität
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                bgcolor: '#111827',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                '&:hover': { bgcolor: '#374151' }
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
              title: 'Hohe Neukundenakquise-Kosten',
              description: 'Teure Werbemaßnahmen für neue Mitglieder belasten Ihr Budget. Nutzen Sie Gutscheine als kostengünstigen Marketing-Kanal für Neukundengewinnung.'
            },
            {
              title: 'Saisonale Mitgliederschwankungen',
              description: 'Januar boomt, im Sommer bricht die Nachfrage ein. Verkaufen Sie Gutscheine ganzjährig und gleichen Sie Umsatzschwankungen aus.'
            },
            {
              title: 'Ungenutzte Zusatzleistungen',
              description: 'Massagen, Personal Training oder Spa-Treatments werden zu wenig gebucht. Machen Sie diese Angebote als Gutscheine sichtbar und steigern Sie den Zusatzumsatz.'
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
                title: 'Neue Mitglieder durch Geschenkgutscheine',
                description: 'Jeder verschenkte Gutschein bringt potenzielle Neumitglieder in Ihren Club. Perfekt für Mundpropaganda-Marketing.'
              },
              {
                title: 'Zusatzumsatz durch Premium-Angebote',
                description: 'Machen Sie hochpreisige Leistungen als Gutscheine buchbar. Steigern Sie den durchschnittlichen Umsatz pro Kunde.'
              },
              {
                title: 'Liquidität für Investitionen und Wachstum',
                description: 'Vorab verkaufte Gutscheine schaffen finanziellen Spielraum für neue Geräte, Renovierungen oder Marketing-Kampagnen.'
              },
              {
                title: 'Automatisierter 24/7 Verkauf',
                description: 'Verkaufen Sie Gutscheine rund um die Uhr ohne Personalaufwand. Auch nachts und am Wochenende.'
              },
              {
                title: 'Modernes digitales Kundenerlebnis',
                description: 'Bieten Sie zeitgemäßen Service und heben Sie sich von traditionellen Fitness-Studios ab.'
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
          onClick={() => navigate('/')}
          sx={{
            bgcolor: '#111827',
            px: 5,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#374151' }
          }}
        >
          Jetzt kostenlos starten
        </Button>
      </Container>

      <Footer />
    </Box>
  );
}
