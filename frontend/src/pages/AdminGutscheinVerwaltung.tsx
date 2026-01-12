import { 
  Box, 
  CircularProgress, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Add as AddIcon
} from '@mui/icons-material';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../auth/firebase';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Variante {
  name: string;
  preis: number;
  beschreibung?: string;
}

interface Gutschein {
  id: string;
  name: string;
  preis?: number; // Angepasst an Firebase-Struktur
  betrag?: number; // Für Kompatibilität
  beschreibung?: string;
  aktiv: boolean;
  reihenfolge?: number;
  typ?: string; // z.B. "dienstleistung", "frei"
  varianten?: Variante[]; // NEU: Varianten
}

interface Shop {
  id: string;
  unternehmensname: string;
  email: string;
}

export default function AdminGutscheinVerwaltung() {
  const user = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [gutscheine, setGutscheine] = useState<Gutschein[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editGutschein, setEditGutschein] = useState<Partial<Gutschein>>({});
  const [isNewGutschein, setIsNewGutschein] = useState(false);
  const [hasVarianten, setHasVarianten] = useState(false);
  const [newVariante, setNewVariante] = useState<Variante>({ name: '', preis: 0, beschreibung: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      setIsAdmin(null);
      return;
    }
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

  // Shops laden
  useEffect(() => {
    const fetchShops = async () => {
      const usersCol = collection(db, 'users');
      const usersSnap = await getDocs(usersCol);
      const shopsArr: Shop[] = [];
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        shopsArr.push({
          id: docSnap.id,
          unternehmensname: data.Checkout?.Unternehmensname || data.Unternehmensdaten?.Unternehmensname || '',
          email: data.email || '',
        });
      });
      setShops(shopsArr);
      
      // Vorauswahl aus location state
      const preselectedShopId = location.state?.preselectedShopId;
      if (preselectedShopId) {
        setSelectedShopId(preselectedShopId);
      }
    };
    if (isAdmin) fetchShops();
  }, [isAdmin, location.state]);

  // Gutscheine eines Shops laden
  const loadGutscheine = async (shopId: string) => {
    setLoading(true);
    try {
      // Lade das User-Dokument direkt
      const userDoc = await getDoc(doc(db, 'users', shopId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const gutscheinarten = userData.Checkout?.Gutscheinarten || {};
        
        console.log('Gefundene Gutscheinarten:', gutscheinarten);
        
        const gutscheineArr: Gutschein[] = [];
        
        // Konvertiere Object zu Array
        Object.keys(gutscheinarten).forEach((key, index) => {
          const item = gutscheinarten[key];
          gutscheineArr.push({
            id: key, // service_0, service_1, etc.
            name: item.name || '',
            preis: item.preis || 0,
            betrag: item.preis || 0, // Für Kompatibilität
            beschreibung: item.beschreibung || '',
            aktiv: item.aktiv !== false, // Default true
            reihenfolge: item.reihenfolge ?? index,
            typ: item.typ || '',
            varianten: item.varianten || [] // NEU: Varianten laden
          });
        });
        
        // Nach Reihenfolge sortieren
        gutscheineArr.sort((a, b) => (a.reihenfolge || 0) - (b.reihenfolge || 0));
        
        setGutscheine(gutscheineArr);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gutscheine:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedShopId) {
      loadGutscheine(selectedShopId);
    } else {
      setGutscheine([]);
    }
  }, [selectedShopId]);

  // Reihenfolge ändern
  const moveUp = async (index: number) => {
    if (index === 0) return; // Bereits ganz oben
    
    const items = Array.from(gutscheine);
    // Tausche mit dem Element darüber
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    
    // Neue Reihenfolge setzen
    const updatedItems = items.map((item, idx) => ({
      ...item,
      reihenfolge: idx
    }));
    
    setGutscheine(updatedItems);
    await saveReihenfolge(updatedItems);
  };

  const moveDown = async (index: number) => {
    if (index === gutscheine.length - 1) return; // Bereits ganz unten
    
    const items = Array.from(gutscheine);
    // Tausche mit dem Element darunter
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    
    // Neue Reihenfolge setzen
    const updatedItems = items.map((item, idx) => ({
      ...item,
      reihenfolge: idx
    }));
    
    setGutscheine(updatedItems);
    await saveReihenfolge(updatedItems);
  };

  // Hilfsfunktion zum Speichern der Reihenfolge
  const saveReihenfolge = async (updatedItems: Gutschein[]) => {
    try {
      const userDocRef = doc(db, 'users', selectedShopId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const gutscheinarten = { ...userData.Checkout?.Gutscheinarten || {} };
        
        // Reihenfolge für alle Items aktualisieren
        updatedItems.forEach(item => {
          if (gutscheinarten[item.id]) {
            gutscheinarten[item.id].reihenfolge = item.reihenfolge;
          }
        });
        
        await updateDoc(userDocRef, {
          'Checkout.Gutscheinarten': gutscheinarten
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Reihenfolge:', error);
    }
  };

  // Gutschein löschen
  const handleDelete = async (gutscheinId: string) => {
    if (!window.confirm('Gutschein wirklich löschen?')) return;
    
    try {
      const userDocRef = doc(db, 'users', selectedShopId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const gutscheinarten = { ...userData.Checkout?.Gutscheinarten || {} };
        
        // Gutschein aus dem Objekt entfernen
        delete gutscheinarten[gutscheinId];
        
        await updateDoc(userDocRef, {
          'Checkout.Gutscheinarten': gutscheinarten
        });
        
        loadGutscheine(selectedShopId);
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen!');
    }
  };

  // Gutschein bearbeiten/hinzufügen
  const handleSave = async () => {
    const betragValue = editGutschein.betrag || editGutschein.preis || 0;
    
    // Validierung: Name ist immer erforderlich
    if (!editGutschein.name) {
      alert('Name ist erforderlich!');
      return;
    }

    // Validierung: Preis nur erforderlich wenn KEINE Varianten
    if (!hasVarianten && !betragValue) {
      alert('Preis ist erforderlich!');
      return;
    }

    // Validierung: Bei Varianten muss mindestens eine vorhanden sein
    if (hasVarianten && (!editGutschein.varianten || editGutschein.varianten.length === 0)) {
      alert('Bitte fügen Sie mindestens eine Variante hinzu!');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', selectedShopId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const gutscheinarten = { ...userData.Checkout?.Gutscheinarten || {} };
        
        if (isNewGutschein) {
          // Neue ID generieren (service_X)
          const existingKeys = Object.keys(gutscheinarten);
          const serviceNumbers = existingKeys
            .filter(key => key.startsWith('service_'))
            .map(key => parseInt(key.replace('service_', '')))
            .filter(num => !isNaN(num));
          
          const nextNumber = serviceNumbers.length > 0 ? Math.max(...serviceNumbers) + 1 : 0;
          const newId = `service_${nextNumber}`;
          
          const nextReihenfolge = gutscheine.length > 0 ? Math.max(...gutscheine.map(g => g.reihenfolge || 0)) + 1 : 0;
          
          gutscheinarten[newId] = {
            name: editGutschein.name,
            preis: hasVarianten ? 0 : betragValue, // Bei Varianten: Preis = 0
            beschreibung: editGutschein.beschreibung || '',
            aktiv: editGutschein.aktiv ?? true,
            reihenfolge: nextReihenfolge,
            typ: editGutschein.typ || 'dienstleistung',
            ...(hasVarianten && editGutschein.varianten && editGutschein.varianten.length > 0 
              ? { varianten: editGutschein.varianten }
              : {})
          };
        } else {
          // Bestehenden Gutschein aktualisieren
          if (gutscheinarten[editGutschein.id!]) {
            gutscheinarten[editGutschein.id!] = {
              ...gutscheinarten[editGutschein.id!],
              name: editGutschein.name,
              preis: hasVarianten ? 0 : betragValue, // Bei Varianten: Preis = 0
              beschreibung: editGutschein.beschreibung || '',
              aktiv: editGutschein.aktiv ?? true,
              typ: editGutschein.typ || gutscheinarten[editGutschein.id!].typ || 'dienstleistung',
              ...(hasVarianten && editGutschein.varianten && editGutschein.varianten.length > 0 
                ? { varianten: editGutschein.varianten }
                : {})
            };
          }
        }
        
        await updateDoc(userDocRef, {
          'Checkout.Gutscheinarten': gutscheinarten
        });
        
        setEditDialog(false);
        setEditGutschein({});
        loadGutscheine(selectedShopId);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern!');
    }
  };

  // Neuen Gutschein hinzufügen
  const handleAddNew = () => {
    setEditGutschein({
      name: '',
      betrag: 0,
      beschreibung: '',
      aktiv: true,
      varianten: []
    });
    setIsNewGutschein(true);
    setHasVarianten(false);
    setEditDialog(true);
  };

  // Gutschein bearbeiten
  const handleEdit = (gutschein: Gutschein) => {
    setEditGutschein(gutschein);
    setIsNewGutschein(false);
    setHasVarianten(!!gutschein.varianten && gutschein.varianten.length > 0);
    setEditDialog(true);
  };

  if (isAdmin === null) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          pt: { xs: 8, md: 12 },
          pl: { xs: 2, md: 8 },
          pr: { xs: 2, md: 8 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/admin')}
            >
              ← Zurück
            </Button>
            <Typography variant="h4" fontWeight={700} color="primary">
              Gutschein-Verwaltung
            </Typography>
          </Box>

          {/* Shop auswählen */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Shop auswählen</InputLabel>
              <Select
                value={selectedShopId}
                label="Shop auswählen"
                onChange={(e) => setSelectedShopId(e.target.value)}
              >
                <MenuItem value="">Bitte Shop wählen</MenuItem>
                {shops.map(shop => (
                  <MenuItem key={shop.id} value={shop.id}>
                    {shop.unternehmensname || shop.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {selectedShopId && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Gutscheine ({gutscheine.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddNew}
                >
                  Neuen Gutschein hinzufügen
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {gutscheine.map((gutschein, index) => (
                    <Paper
                      key={gutschein.id}
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      {/* Reihenfolge-Pfeile */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '40px' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                        <Typography 
                          variant="caption" 
                          sx={{ textAlign: 'center', py: 0.5, minWidth: '20px' }}
                        >
                          {index + 1}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => moveDown(index)}
                          disabled={index === gutscheine.length - 1}
                          sx={{ p: 0.5 }}
                        >
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6">{gutschein.name}</Typography>
                          <Chip 
                            label={`${gutschein.preis || gutschein.betrag} €`} 
                            color="primary" 
                            size="small" 
                          />
                          <Chip 
                            label={gutschein.typ || 'dienstleistung'} 
                            variant="outlined" 
                            size="small" 
                          />
                          <Chip 
                            label={gutschein.aktiv ? 'Aktiv' : 'Inaktiv'} 
                            color={gutschein.aktiv ? 'success' : 'default'} 
                            size="small" 
                          />
                        </Box>
                        {gutschein.beschreibung && (
                          <Typography variant="body2" color="text.secondary">
                            {gutschein.beschreibung}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          onClick={() => handleEdit(gutschein)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(gutschein.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {!loading && gutscheine.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Keine Gutscheine gefunden. Fügen Sie den ersten hinzu!
                </Typography>
              )}
            </Paper>
          )}

          {/* Bearbeiten Dialog */}
          <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {isNewGutschein ? 'Neuen Gutschein hinzufügen' : 'Gutschein bearbeiten'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={editGutschein.name || ''}
                onChange={(e) => setEditGutschein({...editGutschein, name: e.target.value})}
                sx={{ mb: 2 }}
              />
              
              {/* Preis nur anzeigen wenn KEINE Varianten */}
              {!hasVarianten && (
                <TextField
                  margin="dense"
                  label="Preis (€)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={editGutschein.betrag || editGutschein.preis || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEditGutschein({
                      ...editGutschein, 
                      betrag: value,
                      preis: value
                    });
                  }}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                margin="dense"
                label="Beschreibung (optional)"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={editGutschein.beschreibung || ''}
                onChange={(e) => setEditGutschein({...editGutschein, beschreibung: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Kategorie (optional)"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editGutschein.aktiv ? 'true' : 'false'}
                  label="Status"
                  onChange={(e) => setEditGutschein({...editGutschein, aktiv: e.target.value === 'true'})}
                >
                  <MenuItem value="true">Aktiv</MenuItem>
                  <MenuItem value="false">Inaktiv</MenuItem>
                </Select>
              </FormControl>

              {/* Typ-Auswahl hinzufügen */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Typ</InputLabel>
                <Select
                  value={editGutschein.typ || 'dienstleistung'}
                  label="Typ"
                  onChange={(e) => setEditGutschein({...editGutschein, typ: e.target.value})}
                >
                  <MenuItem value="dienstleistung">Dienstleistung</MenuItem>
                  <MenuItem value="frei">Frei</MenuItem>
                </Select>
              </FormControl>

              {/* NEU: Varianten-Toggle */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Varianten (optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Aktivieren Sie Varianten, um mehrere Optionen für diese Dienstleistung anzubieten (z.B. verschiedene Zeitdauern)
                </Typography>
                <Button
                  variant={hasVarianten ? "contained" : "outlined"}
                  size="small"
                  onClick={() => {
                    setHasVarianten(!hasVarianten);
                    if (!hasVarianten && !editGutschein.varianten) {
                      setEditGutschein({...editGutschein, varianten: []});
                    }
                  }}
                  sx={{ mb: hasVarianten ? 2 : 0 }}
                >
                  {hasVarianten ? 'Varianten aktiviert' : 'Varianten aktivieren'}
                </Button>

                {/* Varianten-Liste und Hinzufügen */}
                {hasVarianten && (
                  <Box sx={{ mt: 2 }}>
                    {/* Bestehende Varianten */}
                    {editGutschein.varianten && editGutschein.varianten.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {editGutschein.varianten.map((variante, idx) => (
                          <Paper key={idx} sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>{variante.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{variante.preis}€</Typography>
                              {variante.beschreibung && (
                                <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                                  {variante.beschreibung}
                                </Typography>
                              )}
                            </Box>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                const newVarianten = editGutschein.varianten!.filter((_, i) => i !== idx);
                                setEditGutschein({...editGutschein, varianten: newVarianten});
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                    )}

                    {/* Neue Variante hinzufügen */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px dashed #ccc' }}>
                      <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                        Neue Variante hinzufügen
                      </Typography>
                      <TextField
                        size="small"
                        label="Name (z.B. 60 Minuten)"
                        fullWidth
                        value={newVariante.name}
                        onChange={(e) => setNewVariante({...newVariante, name: e.target.value})}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Preis (€)"
                        type="number"
                        fullWidth
                        value={newVariante.preis || ''}
                        onChange={(e) => setNewVariante({...newVariante, preis: parseFloat(e.target.value) || 0})}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Beschreibung (optional)"
                        fullWidth
                        value={newVariante.beschreibung || ''}
                        onChange={(e) => setNewVariante({...newVariante, beschreibung: e.target.value})}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          if (!newVariante.name || !newVariante.preis) {
                            alert('Name und Preis sind erforderlich!');
                            return;
                          }
                          const currentVarianten = editGutschein.varianten || [];
                          setEditGutschein({
                            ...editGutschein,
                            varianten: [...currentVarianten, newVariante]
                          });
                          setNewVariante({ name: '', preis: 0, beschreibung: '' });
                        }}
                      >
                        Variante hinzufügen
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)}>Abbrechen</Button>
              <Button onClick={handleSave} variant="contained">
                {isNewGutschein ? 'Hinzufügen' : 'Speichern'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
}