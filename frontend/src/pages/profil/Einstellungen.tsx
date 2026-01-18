import PageContainer from '../../components/profil/PageContainer';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';

export default function EinstellungenPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUnternehmensdaten, setEditUnternehmensdaten] = useState(false);
  const [editKontaktinformationen, setEditKontaktinformationen] = useState(false);
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

  const saveChanges = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, formData);
    setData(formData);
    setEditUnternehmensdaten(false);
    setEditKontaktinformationen(false);
  };

  if (loading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <PageContainer title="Einstellungen">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
        {/* Unternehmensdaten */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: 1, p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Unternehmensdaten</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Vorname"
              sx={{ flex: '1 1 calc(50% - 8px)' }}
              value={formData?.['Unternehmensdaten']?.Vorname || ''}
              disabled={!editUnternehmensdaten}
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
              sx={{ flex: '1 1 calc(50% - 8px)' }}
              value={formData?.['Unternehmensdaten']?.Name || ''}
              disabled={!editUnternehmensdaten}
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
            sx={{ mt: 2 }}
            value={formData?.['Unternehmensdaten']?.Unternehmensname || ''}
            disabled={!editUnternehmensdaten}
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
            sx={{ mt: 2 }}
            value={formData?.['Unternehmensdaten']?.Branche || ''}
            disabled={!editUnternehmensdaten}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {!editUnternehmensdaten ? (
              <Button variant="contained" onClick={() => setEditUnternehmensdaten(true)}>Bearbeiten</Button>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={saveChanges}>Speichern</Button>
                <Button variant="outlined" color="inherit" onClick={() => { setFormData(data); setEditUnternehmensdaten(false); }}>Abbrechen</Button>
              </>
            )}
          </Box>
        </Box>

        {/* Kontaktinformationen */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: 1, p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Kontaktinformationen</Typography>
          <TextField
            label="Telefon"
            fullWidth
            sx={{ mb: 2 }}
            value={formData?.['Unternehmensdaten']?.Telefon || ''}
            disabled={!editKontaktinformationen}
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
            disabled={!editKontaktinformationen}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {!editKontaktinformationen ? (
              <Button variant="contained" onClick={() => setEditKontaktinformationen(true)}>Bearbeiten</Button>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={saveChanges}>Speichern</Button>
                <Button variant="outlined" color="inherit" onClick={() => { setFormData(data); setEditKontaktinformationen(false); }}>Abbrechen</Button>
              </>
            )}
          </Box>
        </Box>

        {/* Zahlungsinformationen */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: 1, p: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Zahlungsinformationen</Typography>
          <Typography sx={{ mb: 2 }}>
            Deine Auszahlungen und Zahlungsdaten werden sicher über Stripe verwaltet.
            Änderungen an Bankdaten, Auszahlungsintervallen oder Steuerinformationen kannst du direkt im Stripe-Dashboard vornehmen.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href="https://dashboard.stripe.com/" // Optional: dynamisch generieren, falls du einen eigenen Stripe-Link hast
            target="_blank"
            rel="noopener"
            sx={{ mb: 2 }}
          >
            Zahlungsdaten bei Stripe verwalten
          </Button>
          {formData?.Checkout?.StripeAccountId && (
            <Typography variant="body2" sx={{ color: '#888' }}>
              Stripe Account ID: {formData.Checkout.StripeAccountId}
            </Typography>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
