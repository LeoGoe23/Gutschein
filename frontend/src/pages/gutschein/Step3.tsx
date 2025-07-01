import { Box, Typography, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Gutscheindesign() {
  const [design, setDesign] = useState<'light' | 'dark'>('light');
  const [image, setImage] = useState<string | null>(null);

  const betrag = '50 €'; // Später aus Formular übernehmen
  const dienstleistung = '1x Massage'; // Später aus Formular übernehmen
  const promocode = 'ABC123'; // Generiert oder übergeben

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('gutschein-preview');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [600, 300],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 600, 300);
    pdf.save('Gutschein.pdf');
  };

  return (
    <Box sx={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutscheindesign
      </Typography>

      <Button variant="contained" component="label">
        Bild hochladen
        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
      </Button>

      <Typography>
        Wählen Sie ein Design:
      </Typography>

      <ToggleButtonGroup
        value={design}
        exclusive
        onChange={(_, newDesign) => setDesign(newDesign)}
        sx={{ display: 'flex', gap: '1rem' }}
      >
        <ToggleButton value="light">Helles Design</ToggleButton>
        <ToggleButton value="dark">Dunkles Design</ToggleButton>
      </ToggleButtonGroup>

      <Typography sx={{ mt: '2rem', fontWeight: 500 }}>
        Vorschau:
      </Typography>

      <Box 
        id="gutschein-preview"
        sx={{
          width: '600px',
          height: '300px',
          border: '2px solid #ccc',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: design === 'light' ? '#FDFDF8' : '#1A1A1A',
          color: design === 'light' ? '#111' : '#fff',
          position: 'relative',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          
          {image && (
            <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
              <img 
                src={image} 
                alt="Logo" 
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem' }} 
              />
            </Box>
          )}

          <Typography sx={{ fontSize: '1.4rem', fontWeight: 500, mt: image ? '4rem' : 0 }}>
            {design === 'light' ? 'GUTSCHEIN FÜR' : 'DISCOUNT VOUCHER'}
          </Typography>

          <Typography sx={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {dienstleistung} {betrag ? `– ${betrag}` : ''}
          </Typography>

          <Box sx={{ border: '1px solid', padding: '0.5rem 1rem', width: 'fit-content', mt: '1rem' }}>
            CODE: {promocode}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 500, mb: '0.5rem' }}>
            {design === 'light' ? 'SPECIAL OFFER' : 'SAVE'}
          </Typography>

          <Typography sx={{ fontSize: '2.5rem', fontWeight: 700 }}>
            {betrag}
          </Typography>

          <Typography sx={{ fontSize: '0.8rem', mt: '0.5rem' }}>
            www.deine-seite.de
          </Typography>
        </Box>

      </Box>

      <Button 
        variant="outlined" 
        sx={{ mt: '2rem', maxWidth: '200px' }} 
        onClick={handleDownloadPDF}
      >
        Als PDF herunterladen
      </Button>

    </Box>
  );
}
