import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Divider, TextField } from '@mui/material';
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
  const [error, setError] = useState('');
  const [customAmounts, setCustomAmounts] = useState<{[key: number]: string}>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // URL parameters für Customization
  const params = new URLSearchParams(window.location.search);
  const primaryColor = params.get('primaryColor') || '#1976d2';
  const fontFamily = params.get('fontFamily') || (slug?.toUpperCase() === 'JANKIP' 
    ? "'Cormorant Garamond', Georgia, serif" 
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
  const backgroundColor = params.get('backgroundColor') || 'transparent';
  const parentOrigin = (() => {
    try {
      return document.referrer ? new URL(document.referrer).origin : '*';
    } catch {
      return '*';
    }
  })();

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      try {
        const data = await loadCheckoutDataBySlug(slug);
        
        if (data) {
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
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollLeft(container.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - container.scrollLeft > 8);
    };

    updateScrollState();
    const rafId = window.requestAnimationFrame(updateScrollState);

    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [options, loading]);

  useEffect(() => {
    const updateHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'gutschein-widget-resize', height }, parentOrigin);
    };

    // Setze body background auf transparent
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [loading, options, backgroundColor, parentOrigin, canScrollLeft, canScrollRight]);

  const scrollCards = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-widget-card="true"]')
    );
    if (cards.length === 0) return;

    const currentLeft = container.scrollLeft;
    let targetIndex = 0;

    if (direction === 'right') {
      const nextIndex = cards.findIndex((card) => card.offsetLeft > currentLeft + 8);
      targetIndex = nextIndex === -1 ? cards.length - 1 : nextIndex;
    } else {
      const prevCandidates = cards
        .map((card, index) => ({ index, left: card.offsetLeft }))
        .filter((item) => item.left < currentLeft - 8);
      targetIndex = prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1].index : 0;
    }

    container.scrollTo({
      left: cards[targetIndex].offsetLeft,
      behavior: 'smooth'
    });
  };

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
    }, parentOrigin);
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
      px: { xs: 0, md: 2 },
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

      {options.length > 1 && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            px: 0.5
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.75,
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Box
              component="button"
              onClick={() => scrollCards('left')}
              disabled={!canScrollLeft}
              sx={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid #dbe2ea',
                bgcolor: 'white',
                color: '#1f2937',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                opacity: canScrollLeft ? 1 : 0.35,
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: 0,
                boxShadow: canScrollLeft ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: canScrollLeft ? 'translateY(-1px)' : 'none',
                  boxShadow: canScrollLeft ? '0 4px 10px rgba(0,0,0,0.12)' : 'none',
                  borderColor: canScrollLeft ? '#c8d2de' : '#dbe2ea'
                }
              }}
            >
              {'<'}
            </Box>

            <Box
              component="button"
              onClick={() => scrollCards('right')}
              disabled={!canScrollRight}
              sx={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid #dbe2ea',
                bgcolor: 'white',
                color: '#1f2937',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                opacity: canScrollRight ? 1 : 0.35,
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: 0,
                boxShadow: canScrollRight ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: canScrollRight ? 'translateY(-1px)' : 'none',
                  boxShadow: canScrollRight ? '0 4px 10px rgba(0,0,0,0.12)' : 'none',
                  borderColor: canScrollRight ? '#c8d2de' : '#dbe2ea'
                }
              }}
            >
              {'>'}
            </Box>
          </Box>
        </Box>
      )}

      <Box 
        ref={scrollContainerRef}
        sx={{ 
          display: 'flex',
          overflowX: 'auto',
          gap: { xs: 1.5, md: 3 },
          pb: 2,
          px: { xs: 0, md: 1 },
          alignItems: 'stretch',
          justifyContent: options.length <= 3 ? 'center' : 'flex-start',
          scrollSnapType: { xs: 'x mandatory', md: 'none' },
          WebkitOverflowScrolling: 'touch',
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
            data-widget-card="true"
            sx={{
              minWidth: { xs: '92vw', sm: '260px' },
              flex: '1 1 280px',
              maxWidth: '360px',
              scrollSnapAlign: { xs: 'start', md: 'none' },
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
                          borderColor: primaryColor,
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
                  bgcolor: primaryColor,
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
                    opacity: 0.92,
                  },
                  '&:active': {
                    opacity: 0.85,
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
