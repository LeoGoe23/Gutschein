import { Box, Container, Typography, Paper } from '@mui/material';
import { useEffect } from 'react';

/**
 * DEMO-SEITE: Zeigt wie das Widget auf einer Kunden-Website aussehen würde
 * Diese Seite simuliert die Website eines Kunden (z.B. thai-massage-berlin.de)
 */
export default function WidgetDemo() {
  useEffect(() => {
    const currentOrigin = new URL(window.location.origin);
    const isAllowedOrigin = (origin: string) => {
      if (origin === window.location.origin) return true;
      try {
        const parsed = new URL(origin);
        const isLocalVariant =
          (currentOrigin.hostname === 'localhost' && parsed.hostname === '127.0.0.1') ||
          (currentOrigin.hostname === '127.0.0.1' && parsed.hostname === 'localhost');
        return (
          isLocalVariant &&
          parsed.protocol === currentOrigin.protocol &&
          parsed.port === currentOrigin.port
        );
      } catch {
        return false;
      }
    };

    // Höhen-Anpassung für iframe via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;

      const openInNewTab = (targetUrl: string) => {
        // Keep current page unchanged; browsers may return null with noopener.
        const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          console.warn('Popup blockiert. Bitte Popups fuer diese Seite erlauben.');
        }
      };

      if (event.data.type === 'gutschein-widget-resize') {
        const iframes = document.querySelectorAll('iframe[data-gutschein-widget="true"]');
        if (!event.data.height) return;
        iframes.forEach((iframe) => {
          (iframe as HTMLIFrameElement).style.height = `${event.data.height}px`;
        });
        console.log('Widget-Hoehe angepasst:', event.data.height + 'px');
      }

      if (event.data.type === 'gutscheinSelected') {
        const betrag = Number(event.data.betrag);
        if (!Number.isFinite(betrag) || betrag <= 0) return;
        const targetSlug = typeof event.data.slug === 'string' && event.data.slug.trim()
          ? event.data.slug.trim()
          : 'JANKIP';

        const params = new URLSearchParams({
          betrag: String(betrag),
          source: 'widget-demo',
          openPayment: '1'
        });

        if (typeof event.data.titel === 'string' && event.data.titel.trim()) {
          params.set('titel', event.data.titel.trim());
        }

        openInNewTab(`/demo/${encodeURIComponent(targetSlug)}?${params.toString()}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 1.5, md: 2 } }}>
          {/* Sticky Demo Header */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c', mb: 1, letterSpacing: '-0.02em' }}>
              Thai Massage Berlin
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#718096', fontSize: '1.1rem' }}>
              Traditionelle thailändische Massage & Wellness
            </Typography>
          </Box>

          {/* Sticky Navigation */}
          <Paper elevation={0} sx={{
            p: 2,
            display: 'flex',
            gap: { xs: 2, md: 4 },
            justifyContent: 'center',
            flexWrap: 'wrap',
            bgcolor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <Typography sx={{ cursor: 'pointer', color: '#718096', fontWeight: 500, transition: 'color 0.2s', '&:hover': { color: '#2d3748' } }}>Home</Typography>
            <Typography sx={{ cursor: 'pointer', color: '#718096', fontWeight: 500, transition: 'color 0.2s', '&:hover': { color: '#2d3748' } }}>Leistungen</Typography>
            <Typography sx={{ cursor: 'pointer', color: '#718096', fontWeight: 500, transition: 'color 0.2s', '&:hover': { color: '#2d3748' } }}>Preise</Typography>
            <Typography sx={{ cursor: 'pointer', fontWeight: 600, color: '#2d3748' }}>Gutscheine</Typography>
            <Typography sx={{ cursor: 'pointer', color: '#718096', fontWeight: 500, transition: 'color 0.2s', '&:hover': { color: '#2d3748' } }}>Kontakt</Typography>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Fake Content */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#1a202c' }}>
            Verschenken Sie Entspannung
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#4a5568', lineHeight: 1.7, fontSize: '1.05rem' }}>
            Mit unseren Gutscheinen machen Sie Ihren Liebsten eine besondere Freude. 
            Wählen Sie zwischen einem freien Wertbetrag oder einer unserer beliebten Behandlungen.
          </Typography>

          {/* Divider vor Widget */}
          <Box sx={{ my: 5, borderBottom: '2px solid #e2e8f0' }} />

          {/* Das eingebettete Widget */}
          <Box sx={{ my: 5 }}>
            <iframe
              id="gutschein-widget-iframe"
              data-gutschein-widget="true"
              src="/embed/RR2H80"
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '12px',
                overflow: 'hidden',
                minHeight: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                background: 'white'
              }}
              title="Gutschein Widget"
            />
          </Box>

          {/* Divider nach Widget */}
          <Box sx={{ my: 5, borderBottom: '2px solid #e2e8f0' }} />

          <Typography variant="body2" sx={{ mt: 4, color: '#718096', fontStyle: 'italic' }}>
            * Gutscheine sind 3 Jahre ab Kaufdatum gültig
          </Typography>
        </Box>

        {/* Code-Beispiel für den Kunden */}
        <Paper elevation={0} sx={{ p: 4, bgcolor: '#1a202c', color: '#fff', borderRadius: '16px' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#63b3ed', fontWeight: 600 }}>
            So einfach binden Sie das Widget ein:
          </Typography>
          <Box component="pre" sx={{ 
            bgcolor: '#2d3748', 
            p: 3, 
            borderRadius: '12px',
            overflow: 'auto',
            fontSize: '14px',
            fontFamily: 'monospace',
            border: '1px solid #4a5568'
          }}>
{`<!-- Fügen Sie diesen Code auf Ihrer Website ein: -->
<div id="gutschein-widget" data-slug="RR2H80"></div>
<script src="https://gutscheinfabrik.de/widget.js"></script>

<!-- Fertig! Das Widget lädt automatisch -->`}
          </Box>
          
          <Box sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
              Exakt dieser Code:
            </Typography>
            <Box component="pre" sx={{ 
              bgcolor: 'white', 
              p: 2, 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px',
              fontFamily: 'monospace',
              border: '1px solid #e2e8f0',
              color: '#1a202c'
            }}>
{`<div id="gutschein-widget" data-slug="IHR_SLUG_HIER"></div>
<script src="https://gutscheinfabrik.de/widget.js"></script>`}
            </Box>
          </Box>
        </Paper>
        
        {/* Zweites Widget zum Testen */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1a202c', textAlign: 'center' }}>
            Widget-Test mit nativem Code:
          </Typography>
          <Box sx={{ my: 4, borderTop: '2px solid #e2e8f0' }} />
          <iframe
            data-gutschein-widget="true"
            src="/embed/RR2H80"
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: '400px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              background: 'white'
            }}
            title="Gutschein Widget Test"
          />
          <Box sx={{ my: 4, borderTop: '2px solid #e2e8f0' }} />
        </Box>
      </Container>
    </Box>
  );
}
