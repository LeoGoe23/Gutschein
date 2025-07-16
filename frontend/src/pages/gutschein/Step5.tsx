import { Box, Typography, Button, Stack, Card, CardContent, CircularProgress } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';
import { Key, ReactElement, useState } from 'react';
import { Email, Phone, Person, Business, DesignServices, Image as ImageIcon, Build } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { saveGutscheinData } from '../../utils/saveToFirebase';

export default function Zusammenfassung() {
  const { data, clearData } = useGutschein();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = () => {
    navigate('/checkoutdemo');
  };

  const handleAbschliessen = async () => {
    console.log('🔄 Starting completion process...');
    console.log('📋 Current context data:', data);
    
    setIsLoading(true);
    try {
      const result = await saveGutscheinData(data);
      
      // Erfolgreich gespeichert
      console.log('✅ Gutschein-Setup abgeschlossen:', result);
      
      // Daten löschen und zur Link-Seite navigieren
      clearData();
      navigate('/Success'); // ← Ändere von '/profil' zu '/link'
      
    } catch (error) {
      console.error('❌ Fehler beim Abschließen:', error);
      
      // Bessere Fehlerbehandlung
      let errorMessage = 'Unbekannter Fehler beim Speichern.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Fehler beim Speichern: ${errorMessage}\n\nBitte versuchen Sie es erneut oder kontaktieren Sie den Support.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zusammenfassung
      </Typography>
      <Typography sx={{ fontSize: '1rem', color: '#666', mb: '1rem' }}>
        Sie können Ihre Daten jederzeit auf unserer Website ändern.
      </Typography>

      {/* Persönliche Daten */}
      <Box sx={{ border: '1px solid #ddd', borderRadius: '1rem', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        <Typography sx={{ fontWeight: 500, mb: '1.5rem', color: '#333' }}>
          Persönliche Daten:
        </Typography>
        
        <Stack spacing={2}>
          <Stack direction="row" spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Person sx={{ color: '#4CAF50', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>Name: {data.nachname}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Email sx={{ color: '#2196F3', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>E-Mail: {data.email}</Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Phone sx={{ color: '#FF9800', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>Telefon: {data.telefon}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <Business sx={{ color: '#9C27B0', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 500 }}>IBAN: {data.iban}</Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* Gutschein-Design */}
      <Box sx={{ border: '1px solid #ddd', borderRadius: '1rem', padding: '2rem', backgroundColor: '#FAFAFA' }}>
        <Typography sx={{ fontWeight: 500, mb: '1.5rem', color: '#333' }}>
          Gutschein-Design:
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {data.gutscheinDesign.modus === 'designen' ? (
              <Build sx={{ color: '#FF5722', fontSize: '1.5rem' }} />
            ) : (
              <DesignServices sx={{ color: '#2196F3', fontSize: '1.5rem' }} />
            )}
            <Typography sx={{ fontWeight: 500 }}>
              Modus: {data.gutscheinDesign.modus === 'designen' ? 'Wir designen den Gutschein' : 'Eigenes Design'}
            </Typography>
          </Box>

          {data.gutscheinDesign.modus === 'eigenes' && (
            <>
              {data.gutscheinDesign.selectedDesign && (
                <Card sx={{ maxWidth: 400, mt: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 80,
                          height: 60,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                        }}
                      >
                        <img
                          src={data.gutscheinDesign.selectedDesign.image}
                          alt={data.gutscheinDesign.selectedDesign.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {data.gutscheinDesign.selectedDesign.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {data.gutscheinDesign.selectedDesign.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {data.gutscheinDesign.hintergrund && !data.gutscheinDesign.selectedDesign && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    Hochgeladenes Design:
                  </Typography>
                  <Box
                    sx={{
                      width: 200,
                      height: 150,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    {data.gutscheinDesign.hintergrundTyp === 'image' ? (
                      <img
                        src={data.gutscheinDesign.hintergrund}
                        alt="Hochgeladenes Design"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <ImageIcon sx={{ fontSize: 40, color: '#666' }} />
                        <Typography variant="body2" color="text.secondary">
                          PDF-Datei
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {data.gutscheinDesign.felder.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    Platzierte Elemente: {data.gutscheinDesign.felder.length}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {data.gutscheinDesign.felder.map((feld: { typ: string; }, index: Key | null | undefined) => (
                      <Box
                        key={index}
                        sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: feld.typ === 'CODE' ? '#E3F2FD' : '#F3E5F5',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {feld.typ === 'CODE' ? 'Gutscheincode' : 'Betrag/Dienstleistung'}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}

          {data.gutscheinDesign.modus === 'designen' && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Unser Team erstellt ein individuelles Design basierend auf Ihrer Website und Ihren Angaben.
            </Typography>
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: '2rem' }}>
        <Button
          variant="contained"
          onClick={handlePreview}
          sx={{
            backgroundColor: '#607D8B',
            color: '#fff',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '2rem',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: '#546E7A',
            },
          }}
        >
          Vorschau: Was sieht Ihr Kunde
        </Button>

        <Button
          variant="contained"
          onClick={handleAbschliessen}
          disabled={isLoading}
          sx={{
            backgroundColor: '#2E7D66',
            color: '#fff',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '2rem',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: '#245a4f',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
            },
          }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Speichere...
            </>
          ) : (
            'Abschließen'
          )}
        </Button>
      </Stack>

      {/* Reset-Button */}
      <Button
        variant="outlined"
        onClick={() => clearData()}
        sx={{
          mt: '1rem',
          color: '#FF5722',
          borderColor: '#FF5722',
          padding: '0.5rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: '2rem',
          '&:hover': {
            backgroundColor: '#FFEBEE',
            borderColor: '#FF5722',
          },
        }}
      >
        Zurücksetzen
      </Button>

    </Box>
  );
}
