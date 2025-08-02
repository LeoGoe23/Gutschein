import { Box, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useGutschein } from '../../context/GutscheinContext';
import { getAuth } from 'firebase/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSearchParams } from 'react-router-dom';

export default function Zahlungsdaten() {
  const { data, setData } = useGutschein();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const firebaseUid = data.firebaseUid || currentUser?.uid || '';
  const email = currentUser?.email || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const urlStripeAccountId = searchParams.get('stripeAccountId');
  const [stripeAccountId, setStripeAccountId] = useState<string>(urlStripeAccountId || data.stripeAccountId || '');
  const [saved, setSaved] = useState(false);

  // Stripe-Account-ID aus URL holen (bei Änderung)
  useEffect(() => {
    if (urlStripeAccountId && urlStripeAccountId !== stripeAccountId) {
      setStripeAccountId(urlStripeAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStripeAccountId]);

  // Stripe-Account-ID im Context speichern
  useEffect(() => {
    if (stripeAccountId) setData({ stripeAccountId });
  }, [stripeAccountId, setData]);

  // Account-ID im Backend speichern
  useEffect(() => {
    const saveStripeAccountId = async () => {
      if (!firebaseUid || !stripeAccountId) return;
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const res = await fetch(`${apiUrl}/api/stripeconnect/save-stripe-account-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid, stripeAccountId }),
        });
        const result = await res.json();
        if (res.ok && result.success) setSaved(true);
        else setError(result.error || 'Fehler beim Speichern');
      } catch (err: any) {
        setError(err.message || 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    };
    if (stripeAccountId) saveStripeAccountId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeAccountId, firebaseUid]);

  return (
    <Box sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zahlungsdaten – Stripe verbinden
      </Typography>
      <Typography sx={{ color: '#555', mb: '1rem' }}>
        <b>Stripe verbinden – letzter Schritt!</b><br /><br />
        <ol style={{ marginLeft: '1.2em' }}>
          <li>
            <b>Konto anlegen:</b> <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer">Hier Stripe-Konto erstellen</a>
          </li>
          <li>
            <b>Account-ID kopieren:</b> Im Stripe-Dashboard unter "Einstellungen" findest du deine <code>acct_...</code>-ID.
          </li>
          <li>
            <b>ID eintragen:</b> Einfach unten ins Feld einfügen.
          </li>
        </ol>
        <b>Es ist sicher, nur einmal nötig und lohnt sich!</b><br />
        Bei Fragen: Melde dich gern. Stripe ist sehr sicher – du kannst nichts falsch machen!
      </Typography>

      <TextField
        label="Stripe-Account-ID"
        variant="outlined"
        required
        fullWidth
        value={stripeAccountId}
        onChange={e => setStripeAccountId(e.target.value)}
        sx={{ mb: 2 }}
        helperText="Deine Stripe-Account-ID beginnt mit acct_..."
      />

      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      {error && <Typography color="error">{error}</Typography>}
      {saved && stripeAccountId && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'green', mb: 2 }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography>Stripe-Konto verbunden: {stripeAccountId}</Typography>
        </Box>
      )}
    </Box>
  );
}