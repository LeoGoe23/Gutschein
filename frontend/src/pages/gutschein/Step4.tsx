import { Box, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useGutschein } from '../../context/GutscheinContext';
import { getAuth } from 'firebase/auth';

export default function Zahlungsdaten() {
  const { data } = useGutschein();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const firebaseUid = data.firebaseUid || currentUser?.uid || '';
  const email = data.email || currentUser?.email || '';
  const unternehmensname = data.unternehmensname;

  const [accountId, setAccountId] = useState<string | null>(null);
  const [onboardUrl, setOnboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const missingData = !firebaseUid || !unternehmensname || !email;

  useEffect(() => {
    async function setupAccount() {
      if (missingData) {
        setLoading(false);
        return;
      }
      try {
        const createRes = await fetch(
          'http://localhost:5001/api/zahlung/create-account',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid,
              name: unternehmensname,
              email,
            }),
          }
        );
        if (!createRes.ok) {
          const text = await createRes.text();
          throw new Error(`Account-Erstellung fehlgeschlagen: ${createRes.status} ${text}`);
        }
        const { accountId } = await createRes.json();
        setAccountId(accountId);

        const linkRes = await fetch(
          `http://localhost:5001/api/zahlung/onboard/${accountId}`
        );
        if (!linkRes.ok) {
          const text = await linkRes.text();
          throw new Error(`Onboarding-Link fehlgeschlagen: ${linkRes.status} ${text}`);
        }
        const linkData = await linkRes.json();
        console.log('Onboarding-Antwort:', linkData);
        const url =
          linkData.url ||
          linkData.link ||
          linkData.accountLink?.url;
        if (!url) {
          throw new Error(`Keine URL in Antwort gefunden: ${JSON.stringify(linkData)}`);
        }
        setOnboardUrl(url);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    setupAccount();
  }, [firebaseUid, unternehmensname, email]);

  return (
    <Box
      sx={{
        maxWidth: 500,
        m: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h4">Zahlungsdaten</Typography>
      <Typography color="textSecondary" mb={2}>
        Bitte hinterlegen Sie Ihre Auszahlungskonten über Stripe:
      </Typography>

      {/* Anzeige der Basis-Daten aus Step 1 und Auth */}
      <TextField
        label="Unternehmensname"
        variant="outlined"
        required
        fullWidth
        value={unternehmensname}
        disabled
        sx={{ mb: 2 }}
      />
      <TextField
        label="E-Mail-Adresse"
        variant="outlined"
        required
        fullWidth
        value={email}
        disabled
        sx={{ mb: 2 }}
      />
      <TextField
        label="Firebase UID"
        variant="outlined"
        required
        fullWidth
        value={firebaseUid}
        disabled
        sx={{ mb: 2 }}
      />

      {/* Fehlende Basis-Daten */}
      {!loading && missingData && (
        <Typography color="error" mb={2}>
          Bitte füllen Sie zuerst Unternehmensname, E-Mail und UID aus.
        </Typography>
      )}

      {/* Ladespinner */}
      {loading && <CircularProgress />}

      {/* Fehler beim Erstellen / Link-Generierung */}
      {!loading && error && (
        <Typography color="error" mb={2}>
          Fehler beim Erzeugen des Onboarding-Links: {error}
        </Typography>
      )}

      {/* Warte-Zustand, falls noch kein Link verfügbar */}
      {!loading && !error && !onboardUrl && !missingData && (
        <Typography mb={2}>Onboarding-Link wird erstellt…</Typography>
      )}

      {/* Button zum Öffnen des Stripe-Onboardings */}
      {!loading && !error && onboardUrl && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.open(onboardUrl!, '_blank')}
        >
          Mit Stripe verbinden
        </Button>
      )}
    </Box>
  );
}