import { Box, Typography, TextField } from '@mui/material';
import { useState } from 'react';
import { useGutschein } from '../../context/GutscheinContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Zahlungsdaten() {
  const { data, setData } = useGutschein();
  const [touched, setTouched] = useState(false);

  const isValid = data.stripeAccountId?.trim().length > 0;

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
        value={data.stripeAccountId || ''}
        onChange={e => {
          setData({ ...data, stripeAccountId: e.target.value });
          setTouched(true);
        }}
        sx={{ mb: 2 }}
        helperText="Deine Stripe-Account-ID beginnt mit acct_..."
        error={touched && !isValid}
      />

      {isValid && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'green', mb: 2 }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography>Stripe-Konto verbunden: {data.stripeAccountId}</Typography>
        </Box>
      )}
    </Box>
  );
}