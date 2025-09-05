import { Box, Typography, Paper, Button, TextField, Switch, FormControlLabel, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, LinearProgress } from '@mui/material';
import { Add, Edit, Delete, CloudUpload, Image } from '@mui/icons-material';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../auth/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface DemoData {
  id?: string;
  name: string;
  bildURL: string;
  customValue: boolean;
  dienstleistungen: Array<{
    shortDesc: string;
    longDesc: string;
    price: string;
  }>;
  slug: string;
  createdAt: string;
  bildFileName?: string; // Für Storage-Verwaltung
}

interface DienstleistungForm {
  shortDesc: string;
  longDesc: string;
  price: string;
}

export default function AdminDemosPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [demos, setDemos] = useState<DemoData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDemo, setEditingDemo] = useState<DemoData | null>(null);
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Formular States
  const [formData, setFormData] = useState<DemoData>({
    name: '',
    bildURL: '',
    customValue: false,
    dienstleistungen: [],
    slug: '',
    createdAt: ''
  });
  const [newDienstleistung, setNewDienstleistung] = useState<DienstleistungForm>({
    shortDesc: '',
    longDesc: '',
    price: ''
  });

  // Admin-Check
  useEffect(() => {
    if (user === null) return;
    if (!user) {
      navigate('/');
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        navigate('/');
      }
    };
    checkAdmin();
  }, [user, navigate]);

  // Demos laden
  useEffect(() => {
    if (isAdmin) {
      loadDemos();
    }
  }, [isAdmin]);

  const loadDemos = async () => {
    try {
      const demosCollection = collection(db, 'demos');
      const demoSnapshot = await getDocs(demosCollection);
      const demoList: DemoData[] = [];
      
      demoSnapshot.forEach((doc) => {
        demoList.push({ id: doc.id, ...doc.data() } as DemoData);
      });
      
      // Nach Erstellungsdatum sortieren (neueste zuerst)
      demoList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDemos(demoList);
    } catch (error) {
      console.error('Fehler beim Laden der Demos:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const replacements: { [key: string]: string } = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return replacements[match] || match;
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Auto-Slug generieren wenn Name sich ändert
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name) // Nur auto-generieren wenn Slug leer ist
    }));
  };

  const openCreateDialog = () => {
    setEditingDemo(null);
    setFormData({
      name: '',
      bildURL: '',
      customValue: false,
      dienstleistungen: [],
      slug: '',
      createdAt: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setOpenDialog(true);
  };

  const openEditDialog = (demo: DemoData) => {
    setEditingDemo(demo);
    setFormData({ ...demo });
    setSelectedFile(null);
    setPreviewUrl(demo.bildURL);
    setOpenDialog(true);
  };

  // Datei-Upload Handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      alert('Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Preview erstellen
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Bild zu Firebase Storage hochladen
  const uploadImage = async (file: File): Promise<{ url: string; fileName: string }> => {
    const fileName = `demos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload mit Progress-Tracking (vereinfacht)
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simuliere Progress (da uploadBytes keinen Progress-Listener hat)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const snapshot = await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { url: downloadURL, fileName };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Altes Bild löschen
  const deleteOldImage = async (fileName: string) => {
    if (!fileName) return;
    
    try {
      const oldImageRef = ref(storage, fileName);
      await deleteObject(oldImageRef);
    } catch (error) {
      console.warn('Altes Bild konnte nicht gelöscht werden:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Slug-Validierung
      if (!formData.slug) {
        alert('Bitte geben Sie einen Slug ein.');
        return;
      }

      // Prüfen ob Slug bereits existiert (bei neuer Demo oder geändertem Slug)
      const existingDemo = demos.find(d => 
        d.slug === formData.slug && d.id !== editingDemo?.id
      );
      if (existingDemo) {
        alert('Dieser Slug wird bereits verwendet. Bitte wählen Sie einen anderen.');
        return;
      }

      let bildURL = formData.bildURL;
      let bildFileName = formData.bildFileName;

      // Neues Bild hochladen wenn ausgewählt
      if (selectedFile) {
        const uploadResult = await uploadImage(selectedFile);
        bildURL = uploadResult.url;
        bildFileName = uploadResult.fileName;

        // Altes Bild löschen wenn vorhanden
        if (editingDemo?.bildFileName) {
          await deleteOldImage(editingDemo.bildFileName);
        }
      }

      const demoData = {
        ...formData,
        bildURL,
        bildFileName,
        slug: formData.slug.toLowerCase(),
        createdAt: editingDemo ? formData.createdAt : new Date().toISOString()
      };

      if (editingDemo) {
        await updateDoc(doc(db, 'demos', editingDemo.id!), demoData);
      } else {
        await addDoc(collection(db, 'demos'), demoData);
      }

      setOpenDialog(false);
      loadDemos();
      alert(editingDemo ? 'Demo erfolgreich aktualisiert!' : 'Demo erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Demo');
    }
  };

  const handleDelete = async (demoId: string) => {
    const demo = demos.find(d => d.id === demoId);
    if (!window.confirm(`Demo "${demo?.name}" wirklich löschen?`)) return;
    
    try {
      // Bild aus Storage löschen
      if (demo?.bildFileName) {
        await deleteOldImage(demo.bildFileName);
      }

      // Demo aus Firestore löschen
      await deleteDoc(doc(db, 'demos', demoId));
      loadDemos();
      alert('Demo erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Demo');
    }
  };

  const addDienstleistung = () => {
    if (!newDienstleistung.shortDesc || !newDienstleistung.price) {
      alert('Bitte Beschreibung und Preis eingeben');
      return;
    }

    setFormData({
      ...formData,
      dienstleistungen: [...formData.dienstleistungen, { ...newDienstleistung }]
    });

    setNewDienstleistung({ shortDesc: '', longDesc: '', price: '' });
  };

  const removeDienstleistung = (index: number) => {
    setFormData({
      ...formData,
      dienstleistungen: formData.dienstleistungen.filter((_, i) => i !== index)
    });
  };

  if (isAdmin === null) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Lade...</Box>;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>

      <Box sx={{ pt: { xs: 8, md: 12 }, px: { xs: 2, md: 8 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} color="primary">
                Demo-Verwaltung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Erstellen Sie Demo-Seiten für Kundenanfragen
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ borderRadius: 2 }}
            >
              Neue Demo erstellen
            </Button>
          </Box>

          {demos.length === 0 ? (
            <Paper elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Noch keine Demos erstellt
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Erstellen Sie Ihre erste Demo-Seite für Kundenanfragen
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
              <List>
                {demos.map((demo) => (
                  <ListItem key={demo.id} divider>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      {demo.bildURL ? (
                        <img 
                          src={demo.bildURL} 
                          alt={demo.name}
                          style={{ 
                            width: 60, 
                            height: 60, 
                            objectFit: 'cover', 
                            borderRadius: 8 
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: 60, 
                          height: 60, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image color="disabled" />
                        </Box>
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="h6" fontWeight={600}>
                          {demo.name}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            demo/{demo.slug}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Freier Betrag: {demo.customValue ? 'Ja' : 'Nein'} | 
                            Dienstleistungen: {demo.dienstleistungen.length} | 
                            Erstellt: {new Date(demo.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.open(`/demo/${demo.slug}`, '_blank')}
                        sx={{ borderRadius: 2 }}
                      >
                        Ansehen
                      </Button>
                      <IconButton onClick={() => openEditDialog(demo)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(demo.id!)} color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDemo ? 'Demo bearbeiten' : 'Neue Demo erstellen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              helperText="Der Name der Demo (z.B. 'Musterfriseur Berlin')"
            />
            
            <TextField
              label="URL-Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              required
              helperText="URL-freundlicher Name (z.B. 'musterfriseur-berlin')"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>demo/</Typography>,
              }}
            />

            {/* Bild-Upload Sektion */}
            <Box>
              <Typography variant="h6" gutterBottom>Hintergrundbild</Typography>
              
              {/* Aktuelles/Vorschau Bild */}
              {previewUrl && (
                <Box sx={{ mb: 2 }}>
                  <img 
                    src={previewUrl} 
                    alt="Vorschau"
                    style={{ 
                      width: '100%', 
                      maxWidth: 400, 
                      height: 200, 
                      objectFit: 'cover', 
                      borderRadius: 8,
                      border: '1px solid #ddd'
                    }}
                  />
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{ mb: 1 }}
              >
                {editingDemo && !selectedFile ? 'Bild ändern' : 'Bild hochladen'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary">
                    Upload läuft... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Neue Datei: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.customValue}
                  onChange={(e) => setFormData({ ...formData, customValue: e.target.checked })}
                />
              }
              label="Freier Betrag erlaubt"
            />

            <Typography variant="h6">Dienstleistungen</Typography>
            
            {/* Neue Dienstleistung hinzufügen */}
            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Neue Dienstleistung hinzufügen:</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Kurzbeschreibung"
                  value={newDienstleistung.shortDesc}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, shortDesc: e.target.value })}
                  size="small"
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="Langbeschreibung (optional)"
                  value={newDienstleistung.longDesc}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, longDesc: e.target.value })}
                  size="small"
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="Preis (€)"
                  type="number"
                  value={newDienstleistung.price}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, price: e.target.value })}
                  size="small"
                  sx={{ flex: '0 1 120px' }}
                />
                <Button 
                  variant="contained" 
                  onClick={addDienstleistung}
                  sx={{ flex: '0 0 auto' }}
                >
                  Hinzufügen
                </Button>
              </Box>
            </Box>

            {/* Liste der Dienstleistungen */}
            {formData.dienstleistungen.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Aktuelle Dienstleistungen:</Typography>
                {formData.dienstleistungen.map((dienst, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 2, 
                    border: '1px solid #eee', 
                    borderRadius: 2, 
                    mb: 1,
                    backgroundColor: '#fafafa'
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {dienst.shortDesc} - {dienst.price}€
                      </Typography>
                      {dienst.longDesc && (
                        <Typography variant="caption" color="text.secondary">
                          {dienst.longDesc}
                        </Typography>
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => removeDienstleistung(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {formData.slug && (
              <Alert severity="info">
                Demo wird verfügbar unter: <strong>/demo/{formData.slug}</strong>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={uploading || !formData.name || !formData.slug}
          >
            {uploading ? 'Speichere...' : editingDemo ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}