import { createContext, useState, useContext, useEffect } from 'react';

const GutscheinContext = createContext<any>(null);

const STORAGE_KEY = 'gutschein-data';

const initialData = {
  vorname: '',
  nachname: '',
  email: '',
  telefon: '',
  geschaeftsart: '',
  art: '', // wert oder dienstleistung
  betraege: [] as string[],
  dienstleistungen: [] as { shortDesc: string; longDesc: string; price: string }[], // Korrigierte Struktur
  customValue: false, // Endkunde kann freien Betrag eingeben
  name: '',
  bild: null as File | string | null, // Bild des Unternehmens (File oder Base64 string)
  unternehmensname: '', // Unternehmensname
  design: 'light',
  website: '', // Website-Link
  kontoinhaber: '', // Neuer State für Kontoinhaber
  iban: '', // Neuer State für IBAN
};

// Hilfsfunktion zum Laden aus localStorage
const loadFromStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      return { ...initialData, ...JSON.parse(savedData) };
    }
  } catch (error) {
    console.error('Fehler beim Laden der Daten aus localStorage:', error);
  }
  return initialData;
};

// Hilfsfunktion zum Speichern in localStorage
const saveToStorage = (data: any) => {
  try {
    const dataToSave = { ...data };
    
    // Wenn bild ein File-Objekt ist, konvertiere es zu Base64
    if (dataToSave.bild && typeof dataToSave.bild !== 'string') {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        dataToSave.bild = imageDataUrl;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      };
      fileReader.readAsDataURL(dataToSave.bild);
      return; // Async operation, return early
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Fehler beim Speichern der Daten in localStorage:', error);
  }
};

export function GutscheinProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(loadFromStorage);

  const updateData = (newData: Partial<typeof data>) => {
    setData((prevData: any) => {
      const updatedData = { ...prevData, ...newData };
      saveToStorage(updatedData);
      return updatedData;
    });
  };

  const clearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialData);
  };

  // Debug-Funktion
  const debugData = () => {
    console.log('Current Gutschein Data:', data);
    console.log('LocalStorage Data:', localStorage.getItem(STORAGE_KEY));
  };

  return (
    <GutscheinContext.Provider value={{ 
      data, 
      setData: updateData, 
      clearData, 
      debugData 
    }}>
      {children}
    </GutscheinContext.Provider>
  );
}

export const useGutschein = () => {
  const context = useContext(GutscheinContext);
  if (!context) {
    throw new Error('useGutschein must be used within a GutscheinProvider');
  }
  return context;
};
