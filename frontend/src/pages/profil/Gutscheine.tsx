import PageContainer from '../../components/profil/PageContainer';
import { Box, Button, CircularProgress, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, FormControlLabel, IconButton, Divider } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';

interface GutscheinArt {
  typ: 'betrag' | 'dienstleistung' | 'frei';
  name: string;
  wert?: number;
  preis?: number;
  beschreibung?: string;
  aktiv: boolean;
}

interface FormData {
  Gutscheine: { [key: string]: GutscheinArt };
  freieBetragAktiv: boolean;
}

export default function GutscheinePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    Gutscheine: {},
    freieBetragAktiv: false
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Richtiges Feld: Checkout.Gutscheinarten
        const gutscheine = userData?.Checkout?.Gutscheinarten || {};

        // Prüfe ob freier Betrag aktiv ist
        const freieBetragAktiv = Object.values(gutscheine).some((g: any) => g.typ === 'frei');

        setData(userData);
        setFormData({
          Gutscheine: gutscheine,
          freieBetragAktiv
        });
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleChange = (field: string, value: string | boolean | number, key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    updatedGutscheine[key] = { ...updatedGutscheine[key], [field]: value };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const toggleFreiBetrag = (enabled: boolean) => {
    const updatedGutscheine = { ...formData.Gutscheine };

    if (enabled) {
      // Freien Betrag hinzufügen
      updatedGutscheine['frei_wert'] = {
        typ: 'frei',
        name: 'Freie Wertangabe',
        aktiv: true
      };
    } else {
      // Freien Betrag entfernen
      delete updatedGutscheine['frei_wert'];
    }

    setFormData({
      ...formData,
      Gutscheine: updatedGutscheine,
      freieBetragAktiv: enabled
    });
  };

  const addDienstleistung = () => {
    const newKey = `service_${Date.now()}`;
    const newEntry: GutscheinArt = {
      typ: 'dienstleistung',
      name: '',
      beschreibung: '',
      preis: 0,
      aktiv: true,
    };
    const updatedGutscheine = { ...formData.Gutscheine, [newKey]: newEntry };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const deleteEntry = (key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    delete updatedGutscheine[key];
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const saveChanges = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);

    const updatedData = {
      ...data,
      Checkout: {
        ...data.Checkout,
        Gutscheinarten: formData.Gutscheine,
        Freibetrag: formData.freieBetragAktiv,
        Dienstleistung: Object.values(formData.Gutscheine).some(g => g.typ === 'dienstleistung')
      }
    };

    await updateDoc(userRef, updatedData);
    setData(updatedData);
    setEdit(false);
  };

  const cancelEdit = () => {
    const gutscheine = data?.Gutscheindetails?.Gutscheinarten || {};
    const freieBetragAktiv = Object.values(gutscheine).some((g: any) => g.typ === 'frei');

    setFormData({
      Gutscheine: gutscheine,
      freieBetragAktiv
    });
    setEdit(false);
  };

  if (loading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  // Gruppiere Gutscheine nach Typ
  const dienstleistungen = Object.entries(formData.Gutscheine).filter(([_, g]) => g.typ === 'dienstleistung');

  return (
    <PageContainer title="Gutscheine">
      <Typography variant="h6" sx={{ mb: 2 }}>Gutschein-Konfiguration</Typography>

      {/* Freier Betrag Toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.freieBetragAktiv}
              disabled={!edit}
              onChange={(e) => toggleFreiBetrag(e.target.checked)}
            />
          }
          label="Freie Wertangabe erlauben"
        />
        {formData.freieBetragAktiv && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Kunden können einen beliebigen Betrag eingeben
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Dienstleistungen */}
      <Typography variant="h6" sx={{ mb: 2 }}>Dienstleistungen</Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Preis (€)</TableCell>
              {edit && <TableCell>Aktionen</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {dienstleistungen.map(([key, service]) => (
              <TableRow key={key}>
                <TableCell>
                  <TextField
                    value={service.name || ''}
                    disabled={!edit}
                    placeholder="z.B. Massage"
                    onChange={(e) => handleChange('name', e.target.value, key)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={service.beschreibung || ''}
                    disabled={!edit}
                    placeholder="Detaillierte Beschreibung"
                    onChange={(e) => handleChange('beschreibung', e.target.value, key)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={service.preis || 0}
                    disabled={!edit}
                    onChange={(e) => handleChange('preis', parseFloat(e.target.value) || 0, key)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </TableCell>
                {edit && (
                  <TableCell>
                    <IconButton onClick={() => deleteEntry(key)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {dienstleistungen.length === 0 && (
              <TableRow>
                <TableCell colSpan={edit ? 4 : 3}>
                  <Typography variant="body2" sx={{ color: '#777' }}>
                    Keine Dienstleistungen konfiguriert.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {edit && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addDienstleistung}
          sx={{ mb: 3 }}
        >
          Dienstleistung hinzufügen
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        {!edit ? (
          <Button variant="contained" onClick={() => setEdit(true)}>Bearbeiten</Button>
        ) : (
          <>
            <Button variant="contained" color="success" onClick={saveChanges}>
              Speichern
            </Button>
            <Button variant="outlined" color="inherit" onClick={cancelEdit}>
              Abbrechen
            </Button>
          </>
        )}
      </Box>
    </PageContainer>
  );
}
