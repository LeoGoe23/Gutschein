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
  const unternehmensname = data.unternehmensname || '';

  const [accountId, setAccountId] = useState<string | null>(null);
  const [onboardUrl, setOnboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAccountChecked, setExistingAccountChecked] = useState(false);

  // reset all Mollie-connect state when the Firebase user changes
  useEffect(() => {
    setAccountId(null);
    setOnboardUrl(null);
    setError(null);
    setLoading(true);
    setExistingAccountChecked(false);
  }, [firebaseUid]);

  // check if we've already created a Mollie account for this UID
  useEffect(() => {
    if (!firebaseUid) {
      setExistingAccountChecked(true);
      return;
    }
    fetch(`https://gutscheinery.de/api/zahlung/account/${firebaseUid}`)
      .then(res => res.json())
      .then(data => {
        if (data.accountId) {
          setAccountId(data.accountId);
        }
      })
      .catch(console.error)
      .finally(() => setExistingAccountChecked(true));
  }, [firebaseUid]);

  const missingData = !firebaseUid || !unternehmensname || !email;

  const connectMollie = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create Mollie account
      const createRes = await fetch('https://gutscheinery.de/api/zahlung/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, name: unternehmensname, email }),
      });
      if (!createRes.ok) throw new Error('Account-Erstellung fehlgeschlagen');
      const { accountId: newAccountId } = await createRes.json();
      setAccountId(newAccountId);

      // 2. Generate onboarding link
      const linkRes = await fetch(`https://gutscheinery.de/api/zahlung/onboard/${newAccountId}`);
      if (!linkRes.ok) throw new Error('Onboarding-Link fehlgeschlagen');
      const linkData = await linkRes.json();
      const url = linkData.url || linkData.link || linkData.accountLink?.url;
      if (!url) throw new Error('Keine URL gefunden');
      setOnboardUrl(url);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, m: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">Zahlungsdaten</Typography>
      <Typography color="textSecondary" mb={2}>
        Bitte hinterlegen Sie Ihre Auszahlungskonten über Mollie:
      </Typography>

      {/* Basis-Daten aus Step 1 */}
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

      {/* Fehlende Basis-Daten */}
      {!loading && missingData && (
        <Typography color="error" mb={2}>
          Bitte füllen Sie zuerst Unternehmensname, E-Mail und UID aus.
        </Typography>
      )}

      {/* Spinner */}
      {loading && <CircularProgress />}

      {/* Fehler */}
      {!loading && error && (
        <Typography color="error" mb={2}>
          Fehler beim Erzeugen des Onboarding-Links: {error}
        </Typography>
      )}

      {/* Generierung läuft */}
      {!loading && !error && !onboardUrl && !missingData && (
        <Typography mb={2}>Onboarding-Link wird erstellt…</Typography>
      )}

      {/* Bereits verbunden */}
      {!loading && existingAccountChecked && accountId && (
        <Typography color="primary" mb={2}>
          Mollie-Konto erfolgreich erstellt.
        </Typography>
      )}

      {/* Button nur für neue UIDs */}
      {!loading && existingAccountChecked && !accountId && !error && !missingData && (
        <Button variant="contained" color="primary" onClick={connectMollie}>
          Mit Mollie verbinden
        </Button>
      )}
    </Box>
  );
}