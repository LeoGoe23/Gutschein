import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GutscheinData {
  unternehmen: string;
  betrag: string;
  gutscheinCode: string;
  ausstelltAm: string;
  website?: string;
  bildURL?: string;
  dienstleistung?: {
    shortDesc: string;
    longDesc: string;
  };
}

export const generateGutscheinPDF = async (data: GutscheinData): Promise<void> => {
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
  `;
  
  // HTML-Inhalt generieren - EXAKT wie in Step3.tsx
  pdfContent.innerHTML = `
    <div style="
      width: 595px;
      height: 842px;
      position: relative;
      background-color: #ffffff;
      overflow: hidden;
      box-sizing: border-box;
    ">
      ${data.bildURL ? `
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
          src="${data.bildURL}"
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
        height: ${data.bildURL ? 'calc(842px - 210px - 24px)' : '842px'};
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
            € ${data.betrag}
          </div>
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
          ${data.dienstleistung.longDesc || data.dienstleistung.shortDesc}
        </div>` : ''}

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
  
  // Element zum DOM hinzufügen
  document.body.appendChild(pdfContent);
  
  try {
    // Canvas erstellen mit höherer Auflösung für bessere Qualität
    const canvas = await html2canvas(pdfContent, {
      width: 595,
      height: 842,
      scale: 3, // Höhere Auflösung für bessere Qualität
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: false,
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
    
    // PDF speichern
    const fileName = `Gutschein_${data.unternehmen.replace(/[^a-zA-Z0-9]/g, '_')}_${data.gutscheinCode}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Fehler beim Generieren des PDFs:', error);
    throw new Error('PDF konnte nicht generiert werden');
  } finally {
    // Element wieder entfernen
    document.body.removeChild(pdfContent);
  }
};