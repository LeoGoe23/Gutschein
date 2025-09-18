import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, TextField } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../auth/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';

// A4 Größe in Pixel bei 72 DPI (Standard für jsPDF)
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

const calculatePreviewDimensions = () => ({
  width: A4_WIDTH_PX,
  height: A4_HEIGHT_PX
});

export default function GutscheinDesignAdminEdit() {
  const { shopId } = useParams<{ shopId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<any>(null);
  const [designURL, setDesignURL] = useState<string | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [betragConfig, setBetragConfig] = useState({ x: 0, y: 0, size: 32 });
  const [codeConfig, setCodeConfig] = useState({ x: 0, y: 30, size: 24 });
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
          setBetragConfig(data.Checkout?.DesignConfig?.betrag || { x: 0, y: 0, size: 32 });
          setCodeConfig(data.Checkout?.DesignConfig?.code || { x: 0, y: 30, size: 24 });
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
      await updateDoc(doc(db, 'users', shopId), {
        'Checkout.GutscheinDesignURL': url || null,
        'Checkout.DesignConfig': {
          betrag: betragConfig,
          code: codeConfig
        }
      });
      setDesignURL(url);
      alert('Design und Einstellungen gespeichert!');
    } catch (err) {
      alert('Fehler beim Speichern');
    }
    setLoading(false);
  };

  // Neue Drag-Funktionen mit horizontaler Zentrierung
  const handleMouseDown = (e: React.MouseEvent, type: 'betrag' | 'code') => {
    e.preventDefault();
    setIsDragging(type);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const previewElement = document.getElementById('design-preview');
    if (!previewElement) return;
    
    const rect = previewElement.getBoundingClientRect();
    // NUR Y-Position ändern, X bleibt zentriert
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
    
    if (isDragging === 'betrag') {
      setBetragConfig(cfg => ({ 
        ...cfg, 
        x: rect.width / 2 - 75, // Zentriert (75px = halbe Elementbreite ca.)
        y 
      }));
    } else if (isDragging === 'code') {
      setCodeConfig(cfg => ({ 
        ...cfg, 
        x: rect.width / 2 - 75, // Zentriert (75px = halbe Elementbreite ca.)
        y 
      }));
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

          {/* Vorschau mit eigener Drag-Implementierung */}
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
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setBetragConfig(cfg => ({ ...cfg, x: 0, y: 0 }));
                    setCodeConfig(cfg => ({ ...cfg, x: 0, y: 30 }));
                  }}
                >
                  Elemente zurücksetzen (links oben)
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
                    
                    {/* Betrag Element - mit Transform für echte Zentrierung */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%', // Horizontal zentriert
                        top: `${betragConfig.y}px`,
                        transform: 'translateX(-50%)', // Echte Zentrierung
                        zIndex: 10,
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' }
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'betrag')}
                    >
                      <Typography
                        sx={{
                          fontSize: `${betragConfig.size}px`,
                          color: '#000', // Schwarzer Text
                          fontWeight: 'bold',
                          userSelect: 'none'
                        }}
                      >
                        50,00 €
                      </Typography>
                    </Box>

                    {/* Code Element - mit Transform für echte Zentrierung */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%', // Horizontal zentriert
                        top: `${codeConfig.y}px`,
                        transform: 'translateX(-50%)', // Echte Zentrierung
                        zIndex: 20,
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' }
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'code')}
                    >
                      <Typography
                        sx={{
                          fontSize: `${codeConfig.size}px`,
                          color: '#000', // Schwarzer Text
                          fontWeight: 'bold',
                          userSelect: 'none'
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
              
              {/* Live Position Display */}
              <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  background: '#f8f9fa', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2, 
                  p: 2, 
                  minWidth: 200 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                    Live Position (Pixel)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#1976d2', fontFamily: 'monospace' }}>
                      <strong>Betrag:</strong> X: {Math.round(betragConfig.x)}px, Y: {Math.round(betragConfig.y)}px
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#d32f2f', fontFamily: 'monospace' }}>
                      <strong>Code:</strong> X: {Math.round(codeConfig.x)}px, Y: {Math.round(codeConfig.y)}px
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
                    inputProps={{ min: 8, max: 72 }} // Mindest- und Maximalwerte
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
                    inputProps={{ min: 8, max: 72 }} // Mindest- und Maximalwerte
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Button variant="contained" color="primary" onClick={handleSave}>Speichern</Button>
        </Paper>
      </Box>
    </Box>
  );
}