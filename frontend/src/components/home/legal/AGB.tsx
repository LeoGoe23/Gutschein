import React from 'react';
import { useEffect } from 'react';
import { Container, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoTopLeft from '../TopLeftLogo';
import Footer from '../Footer';


export default function AGB() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <LogoTopLeft />
      <Container sx={{ pt: '6rem', px: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Allgemeine Geschäftsbedingungen (AGB) der Gutscheinfabrik GbR
      </Typography>

      <Typography variant="h6" gutterBottom>
        1. Geltungsbereich
      </Typography>
      <Typography paragraph>
        (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge, die Verbraucher oder Unternehmer (nachfolgend gemeinsam „Kund:innen") über den Online-Shop der Gutscheinfabrik GbR, Stünzbach 4a, 84172 Buch am Erlbach (nachfolgend „Anbieter") abschließen.
      </Typography>
      <Typography paragraph>
        (2) Abweichende Bedingungen der Kund:innen erkennt der Anbieter nicht an, es sei denn, er stimmt ihrer Geltung ausdrücklich schriftlich zu.
      </Typography>

      <Typography variant="h6" gutterBottom>
        2. Vertragspartner
      </Typography>
      <Typography paragraph>
        Vertragspartner sind:<br />
        • GutscheinFabrik GbR<br />
        – Leonhard Götz, Stünzbach 4a, 84172 Buch am Erlbach<br />
        – Konrad Blersch, Wahlenstraße 27, 93047 Regensburg<br />
        Kontakt E‑Mail: <Link href="mailto:gutscheinfabrik@gmail.com">gutscheinfabrik@gmail.com</Link>
      </Typography>

      <Typography variant="h6" gutterBottom>
        3. Begriffsdefinitionen
      </Typography>
      <Typography paragraph>
        • Gutschein: Elektronischer Gutscheincode eines (zukünftigen) Partnerunternehmens.
      </Typography>

      <Typography variant="h6" gutterBottom>
        4. Vertragsschluss
      </Typography>
      <Typography paragraph>
        (1) Die Präsentation der Gutscheine im Online-Shop stellt kein bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots durch die Kund:innen.<br />
        (2) Durch Anklicken des Buttons „zahlungspflichtig bestellen" geben die Kund:innen ein verbindliches Angebot ab.<br />
        (3) Der Anbieter bestätigt den Eingang der Bestellung unverzüglich per E‑Mail. Mit dieser Auftragsbestätigung kommt der Vertrag zustande.
      </Typography>

      <Typography variant="h6" gutterBottom>
        5. Leistungen und Lieferung
      </Typography>
      <Typography paragraph>
        (1) Der Anbieter vermittelt bzw. verkauft elektronische Gutscheincodes an Endkund:innen.<br />
        (2) Die Zustellung des Gutscheincodes erfolgt per E‑Mail an die vom Kunden angegebene E‑Mail-Adresse in der Regel unmittelbar nach Zahlungseingang.
      </Typography>

      <Typography variant="h6" gutterBottom>
        6. Preise, Zahlung und Provision
      </Typography>
      <Typography paragraph>
        (1) Die angegebenen Preise enthalten die gesetzliche Mehrwertsteuer. Zusätzliche Versandkosten fallen nicht an.<br />
        (2) Die Zahlung erfolgt per Kreditkarte, Apple Pay, Google Pay oder PayPal und ist unmittelbar mit Bestellung fällig.<br />
        (3) Im Falle des Zahlungsausfalls behält sich der Anbieter vor, den Gutschein zu stornieren.
      </Typography>

      <Typography variant="h6" gutterBottom>
        7. Widerrufsrecht
      </Typography>
      <Typography paragraph>
        (1) Verbrauchern steht ein gesetzliches Widerrufsrecht nach §§ 312g, 355 BGB zu.<br />
        (2) Die Widerrufsfrist beträgt 14 Tage ab Erhalt der Ware bzw. bei digitalen Inhalten ab Vertragsschluss.<br />
        (3) Das Widerrufsrecht erlischt bei Verträgen zur Lieferung von digitalen Inhalten (elektronische Gutscheincodes), wenn der Anbieter mit der Ausführung des Vertrags begonnen hat und der Kunde zuvor ausdrücklich zugestimmt hat, dass er sein Widerrufsrecht verliert.<br />
        (4) Für die Ausübung des Widerrufsrechts genügt eine eindeutige Erklärung per E‑Mail an <Link href="mailto:gutscheinfabrik@gmail.com">gutscheinfabrik@gmail.com</Link>.
      </Typography>

      <Typography variant="h6" gutterBottom>
        8. Haftung und Gewährleistung
      </Typography>
      <Typography paragraph>
        (1) Die Haftung des Anbieters für leicht fahrlässige Pflichtverletzungen wird ausgeschlossen, es sei denn, es handelt sich um die Verletzung wesentlicher Vertragspflichten.<br />
        (2) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.<br />
        (3) Eine Haftung für die Erbringung oder Einlösung des Gutscheins durch das Partnerunternehmen ist ausgeschlossen.<br />
        (4) Es gelten die gesetzlichen Gewährleistungsrechte.
      </Typography>

      <Typography variant="h6" gutterBottom>
        9. Datenschutz
      </Typography>
      <Typography paragraph>
        Weitere Informationen zum Datenschutz finden Sie in unserer <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </Typography>

      <Typography variant="h6" gutterBottom>
        10. Schlussbestimmungen
      </Typography>
      <Typography paragraph>
        (1) Es gilt ausschließlich deutsches Recht unter Ausschluss des UN-Kaufrechts.<br />
        (2) Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Regensburg, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.<br />
        (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
      </Typography>
      </Container>
      <Footer />
    </>
  );
}
