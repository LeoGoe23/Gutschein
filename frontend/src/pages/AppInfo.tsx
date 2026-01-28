import { Box, Button, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, Download, Login, Visibility, Settings } from '@mui/icons-material';
import { useEffect } from 'react';

export default function AppInfo() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'App Info - Gutscheinery';
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      number: 1,
      icon: Download,
      title: 'App herunterladen',
      description: 'Laden Sie die Gutscheinery App kostenlos aus dem App Store herunter. Die App ist speziell für die Verwaltung Ihrer digitalen Gutscheine entwickelt und bietet Ihnen alle Funktionen, die Sie für den professionellen Betrieb benötigen.',
      screenshot: '/SC1.png',
      action: {
        type: 'download',
        url: 'https://apps.apple.com/de/app/gutschein-manager/id6757339464'
      }
    },
    {
      number: 2,
      icon: Login,
      title: 'Mit Geschäfts-E-Mail anmelden',
      description: 'Melden Sie sich mit der E-Mail-Adresse an, die Sie bei der Einrichtung Ihres Gutscheinsystems verwendet haben. Nach der ersten Anmeldung haben Sie sofortigen Zugriff auf alle Ihre Gutscheine.',
      screenshot: '/SC1.png',
      action: {
        type: 'link',
        text: 'Passwort vergessen? Klicken Sie hier',
        url: '/'
      }
    },
    {
      number: 3,
      icon: Visibility,
      title: 'Gutscheine auf einen Blick',
      description: 'Behalten Sie den vollständigen Überblick über alle Ihre Gutscheine. Die App zeigt Ihnen den Status jedes Gutscheins – ob aktiv, teilweise eingelöst oder vollständig verwendet. Scannen Sie mit der integrierten Kamera einfach den QR-Code auf dem Gutschein für eine schnelle Einlösung direkt vor Ort.',
      screenshot: '/SC2.png'
    },
    {
      number: 4,
      icon: Settings,
      title: 'Gutscheine verwalten',
      description: 'Verwalten Sie Ihre Gutscheine professionell. Lösen Sie Gutscheine direkt in der App ein – per QR-Code-Scanner oder manueller Eingabe. Verfolgen Sie Verkaufsstatistiken in Echtzeit und sehen Sie genau, wie sich Ihr Gutscheingeschäft entwickelt.',
      screenshot: '/SC3.png'
    }
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      bgcolor: '#f4f4f4'
    }}>
      {/* Header */}
      <Box sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        py: 3,
        px: { xs: 3, md: 6 },
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{
          maxWidth: '1400px',
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Button
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{
              color: '#667eea',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            Zurück zur Startseite
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{
        maxWidth: '1400px',
        mx: 'auto',
        px: { xs: 3, md: 6 },
        py: { xs: 8, md: 12 }
      }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: 2,
              color: '#667eea',
              display: 'block',
              mb: 2
            }}
          >
            GUTSCHEINERY APP
          </Typography>
          
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '4rem' },
              lineHeight: 1.2,
              color: '#1a202c'
            }}
          >
            Gutscheine professionell verwalten
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              color: '#4a5568',
              lineHeight: 1.7,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              maxWidth: '900px',
              mx: 'auto'
            }}
          >
            Mit der Gutscheinery App haben Sie alle Ihre Gutscheine immer im Griff – 
            unterwegs, in Echtzeit, von überall.
          </Typography>
        </Box>

        {/* Schritt-für-Schritt Anleitung */}
        <Box sx={{ mt: 12 }}>
          {steps.map((step, index) => (
            <Box 
              key={index}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                gap: { xs: 6, md: 8 },
                mb: { xs: 12, md: 16 },
                position: 'relative'
              }}
            >
              {/* Linke Seite - Phone Mockup */}
              <Box sx={{ 
                flex: '0 0 auto',
                display: 'flex',
                justifyContent: 'center',
                order: { xs: 2, md: 1 }
              }}>
                {/* Phone Frame */}
                <Box sx={{
                  position: 'relative',
                  width: { xs: '260px', sm: '300px' },
                  height: { xs: '520px', sm: '600px' },
                  bgcolor: '#1a1a1a',
                  borderRadius: '45px',
                  padding: '14px',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  {/* Notch */}
                  <Box sx={{
                    position: 'absolute',
                    top: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '110px',
                    height: '26px',
                    bgcolor: '#1a1a1a',
                    borderRadius: '0 0 18px 18px',
                    zIndex: 10
                  }} />

                  {/* Screen */}
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '38px',
                    overflow: 'hidden',
                    bgcolor: 'white',
                    position: 'relative'
                  }}>
                    <img 
                      src={step.screenshot}
                      alt={step.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>

                  {/* Power Button */}
                  <Box sx={{
                    position: 'absolute',
                    right: '-4px',
                    top: '110px',
                    width: '4px',
                    height: '55px',
                    bgcolor: '#2d2d2d',
                    borderRadius: '0 4px 4px 0'
                  }} />

                  {/* Volume Buttons */}
                  <Box sx={{
                    position: 'absolute',
                    left: '-4px',
                    top: '90px',
                    width: '4px',
                    height: '35px',
                    bgcolor: '#2d2d2d',
                    borderRadius: '4px 0 0 4px'
                  }} />
                  <Box sx={{
                    position: 'absolute',
                    left: '-4px',
                    top: '135px',
                    width: '4px',
                    height: '35px',
                    bgcolor: '#2d2d2d',
                    borderRadius: '4px 0 0 4px'
                  }} />
                </Box>
              </Box>

              {/* Rechte Seite - Erklärung */}
              <Box sx={{ 
                flex: 1,
                textAlign: { xs: 'center', md: 'left' },
                order: { xs: 1, md: 2 }
              }}>
                {/* Schritt Nummer */}
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 70,
                  height: 70,
                  borderRadius: '20px',
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  mb: 3,
                  position: 'relative'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    width: 35,
                    height: 35,
                    borderRadius: '50%',
                    bgcolor: '#667eea',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)'
                  }}>
                    {step.number}
                  </Box>
                  <step.icon sx={{ fontSize: 40, color: '#667eea' }} />
                </Box>

                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                    color: '#1a202c',
                    lineHeight: 1.3
                  }}
                >
                  {step.number}. Schritt: {step.title}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#4a5568',
                    lineHeight: 1.9,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    mb: 4
                  }}
                >
                  {step.description}
                </Typography>

                {/* Action Buttons */}
                {step.action && (
                  <Box sx={{ mt: 4 }}>
                    {step.action.type === 'download' && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        alignItems: 'flex-start',
                        flexDirection: { xs: 'column', sm: 'row' }
                      }}>
                        <Box>
                          <Button
                            variant="contained"
                            size="large"
                            component="a"
                            href={step.action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<Download />}
                            sx={{
                              bgcolor: '#667eea',
                              color: 'white',
                              px: 4,
                              py: 1.5,
                              fontSize: '1.05rem',
                              fontWeight: 600,
                              borderRadius: '12px',
                              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: '#5568d3',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Jetzt herunterladen
                          </Button>
                        </Box>

                        {/* QR Code */}
                        <Box sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: '1px solid #e2e8f0',
                          textAlign: 'center'
                        }}>
                          <Box sx={{
                            width: '120px',
                            height: '120px',
                            bgcolor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1
                          }}>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(step.action.url)}`}
                              alt="QR Code"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </Box>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontWeight: 500
                          }}>
                            QR-Code scannen
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {step.action.type === 'link' && (
                      <Button
                        variant="text"
                        onClick={() => navigate('/?reset-password=true')}
                        sx={{
                          color: '#667eea',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          p: 0,
                          minWidth: 'auto',
                          '&:hover': {
                            bgcolor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {step.action.text}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* CTA Section */}
        <Box sx={{
          textAlign: 'center',
          mt: 16,
          py: 10,
          px: 4,
          bgcolor: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              color: '#1a202c'
            }}
          >
            Bereit, Ihre Gutscheine zu digitalisieren?
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#4a5568',
              mb: 5,
              fontSize: '1.15rem',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8
            }}
          >
            Starten Sie noch heute und verwalten Sie Ihre Gutscheine professionell. 
            Die App ist kostenlos und in wenigen Minuten einsatzbereit.
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center'
          }}>
            <Button
              variant="contained"
              size="large"
              component="a"
              href="https://apps.apple.com/de/app/gutschein-manager/id6757339464"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                bgcolor: '#667eea',
                color: 'white',
                px: 5,
                py: 2,
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#5568d3',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              App jetzt herunterladen
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                px: 5,
                py: 2,
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'rgba(102, 126, 234, 0.05)',
                  borderColor: '#667eea',
                }
              }}
            >
              Zurück zur Startseite
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
