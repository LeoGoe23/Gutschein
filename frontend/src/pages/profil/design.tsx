import { Box, Button, TextField, Typography, Paper, Divider } from '@mui/material';
import { useState } from 'react';
import ImageIcon from '@mui/icons-material/Image';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PageContainer from '../../components/profil/PageContainer';

interface Feld {
  typ: 'CODE' | 'TEXT' | 'WIDMUNG';
  x: number;
  y: number;
  text: string;
  editing: boolean;
}

export default function GutscheinEditorPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [adresse, setAdresse] = useState('');
  const [farbe, setFarbe] = useState('#F3F4F6');
  const [firmenname, setFirmenname] = useState('Dein Firmenname');
  const [felder, setFelder] = useState<Feld[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (draggedIndex === null) return;
    const newFelder = [...felder];
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    newFelder[draggedIndex] = {
      ...newFelder[draggedIndex],
      x: e.clientX - rect.left - 50,
      y: e.clientY - rect.top - 15,
    };
    setFelder(newFelder);
    setDraggedIndex(null);
  };

  const toggleEdit = (index: number) => {
    const newFelder = [...felder];
    newFelder[index].editing = !newFelder[index].editing;
    setFelder(newFelder);
  };

  const updateText = (index: number, newText: string) => {
    const newFelder = [...felder];
    newFelder[index].text = newText;
    setFelder(newFelder);
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const previewElement = document.querySelector('#voucher-preview');

    if (previewElement) {
      const canvas = await html2canvas(previewElement as HTMLElement, {
        scale: 4,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = 10;

      doc.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      doc.save('voucher.pdf');
    }
  };

  return (
    <PageContainer title="Gutschein Editor">
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center">
            Gutschein konfigurieren
          </Typography>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ width: '100%' }}>
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

        <Box
          sx={{
            width: '55%',
            height: '650px',
            backgroundColor: farbe,
            position: 'relative',
            overflow: 'hidden',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const newFelder = [...felder];

            if (draggedIndex === -1) {
              newFelder.push({
                typ: 'CODE',
                x: e.clientX - rect.left - 50,
                y: e.clientY - rect.top - 15,
                text: 'Gutscheincode hier',
                editing: false,
              });
            } else if (draggedIndex === -2) {
              newFelder.push({
                typ: 'WIDMUNG',
                x: e.clientX - rect.left - 50,
                y: e.clientY - rect.top - 15,
                text: 'Widmung hier',
                editing: false,
              });
            } else if (draggedIndex !== null) {
              newFelder[draggedIndex] = {
                ...newFelder[draggedIndex],
                x: e.clientX - rect.left - 50,
                y: e.clientY - rect.top - 15,
              };
            }

            setFelder(newFelder);
            setDraggedIndex(null);
          }}
        >
          {logo && (
            <img
              src={logo}
              alt="Logo"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          )}
          {felder.map((feld, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: feld.x,
                top: feld.y,
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                border: '1px dashed gray',
                cursor: 'move',
              }}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDoubleClick={() => toggleEdit(index)}
            >
              {feld.editing ? (
                <TextField
                  size="small"
                  value={feld.text}
                  onChange={(e) => updateText(index, e.target.value)}
                  onBlur={() => toggleEdit(index)}
                  autoFocus
                />
              ) : (
                <span>{feld.text}</span>
              )}
            </div>
          ))}
        </Box>
      </Box>
    </PageContainer>
  );
}
