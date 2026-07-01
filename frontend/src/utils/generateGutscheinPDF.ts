import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GutscheinData {
  unternehmen: string;
  betrag: string;
  gutscheinCode: string;
  ausstelltAm: string;
  website: string;
  bildURL?: string;
  dienstleistung?: {
    shortDesc: string;
    longDesc: string;
  };
  gutscheinDesignURL?: string;
  designConfig?: {
    betrag: { x: number; y: number; size: number; width?: number; color?: string };
    code: { x: number; y: number; size: number; width?: number; color?: string };
  };
  isDemoMode?: boolean; // ✅ NEU: Demo-Flag hinzufügen
}

// 🔥 Hilfsfunktion: Bild zu Base64 konvertieren über Backend
const imageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('🔄 Converting image to Base64 via backend:', imageUrl);
    
    // Backend-Route verwenden
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_URL}/api/gutscheine/image-to-base64`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend conversion failed: ${errorData.error || response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Image converted via backend proxy');
    console.log('🎯 Original size:', data.size, 'bytes');
    console.log('🎯 MIME type:', data.mimeType);
    
    return data.base64;
    
  } catch (backendError) {
    console.warn('⚠️ Backend conversion failed, trying direct fetch:', backendError);
    
    // Fallback: Versuche direkten Fetch (wird wahrscheinlich CORS-Fehler geben)
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          console.log('✅ Direct fetch conversion successful');
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
    } catch (directError) {
      console.error('❌ All conversion methods failed');
      console.error('Backend error:', (backendError instanceof Error ? backendError.message : String(backendError)));
      console.error('Direct fetch error:', directError instanceof Error ? directError.message : String(directError));
      
      // Als letzter Ausweg: Original URL zurückgeben
      console.warn('🔄 Using original URL as fallback (may cause CORS issues)');
      return imageUrl;
    }
  }
};

// A4 Größe in Pixel bei 72 DPI (Standard für jsPDF)
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

export const generateGutscheinPDF = async (data: GutscheinData): Promise<Blob> => {
  console.log('🎨 Generating PDF with design:', data.gutscheinDesignURL);
  
  // Container für PDF-Generierung erstellen
  const pdfContent = document.createElement('div');
  pdfContent.style.cssText = `
    width: 595px;
    height: 842px;
    position: absolute;
    top: -9999px;
    left: -9999px;
    background: white;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
  `;
  
  if (data.gutscheinDesignURL && data.designConfig) {
    console.log('✅ Using custom PNG design');
    
    let safeImageUrl = data.gutscheinDesignURL;
    try {
      safeImageUrl = await imageToBase64(data.gutscheinDesignURL);
      console.log('✅ Image successfully converted to Base64');
    } catch (error) {
      console.error('❌ Image conversion failed, using original URL:', error);
    }
    
    // 🚨 PROBLEM GEFUNDEN: Editor hat BORDER + PADDING!
    // Der Editor-Container hat: border: 4px + eventuell padding
    // Das PDF-Container hat: KEIN border, KEIN padding
    
    // 🔥 ECHTES PROBLEM: Koordinaten sind relativ zum BROWSER-VIEWPORT, nicht zum Container!
    // Wir müssen die Container-Position berücksichtigen!
    
    // KORREKTUR: Prozentsätze zu Pixeln umrechnen
    const betragConfig = {
      x: data.designConfig.betrag.x, // Bereits Pixel
      y: data.designConfig.betrag.y, // Bereits Pixel
      size: data.designConfig.betrag.size,
    };
    
    const codeConfig = {
      x: data.designConfig.code.x, // Bereits Pixel
      y: data.designConfig.code.y, // Bereits Pixel
      size: data.designConfig.code.size,
    };

    const betragColor = data.designConfig?.betrag?.color || '#000000';
    const codeColor = data.designConfig?.code?.color || '#000000';
    
    console.log('🎯 Direkte Pixel-Werte:');
    console.log('🎯 Betrag - Pixel:', betragConfig);
    console.log('🎯 Code - Pixel:', codeConfig);
    
    // ✅ NEU: Gleiche intelligente Textaufteilung für PDF
    // ✅ KORREKTUR: Für Custom-Design nur shortDesc verwenden
    const displayBetrag = data.dienstleistung 
      ? data.dienstleistung.shortDesc // ✅ Nur shortDesc für Custom-Design
      : `€ ${data.betrag}`;

    // ✅ DEBUG: Welcher Text wird verwendet?
    console.log('🎯 Display Betrag:', displayBetrag);
    console.log('🎯 Dienstleistung Data:', data.dienstleistung);
    console.log('🎯 Betrag Data:', data.betrag);
    
    // 🎯 EXAKT gleiche Struktur wie im Editor mit Border!
    // Custom PNG-Design Bereich - Dienstleistung oder Betrag anzeigen:
    pdfContent.innerHTML = `
      <div id="design-preview" style="
        width: 595px;
        height: 842px;
        position: relative;
        background-color: #ffffff;
        overflow: hidden;
        box-sizing: border-box;
        border: none;
        box-shadow: none;
        border-radius: 0;
      ">
        <!-- Custom PNG-Hintergrund -->
        <img
          src="${safeImageUrl}"
          alt="Gutschein Design"
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
          "
        />
        
        <!-- Text-Overlays -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">
          <!-- Betrag/Dienstleistung -->
          <div style="
            position: absolute;
            left: 50%;
            top: ${betragConfig.y}px;
            transform: translateX(-50%);
            font-size: ${betragConfig.size}px;
            color: ${betragColor};
            font-weight: bold;
            font-family: Arial, sans-serif;
            text-align: center;
            line-height: 1.1;
            white-space: pre-line;
            max-width: ${data.designConfig?.betrag?.width || 80}%;
            padding: 4px 8px;
          ">
            ${displayBetrag}
          </div>
          
          <!-- Gutscheincode -->
          <div style="
            position: absolute;
            left: 50%;
            top: ${codeConfig.y}px;
            transform: translateX(-50%);
            font-size: ${codeConfig.size}px;
            color: ${codeColor};
            font-weight: bold;
            font-family: 'Courier New', monospace;
            text-align: center;
            white-space: nowrap;
            min-width: 150px;
          ">
            ${data.gutscheinCode}
          </div>
        </div>
      </div>
    `;
  } else {
    console.log('✅ Using standard layout');
    
    // Standard-Layout - auch mit Base64-Konvertierung für bildURL
    let safeBildURL = data.bildURL;
    if (data.bildURL) {
      try {
        safeBildURL = await imageToBase64(data.bildURL);
        console.log('✅ Company image converted to Base64');
      } catch (error) {
        console.warn('⚠️ Company image conversion failed, using original URL');
      }
    }
    
    pdfContent.innerHTML = `
      <div id="standard-preview" style="
        width: 595px;
        height: 842px;
        position: relative;
        background-color: #ffffff;
        overflow: hidden;
        box-sizing: border-box;
      ">
        ${safeBildURL ? `
        <!-- Unternehmensbild im oberen Bereich -->
        <div style="
          width: 100%;
          height: 210px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          margin-bottom: 24px;
          overflow: hidden;
          position: relative;
        ">
          <img
            src="${safeBildURL}"
            alt="Unternehmensbild"
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              min-width: 100%;
              min-height: 100%;
              width: auto;
              height: auto;
              object-fit: cover;
            "
          />
        </div>` : ''}

        <!-- Gutschein-Inhalt -->
        <div style="
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          height: ${safeBildURL ? 'calc(842px - 210px - 24px)' : '842px'};
          justify-content: center;
          box-sizing: border-box;
        ">
          <!-- Überschrift -->
          <div style="
            font-weight: bold;
            text-align: center;
            color: #1976d2;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            font-size: 48px;
            margin: 0;
            font-family: Arial, sans-serif;
            line-height: 1.2;
          ">
            GUTSCHEIN
          </div>

          <!-- Unternehmen -->
          <div style="
            font-weight: 600;
            text-align: center;
            color: #333;
            margin: 0;
            font-size: 28px;
            font-family: Arial, sans-serif;
            line-height: 1.2;
            max-width: 500px;
            word-wrap: break-word;
          ">
            ${data.unternehmen}
          </div>

          ${data.dienstleistung ? `
          <!-- Dienstleistung -->
          <div style="
            text-align: center;
            color: #666;
            font-size: 16px;
            margin: 8px 0;
            font-family: Arial, sans-serif;
            max-width: 400px;
            word-wrap: break-word;
            line-height: 1.4;
          ">
            <div style="font-size:32px;font-weight:bold;color:#1976d2;">${data.dienstleistung.shortDesc}</div>
            <div style="font-size:16px;color:#666;">${data.dienstleistung.longDesc}</div>
          </div>` : `
          <!-- Betrag -->
          <div style="
            background: linear-gradient(45deg, #1976d2 30%, #42a5f5 90%);
            border-radius: 15px;
            padding: 20px 40px;
            box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);
            margin: 16px 0;
          ">
            <div style="
              font-weight: bold;
              text-align: center;
              color: #ffffff;
              font-size: 48px;
              margin: 0;
              font-family: Arial, sans-serif;
              line-height: 1;
            ">
              ${data.betrag} €
            </div>
          </div>`}

          <!-- Gutscheincode -->
          <div style="
            border: 2px dashed #1976d2;
            padding: 15px 25px;
            border-radius: 8px;
            background-color: #f8f9fa;
            margin: 16px 0;
          ">
            <div style="
              font-weight: bold;
              text-align: center;
              font-family: 'Courier New', monospace;
              color: #1976d2;
              letter-spacing: 2px;
              font-size: 20px;
              margin: 0;
              line-height: 1;
            ">
              ${data.gutscheinCode}
            </div>
          </div>

          <!-- Gültigkeit -->
          <div style="
            text-align: center;
            color: #666;
            font-weight: 500;
            font-size: 14px;
            font-family: Arial, sans-serif;
            margin: 8px 0;
          ">
            Ausgestellt am: ${data.ausstelltAm}
          </div>

          ${data.website ? `
          <!-- Website -->
          <div style="
            text-align: center;
            color: #1976d2;
            font-weight: 500;
            font-size: 14px;
            font-family: Arial, sans-serif;
            margin: 4px 0;
          ">
            ${data.website}
          </div>` : ''}

          <!-- Abschlusstext -->
          <div style="
            margin-top: 16px;
            padding: 10px 20px;
            border-top: 1px solid #e0e0e0;
            width: calc(100% - 40px);
          ">
            <div style="
              text-align: center;
              color: #666;
              font-style: italic;
              font-size: 12px;
              font-family: Arial, sans-serif;
            ">
              Wir freuen uns auf Sie!
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Element zum DOM hinzufügen
  document.body.appendChild(pdfContent);

  // Kurz warten damit Base64-Bilder geladen werden
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // 🎯 EXAKT gleiche Download-Logik wie im Editor!
    const previewElement = pdfContent.querySelector('#design-preview, #standard-preview, [style*="width: 595px"]') as HTMLElement;
    
    // Temporär Rand/Schatten entfernen (wie im Editor)
    previewElement.style.border = 'none';
    previewElement.style.boxShadow = 'none';

    // Canvas erstellen mit EXAKT gleichen Einstellungen wie Editor
    const canvas = await html2canvas(previewElement, {
      width: 595,
      height: 842,
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: false,
      imageTimeout: 15000,
      logging: false
    });
    
    // PDF erstellen im A4 Format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [595, 842]
    });
    
    // Bild zum PDF hinzufügen
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 595, 842, '', 'FAST');
    
    // Demo-Wasserzeichen hinzufügen wenn isDemoMode = true
    if (data.isDemoMode) {
      pdf.setFontSize(60);
      pdf.setTextColor(255, 0, 0, 0.3); // Rot, transparent
      pdf.text('DEMO', A4_WIDTH_PX / 2, A4_HEIGHT_PX / 2, { 
        align: 'center',
        angle: 45 
      });
      pdf.setTextColor(0, 0, 0); // Zurück zu schwarz
    }
    
    // PDF als Blob zurückgeben
    const pdfBlob = pdf.output('blob');
    console.log('✅ PDF successfully generated with custom design');
    return pdfBlob;
    
  } catch (error) {
    console.error('❌ Fehler beim Generieren des PDFs:', error);
    throw new Error('PDF konnte nicht generiert werden');
  } finally {
    // Element wieder entfernen
    document.body.removeChild(pdfContent);
  }
};
