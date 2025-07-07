import PageContainer from '../../components/profil/PageContainer';
import { Box, Button, CircularProgress, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch } from '@mui/material';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';

export default function GutscheinePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState<any>({ Gutscheine: {} });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const gutscheine = userData?.Gutscheindetails?.Gutscheinarten || {};
        setData(userData);
        setFormData({ Gutscheine: gutscheine });
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleChange = (field: string, value: string | boolean, key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    updatedGutscheine[key][field] = value; // Entferne die Konvertierung zu String
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const saveChanges = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const updatedData = { ...data, Gutscheindetails: { ...data.Gutscheindetails, Gutscheinarten: formData.Gutscheine } };
    await updateDoc(userRef, updatedData);
    setData(updatedData);
    setEdit(false);
  };

  const addEntry = () => {
    const newKey = `Gutschein_${Date.now()}`; // Einzigartiger Schlüssel basierend auf Zeitstempel
    const newEntry = {
      Beschreibung: '',
      Preis: 0,
      Aktiv: false,
    };
    const updatedGutscheine = { ...formData.Gutscheine, [newKey]: newEntry };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  if (loading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <PageContainer title="Gutscheine">
      <Typography variant="h6" sx={{ mb: 2 }}>Ihre Gutscheine</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Preis (€)</TableCell>
              <TableCell>Aktiv</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData?.Gutscheine && Object.entries(formData.Gutscheine).length > 0 ? (
              Object.entries(formData.Gutscheine).map(([key, gutschein]: [string, any]) => (
                <TableRow key={key}>
                  <TableCell>
                    <TextField
                      value={gutschein.Beschreibung || ''}
                      disabled={!edit}
                      onChange={(e) => handleChange('Beschreibung', e.target.value, key)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={gutschein.Preis || 0}
                      disabled={!edit}
                      onChange={(e) => handleChange('Preis', e.target.value, key)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={gutschein.Aktiv || false}
                      disabled={!edit}
                      onChange={(e) => handleChange('Aktiv', e.target.checked, key)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" sx={{ color: '#777' }}>
                    Keine Gutscheine verfügbar.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        {!edit ? (
          <Button variant="contained" onClick={() => setEdit(true)}>Bearbeiten</Button>
        ) : (
          <>
            <Button variant="contained" color="success" onClick={saveChanges}>Speichern</Button>
            <Button variant="outlined" color="inherit" onClick={() => { setFormData({ Gutscheine: data?.Gutscheindetails?.Gutscheinarten || {} }); setEdit(false); }}>Abbrechen</Button>
          </>
        )}
        <Button variant="contained" color="primary" onClick={addEntry}>Eintrag hinzufügen</Button>
      </Box>
    </PageContainer>
  );
}
