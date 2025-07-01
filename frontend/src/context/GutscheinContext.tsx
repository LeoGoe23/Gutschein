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
    bild: null as string | null,
    design: 'light',
  });

  return (
    <GutscheinContext.Provider value={{ data, setData }}>
      {children}
    </GutscheinContext.Provider>
  );
}

export const useGutschein = () => useContext(GutscheinContext);
