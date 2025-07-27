import { Box, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useGutschein } from '../../context/GutscheinContext';
import { getAuth } from 'firebase/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Zahlungsdaten() {
  const { data, setData } = useGutschein();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const firebaseUid = data.firebaseUid || currentUser?.uid || '';
  const email = data.email || currentUser?.email || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingData = !email;

  const connectStripe = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const res = await fetch(`${apiUrl}/api/stripeconnect/stripe-connect-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Zeige Backend-Fehlerdetails an
        throw new Error(data.error + (data.details && data.details.message ? ` (${data.details.message})` : ''));
      }
      if (!data.url) throw new Error('Keine URL erhalten');
      // Stripe-Account-ID im Context speichern
      setData({ stripeAccountId: data.stripeAccountId });
      window.open(data.url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zahlungsdaten
      </Typography>
      <Typography sx={{ color: '#555', mb: '1rem' }}>
        Sie werden zu Stripe weitergeleitet, um Ihr Auszahlungskonto zu verbinden.
      </Typography>

      <TextField
        label="E-Mail-Adresse"
        variant="outlined"
        required
        fullWidth
        value={email}
        disabled
        sx={{ mb: 2 }}
      />

      {!loading && missingData && (
        <Typography color="error" mb={2}>
          Bitte stellen Sie sicher, dass Ihre E-Mail vorhanden ist.
        </Typography>
      )}

      {loading && <CircularProgress />}

      {!loading && error && (
        <Typography color="error" mb={2}>
          Fehler: {error}
        </Typography>
      )}

      {!loading && !missingData && (
        <Button variant="contained" color="primary" onClick={connectStripe}>
          Mit Stripe verbinden
        </Button>
      )}

      {data.stripeAccountId && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'green', mb: 2 }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography>Stripe-Konto erfolgreich verbunden!</Typography>
        </Box>
      )}
    </Box>
  );
}