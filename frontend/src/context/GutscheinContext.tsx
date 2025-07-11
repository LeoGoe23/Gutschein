import { createContext, useState, useContext } from 'react';

const GutscheinContext = createContext<any>(null);

export function GutscheinProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    geschaeftsart: '',
    art: '', // wert oder dienstleistung
    betraege: [] as string[],
    dienstleistungen: [] as { desc: string; price: string }[],
    customValue: false,
    name: '',
    bild: null as File | null, // Bild des Unternehmens
    unternehmensname: '', // Unternehmensname
    design: 'light',
    website: '', // Website-Link
    kontoinhaber: '', // Neuer State für Kontoinhaber
    iban: '', // Neuer State für IBAN
  });

  const updateData = (newData: Partial<typeof data>) => {
    setData((prevData) => ({ ...prevData, ...newData }));
  };

  return (
    <GutscheinContext.Provider value={{ data, setData: updateData }}>
      {children}
    </GutscheinContext.Provider>
  );
}

export const useGutschein = () => useContext(GutscheinContext);
