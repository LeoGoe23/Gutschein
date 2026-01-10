import { Box, Container, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/home/TopBar';
import LogoTopLeft from '../../components/home/TopLeftLogo';
import Footer from '../../components/home/Footer';
import { Helmet } from 'react-helmet';

export default function GutscheinsystemFloristen() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
      <Helmet>
        <title>Digitales Gutscheinsystem für Floristen | Gutscheinery</title>
        <meta name="description" content="Verkaufen Sie Blumen-Gutscheine digital und automatisiert. Perfekt für Hochsaisons wie Valentinstag, Muttertag und Weihnachten. Einfache Integration." />
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
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
            Digitales Gutscheinsystem für Floristen
          </Typography>
          <Typography variant="h2" sx={{
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            fontWeight: 400,
            mb: 4,
            textAlign: 'center',
            opacity: 0.95
          }}>
            Mehr Liquidität vor Valentinstag und Muttertag
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                bgcolor: 'white',
                color: '#f5576c',
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
              title: 'Umsatzeinbrüche außerhalb der Hochsaison',
              description: 'Nach Valentinstag, Muttertag und Weihnachten sind die Kassen leer. Verkaufen Sie Gutscheine im Voraus und sichern Sie sich kontinuierliche Einnahmen.'
            },
            {
              title: 'Zeitaufwand bei Gutscheinverkauf im Laden',
              description: 'Während der Hochsaison ist jede Minute wertvoll. Automatisieren Sie den Gutscheinverkauf und konzentrieren Sie sich auf Ihre Kernarbeit.'
            },
            {
              title: 'Verpasste Online-Verkaufschancen',
              description: 'Kunden möchten spontan online bestellen – auch außerhalb Ihrer Öffnungszeiten. Mit digitalem Gutscheinverkauf verpassen Sie keine Verkaufschance mehr.'
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
                title: 'Liquidität vor der Hochsaison aufbauen',
                description: 'Verkaufen Sie Gutscheine schon Wochen vor Valentinstag oder Muttertag und sichern Sie sich finanzielle Planungssicherheit.'
              },
              {
                title: 'Automatischer 24/7 Verkauf ohne Personalaufwand',
                description: 'Ihre Kunden kaufen Gutscheine online – auch nachts und am Wochenende. Sie konzentrieren sich auf das Blumenbinden.'
              },
              {
                title: 'Neue Kunden durch Geschenkgutscheine',
                description: 'Jeder verschenkte Gutschein bringt potenzielle Neukunden in Ihr Geschäft. Perfekt für Hochsaison-Marketing.'
              },
              {
                title: 'Professionelles digitales Auftreten',
                description: 'Moderne Kunden erwarten Online-Bestellmöglichkeiten. Bieten Sie digitale Gutscheine und bleiben Sie wettbewerbsfähig.'
              },
              {
                title: 'Sofort einsatzbereit ohne IT-Kenntnisse',
                description: 'In wenigen Minuten eingerichtet. Keine komplizierte Software, keine Schulung nötig.'
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
            bgcolor: '#f5576c',
            px: 5,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            '&:hover': { bgcolor: '#e04658' }
          }}
        >
          Jetzt kostenlos starten
        </Button>
      </Container>

      <Footer />
    </Box>
  );
}
