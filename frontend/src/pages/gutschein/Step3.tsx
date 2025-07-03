import { Box, Typography, Button, TextField, MenuItem, Select } from '@mui/material';
import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function GutscheinDesigner() {
  const [fuer, setFuer] = useState('');
  const [von, setVon] = useState('');
  const [widmung, setWidmung] = useState('');
  const [farbe, setFarbe] = useState('#00796B');
  const [schriftart, setSchriftart] = useState('serif');
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('gutschein-vorschau');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [400, 600] });
    pdf.addImage(imgData, 'PNG', 0, 0, 400, 600);
    pdf.save('Gutschein.pdf');
  };

  return (
    <Box sx={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', p: '2rem', fontFamily: 'system-ui, sans-serif' }}>

      {/* Linke Vorschau */}
      <Box sx={{ border: '1px solid #ccc', width: '300px', backgroundColor: '#FDF8F0' }}>
        <Box sx={{ backgroundColor: farbe, height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {image ? (
            <img src={image} alt="Logo" style={{ maxHeight: '100px' }} />
          ) : (
            <Typography sx={{ color: '#fff', fontSize: '1.2rem' }}>Ihr Logo</Typography>
          )}
        </Box>

        <Box sx={{ p: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: schriftart }}>
          <Typography>Sie können diesen Gutschein personalisieren.</Typography>

          <Typography sx={{ fontSize: '0.9rem' }}>für</Typography>
          <Typography sx={{ borderBottom: '1px solid #333', minHeight: '2rem' }}>{fuer}</Typography>

          <Typography sx={{ fontSize: '0.9rem' }}>von</Typography>
          <Typography sx={{ borderBottom: '1px solid #333', minHeight: '2rem' }}>{von}</Typography>

          <Typography sx={{ fontSize: '0.9rem' }}>Widmung</Typography>
          <Typography sx={{ minHeight: '4rem', border: '1px solid #ddd', p: '0.5rem' }}>{widmung}</Typography>

          <Button onClick={handleDownload} variant="outlined" sx={{ mt: '1rem' }}>
            PDF Download
          </Button>
        </Box>
      </Box>

      {/* Rechte Einstellungen */}
      <Box sx={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>Gutschein anpassen</Typography>

        <TextField label="Für" value={fuer} onChange={(e) => setFuer(e.target.value)} />
        <TextField label="Von" value={von} onChange={(e) => setVon(e.target.value)} />
        <TextField
          label="Widmung"
          multiline
          rows={3}
          value={widmung}
          onChange={(e) => setWidmung(e.target.value)}
          inputProps={{ maxLength: 160 }}
          helperText={`${160 - widmung.length} Zeichen übrig`}
        />

        <Typography sx={{ mt: '1rem' }}>Farbe wählen</Typography>
        <input type="color" value={farbe} onChange={(e) => setFarbe(e.target.value)} style={{ width: '100%', height: '2rem' }} />

        <Typography>Schriftart wählen</Typography>
        <Select value={schriftart} onChange={(e) => setSchriftart(e.target.value)} fullWidth>
          <MenuItem value="serif">Serif (klassisch)</MenuItem>
          <MenuItem value="sans-serif">Sans-Serif (modern)</MenuItem>
          <MenuItem value="cursive">Cursive (verspielt)</MenuItem>
        </Select>

        <Typography sx={{ mt: '1rem' }}>Logo oder Bild hochladen</Typography>
        <Button variant="outlined" component="label">
          Datei wählen
          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
        </Button>
      </Box>
    </Box>
  );
}
