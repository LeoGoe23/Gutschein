import React, { useState } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqData = [
  {
    question: "Wie kann ich Gutscheine über eure Plattform verkaufen?",
    answer: "Sie erhalten einen individuellen Gutschein-Link oder können diesen direkt in Ihre Website einbinden. Ihre Kunden wählen den Betrag aus, bezahlen online, und erhalten den Gutschein sofort digital – ohne Mehraufwand für Sie."
  },
  {
    question: "Wie funktioniert die Auszahlung an meinen Shop?",
    answer: "Die Einnahmen aus dem Gutscheinverkauf werden automatisch über Stripe an Sie ausgezahlt. Sie sehen jederzeit, wie viele Gutscheine verkauft wurden – transparent und nachvollziehbar."
  },
  {
    question: "Was kostet mich die Teilnahme?",
    answer: "Es gibt keine Einrichtungsgebühr, keine Fixkosten und kein Abo. Wir behalten lediglich eine geringe Provision von 6,5 % pro verkauftem Gutschein ein – der Rest gehört Ihnen."
  },
  {
    question: "Muss ich meine Website umbauen?",
    answer: "Nein. Sie können den Gutschein-Link ganz einfach auf Ihrer Website, bei Instagram, Facebook oder Google Business hinterlegen – mit einem Klick buchbar. Alternativ stellen wir Ihnen auf Wunsch auch eine einfache Shop-Seite zur Verfügung."
  },
  {
    question: "Kann ich meine Gutscheine später anpassen?",
    answer: "Ja. Sie können jederzeit den Betrag, das Design oder die Beschreibung ändern – ohne technische Vorkenntnisse. Wir helfen Ihnen gern dabei."
  },
  {
    question: "Wie schnell erhält der Kunde den Gutschein?",
    answer: "Sofort. Der Gutschein wird dem Käufer direkt nach dem Kauf per E-Mail zugestellt – inklusive PDF zum Ausdrucken, falls gewünscht."
  },
  {
    question: "Ist das rechtlich sicher und steuerlich sauber?",
    answer: "Ja. Wir nutzen Stripe als zertifizierten Zahlungsanbieter und stellen dem Kunden eine rechtssichere Rechnung aus. Alle Verkäufe sind in Ihrem Dashboard dokumentiert."
  }
];

export default function FAQ() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      padding: { xs: '4rem 1rem', md: '6rem 2rem' }, // Einheitliches Padding
      backgroundColor: '#f4f4f4', // Gleiche Farbe wie ContentSection
      overflow: 'hidden'
    }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200, // Einheitliche Breite
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3rem',
          boxSizing: 'border-box',
        }}
      >
        <Typography 
          sx={{ 
            fontSize: { xs: '2rem', md: '2.8rem' }, 
            fontWeight: 700, 
            color: '#222',
            textAlign: 'center',
            maxWidth: 1200,
          }}
        >
          Häufig gestellte Fragen
        </Typography>
        
        <Box sx={{ width: '100%', maxWidth: '1000px' }}>
          {faqData.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              sx={{
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                '&:before': {
                  display: 'none',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  minHeight: '64px',
                  '&.Mui-expanded': {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  backgroundColor: '#ffffff',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px',
                  padding: '1.5rem',
                }}
              >
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  );
}