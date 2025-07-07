import { Box, Button, Typography, TextField, Card, CardActionArea } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CollectionsIcon from '@mui/icons-material/Collections';
import { useState } from 'react';

interface Feld {
  typ: 'CODE' | 'TEXT' | 'WIDMUNG';
  x: number;
  y: number;
  text: string;
  editing: boolean;
}

export default function GutscheinEditor() {
  const [modus, setModus] = useState<'eigenes' | 'vorlage'>('eigenes');
  const [hintergrund, setHintergrund] = useState<string | null>(null);
  const [felder, setFelder] = useState<Feld[]>([]); // Keine Elemente initial
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleBildUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setHintergrund(url);
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" mb={2} sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutschein Editor
      </Typography>

      {/* Auswahl-Karten */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card
          sx={{
            width: 200,
            border: modus === 'eigenes' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'eigenes' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModus('eigenes')} sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: modus === 'eigenes' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Eigenes Design hochladen</Typography>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 200,
            border: modus === 'vorlage' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'vorlage' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModus('vorlage')} sx={{ p: 2, textAlign: 'center' }}>
            <CollectionsIcon sx={{ fontSize: 40, color: modus === 'vorlage' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Vorgefertigtes Design wählen</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* Hauptbereich mit Editor und Gutscheincode-Elementen */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Gutscheincode-Elemente */}
        <Box
          sx={{
            width: 200,
            padding: 2,
          }}
        >
          {modus === 'eigenes' && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 500, mb: '0.5rem' }}>
                Gutscheindesign hochladen (pdf):
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{ textTransform: 'none' }}
              >
                Datei auswählen
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBildUpload}
                  hidden
                />
              </Button>
            </Box>
          )}

          <Typography variant="subtitle1" mb={2}>
            Elemente
          </Typography>
          {!felder.some((feld) => feld.typ === 'CODE') && ( // Gutscheincode nur anzeigen, wenn es noch nicht hinzugefügt wurde
            <Box
              draggable
              onDragStart={() => setDraggedIndex(-1)} // -1 für neues Element
              sx={{
                padding: '4px 8px',
                border: '1px dashed gray',
                cursor: 'move',
                marginBottom: 2,
              }}
            >
              Gutscheincode hier
            </Box>
          )}
          {!felder.some((feld) => feld.typ === 'WIDMUNG') && ( // Widmung nur anzeigen, wenn es noch nicht hinzugefügt wurde
            <Box
              draggable
              onDragStart={() => setDraggedIndex(-2)} // -2 für neues Element
              sx={{
                padding: '4px 8px',
                border: '1px dashed gray',
                cursor: 'move',
                marginBottom: 2,
              }}
            >
              Widmung hier
            </Box>
          )}
        </Box>

        {/* Editor-Bereich */}
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
          onDragOver={(e) => e.preventDefault()} // Ermöglicht das Ablegen
          onDrop={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const newFelder = [...felder];

            if (draggedIndex === -1) {
              // Neues Gutscheincode-Element hinzufügen
              newFelder.push({
                typ: 'CODE',
                x: e.clientX - rect.left - 50,
                y: e.clientY - rect.top - 15,
                text: 'Gutscheincode hier',
                editing: false,
              });
            } else if (draggedIndex === -2) {
              // Neues Widmungs-Element hinzufügen
              newFelder.push({
                typ: 'WIDMUNG',
                x: e.clientX - rect.left - 50,
                y: e.clientY - rect.top - 15,
                text: 'Widmung hier',
                editing: false,
              });
            } else if (draggedIndex !== null) {
              // Bestehendes Element verschieben
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
          {modus === 'eigenes' && hintergrund && (
            <img
              src={hintergrund}
              alt="Hintergrund"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          )}

          {modus === 'eigenes' && felder.map((feld, index) => (
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
                minWidth: '80px',
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

      
    </Box>
  );
}
