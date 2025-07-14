import { Box, Button, Typography, TextField, Card, CardActionArea } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import { useState } from 'react';
import { ResizableBox } from 'react-resizable'; // Hinzufügen der Resizable-Komponente
import 'react-resizable/css/styles.css'; // CSS für Resizable-Komponente importieren

interface Feld {
  typ: 'CODE' | 'TEXT' | 'BETRAG';
  x: number;
  y: number;
  width: number; // Neue Eigenschaft für Breite
  height: number; // Neue Eigenschaft für Höhe
  text: string;
  editing: boolean;
}

export default function GutscheinEditor() {
  const [modus, setModus] = useState<'eigenes' | 'vorlage' | 'designen'>('eigenes');
  const [hintergrund, setHintergrund] = useState<string | null>(null);
  const [hintergrundTyp, setHintergrundTyp] = useState<'image' | 'pdf' | null>(null);
  const [felder, setFelder] = useState<Feld[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState<boolean[]>([]); // State für Skalierung

  const handleBildUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setHintergrund(url);
      
      // Bestimme den Dateityp
      if (file.type === 'application/pdf') {
        setHintergrundTyp('pdf');
      } else if (file.type.startsWith('image/')) {
        setHintergrundTyp('image');
      }
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

  const handleResizeStart = (index: number) => {
    const resizingState = [...isResizing];
    resizingState[index] = true;
    setIsResizing(resizingState);
  };

  const handleResizeStop = (index: number, data: { size: { width: number; height: number } }) => {
    const resizingState = [...isResizing];
    resizingState[index] = false;
    setIsResizing(resizingState);

    const newFelder = [...felder];
    newFelder[index] = {
      ...newFelder[index],
      width: data.size.width,
      height: data.size.height,
    };
    setFelder(newFelder);
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
            border: modus === 'eigenes' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'eigenes' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModus('eigenes')} sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: modus === 'eigenes' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Design hochladen/ Design auswählen</Typography>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 200,
            border: modus === 'designen' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'designen' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModus('designen')} sx={{ p: 2, textAlign: 'center' }}>
            <DesignServicesIcon sx={{ fontSize: 40, color: modus === 'designen' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Wir designen den Gutschein</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* Hauptbereich mit Editor und Gutscheincode-Elementen */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {modus === 'designen' ? (
          <Box sx={{ width: '100%', textAlign: 'left', mt: 4 }}> {/* textAlign auf 'left' geändert */}
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Wir erstellen den Gutschein!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Unser Team wird Ihre Website analysieren und einen personalisierten Gutschein für Sie erstellen – frei Haus! Das kann später jederzeit in den Einstellungen geändert werden.
            </Typography>
          </Box>
        ) : (
          <>
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
                    Gutscheindesign hochladen:
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    sx={{ textTransform: 'none', mb: 2 }}
                  >
                    Datei auswählen
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleBildUpload}
                      hidden
                    />
                  </Button>

                  {/* Button für Gutscheindesign auswählen */}
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ textTransform: 'none' }}
                    onClick={() => console.log('Gutscheindesign auswählen')}
                  >
                    Design auswählen
                  </Button>
                </Box>
              )}

              <Typography variant="subtitle1" mb={2}>
                Elemente
              </Typography>
              {!felder.some((feld) => feld.typ === 'CODE') && (
                <Box
                  draggable
                  onDragStart={() => setDraggedIndex(-1)}
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
              {!felder.some((feld) => feld.typ === 'BETRAG') && (
                <Box
                  draggable
                  onDragStart={() => setDraggedIndex(-2)}
                  sx={{
                    padding: '4px 8px',
                    border: '1px dashed gray',
                    cursor: 'move',
                    marginBottom: 2,
                  }}
                >
                  Betrag / Dienstleistung
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const newFelder = [...felder];

                if (draggedIndex === -1) {
                  newFelder.push({
                    typ: 'CODE',
                    x: e.clientX - rect.left - 50,
                    y: e.clientY - rect.top - 15,
                    width: 100, // Standardbreite
                    height: 50, // Standardhöhe
                    text: 'Gutscheincode hier',
                    editing: false,
                  });
                } else if (draggedIndex === -2) {
                  newFelder.push({
                    typ: 'BETRAG',
                    x: e.clientX - rect.left - 50,
                    y: e.clientY - rect.top - 15,
                    width: 100,
                    height: 50,
                    text: 'Betrag / Dienstleistung',
                    editing: false,
                  });
                }

                setFelder(newFelder);
                setDraggedIndex(null);
              }}
            >
              {modus === 'eigenes' && hintergrund && (
                <>
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
                </>
              )}

              {modus === 'eigenes' && felder.map((feld, index) => {
                return (
                  <div
                    key={index}
                    draggable={!isResizing[index]} // Deaktivieren von draggable während des Skalierens
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={(e) => {
                      const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                      const newFelder = [...felder];
                      newFelder[index] = {
                        ...newFelder[index],
                        x: e.clientX - rect.left - feld.width / 2,
                        y: e.clientY - rect.top - feld.height / 2,
                      };
                      setFelder(newFelder);
                    }}
                    style={{
                      position: 'absolute',
                      left: feld.x,
                      top: feld.y,
                      cursor: isResizing[index] ? 'default' : 'move', // Cursor ändern, wenn skaliert wird
                    }}
                  >
                    <ResizableBox
                      width={feld.width}
                      height={feld.height}
                      minConstraints={[50, 30]} // Mindestgröße
                      maxConstraints={[300, 200]} // Maximalgröße
                      onResizeStart={() => handleResizeStart(index)} // Skalierung starten
                      onResizeStop={(e, data) => handleResizeStop(index, data)} // Skalierung beenden
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: '1px dashed gray',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: Math.min(feld.width / 10, feld.height / 2), // Dynamische Textgröße
                          textAlign: 'center',
                        }}
                      >
                        <span>{feld.text}</span>
                      </div>
                    </ResizableBox>
                  </div>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
