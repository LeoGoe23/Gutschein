import { Box, Button, TextField, Typography, Paper, Divider } from '@mui/material';
import { useState } from 'react';
import ImageIcon from '@mui/icons-material/Image';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download'; // Importiere das Download-Icon
import { jsPDF } from 'jspdf'; // Importiere die jspdf-Bibliothek
import html2canvas from 'html2canvas'; // Importiere html2canvas für bessere PDF-Darstellung
import PageContainer from '../../components/profil/PageContainer'; // Importiere PageContainer

export default function GutscheinEditorPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [adresse, setAdresse] = useState('');
  const [farbe, setFarbe] = useState('#F3F4F6'); // Helles Grau Standard
  const [firmenname, setFirmenname] = useState('Dein Firmenname'); // Neuer State für Firmenname

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('portrait', 'mm', 'a4'); // PDF im Hochformat
    const previewElement = document.querySelector('#voucher-preview');

    if (previewElement) {
      const canvas = await html2canvas(previewElement as HTMLElement, {
        scale: 4, // Höhere Auflösung für bessere Qualität
        useCORS: true, // Bilder korrekt laden
      });
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = 210; // Breite der A4-Seite in mm
      const pageHeight = 297; // Höhe der A4-Seite in mm
      const imgWidth = pageWidth - 20; // Breite mit Rand
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Höhe proportional zur Breite

      // Zentrierung des Bildes auf der Seite
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = 10; // Mehr Platz oben für das Bild

      doc.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      doc.save('voucher.pdf');
    }
  };

  return (
    <PageContainer title="Gutschein Editor">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2, // Abstand zwischen den Bereichen reduziert
          mt: 3, // Verschiebt den gesamten Container etwas nach unten
        }}
      >
        {/* Linker Bereich – Konfiguration */}
        <Box
          sx={{
            width: '35%', // Etwas breiter für bessere Balance
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mt: 2, // Verschiebt den linken Bereich etwas nach unten
          }}
        >
          <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
            Gutschein konfigurieren
          </Typography>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ width: '100%' }} // Button breiter machen
          >
            Logo/Bild hochladen
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </Button>

          <TextField
            label="Firmenname"
            value={firmenname}
            onChange={(e) => setFirmenname(e.target.value)}
            fullWidth
            placeholder="Dein Firmenname"
          />

          <TextField
            label="Kurzer Text (optional)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <TextField
            label="Adresse oder Website (optional)"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            fullWidth
          />

          <TextField
            label="Hintergrundfarbe (HEX)"
            value={farbe}
            onChange={(e) => setFarbe(e.target.value)}
            fullWidth
            placeholder="#F3F4F6"
          />

          <Button variant="contained" sx={{ mt: 2, width: '100%' }}>
            Design speichern
          </Button>
        </Box>

        {/* Rechter Bereich – Gutschein Vorschau */}
        <Box
          sx={{
            width: '55%', // Vorschau etwas breiter machen
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', // Für das Icon oben rechts
          }}
        >
          {/* PDF-Download Icon oben rechts */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadPDF}
              sx={{
                minWidth: 'auto',
                padding: 1,
              }}
            >
              <DownloadIcon />
            </Button>
          </Box>

          <Paper
            id="voucher-preview"
            elevation={3}
            sx={{
              width: '100%', // Vorschau breiter machen
              height: '650px', // Höhe leicht reduzieren
              backgroundColor: farbe,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              padding: 3, // Mehr Padding für bessere Darstellung
            }}
          >
            {/* Logo oder Platzhalter */}
            <Box
              sx={{
                height: '33.33%', // Das obere Drittel ausfüllen
                backgroundColor: '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2, // Abstand für Logo
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'cover', // Bild vollständig ausfüllen
                  }}
                />
              ) : (
                <ImageIcon sx={{ fontSize: 50, color: '#9CA3AF' }} />
              )}
            </Box>

            <Box
              sx={{
                flex: 1,
                padding: 3, // Mehr Abstand für Inhalte
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                {/* Dynamischer Firmenname */}
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ fontSize: '1.2rem', mb: 2 }} // Mehr Abstand
                >
                  {firmenname}
                </Typography>

                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ fontSize: '1.4rem', mb: 2 }} // Mehr Abstand
                >
                  Gutschein für
                </Typography>

                <Typography
                  variant="body1"
                  color="primary"
                  sx={{
                    mt: 1,
                    fontWeight: 'bold',
                    backgroundColor: '#E5E7EB',
                    borderRadius: 1,
                    padding: '8px 16px', // Größere Schrift und Abstand
                    display: 'inline-block',
                    fontSize: '1.1rem',
                  }}
                >
                  60 Minuten Massage
                </Typography>

                {/* Feste Von/Für Box */}
                <Box
                  sx={{
                    mt: 3, // Mehr Abstand
                    p: 2, // Mehr Padding
                    border: '1px dashed #9CA3AF',
                    borderRadius: 1,
                    mx: 'auto',
                    maxWidth: '80%',
                  }}
                >
                  <Typography
                    sx={{ fontStyle: 'italic', fontSize: '0.9rem' }} // Größere Schrift
                  >
                    Von: Max Mustermann
                  </Typography>
                  <Typography
                    sx={{ fontStyle: 'italic', fontSize: '0.9rem' }} // Größere Schrift
                  >
                    Für: Lisa Beispiel
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 1, fontSize: '0.9rem' }} // Größere Schrift
                  >
                    Für deinen besonderen Tag...
                  </Typography>
                </Box>

                {text && (
                  <Typography sx={{ mt: 2, fontSize: '1rem' }}> {/* Größere Schrift */}
                    {text}
                  </Typography>
                )}
              </Box>

              <Box>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem' }} // Größere Schrift
                >
                  Gutscheincode: ABCD1234
                </Typography>
                {adresse && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, fontSize: '0.8rem' }} // Größere Schrift
                  >
                    {adresse}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </PageContainer>
  );
}
