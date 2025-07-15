import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Card, CardActionArea, Modal, Grid, Stack } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import CloseIcon from '@mui/icons-material/Close';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useGutschein } from '../../context/GutscheinContext';

interface Feld {
  typ: 'CODE' | 'TEXT' | 'BETRAG' | 'DIENSTLEISTUNG' | 'UNTERNEHMEN' | 'GUELTIG_BIS' | 'WEBSITE';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  editing: boolean;
}

interface DesignVorlage {
  id: number;
  name: string;
  image: string;
  description: string;
}

export default function GutscheinEditor() {
  const { data, setData } = useGutschein();
  
  const [modus, setModus] = useState<'eigenes' | 'vorlage' | 'designen'>(data.gutscheinDesign.modus);
  const [hintergrund, setHintergrund] = useState<string | null>(data.gutscheinDesign.hintergrund);
  const [hintergrundTyp, setHintergrundTyp] = useState<'image' | 'pdf' | null>(data.gutscheinDesign.hintergrundTyp);
  const [felder, setFelder] = useState<Feld[]>(data.gutscheinDesign.felder);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState<boolean[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Dynamische Daten aus dem Kontext
  const unternehmen = data.unternehmensname || data.name || "Ihr Unternehmen";
  const website = data.website || "www.ihr-unternehmen.de";
  const beispielBetrag = data.betraege?.[0] || "50";
  const beispielDienstleistung = data.dienstleistungen?.[0]?.shortDesc || "Beispiel Dienstleistung";
  const beispielCode = `${data.gutscheinConfig?.prefix || 'GS'}-XXXX-XXXX`;
  const gueltigBis = new Date(Date.now() + ((data.gutscheinConfig?.gueltigkeitTage || 365) * 24 * 60 * 60 * 1000)).toLocaleDateString('de-DE');

  // Hilfsfunktion um dynamische Inhalte zu generieren
  const getDynamicContent = (placeholder: string) => {
    switch (placeholder) {
      case 'UNTERNEHMEN':
        return unternehmen;
      case 'WEBSITE':
        return website;
      case 'BETRAG':
        return `€ ${beispielBetrag}`;
      case 'DIENSTLEISTUNG':
        return beispielDienstleistung;
      case 'CODE':
        return beispielCode;
      case 'GUELTIG_BIS':
        return `Gültig bis: ${gueltigBis}`;
      default:
        return placeholder;
    }
  };

  // Speichere Änderungen im Kontext
  const saveToContext = () => {
    setData({
      gutscheinDesign: {
        modus,
        hintergrund,
        hintergrundTyp,
        selectedDesign: data.gutscheinDesign.selectedDesign,
        felder
      }
    });
  };

  React.useEffect(() => {
    saveToContext();
  }, [modus, hintergrund, hintergrundTyp, felder]);

  // Dynamische Gutschein-Designs mit echten Daten
  const designVorlagen: DesignVorlage[] = [
    {
      id: 1,
      name: "Elegant Gold",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#FF6347;stop-opacity:1" />
            </linearGradient>
            <pattern id="goldPattern" patternUnits="userSpaceOnUse" width="60" height="60">
              <circle cx="30" cy="30" r="2" fill="rgba(255,255,255,0.3)" />
            </pattern>
          </defs>
          <rect width="595" height="842" fill="url(#goldGrad)" />
          <rect x="0" y="0" width="595" height="842" fill="url(#goldPattern)" />
          <rect x="30" y="30" width="535" height="782" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="20,5" />
          <circle cx="297.5" cy="200" r="80" fill="rgba(255,255,255,0.9)" />
          <text x="297.5" y="210" text-anchor="middle" fill="#B8860B" font-size="24" font-weight="bold" font-family="serif">GUTSCHEIN</text>
          <text x="297.5" y="280" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">${unternehmen}</text>
          <rect x="100" y="350" width="395" height="80" fill="rgba(255,255,255,0.85)" rx="10" />
          <text x="297.5" y="375" text-anchor="middle" fill="#B8860B" font-size="14">Gutscheincode:</text>
          <text x="297.5" y="400" text-anchor="middle" fill="#B8860B" font-size="18" font-weight="bold">${beispielCode}</text>
          <rect x="100" y="500" width="395" height="60" fill="rgba(255,255,255,0.85)" rx="10" />
          <text x="297.5" y="535" text-anchor="middle" fill="#B8860B" font-size="20" font-weight="bold">€ ${beispielBetrag}</text>
          <text x="297.5" y="620" text-anchor="middle" fill="#fff" font-size="14">Nicht gegen Barwert tauschbar</text>
          <text x="297.5" y="700" text-anchor="middle" fill="#fff" font-size="14">Wir freuen uns auf Ihren Besuch!</text>
          <text x="297.5" y="730" text-anchor="middle" fill="#fff" font-size="12">${website}</text>
          <rect x="50" y="750" width="495" height="60" fill="rgba(255,255,255,0.1)" rx="5" />
          <text x="297.5" y="785" text-anchor="middle" fill="#fff" font-size="12">Nicht mit anderen Aktionen kombinierbar</text>
        </svg>
      `),
      description: "Luxuriöser goldener Gutschein mit elegantem Design und Ornament-Muster"
    },
    {
      id: 2,
      name: "Modern Blau",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4FC3F7;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#29B6F6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0277BD;stop-opacity:1" />
            </linearGradient>
            <pattern id="geometricPattern" patternUnits="userSpaceOnUse" width="40" height="40">
              <polygon points="20,5 35,20 20,35 5,20" fill="rgba(255,255,255,0.1)" />
            </pattern>
          </defs>
          <rect width="595" height="842" fill="url(#blueGrad)" />
          <rect x="0" y="0" width="595" height="842" fill="url(#geometricPattern)" />
          <rect x="40" y="40" width="515" height="762" fill="none" stroke="#fff" stroke-width="2" />
          <rect x="80" y="120" width="435" height="100" fill="rgba(255,255,255,0.95)" rx="15" />
          <text x="297.5" y="165" text-anchor="middle" fill="#0277BD" font-size="32" font-weight="bold" font-family="Arial">GUTSCHEIN</text>
          <text x="297.5" y="195" text-anchor="middle" fill="#0277BD" font-size="18" font-weight="bold">${unternehmen}</text>
          <rect x="100" y="280" width="395" height="70" fill="rgba(255,255,255,0.9)" rx="10" />
          <text x="297.5" y="310" text-anchor="middle" fill="#0277BD" font-size="14">Gutscheincode:</text>
          <text x="297.5" y="330" text-anchor="middle" fill="#0277BD" font-size="18" font-weight="bold">${beispielCode}</text>
          <rect x="100" y="380" width="395" height="80" fill="rgba(255,255,255,0.9)" rx="10" />
          <text x="297.5" y="410" text-anchor="middle" fill="#0277BD" font-size="16">Wert:</text>
          <text x="297.5" y="440" text-anchor="middle" fill="#0277BD" font-size="32" font-weight="bold">€ ${beispielBetrag}</text>
          <text x="297.5" y="520" text-anchor="middle" fill="#fff" font-size="14">Übertragbar und verschenkbar</text>
          <line x1="100" y1="600" x2="495" y2="600" stroke="#fff" stroke-width="1" />
          <text x="297.5" y="650" text-anchor="middle" fill="#fff" font-size="14">Wir freuen uns auf Ihren Besuch!</text>
          <text x="297.5" y="750" text-anchor="middle" fill="#fff" font-size="12">${website}</text>
        </svg>
      `),
      description: "Modernes blaues Design mit geometrischen Mustern und klarer Struktur"
    },
    {
      id: 3,
      name: "Natur Grün",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#81C784;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#66BB6A;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
            </linearGradient>
            <pattern id="leafPattern" patternUnits="userSpaceOnUse" width="50" height="50">
              <ellipse cx="25" cy="25" rx="8" ry="4" fill="rgba(255,255,255,0.2)" transform="rotate(45 25 25)" />
            </pattern>
          </defs>
          <rect width="595" height="842" fill="url(#greenGrad)" />
          <rect x="0" y="0" width="595" height="842" fill="url(#leafPattern)" />
          <ellipse cx="297.5" cy="150" rx="150" ry="80" fill="rgba(255,255,255,0.9)" />
          <text x="297.5" y="145" text-anchor="middle" fill="#2E7D32" font-size="28" font-weight="bold" font-family="Georgia">GUTSCHEIN</text>
          <text x="297.5" y="170" text-anchor="middle" fill="#2E7D32" font-size="16" font-weight="bold">${unternehmen}</text>
          <rect x="70" y="280" width="455" height="100" fill="rgba(255,255,255,0.85)" rx="20" />
          <text x="297.5" y="315" text-anchor="middle" fill="#2E7D32" font-size="14">Gutscheincode:</text>
          <text x="297.5" y="340" text-anchor="middle" fill="#2E7D32" font-size="18" font-weight="bold">${beispielCode}</text>
          <text x="297.5" y="365" text-anchor="middle" fill="#2E7D32" font-size="12">Teilweise einlösbar</text>
          <rect x="70" y="420" width="455" height="80" fill="rgba(255,255,255,0.85)" rx="20" />
          <text x="297.5" y="470" text-anchor="middle" fill="#2E7D32" font-size="28" font-weight="bold">€ ${beispielBetrag}</text>
          <rect x="100" y="550" width="395" height="2" fill="rgba(255,255,255,0.7)" />
          <text x="297.5" y="600" text-anchor="middle" fill="#fff" font-size="14">Wir freuen uns auf Sie!</text>
          <text x="297.5" y="650" text-anchor="middle" fill="#fff" font-size="12">Einlösbar in allen Filialen</text>
          <text x="297.5" y="700" text-anchor="middle" fill="#fff" font-size="12">${website}</text>
          <rect x="80" y="720" width="435" height="60" fill="rgba(255,255,255,0.1)" rx="10" />
          <text x="297.5" y="755" text-anchor="middle" fill="#fff" font-size="11">Allgemeine Geschäftsbedingungen finden Sie unter ${website}</text>
        </svg>
      `),
      description: "Natürliches grünes Design mit Blattmuster und organischen Formen"
    },
    {
      id: 4,
      name: "Klassisch Schwarz-Weiß",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="595" height="842" fill="#ffffff" />
          <rect x="20" y="20" width="555" height="802" fill="none" stroke="#000" stroke-width="3" />
          <rect x="40" y="40" width="515" height="762" fill="none" stroke="#000" stroke-width="1" />
          <rect x="80" y="100" width="435" height="120" fill="#000" />
          <text x="297.5" y="155" text-anchor="middle" fill="#fff" font-size="36" font-weight="bold" font-family="Times">GUTSCHEIN</text>
          <text x="297.5" y="190" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">${unternehmen}</text>
          <rect x="100" y="280" width="395" height="80" fill="none" stroke="#000" stroke-width="2" />
          <text x="297.5" y="310" text-anchor="middle" fill="#000" font-size="14">GUTSCHEIN-CODE</text>
          <text x="297.5" y="335" text-anchor="middle" fill="#000" font-size="16" font-weight="bold">${beispielCode}</text>
          <rect x="100" y="400" width="395" height="80" fill="none" stroke="#000" stroke-width="2" />
          <text x="297.5" y="435" text-anchor="middle" fill="#000" font-size="14">WERT</text>
          <text x="297.5" y="460" text-anchor="middle" fill="#000" font-size="32" font-weight="bold">€ ${beispielBetrag}</text>
          <text x="297.5" y="520" text-anchor="middle" fill="#000" font-size="12">Nicht gegen Barwert tauschbar</text>
          <line x1="100" y1="550" x2="495" y2="550" stroke="#000" stroke-width="1" />
          <text x="297.5" y="580" text-anchor="middle" fill="#000" font-size="12">Vielen Dank für Ihren Besuch!</text>
          <text x="297.5" y="620" text-anchor="middle" fill="#000" font-size="12">Nicht mit anderen Aktionen kombinierbar</text>
          <rect x="80" y="700" width="435" height="80" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="5,5" />
          <text x="297.5" y="735" text-anchor="middle" fill="#000" font-size="14" font-weight="bold">${unternehmen}</text>
          <text x="297.5" y="755" text-anchor="middle" fill="#000" font-size="11">${website}</text>
        </svg>
      `),
      description: "Elegantes schwarz-weißes Design im klassischen Stil"
    },
    {
      id: 5,
      name: "Festlich Rot",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF5722;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#F44336;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#B71C1C;stop-opacity:1" />
            </linearGradient>
            <pattern id="starPattern" patternUnits="userSpaceOnUse" width="60" height="60">
              <polygon points="30,5 35,20 50,20 38,30 43,45 30,35 17,45 22,30 10,20 25,20" fill="rgba(255,255,255,0.1)" />
            </pattern>
          </defs>
          <rect width="595" height="842" fill="url(#redGrad)" />
          <rect x="0" y="0" width="595" height="842" fill="url(#starPattern)" />
          <rect x="30" y="30" width="535" height="782" fill="none" stroke="#FFD700" stroke-width="4" />
          <rect x="50" y="50" width="495" height="742" fill="none" stroke="#FFD700" stroke-width="2" stroke-dasharray="10,5" />
          <ellipse cx="297.5" cy="180" rx="200" ry="100" fill="rgba(255,215,0,0.9)" />
          <text x="297.5" y="175" text-anchor="middle" fill="#B71C1C" font-size="32" font-weight="bold" font-family="Arial">GUTSCHEIN</text>
          <text x="297.5" y="200" text-anchor="middle" fill="#B71C1C" font-size="18" font-weight="bold">${unternehmen}</text>
          <rect x="100" y="320" width="395" height="90" fill="rgba(255,255,255,0.95)" rx="15" />
          <text x="297.5" y="350" text-anchor="middle" fill="#B71C1C" font-size="14">Gutscheincode:</text>
          <text x="297.5" y="375" text-anchor="middle" fill="#B71C1C" font-size="18" font-weight="bold">${beispielCode}</text>
          <text x="297.5" y="395" text-anchor="middle" fill="#B71C1C" font-size="12">Verschenkbar & übertragbar</text>
          <rect x="100" y="450" width="395" height="90" fill="rgba(255,255,255,0.95)" rx="15" />
          <text x="297.5" y="485" text-anchor="middle" fill="#B71C1C" font-size="16">Gutscheinwert:</text>
          <text x="297.5" y="515" text-anchor="middle" fill="#B71C1C" font-size="28" font-weight="bold">€ ${beispielBetrag}</text>
          <text x="297.5" y="620" text-anchor="middle" fill="#FFD700" font-size="16" font-weight="bold">Einlösbar in unserer Filiale.</text>
          <text x="297.5" y="680" text-anchor="middle" fill="#fff" font-size="14">Wir freuen uns auf Ihren Besuch!</text>
          <text x="297.5" y="710" text-anchor="middle" fill="#fff" font-size="12">${website}</text>
        </svg>
      `),
      description: "Festliches rotes Design mit goldenen Akzenten und Sternenmuster"
    },
    {
      id: 6,
      name: "Wellness Spa",
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg width="595" height="842" viewBox="0 0 595 842" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#E1F5FE;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#B3E5FC;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#81D4FA;stop-opacity:1" />
            </linearGradient>
            <pattern id="wavePattern" patternUnits="userSpaceOnUse" width="100" height="20">
              <path d="M0,10 Q25,0 50,10 T100,10" stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none" />
            </pattern>
          </defs>
          <rect width="595" height="842" fill="url(#spaGrad)" />
          <rect x="0" y="0" width="595" height="842" fill="url(#wavePattern)" />
          <circle cx="297.5" cy="150" r="100" fill="rgba(255,255,255,0.8)" />
          <text x="297.5" y="135" text-anchor="middle" fill="#0277BD" font-size="22" font-weight="bold" font-family="Arial">WELLNESS</text>
          <text x="297.5" y="160" text-anchor="middle" fill="#0277BD" font-size="22" font-weight="bold" font-family="Arial">GUTSCHEIN</text>
          <text x="297.5" y="180" text-anchor="middle" fill="#0277BD" font-size="16" font-weight="bold">${unternehmen}</text>
          <rect x="80" y="300" width="435" height="100" fill="rgba(255,255,255,0.85)" rx="25" />
          <text x="297.5" y="330" text-anchor="middle" fill="#0277BD" font-size="14">Gutscheincode:</text>
          <text x="297.5" y="355" text-anchor="middle" fill="#0277BD" font-size="18" font-weight="bold">${beispielCode}</text>
          <text x="297.5" y="380" text-anchor="middle" fill="#0277BD" font-size="12">Für alle Behandlungen einlösbar</text>
          <rect x="120" y="430" width="355" height="80" fill="rgba(255,255,255,0.85)" rx="20" />
          <text x="297.5" y="465" text-anchor="middle" fill="#0277BD" font-size="16">Wert</text>
          <text x="297.5" y="490" text-anchor="middle" fill="#0277BD" font-size="32" font-weight="bold">€ ${beispielBetrag}</text>
          <circle cx="150" cy="600" r="20" fill="rgba(255,255,255,0.6)" />
          <circle cx="297.5" cy="600" r="20" fill="rgba(255,255,255,0.6)" />
          <circle cx="445" cy="600" r="20" fill="rgba(255,255,255,0.6)" />
          <text x="297.5" y="670" text-anchor="middle" fill="#0277BD" font-size="14">Wir freuen uns auf Sie!</text>
          <text x="297.5" y="700" text-anchor="middle" fill="#0277BD" font-size="12">Terminvereinbarung erforderlich</text>
          <text x="297.5" y="730" text-anchor="middle" fill="#0277BD" font-size="12">${website}</text>
          <text x="297.5" y="750" text-anchor="middle" fill="#0277BD" font-size="12">Ihr Wellness-Center</text>
        </svg>
      `),
      description: "Beruhigendes Wellness-Design in sanften Blautönen mit Wellenmuster"
    }
  ];

  const handleBildUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setHintergrund(url);
      
      if (file.type === 'application/pdf') {
        setHintergrundTyp('pdf');
      } else if (file.type.startsWith('image/')) {
        setHintergrundTyp('image');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setHintergrund(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesignAuswahl = (design: DesignVorlage) => {
    setHintergrund(design.image);
    setHintergrundTyp('image');
    setModalOpen(false);
    
    setData({
      gutscheinDesign: {
        ...data.gutscheinDesign,
        selectedDesign: design,
        hintergrund: design.image,
        hintergrundTyp: 'image'
      }
    });
  };

  const setModusAndSave = (newModus: 'eigenes' | 'designen') => {
    setModus(newModus);
    setData({
      gutscheinDesign: {
        ...data.gutscheinDesign,
        modus: newModus
      }
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (draggedIndex === null) return;
    const newFelder = [...felder];
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    newFelder[draggedIndex] = {
      ...newFelder[draggedIndex],
      x: e.clientX - rect.left - 50,
      y: e.clientY - rect.top - 15,
    };
    setFelder(newFelder);
    setDraggedIndex(null);
  };

  const toggleEdit = (index: number) => {
    const newFelder = [...felder];
    newFelder[index].editing = !newFelder[index].editing;
    setFelder(newFelder);
  };

  const updateText = (index: number, newText: string) => {
    const newFelder = [...felder];
    newFelder[index].text = newText;
    setFelder(newFelder);
  };

  const handleResizeStart = (index: number) => {
    const resizingState = [...isResizing];
    resizingState[index] = true;
    setIsResizing(resizingState);
  };

  const handleResizeStop = (index: number, data: { size: { width: number; height: number } }) => {
    const resizingState = [...isResizing];
    resizingState[index] = false;
    setIsResizing(resizingState);

    const newFelder = [...felder];
    newFelder[index] = {
      ...newFelder[index],
      width: data.size.width,
      height: data.size.height,
    };
    setFelder(newFelder);
  };

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" mb={2} sx={{ fontSize: '2rem', fontWeight: 700 }}>
        Gutschein Editor
      </Typography>

      {/* Debug Info */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Vorschau mit Ihren Daten:</strong> {unternehmen} | €{beispielBetrag} | {beispielCode} | {website}
        </Typography>
      </Box>

      {/* Auswahl-Karten */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card
          sx={{
            width: 200,
            border: modus === 'eigenes' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'eigenes' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModusAndSave('eigenes')} sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: modus === 'eigenes' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Design hochladen/ Design auswählen</Typography>
          </CardActionArea>
        </Card>

        <Card
          sx={{
            width: 200,
            border: modus === 'designen' ? '2px solid #1976d2' : '1px solid #ccc',
            boxShadow: modus === 'designen' ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
          }}
        >
          <CardActionArea onClick={() => setModusAndSave('designen')} sx={{ p: 2, textAlign: 'center' }}>
            <DesignServicesIcon sx={{ fontSize: 40, color: modus === 'designen' ? '#1976d2' : '#555' }} />
            <Typography mt={1}>Wir designen den Gutschein</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* Modal für Design-Auswahl */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            p: 4,
            maxWidth: 1000,
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Button
            onClick={() => setModalOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              minWidth: 'auto',
              p: 1,
            }}
          >
            <CloseIcon />
          </Button>

          <Typography variant="h5" mb={3} sx={{ fontWeight: 600 }}>
            Professionelle Gutschein-Designs mit Ihren Daten
          </Typography>

          <Stack spacing={3}>
            {designVorlagen.map((design) => (
              <Stack direction="row" spacing={2} key={design.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                    },
                    minWidth: 300,
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                  onClick={() => handleDesignAuswahl(design)}
                >
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 150,
                        height: 100,
                        mr: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <img
                        src={design.image}
                        alt={design.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                    <Stack>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {design.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {design.description}
                      </Typography>
                    </Stack>
                  </Box>
                </Card>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setModalOpen(false)}
              sx={{ textTransform: 'none' }}
            >
              Abbrechen
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Hauptbereich mit Editor und Gutscheincode-Elementen */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {modus === 'designen' ? (
          <Box sx={{ width: '100%', textAlign: 'left', mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Wir erstellen den Gutschein!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Unser Team wird Ihre Website analysieren und einen personalisierten Gutschein für Sie erstellen – frei Haus! Das kann später jederzeit in den Einstellungen geändert werden.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Gutscheincode-Elemente */}
            <Box
              sx={{
                width: 200,
                padding: 2,
              }}
            >
              {modus === 'eigenes' && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 500, mb: '0.5rem' }}>
                    Gutscheindesign hochladen:
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    sx={{ textTransform: 'none', mb: 2 }}
                  >
                    Datei auswählen
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleBildUpload}
                      hidden
                    />
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ textTransform: 'none' }}
                    onClick={() => setModalOpen(true)}
                  >
                    Design auswählen
                  </Button>
                </Box>
              )}

              <Typography variant="subtitle1" mb={2}>
                Elemente
              </Typography>
              {!felder.some((feld) => feld.typ === 'CODE') && (
                <Box
                  draggable
                  onDragStart={() => setDraggedIndex(-1)}
                  sx={{
                    padding: '4px 8px',
                    border: '1px dashed gray',
                    cursor: 'move',
                    marginBottom: 2,
                  }}
                >
                  Gutscheincode hier
                </Box>
              )}
              {!felder.some((feld) => feld.typ === 'BETRAG') && (
                <Box
                  draggable
                  onDragStart={() => setDraggedIndex(-2)}
                  sx={{
                    padding: '4px 8px',
                    border: '1px dashed gray',
                    cursor: 'move',
                    marginBottom: 2,
                  }}
                >
                  Betrag / Dienstleistung
                </Box>
              )}
            </Box>

            {/* Editor-Bereich - A4 Format (595x842 Pixel) */}
            <Box
              sx={{
                border: '1px solid gray',
                width: 595,
                height: 842,
                position: 'relative',
                backgroundColor: '#fafafa',
                overflow: 'hidden',
                mb: 2,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const newFelder = [...felder];

                if (draggedIndex === -1) {
                  newFelder.push({
                    typ: 'CODE',
                    x: e.clientX - rect.left - 50,
                    y: e.clientY - rect.top - 15,
                    width: 100,
                    height: 50,
                    text: beispielCode,
                    editing: false,
                  });
                } else if (draggedIndex === -2) {
                  newFelder.push({
                    typ: 'BETRAG',
                    x: e.clientX - rect.left - 50,
                    y: e.clientY - rect.top - 15,
                    width: 100,
                    height: 50,
                    text: `€ ${beispielBetrag}`,
                    editing: false,
                  });
                }

                setFelder(newFelder);
                setDraggedIndex(null);
              }}
            >
              {modus === 'eigenes' && hintergrund && (
                <>
                  {hintergrundTyp === 'image' && (
                    <img
                      src={hintergrund}
                      alt="Hintergrund"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'absolute',
                        objectFit: 'contain',
                        objectPosition: 'center'
                      }}
                    />
                  )}
                  {hintergrundTyp === 'pdf' && (
                    <embed
                      src={hintergrund}
                      type="application/pdf"
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        border: 'none'
                      }}
                    />
                  )}
                </>
              )}

              {modus === 'eigenes' && felder.map((feld, index) => {
                const displayText = getDynamicContent(feld.typ) || feld.text;
                
                return (
                  <div
                    key={index}
                    draggable={!isResizing[index]}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={(e) => {
                      const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                      const newFelder = [...felder];
                      newFelder[index] = {
                        ...newFelder[index],
                        x: e.clientX - rect.left - feld.width / 2,
                        y: e.clientY - rect.top - feld.height / 2,
                      };
                      setFelder(newFelder);
                    }}
                    style={{
                      position: 'absolute',
                      left: feld.x,
                      top: feld.y,
                      cursor: isResizing[index] ? 'default' : 'move',
                    }}
                  >
                    <ResizableBox
                      width={feld.width}
                      height={feld.height}
                      minConstraints={[50, 30]}
                      maxConstraints={[300, 200]}
                      onResizeStart={() => handleResizeStart(index)}
                      onResizeStop={(e, data) => handleResizeStop(index, data)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: '1px dashed gray',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: Math.min(feld.width / 10, feld.height / 2),
                          textAlign: 'center',
                          fontWeight: feld.typ === 'CODE' || feld.typ === 'BETRAG' ? 'bold' : 'normal',
                        }}
                      >
                        <span>{displayText}</span>
                      </div>
                    </ResizableBox>
                  </div>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}