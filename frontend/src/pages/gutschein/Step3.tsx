import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Card, CardActionArea } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import PaletteIcon from '@mui/icons-material/Palette';
import 'react-resizable/css/styles.css';
import { useGutschein } from '../../context/GutscheinContext';

export default function GutscheinEditor() {
  const { data, setData } = useGutschein();
  
  const [modus, setModus] = useState<'unser-design' | 'wir-designen' | 'eigenes'>(data.gutscheinDesign.modus || 'unser-design');
  const [hintergrund, setHintergrund] = useState<string | null>(data.gutscheinDesign.hintergrund);
  const [hintergrundTyp, setHintergrundTyp] = useState<'image' | 'pdf' | null>(data.gutscheinDesign.hintergrundTyp);

  // Dynamische Daten aus dem Kontext
  const unternehmen = data.unternehmensname || data.name || "Ihr Unternehmen";
  const website = data.website || "www.ihr-unternehmen.de";
  const beispielBetrag = data.betraege?.[0] || "50";
  const beispielCode = `${data.gutscheinConfig?.prefix || 'GS'}-XXXX-XXXX`;
  const gueltigBis = new Date(Date.now() + ((data.gutscheinConfig?.gueltigkeitTage || 365) * 24 * 60 * 60 * 1000)).toLocaleDateString('de-DE');

  const handleBildUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      let typ: 'image' | 'pdf';
      if (file.type === 'application/pdf') {
        typ = 'pdf';
      } else if (file.type.startsWith('image/')) {
        typ = 'image';
      } else {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setHintergrund(base64String);
        setHintergrundTyp(typ);
        
        // Speichere im Context
        setData({
          gutscheinDesign: {
            ...data.gutscheinDesign,
            hintergrund: base64String,
            hintergrundTyp: typ
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const setModusAndSave = (newModus: 'unser-design' | 'wir-designen' | 'eigenes') => {
    setModus(newModus);
    setData({
      gutscheinDesign: {
        ...data.gutscheinDesign,
        modus: newModus
      }
    });
  };

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" mb={2} sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutschein Editor
      </Typography>

      {/* Auswahl-Karten */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card
          sx={{
            width: 200,
            border: modus === 'unser-design' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'unser-design' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModusAndSave('unser-design')} sx={{ p: 2, textAlign: 'center' }}>
            <PaletteIcon sx={{ fontSize: 40, color: modus === 'unser-design' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Unser Design verwenden</Typography>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 200,
            border: modus === 'wir-designen' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'wir-designen' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModusAndSave('wir-designen')} sx={{ p: 2, textAlign: 'center' }}>
            <DesignServicesIcon sx={{ fontSize: 40, color: modus === 'wir-designen' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Wir designen</Typography>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 200,
            border: modus === 'eigenes' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'eigenes' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModusAndSave('eigenes')} sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: modus === 'eigenes' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Ihr Design hochladen</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* Hauptbereich mit Editor und Gutscheincode-Elementen */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {modus === 'unser-design' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* A4 Vorschau - Unser Design */}
            <Box
              sx={{
                border: '1px solid gray',
                width: 595,
                height: 842,
                position: 'relative',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                mb: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* Unternehmensbild im oberen Bereich */}
              {data.bild && (
                <Box
                  sx={{
                    width: '100%',
                    height: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    borderBottom: '3px solid #1976d2',
                    mb: 3,
                  }}
                >
                  <img
                    src={typeof data.bild === 'string' ? data.bild : URL.createObjectURL(data.bild)}
                    alt="Unternehmensbild"
                    style={{
                      maxWidth: '400px',
                      maxHeight: '250px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                </Box>
              )}

              {/* Gutschein-Inhalt */}
              <Box
                sx={{
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  height: data.bild ? 'calc(100% - 280px)' : '100%',
                  justifyContent: 'center',
                }}
              >
                {/* Überschrift */}
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#1976d2',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  GUTSCHEIN
                </Typography>

                {/* Unternehmen */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    textAlign: 'center',
                    color: '#333',
                    mb: 2,
                  }}
                >
                  {unternehmen}
                </Typography>

                {/* Betrag */}
                <Box
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    borderRadius: '15px',
                    padding: '20px 40px',
                    boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: '#ffffff',
                    }}
                  >
                    € {beispielBetrag}
                  </Typography>
                </Box>

                {/* Gutscheincode */}
                <Box
                  sx={{
                    border: '2px dashed #1976d2',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    mt: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      color: '#1976d2',
                      letterSpacing: '2px',
                    }}
                  >
                    {beispielCode}
                  </Typography>
                </Box>

                {/* Gültigkeit */}
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    color: '#666',
                    fontWeight: 500,
                    mt: 2,
                  }}
                >
                  Gültig bis: {gueltigBis}
                </Typography>

                {/* Website */}
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    color: '#1976d2',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {website}
                </Typography>

                {/* Abschlusstext */}
                <Box
                  sx={{
                    mt: 3,
                    padding: '10px 20px',
                    borderTop: '1px solid #e0e0e0',
                    width: '100%',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      color: '#666',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                    }}
                  >
                    Wir freuen uns auf Sie!
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : modus === 'wir-designen' ? (
          <Box sx={{ width: '100%', textAlign: 'left', mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Wir erstellen den Gutschein!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Unser Team wird Ihre Website analysieren und einen personalisierten Gutschein für Sie erstellen – frei Haus! Das kann später jederzeit in den Einstellungen geändert werden.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Upload-Bereich */}
            <Box
              sx={{
                width: 300,
                padding: 2,
              }}
            >
              <Typography sx={{ fontWeight: 500, mb: 2 }}>
                Gutscheindesign hochladen:
              </Typography>
              
              <Button
                variant="contained"
                component="label"
                sx={{ 
                  textTransform: 'none',
                  mb: 2,
                  width: '100%',
                }}
              >
                Datei auswählen
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleBildUpload}
                  hidden
                />
              </Button>
              
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 3 }}>
                Wir passen Ihr Design leicht an, um Code und Betrag dynamisch anzupassen. 
                Dies erfolgt in den nächsten 12h nach Registrierung.
              </Typography>

              {/* Vorschau des hochgeladenen Designs */}
              {hintergrund && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Vorschau:
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden',
                      maxHeight: 200,
                    }}
                  >
                    {hintergrundTyp === 'image' ? (
                      <img
                        src={hintergrund}
                        alt="Design Vorschau"
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '200px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          padding: 2,
                          textAlign: 'center',
                          backgroundColor: '#f5f5f5',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          PDF hochgeladen
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            {/* A4 Vorschau - falls Design hochgeladen */}
            {hintergrund && (
              <Box
                sx={{
                  border: '1px solid gray',
                  width: 595,
                  height: 842,
                  position: 'relative',
                  backgroundColor: '#fafafa',
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                {hintergrundTyp === 'image' && (
                  <img
                    src={hintergrund}
                    alt="Hintergrund"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      position: 'absolute',
                      objectFit: 'contain',
                      objectPosition: 'center'
                    }}
                  />
                )}
                {hintergrundTyp === 'pdf' && (
                  <embed
                    src={hintergrund}
                    type="application/pdf"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      border: 'none'
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}