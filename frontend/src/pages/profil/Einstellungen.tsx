import PageContainer from '../../components/profil/PageContainer';
import { Box, Button, CircularProgress, TextField, Typography, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';

export default function EinstellungenPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setData(userSnap.data());
        setFormData(userSnap.data());
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveChanges = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, formData);
    setData(formData);
    setEdit(false);
  };

  if (loading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <PageContainer title="Einstellungen">
      <Box sx={{
        maxWidth: '700px',
        margin: '3rem 0',
        padding: '2rem 2.5rem',
        border: '1px solid #ddd',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignSelf: 'flex-start'
      }}>
        
        <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, mb: 2 }}>Unternehmensdaten</Typography>

        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <TextField
            label="Vorname"
            fullWidth
            value={formData?.['Unternehmensdaten']?.Vorname || ''}
            disabled={!edit}
            onChange={(e) => {
              setFormData({
                ...formData,
                Unternehmensdaten: {
                  ...formData.Unternehmensdaten,
                  Vorname: e.target.value
                }
              });
            }}
          />

          <TextField
            label="Nachname"
            fullWidth
            value={formData?.['Unternehmensdaten']?.Name || ''}
            disabled={!edit}
            onChange={(e) => {
              setFormData({
                ...formData,
                Unternehmensdaten: {
                  ...formData.Unternehmensdaten,
                  Name: e.target.value
                }
              });
            }}
          />
        </Box>

        <TextField
          label="Unternehmen"
          fullWidth
          value={formData?.['Unternehmensdaten']?.Unternehmensname || ''}
          disabled={!edit}
          onChange={(e) => {
            setFormData({
              ...formData,
              Unternehmensdaten: {
                ...formData.Unternehmensdaten,
                Unternehmensname: e.target.value
              }
            });
          }}
        />

        <TextField
          label="Branche"
          fullWidth
          value={formData?.['Unternehmensdaten']?.Branche || ''}
          disabled={!edit}
          onChange={(e) => {
            setFormData({
              ...formData,
              Unternehmensdaten: {
                ...formData.Unternehmensdaten,
                Branche: e.target.value
              }
            });
          }}
        />

        <TextField
          label="Telefon"
          fullWidth
          value={formData?.['Unternehmensdaten']?.Telefon || ''}
          disabled={!edit}
          onChange={(e) => {
            setFormData({
              ...formData,
              Unternehmensdaten: {
                ...formData.Unternehmensdaten,
                Telefon: e.target.value
              }
            });
          }}
        />

        <TextField
          label="E-Mail"
          fullWidth
          value={formData?.email || ''}
          disabled={!edit}
          onChange={(e) => handleChange('email', e.target.value)}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {!edit ? (
            <Button variant="contained" onClick={() => setEdit(true)}>Bearbeiten</Button>
          ) : (
            <>
              <Button variant="contained" color="success" onClick={saveChanges}>Speichern</Button>
              <Button variant="outlined" color="inherit" onClick={() => { setFormData(data); setEdit(false); }}>Abbrechen</Button>
            </>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
