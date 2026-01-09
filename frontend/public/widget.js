/**
 * GutscheinFabrik Widget Loader
 * Version: 1.0.0
 * 
 * Usage:
 * <div id="gutschein-widget" 
 *      data-slug="your-shop-slug"
 *      data-primary-color="#1976d2"
 *      data-font-family="Arial">
 * </div>
 * <script src="https://gutscheinfabrik.de/widget.js"></script>
 */

(function() {
  'use strict';

  // Warte bis DOM geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    // Finde alle Widget-Container
    const containers = document.querySelectorAll('[id^="gutschein-widget"]');
    
    containers.forEach(function(container) {
      const slug = container.getAttribute('data-slug');
      const primaryColor = container.getAttribute('data-primary-color');
      const fontFamily = container.getAttribute('data-font-family');
      const backgroundColor = container.getAttribute('data-background-color');
      const theme = container.getAttribute('data-theme'); // "auto", "light", "dark"
      
      if (!slug) {
        console.error('GutscheinWidget: data-slug Attribut fehlt!');
        return;
      }

      // Auto-Theme-Detection
      let detectedPrimaryColor = primaryColor;
      let detectedBgColor = backgroundColor;
      let detectedFontFamily = fontFamily;
      
      if (theme === 'auto' || !primaryColor || !fontFamily) {
        const detection = detectParentTheme();
        if (!primaryColor) detectedPrimaryColor = detection.primaryColor;
        if (!backgroundColor) detectedBgColor = detection.isDark ? '#1a1a1a' : 'transparent';
        if (!fontFamily) detectedFontFamily = detection.fontFamily;
      }

      // Erstelle iframe mit Styling-Parametern
      const iframe = document.createElement('iframe');
      // Automatische Umgebungserkennung
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseURL = isDevelopment ? 'http://localhost:3000' : 'https://gutscheinery.de';
      
      // Baue URL mit Parametern
      let url = baseURL + '/embed/' + slug;
      const params = [];
      if (detectedPrimaryColor) params.push('primaryColor=' + encodeURIComponent(detectedPrimaryColor));
      if (detectedFontFamily) params.push('fontFamily=' + encodeURIComponent(detectedFontFamily));
      if (detectedBgColor) params.push('backgroundColor=' + encodeURIComponent(detectedBgColor));
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.style.minHeight = '600px';
      iframe.style.overflow = 'hidden';
      iframe.title = 'Gutschein Widget';
      iframe.setAttribute('scrolling', 'no');

      // Füge iframe zum Container hinzu
      container.appendChild(iframe);

      // Höhen-Anpassung
      window.addEventListener('message', function(event) {
        // Sicherheit: Prüfe Origin (in Production auf deine Domain beschränken)
        // if (event.origin !== 'https://gutscheinfabrik.de') return;
        
        if (event.data.type === 'gutschein-widget-resize') {
          iframe.style.height = event.data.height + 'px';
          console.log('GutscheinWidget: Höhe angepasst auf', event.data.height + 'px');
        }
      });

      console.log('GutscheinWidget: Erfolgreich geladen für Slug:', slug);
    });
  }

  // Theme-Detection Funktion
  function detectParentTheme() {
    try {
      // 1. Versuche Primärfarbe von Links zu extrahieren
      const link = document.querySelector('a');
      let primaryColor = '#1976d2'; // Fallback
      
      if (link) {
        const linkStyle = window.getComputedStyle(link);
        const linkColor = linkStyle.color;
        // Konvertiere rgb zu hex
        const rgb = linkColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          primaryColor = '#' + 
            parseInt(rgb[0]).toString(16).padStart(2, '0') +
            parseInt(rgb[1]).toString(16).padStart(2, '0') +
            parseInt(rgb[2]).toString(16).padStart(2, '0');
        }
      }

      // 2. Erkenne Dark/Light Mode
      const body = document.body;
      const bodyStyle = window.getComputedStyle(body);
      const bgColor = bodyStyle.backgroundColor;
      
      let isDark = false;
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        // Berechne Helligkeit (0-255)
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        isDark = brightness < 128;
      }

      // 3. Erkenne Schriftart vom Body
      let fontFamily = bodyStyle.fontFamily || 'inherit';
      // Bereinige font-family (entferne Anführungszeichen)
      fontFamily = fontFamily.replace(/['"]/g, '');

      return {
        primaryColor: primaryColor,
        isDark: isDark,
        fontFamily: fontFamily
      };
    } catch (error) {
      console.warn('Theme-Detection fehlgeschlagen, nutze Defaults', error);
      return {
        primaryColor: '#1976d2',
        isDark: false,
        fontFamily: 'inherit'
      };
    }
  }
})();
