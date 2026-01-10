import { Box, Container, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/home/TopBar';
import LogoTopLeft from '../../components/home/TopLeftLogo';
import Footer from '../../components/home/Footer';
import { Helmet } from 'react-helmet';

export default function GutscheinsystemMassageSalons() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <Helmet>
        <title>Digitales Gutscheinsystem für Massage-Salons | Gutscheinery</title>
        <meta name="description" content="Automatisierter Gutscheinverkauf für Massage-Salons. Verkaufen Sie Massage-Gutscheine rund um die Uhr. Reduzieren Sie Terminausfälle und steigern Sie Ihre Einnahmen." />
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
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
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
            Digitales Gutscheinsystem für Massage-Salons
          </Typography>
          <Typography variant="h2" sx={{
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            opacity: 0.95
          }}>
            Mehr Liquidität und weniger Terminausfälle
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                bgcolor: 'white',
                color: '#00f2fe',
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
              title: 'Hohe Terminausfallquote',
              description: 'Kurzfristige Absagen und No-Shows verursachen Umsatzverluste. Gutscheininhaber erscheinen zuverlässiger zu Terminen – sie haben bereits bezahlt.'
            },
            {
              title: 'Verwaltungsaufwand bei Gutscheinen',
              description: 'Manuelles Ausstellen, Archivieren und Nachverfolgen von Papiergutscheinen kostet Zeit. Automatisieren Sie diesen Prozess komplett.'
            },
            {
              title: 'Schwankende Auslastung und Liquidität',
              description: 'Leere Kalender bedeuten finanzielle Unsicherheit. Verkaufen Sie Gutscheine im Voraus und sichern Sie planbare Einnahmen.'
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
                title: 'Weniger Terminausfälle durch Vorauszahlung',
                description: 'Gutscheininhaber haben bereits bezahlt und erscheinen deutlich zuverlässiger zu Terminen. Reduzieren Sie No-Shows messbar.'
              },
              {
                title: 'Automatischer Verkauf ohne Personalaufwand',
                description: 'Verkaufen Sie Massage-Gutscheine 24/7 online. Kein manuelles Ausstellen mehr – alles läuft automatisch.'
              },
              {
                title: 'Liquidität vor Leistungserbringung',
                description: 'Sie erhalten das Geld sofort bei Gutscheinkauf. Perfekt für Finanzplanung und Investitionen.'
              },
              {
                title: 'Neue Kunden durch Weiterempfehlung',
                description: 'Verschenkte Gutscheine bringen neue Gesichter in Ihren Salon. Jeder eingelöste Gutschein ist eine Chance für Folgebuchungen.'
              },
              {
                title: 'Professionelles digitales Image',
                description: 'Moderne Kunden erwarten Online-Buchungsmöglichkeiten. Bieten Sie zeitgemäßen Service und heben Sie sich vom Wettbewerb ab.'
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
            bgcolor: '#00f2fe',
            px: 5,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#00d9e5' }
          }}
        >
          Jetzt kostenlos starten
        </Button>
      </Container>

      <Footer />
    </Box>
  );
}
