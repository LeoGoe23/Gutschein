import { Box, Typography, Button } from '@mui/material';
import { useGutschein } from '../../context/GutscheinContext';
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from 'react';

export default function Zusammenfassung() {
  const { data } = useGutschein();

  return (
    <Box sx={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Zusammenfassung
      </Typography>

      <Box sx={{ border: '1px solid #ccc', borderRadius: '1rem', padding: '2rem', backgroundColor: '#F9F9F9' }}>
        
        <Typography sx={{ fontWeight: 500, mb: '0.5rem' }}>
          Persönliche Daten:
        </Typography>
        <Typography>Vorname: {data.vorname}</Typography>
        <Typography>Nachname: {data.nachname}</Typography>
        <Typography>E-Mail: {data.email}</Typography>
        <Typography>Telefon: {data.telefon}</Typography>
        <Typography>Geschäftsart: {data.geschaeftsart}</Typography>

        <Typography sx={{ fontWeight: 500, mt: '1.5rem', mb: '0.5rem' }}>
          Gutschein Details:
        </Typography>
        <Typography>Gutscheinname: {data.name}</Typography>
        <Typography>Art: {data.art === 'wert' ? 'Wert-Gutschein' : 'Dienstleistung'}</Typography>

        {data.art === 'wert' && (
          <>
            <Typography>Werte: {data.betraege.join(', ')} €</Typography>
            <Typography>Freier Betrag erlaubt: {data.customValue ? 'Ja' : 'Nein'}</Typography>
          </>
        )}

        {data.art === 'dienstleistung' && (
          <>
            {data.dienstleistungen.map((d: { desc: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; price: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, i: Key | null | undefined) => (
              <Typography key={i}>
                {d.desc} – {d.price} €
              </Typography>
            ))}
          </>
        )}

        <Typography sx={{ fontWeight: 500, mt: '1.5rem', mb: '0.5rem' }}>
          Design:
        </Typography>
        <Typography>Design-Stil: {data.design}</Typography>
        {data.bild && (
          <Box sx={{ mt: '1rem' }}>
            <img src={data.bild} alt="Bild" style={{ width: '100px', borderRadius: '0.5rem' }} />
          </Box>
        )}
      </Box>

      <Button variant="contained" sx={{ mt: '2rem', backgroundColor: '#2E7D66' }}>
        Gutschein erstellen
      </Button>

    </Box>
  );
}
