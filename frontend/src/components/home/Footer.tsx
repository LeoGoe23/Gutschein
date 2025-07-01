import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ width: '100%', backgroundColor: '#222', color: '#fff', padding: '6rem 4%', mt: '4rem' }}>
      
      <Box sx={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: '3rem' }}>
        
        {/* Logo & Beschreibung */}
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4F46E5', mb: '1rem' }}>
            GutscheinFabrik
          </Typography>
          <Typography sx={{ lineHeight: 1.7, color: '#bbb', maxWidth: '300px' }}>
            Die Plattform für digitale Gutscheine. Einfach. Schnell. Flexibel. Für Unternehmen und Kunden.
          </Typography>
        </Box>

        {/* Navigation Unternehmen */}
        <Box sx={{ flex: '1 1 180px', minWidth: '150px' }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#4F46E5', mb: '1rem' }}>
            Unternehmen
          </Typography>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>Für Partner</Link>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>Vorteile</Link>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>Kontakt</Link>
        </Box>

        {/* Navigation Rechtliches */}
        <Box sx={{ flex: '1 1 180px', minWidth: '150px' }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#4F46E5', mb: '1rem' }}>
            Rechtliches
          </Typography>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>AGB</Link>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>Datenschutz</Link>
          <Link href="#" underline="hover" sx={{ display: 'block', mb: '0.5rem', color: '#bbb' }}>Impressum</Link>
        </Box>

        {/* Kontakt */}
        <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#4F46E5', mb: '1rem' }}>
            Kontakt
          </Typography>
          <Typography sx={{ color: '#bbb', mb: '0.5rem' }}>
            Konrad Blesch, Leonhard Götz
          </Typography>
          <Typography sx={{ color: '#bbb' }}>
            Musterstraße 12<br />12345 Berlin
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid #444', mt: '4rem', pt: '2rem', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} GutscheinFabrik. Alle Rechte vorbehalten.
      </Box>
    </Box>
  );
}
