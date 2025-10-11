import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, TextField, Switch, FormControlLabel, Chip } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../auth/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// A4 Größe in Pixel bei 72 DPI (Standard für jsPDF)
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

const calculatePreviewDimensions = () => ({
  width: A4_WIDTH_PX,
  height: A4_HEIGHT_PX
});

// ✅ NEU: Intelligente Textaufteilung-Funktion
const formatTextForDisplay = (text: string, maxLength: number = 25) => {
  if (text.length <= maxLength) {
    return text; // Kurzer Text: keine Änderung
  }
  
  // ✅ STRATEGIE 1: Bei Sonderzeichen wie ® umbrechen
  if (text.includes('®')) {
    const parts = text.split('®');
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}®
          <br />
          {parts[1].trim()}
        </>
      );
    }
  }
  
  // ✅ STRATEGIE 2: Bei "Massage" umbrechen
  if (text.includes('Massage')) {
    const beforeMassage = text.substring(0, text.indexOf('Massage') + 7); // "Massage" mit einschließen
    const afterMassage = text.substring(text.indexOf('Massage') + 7).trim();
    
    if (afterMassage) {
      return (
        <>
          {beforeMassage}
          <br />
          {afterMassage}
        </>
      );
    }
  }
  
  // ✅ STRATEGIE 3: Nach der Hälfte der Wörter umbrechen
  const words = text.split(' ');
  if (words.length >= 3) {
    const midPoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midPoint).join(' ');
    const secondLine = words.slice(midPoint).join(' ');
    
    return (
      <>
        {firstLine}
        <br />
        {secondLine}
      </>
    );
  }
  
  // ✅ FALLBACK: Einfach in der Mitte trennen
  const midPoint = Math.floor(text.length / 2);
  const splitPoint = text.lastIndexOf(' ', midPoint) || midPoint;
  
  return (
    <>
      {text.substring(0, splitPoint)}
      <br />
      {text.substring(splitPoint).trim()}
    </>
  );
};

export default function GutscheinDesignAdminEdit() {
  const { shopId } = useParams<{ shopId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<any>(null);
  const [designURL, setDesignURL] = useState<string | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [betragConfig, setBetragConfig] = useState({ y: 200, size: 32, width: 80 }); // ✅ width hinzugefügt
  const [codeConfig, setCodeConfig] = useState({ y: 250, size: 24, width: 70 });     // ✅ width hinzugefügt
  const [previewDimensions, setPreviewDimensions] = useState<{width: number, height: number}>(calculatePreviewDimensions());
  const [slug, setSlug] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const fetchShop = async () => {
      try {
        if (!shopId) {
          setError('Ungültige Shop-ID!');
          setLoading(false);
          return;
        }
        const docRef = doc(db, 'users', shopId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCheckout(data.Checkout);
          setDesignURL(data.Checkout?.GutscheinDesignURL || null);
          setSlug(data.slug || shopId);
          // ✅ Auch width laden
          setBetragConfig({ 
            y: data.Checkout?.DesignConfig?.betrag?.y || 200, 
            size: data.Checkout?.DesignConfig?.betrag?.size || 32,
            width: data.Checkout?.DesignConfig?.betrag?.width || 80 // ✅ NEU
          });
          setCodeConfig({ 
            y: data.Checkout?.DesignConfig?.code?.y || 250, 
            size: data.Checkout?.DesignConfig?.code?.size || 24,
            width: data.Checkout?.DesignConfig?.code?.width || 70 // ✅ NEU
          });
        } else {
          setError('Shop nicht gefunden');
        }
      } catch (err) {
        setError('Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopId]);

  // Design-Upload
  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setDesignFile(e.target.files[0]);
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setPreviewDimensions(calculatePreviewDimensions());
    }
  };

  // Lade existierendes Design
  useEffect(() => {
    const loadExistingDesign = async () => {
      if (designURL && !designFile) {
        setPreviewImage(designURL);
        setPreviewDimensions(calculatePreviewDimensions());
      }
    };
    loadExistingDesign();
  }, [designURL, designFile]);

  // PDF Download
  const downloadAsPDF = async () => {
    const previewElement = document.getElementById('design-preview');
    if (!previewElement) return;

    previewElement.style.border = 'none';
    previewElement.style.boxShadow = 'none';

    try {
      const canvas = await html2canvas(previewElement, {
        backgroundColor: '#ffffff',
        scale: 4,
        useCORS: true,
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [A4_WIDTH_PX, A4_HEIGHT_PX]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);
      pdf.save(`gutschein-design-${checkout?.Unternehmensname || 'shop'}.pdf`);
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Fehler beim PDF-Export');
    } finally {
      previewElement.style.border = '4px solid #1976d2';
      previewElement.style.boxShadow = '0 0 24px 4px rgba(25,118,210,0.15)';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let url = designURL;
      if (designFile && slug) {
        const ext = designFile.name.split('.').pop();
        const storageRef = ref(storage, `seiten/${slug}/voucher-design.${ext}`);
        await uploadBytes(storageRef, designFile);
        url = await getDownloadURL(storageRef);
      }
      if (!shopId) {
        alert('Ungültige Shop-ID!');
        setLoading(false);
        return;
      }
      // ✅ KORRIGIERT: Auch width speichern
      await updateDoc(doc(db, 'users', shopId), {
        'Checkout.GutscheinDesignURL': url || null,
        'Checkout.DesignConfig': {
          betrag: {
            x: A4_WIDTH_PX / 2, // IMMER zentriert
            y: betragConfig.y,
            size: betragConfig.size,
            width: betragConfig.width // ✅ NEU
          },
          code: {
            x: A4_WIDTH_PX / 2, // IMMER zentriert
            y: codeConfig.y,
            size: codeConfig.size,
            width: codeConfig.width // ✅ NEU
          }
        }
      });
      setDesignURL(url);
      alert('Design und Einstellungen gespeichert!');
    } catch (err) {
      alert('Fehler beim Speichern');
    }
    setLoading(false);
  };

  // Überarbeitete Drag-Funktionen mit optionaler horizontaler Bewegung
  const handleMouseDown = (e: React.MouseEvent, type: 'betrag' | 'code') => {
    e.preventDefault();
    setIsDragging(type);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: 0, // ❌ Nicht mehr verwendet
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const previewElement = document.getElementById('design-preview');
    if (!previewElement) return;
    
    const rect = previewElement.getBoundingClientRect();
    
    // ✅ NUR Y-Position ändern
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
    
    if (isDragging === 'betrag') {
      setBetragConfig(cfg => ({ ...cfg, y }));
    } else if (isDragging === 'code') {
      setCodeConfig(cfg => ({ ...cfg, y }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  const previewStyle = {
    position: 'relative' as const,
    width: previewDimensions.width,
    height: previewDimensions.height,
    maxWidth: '100%',
    background: previewImage ? 'transparent' : '#f0f0f0',
    border: previewImage ? 'none' : '2px dashed #ccc',
    borderRadius: 8,
    overflow: 'hidden',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{
        position: 'absolute',
        top: { xs: '0.5rem', md: '1.5rem' },
        right: { xs: '1rem', md: '4rem' },
        zIndex: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'center'
      }}>
        <TopBar />
      </Box>
      <Box sx={{
        width: '100%',
        maxWidth: 1400,
        mx: 'auto',
        pt: { xs: 8, md: 12 },
        pl: { xs: 0, md: 8 },
        pr: { xs: 0, md: 8 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <Paper elevation={4} sx={{
          p: { xs: 3, md: 5 },
          mt: { xs: 2, md: 4 },
          borderRadius: 4,
          minWidth: 320,
          maxWidth: 1100,
          width: '100%',
          textAlign: 'left',
          background: 'white'
        }}>
          <Typography variant="h5" sx={{ mb: 3 }}>Gutschein-Design des Shops bearbeiten</Typography>

          {/* Shop-Daten */}
          <Box sx={{ mb: 3, p: 2, background: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Shop-Daten (Kundenwahl)</Typography>
            <Typography sx={{ mb: 1 }}><b>Unternehmensname:</b> {checkout?.Unternehmensname || <span style={{ color: '#aaa' }}>Nicht angegeben</span>}</Typography>
            <Typography sx={{ mb: 1 }}><b>Website:</b> {checkout?.Website || <span style={{ color: '#aaa' }}>Nicht angegeben</span>}</Typography>
            {checkout?.BildURL && (
              <Box sx={{ mb: 2 }}>
                <img src={checkout.BildURL} alt="Unternehmensbild" style={{ width: '100%', maxHeight: 120, objectFit: 'contain' }} />
              </Box>
            )}
            {checkout?.Gutscheinarten && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Gutscheinarten:</Typography>
                {Object.values(checkout.Gutscheinarten).map((g: any, i: number) => (
                  <Typography key={i} sx={{ fontSize: 14, color: '#555' }}>
                    {g.typ === 'dienstleistung' ? `Dienstleistung: ${g.name} (${g.preis} €)` : g.typ === 'betrag' ? `Betrag: ${g.wert} €` : g.name}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          {/* Design-Upload */}
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                border: '2px dashed #1976d2',
                borderRadius: 3,
                p: 4,
                background: '#f5faff',
                textAlign: 'center',
                cursor: 'pointer',
                width: 340,
                mb: 2
              }}
              onClick={() => document.getElementById('design-upload-input')?.click()}
            >
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                PDF oder Bild hochladen
              </Typography>
              <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                Ziehe deine Datei hierher oder klicke zum Auswählen
              </Typography>
              <input
                id="design-upload-input"
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={handleDesignUpload}
              />
              {designFile && (
                <Typography variant="body2" sx={{ color: '#1976d2' }}>
                  {designFile.name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Vorschau mit Drag-Implementierung */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative', mb: 3 }}>
              {(previewImage || designFile) && (
                <Button
                  onClick={downloadAsPDF}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    minWidth: 0,
                    padding: 1,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    boxShadow: 2,
                    '&:hover': { backgroundColor: '#f0f0f0' }
                  }}
                >
                  <DownloadIcon sx={{ color: '#1976d2' }} />
                </Button>
              )}
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Design-Vorschau & Positionierung</Typography>
              
              {/* Info-Text erweitert */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  💡 Ziehe die Elemente per Drag & Drop zur gewünschten Position
                </Typography>
                {/* {enableHorizontalMove && (
                  <Chip 
                    label="Horizontal aktiv" 
                    color="primary" 
                    size="small" 
                    icon={<SwapHorizIcon />}
                  />
                )} */}
              </Box>

              {/* Positions-Anzeige erweitert */}
              <Box sx={{ display: 'flex', gap: 4, mb: 2, p: 1, background: '#f9f9f9', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Betrag:</strong> Y: {Math.round(betragConfig.y)}px, Größe: {betragConfig.size}px
                </Typography>
                <Typography variant="body2">
                  <strong>Code:</strong> Y: {Math.round(codeConfig.y)}px, Größe: {codeConfig.size}px
                </Typography>
              </Box>

              {/* Reset-Button für Zentrierung */}
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // BESSER: Text-zentriert statt Position-zentriert
                    setBetragConfig(cfg => ({ 
                      ...cfg, 
                      x: (previewDimensions.width / 2) - 100 // Mehr Platz für breiteren Text
                    }));
                    setCodeConfig(cfg => ({ 
                      ...cfg, 
                      x: (previewDimensions.width / 2) - 80 // Weniger Platz für schmaleren Code
                    }));
                  }}
                  sx={{ mr: 1 }}
                >
                  🎯 Optisch zentrieren
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Mathematisch exakt zentriert (gleiche X-Position)
                    const centerX = (previewDimensions.width / 2) - 75;
                    setBetragConfig(cfg => ({ ...cfg, x: centerX }));
                    setCodeConfig(cfg => ({ ...cfg, x: centerX }));
                  }}
                >
                  📐 Exakt zentrieren
                </Button>
              </Box>
              
              {/* Erweiterte Positionierungs-Buttons */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // VERBESSERT: Echte optische Zentrierung mit text-align
                    const centerX = (previewDimensions.width / 2) - 100;
                    setBetragConfig(cfg => ({ ...cfg, x: centerX }));
                    setCodeConfig(cfg => ({ ...cfg, x: centerX + 20 })); // Leicht versetzt für Code
                  }}
                >
                  🎯 Zentriert
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const leftX = 50;
                    setBetragConfig(cfg => ({ ...cfg, x: leftX }));
                    setCodeConfig(cfg => ({ ...cfg, x: leftX }));
                  }}
                >
                  ⬅️ Links
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const rightX = previewDimensions.width - 200;
                    setBetragConfig(cfg => ({ ...cfg, x: rightX }));
                    setCodeConfig(cfg => ({ ...cfg, x: rightX }));
                  }}
                >
                  ➡️ Rechts
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const quarterX = (previewDimensions.width * 0.25) - 75;
                    setBetragConfig(cfg => ({ ...cfg, x: quarterX }));
                    setCodeConfig(cfg => ({ ...cfg, x: quarterX }));
                  }}
                >
                  📍 1/4
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const threeQuarterX = (previewDimensions.width * 0.75) - 75;
                    setBetragConfig(cfg => ({ ...cfg, x: threeQuarterX }));
                    setCodeConfig(cfg => ({ ...cfg, x: threeQuarterX }));
                  }}
                >
                  📍 3/4
                </Button>
              </Box>
              
              <Box 
                id="design-preview" 
                sx={{
                  ...previewStyle,
                  border: '4px solid #1976d2',
                  boxShadow: '0 0 24px 4px rgba(25,118,210,0.15)',
                  background: previewImage ? 'white' : '#f0f0f0',
                  position: 'relative',
                  borderRadius: 0,
                  cursor: isDragging ? 'grabbing' : 'default'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Design Vorschau"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 1
                      }}
                    />
                    
                    {/* ✅ PERFEKT ZENTRIERT: Betrag Element */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%', 
                        top: `${betragConfig.y}px`,
                        transform: 'translateX(-50%)', 
                        zIndex: 10,
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        border: '1px dashed red',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        maxWidth: `${betragConfig.width}%`,
                        textAlign: 'center'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'betrag')}
                    >
                      <Typography
                        component="div"
                        sx={{
                          fontSize: `${betragConfig.size}px`,
                          color: '#000000',
                          fontWeight: 'bold',
                          userSelect: 'none',
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                          textAlign: 'center',
                          lineHeight: 1.1,
                          padding: '4px 8px',
                          width: '100%',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          hyphens: 'auto'
                        }}
                      >
                        {/* ✅ VEREINFACHT: Zeige verschiedene Demo-Texte */}
                        {(() => {
                          // Verschiedene Demo-Beispiele für bessere Vorschau
                          const demoTexts = [
                            "Klassische TouchLife® Massage 60 min.",
                            "Gesichtspflege Deluxe Treatment",
                            "Wellness-Paket für 2 Personen",
                            "€ 50,00" // Für Wertgutscheine
                          ];
                          
                          // Zufällig wechseln oder ersten nehmen
                          const selectedText = demoTexts[0]; // Oder rotieren
                          
                          return formatTextForDisplay(selectedText);
                        })()}
                      </Typography>
                    </Box>

                    {/* ✅ KORRIGIERT: Code Element - mit variabler Breite */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%', 
                        top: `${codeConfig.y}px`,
                        transform: 'translateX(-50%)', 
                        zIndex: 20,
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        border: '1px dashed blue',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        maxWidth: `${codeConfig.width}%`, // ✅ VARIABLE BREITE
                        textAlign: 'center'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'code')}
                    >
                      <Typography
                        sx={{
                          fontSize: `${codeConfig.size}px`,
                          color: '#000000',
                          fontWeight: 'bold',
                          userSelect: 'none',
                          textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                          fontFamily: '"Courier New", monospace',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          padding: '4px 8px',
                          width: '100%'
                        }}
                      >
                        GS-XXXX-XXXX
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography sx={{ color: '#888', textAlign: 'center' }}>
                    Lade ein PNG/JPEG Design hoch, um die Vorschau zu sehen
                  </Typography>
                )}
              </Box>
              
              {/* ✅ VEREINFACHT: Nur noch Y-Position anzeigen */}
              <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  background: '#f8f9fa', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2, 
                  p: 2, 
                  minWidth: 200 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                    Vertikale Position (immer zentriert)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#1976d2', fontFamily: 'monospace' }}>
                      <strong>Betrag:</strong> Y: {Math.round(betragConfig.y)}px
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#d32f2f', fontFamily: 'monospace' }}>
                      <strong>Code:</strong> Y: {Math.round(codeConfig.y)}px
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Betrag Größe</Typography>
                  <TextField
                    label="Größe (px)"
                    type="number"
                    value={betragConfig.size}
                    onChange={e => setBetragConfig({ ...betragConfig, size: Number(e.target.value) })}
                    size="small"
                    sx={{ width: 100 }}
                    inputProps={{ min: 8, max: 72 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Code Größe</Typography>
                  <TextField
                    label="Größe (px)"
                    type="number"
                    value={codeConfig.size}
                    onChange={e => setCodeConfig({ ...codeConfig, size: Number(e.target.value) })}
                    size="small"
                    sx={{ width: 100 }}
                    inputProps={{ min: 8, max: 72 }}
                  />
                </Box>
              </Box>

            </Box>

            <Button variant="contained" color="primary" onClick={handleSave}>Speichern</Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}