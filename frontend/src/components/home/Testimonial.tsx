import { Box, Typography, Avatar } from '@mui/material';
import { Star } from '@mui/icons-material';

export default function Testimonial() {
  return (
    <Box 
      sx={{ 
        width: '100%', 
        backgroundColor: '#f9fafb',
        padding: { xs: '4rem 1.5rem', md: '6rem 4rem' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box 
        sx={{ 
          maxWidth: '900px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {/* Überschrift */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            mb: 4,
            color: '#1a1a1a',
            fontSize: { xs: '1.75rem', md: '2.25rem' }
          }}
        >
          Was unsere Kunden sagen
        </Typography>

        {/* Testimonial Card */}
        <Box 
          sx={{ 
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: { xs: '2rem 1.5rem', md: '3rem 4rem' },
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            '&::before': {
              content: '"""',
              position: 'absolute',
              top: '-10px',
              left: '30px',
              fontSize: '120px',
              color: '#e3f2fd',
              fontFamily: 'Georgia, serif',
              lineHeight: 1
            }
          }}
        >
          {/* Sterne */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} sx={{ color: '#ffc107', fontSize: '1.5rem' }} />
            ))}
          </Box>

          {/* Testimonial Text */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500,
              color: '#333',
              lineHeight: 1.8,
              mb: 3,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontStyle: 'italic'
            }}
          >
            "Ich bin sehr zufrieden mit dem System! Die Einrichtung war kinderleicht und ich bin 
            wirklich überrascht, wie viele Gutscheine wir bereits verkauft haben. Eine absolute 
            Bereicherung für unser Geschäft."
          </Typography>

          {/* Kunde */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            {/* Logo */}
            <Box
              component="img"
              src="/recover-club.svg"
              alt="Recover Club Logo"
              sx={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontSize: '1.1rem'
                }}
              >
                Rudolf Hilt
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontSize: '0.95rem'
                }}
              >
                Inhaber, recover-club.de
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
