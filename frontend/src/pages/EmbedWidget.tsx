import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Divider, TextField } from '@mui/material';
import { loadCheckoutDataBySlug } from '../utils/loadCheckoutData';

interface GutscheinOption {
  titel: string;
  betrag: number;
  beschreibung?: string;
}

const EmbedWidget: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<GutscheinOption[]>([]);
  const [unternehmenName, setUnternehmenName] = useState('');
  const [error, setError] = useState('');
  const [customAmounts, setCustomAmounts] = useState<{[key: number]: string}>({});

  // URL parameters für Customization
  const params = new URLSearchParams(window.location.search);
  const primaryColor = params.get('primaryColor') || '#1976d2';
  const fontFamily = params.get('fontFamily') || slug?.toUpperCase() === 'JANKIP' 
    ? "'Cormorant Garamond', Georgia, serif" 
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const backgroundColor = params.get('backgroundColor') || 'transparent';

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      try {
        const data = await loadCheckoutDataBySlug(slug);
        
        if (data) {
          setUnternehmenName(data.unternehmensname);
          
          const loadedOptions: GutscheinOption[] = [];
          
          // Freier Betrag hinzufügen wenn aktiviert
          if (data.customValue) {
            loadedOptions.push({
              titel: 'Freier Betrag',
              betrag: 0,
              beschreibung: 'Sie bestimmen den Wert'
            });
          }

          if (data.dienstleistungen && data.dienstleistungen.length > 0) {
            data.dienstleistungen.forEach((dl: any) => {
              // Check if it has variants
              if (dl.varianten && dl.varianten.length > 0) {
                // Add each variant as a separate option
                dl.varianten.forEach((variant: any) => {
                  loadedOptions.push({
                    titel: `${dl.shortDesc} - ${variant.name}`,
                    betrag: parseInt(variant.preis),
                    beschreibung: variant.beschreibung || dl.longDesc
                  });
                });
              } else {
                // Regular service without variants
                loadedOptions.push({
                  titel: dl.shortDesc,
                  betrag: parseInt(dl.price),
                  beschreibung: dl.longDesc !== dl.shortDesc ? dl.longDesc : undefined
                });
              }
            });
          }

          setOptions(loadedOptions);
        } else {
          setError('Gutschein-Daten nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  useEffect(() => {
    const updateHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'gutschein-widget-resize', height }, '*');
    };

    // Setze body background auf transparent
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [loading, options, backgroundColor]);

  const handleWeiterZurZahlung = (option: GutscheinOption, index: number) => {
    let betrag = option.betrag;
    
    // Wenn Freier Betrag, nutze den eingegebenen Wert
    if (option.betrag === 0 && customAmounts[index]) {
      betrag = parseFloat(customAmounts[index]) || 0;
    }
    
    window.parent.postMessage({ 
      type: 'gutscheinSelected', 
      slug, 
      betrag,
      titel: option.titel 
    }, '*');
  };

  const handleCustomAmountChange = (index: number, value: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [index]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '200px',
        fontFamily
      }}>
        <Typography>Laden...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        p: 3,
        fontFamily
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: backgroundColor,
      fontFamily,
      pt: 3,
      pb: 1.5,
      px: 2,
      position: 'relative',
      '& *': {
        fontFamily: `${fontFamily} !important`
      }
    }}>
      {/* Oberer Divider */}
      <Box sx={{ mb: 3 }}>
        <Divider sx={{ borderColor: '#e2e8f0' }} />
      </Box>

      {/* Powered by rechts oben */}
      <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
        <Typography 
          component="a" 
          href="https://gutscheinfabrik.de" 
          target="_blank" 
          rel="noopener noreferrer"
          variant="caption" 
          sx={{ 
            color: '#9ca3af',
            fontSize: '0.7rem',
            textDecoration: 'none',
            '&:hover': {
              color: '#6b7280',
              textDecoration: 'underline'
            }
          }}
        >
          powered by GutscheinFabrik
        </Typography>
      </Box>
      
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: 'center', 
          mb: 4,
          color: '#718096',
          fontSize: '1rem'
        }}
      >
        Jetzt kaufen und sofort per E-Mail erhalten
      </Typography>

      <Box 
        sx={{ 
          display: 'flex',
          overflowX: 'auto',
          gap: 3,
          pb: 2,
          px: 1,
          alignItems: 'stretch',
          justifyContent: options.length <= 3 ? 'center' : 'flex-start',
          '&::-webkit-scrollbar': {
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a0aec0',
          },
        }}
      >
        {options.map((option, index) => (
          <Card
            key={index}
            sx={{
              minWidth: '260px',
              flex: '1 1 280px',
              maxWidth: '360px',
              bgcolor: '#ffffff',
              boxShadow: 'none',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#cbd5e0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              },
            }}
          >
            <CardContent sx={{ 
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Titel - feste Höhe für 2 Zeilen */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  color: '#2d3748',
                  fontSize: '1.15rem',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {option.titel}
              </Typography>

              {/* Beschreibung - feste Höhe */}
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1.5,
                  color: '#718096',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  minHeight: '24px'
                }}
              >
                {option.beschreibung || '\u00A0'}
              </Typography>

              <Divider sx={{ mb: 1.5, borderColor: '#e2e8f0' }} />

              {/* Preis - zentriert */}
              {option.betrag === 0 ? (
                <Box sx={{ 
                  mb: 1.5, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '60px'
                }}>
                  <TextField
                    type="number"
                    placeholder="50"
                    value={customAmounts[index] || ''}
                    onChange={(e) => handleCustomAmountChange(index, e.target.value)}
                    inputProps={{ min: 10, step: 5 }}
                    sx={{
                      width: '90px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#cbd5e0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& input': {
                        textAlign: 'center',
                        padding: '10px 8px',
                        color: '#1a202c',
                      },
                      '& input::placeholder': {
                        color: '#cbd5e0',
                        opacity: 1,
                      }
                    }}
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: '#1a202c',
                      ml: 0.5
                    }}
                  >
                    €
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 1.5,
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1a202c',
                      fontSize: '2rem'
                    }}
                  >
                    {option.betrag}€
                  </Typography>
                </Box>
              )}

              {/* Spacer */}
              <Box sx={{ flex: 1 }} />

              <Box
                component="button"
                onClick={() => handleWeiterZurZahlung(option, index)}
                sx={{
                  width: '100%',
                  bgcolor: '#1976d2',
                  color: '#ffffff',
                  py: 1.25,
                  px: 3,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'background-color 0.2s ease',
                  fontFamily: 'inherit',
                  mt: 'auto',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                  '&:active': {
                    bgcolor: '#0d47a1',
                  }
                }}
              >
                Zum Gutschein
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Unterer Divider */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ borderColor: '#e2e8f0' }} />
      </Box>
    </Box>
  );
};

export default EmbedWidget;
