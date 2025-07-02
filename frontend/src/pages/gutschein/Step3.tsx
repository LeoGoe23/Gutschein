import { Box, Typography, Button } from '@mui/material';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Gutscheindesign() {
  const [design, setDesign] = useState<'design1' | 'design2' | 'design3' | 'design4'>('design1');
  const [image, setImage] = useState<string | null>(null);

  const betrag = '50 €';
  const dienstleistung = '1x Massage';
  const promocode = 'ABC123';

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
      orientation: design === 'design3' || design === 'design4' ? 'portrait' : 'landscape',
      unit: 'px',
      format: design === 'design3' || design === 'design4' ? [300, 450] : [600, 300],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 
      design === 'design3' || design === 'design4' ? 300 : 600, 
      design === 'design3' || design === 'design4' ? 450 : 300
    );
    pdf.save('Gutschein.pdf');
  };

  return (
    <Box sx={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutscheindesign
      </Typography>

      <Button variant="contained" component="label">
        Bild hochladen
        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
      </Button>

      <Typography sx={{ mt: '1rem' }}>
        Design auswählen:
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* Design 1 - Querformat Elegant */}
        <Box
          onClick={() => setDesign('design1')}
          sx={{
            border: design === 'design1' ? '3px solid #00796B' : '2px solid #ccc',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            backgroundColor: '#fff',
          }}
        >
          <Box
            sx={{
              width: '300px',
              height: '150px',
              border: '2px solid #C8B560',
              backgroundColor: '#fff',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'serif',
            }}
          >
            <Typography sx={{ fontSize: '1.2rem', color: '#C8B560', fontWeight: 500 }}>
              Gutschein
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '1.2rem', color: '#C8B560' }}>{betrag}</Typography>
              <Typography sx={{ fontSize: '0.9rem' }}>{promocode}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Design 2 - Querformat Modern */}
        <Box
          onClick={() => setDesign('design2')}
          sx={{
            border: design === 'design2' ? '3px solid #00796B' : '2px solid #ccc',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            backgroundColor: '#fff',
          }}
        >
          <Box
            sx={{
              width: '300px',
              height: '150px',
              backgroundColor: '#E0F7FA',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Gutschein {dienstleistung}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '1.2rem' }}>{betrag}</Typography>
              <Typography sx={{ fontSize: '0.9rem' }}>{promocode}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Design 3 - Hochformat Minimal */}
        <Box
          onClick={() => setDesign('design3')}
          sx={{
            border: design === 'design3' ? '3px solid #00796B' : '2px solid #ccc',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            backgroundColor: '#fff',
          }}
        >
          <Box
            sx={{
              width: '150px',
              height: '225px',
              backgroundColor: '#FFF5E1',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
              Gutschein
            </Typography>
            <Typography sx={{ fontSize: '1.2rem' }}>{betrag}</Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>{promocode}</Typography>
          </Box>
        </Box>

        {/* Design 4 - Hochformat Verspielt */}
        <Box
          onClick={() => setDesign('design4')}
          sx={{
            border: design === 'design4' ? '3px solid #00796B' : '2px solid #ccc',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            backgroundColor: '#fff',
          }}
        >
          <Box
            sx={{
              width: '150px',
              height: '225px',
              backgroundColor: '#E8EAF6',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
              Geschenk für dich
            </Typography>
            <Typography sx={{ fontSize: '1.2rem' }}>{betrag}</Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>{promocode}</Typography>
          </Box>
        </Box>

      </Box>

      <Typography sx={{ mt: '2rem', fontWeight: 500 }}>
        Vorschau aktiv:
      </Typography>

      <Box
        id="gutschein-preview"
        sx={{
          width: design === 'design3' || design === 'design4' ? '300px' : '600px',
          height: design === 'design3' || design === 'design4' ? '450px' : '300px',
          border: '2px solid #ccc',
          backgroundColor:
            design === 'design1' ? '#fff' :
            design === 'design2' ? '#E0F7FA' :
            design === 'design3' ? '#FFF5E1' :
            '#E8EAF6',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <Typography sx={{ fontSize: '2rem', mb: '1rem' }}>
          {design === 'design4' ? 'Geschenk für dich' : 'Gutschein'}
        </Typography>
        <Typography sx={{ fontSize: '1.5rem' }}>{dienstleistung}</Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>{betrag}</Typography>
        <Typography sx={{ fontSize: '1rem', mt: '1rem' }}>CODE: {promocode}</Typography>
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
