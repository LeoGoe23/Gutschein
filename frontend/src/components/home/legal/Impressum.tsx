import React from 'react';
import { Container, Typography, Link } from '@mui/material';

export default function Impressum() {
  return (
    <Container sx={{ py: 4, px: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Impressum
      </Typography>

      <Typography variant="body1" paragraph>
        GutscheinFabrik GbR<br />
        Stünzbach 4a<br />
        84172 Buch am Erlbach
      </Typography>

      <Typography variant="h6" gutterBottom>
        Vertreten durch:
      </Typography>
      <Typography variant="body1" paragraph>
        Herrn Leonhard Götz<br />
        Herrn Konrad Blersch
      </Typography>

      <Typography variant="h6" gutterBottom>
        Kontakt
      </Typography>
      <Typography variant="body1" paragraph>
        Telefon: 17672910739<br />
        E-Mail: <Link href="mailto:gutscheinfabrik@gmail.com">gutscheinfabrik@gmail.com</Link>
      </Typography>

      <Typography variant="h6" gutterBottom>
        Verbraucherstreitbeilegung/Universalschlichtungsstelle
      </Typography>
      <Typography variant="body1" paragraph>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Zentrale Kontaktstelle nach dem Digital Services Act - DSA (Verordnung (EU) 2022/265)
      </Typography>
      <Typography variant="body1" paragraph>
        Unsere zentrale Kontaktstelle für Nutzer und Behörden nach Art. 11, 12 DSA erreichen Sie wie folgt:<br />
        E-Mail: <Link href="mailto:gutscheinfabrik@gmail.com">gutscheinfabrik@gmail.com</Link><br />
        Telefon: 17672910739<br />
        Die für den Kontakt zur Verfügung stehenden Sprachen sind: Deutsch, Englisch.
      </Typography>
    </Container>
  );
}
