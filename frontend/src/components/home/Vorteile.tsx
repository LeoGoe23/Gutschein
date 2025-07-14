import { Box, Stack, Typography } from '@mui/material';

const features = [
  {
    image: '/about1.png',
    title: 'Digitale Gutscheine in Sekunden',
    text: 'Kunden können Gutscheine sofort online kaufen und verschenken – ganz ohne Aufwand für Sie.',
  },
  {
    image: '/about2.png',
    title: 'Einfach eingebunden',
    text: 'Egal ob Website, Instagram oder Google – der Gutscheinlink funktioniert überall. Kein Umbau nötig.',
  },
  {
    image: '/about3.png',
    title: 'Mehr Sichtbarkeit für Ihren Shop',
    text: 'Erreichen Sie neue Kunden durch unser Gutscheinportal und steigern Sie Ihre Buchungszahlen.',
  },
  {
    image: '/about4.png',
    title: 'Sichere Auszahlung & volle Kontrolle',
    text: 'Sie erhalten automatisch Ihre Einnahmen, behalten den Überblick im Dashboard und zahlen keine Fixkosten.',
  },
];

export default function GutscheinVorteile() {
  return (
    <Box
      sx={{
        padding: { xs: '3rem 1rem', md: '6rem 4rem' },
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h4"
        sx={{ textAlign: 'center', fontWeight: 700, mb: 6 }}
      >
        Ihre Vorteile auf einen Blick
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={4}
        justifyContent="center"
        alignItems="flex-start"
        useFlexGap
        flexWrap="wrap"
      >
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{
              width: '260px',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={feature.image}
              alt={feature.title}
              style={{ width: '100px', height: 'auto', marginBottom: '1rem' }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1,
                minHeight: '3.8rem', // Reserve für 2 Zeilen Titel
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {feature.title}
            </Typography>
            <Typography sx={{ color: '#555', fontSize: '0.95rem' }}>
              {feature.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
