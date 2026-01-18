import { db } from '../auth/firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

export interface SoldGutscheinData {
  gutscheinCode: string;
  betrag: number;
  kaufdatum: string; // ISO-String
  empfaengerEmail: string;
  slug: string; // Shop-Slug
  provision: number; // Provision in Cent
}

export const saveSoldGutscheinToShop = async (data: SoldGutscheinData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'shops', data.slug, 'verkaufte_gutscheine'),
      {
        gutscheinCode: data.gutscheinCode,
        betrag: data.betrag,
        kaufdatum: data.kaufdatum,
        empfaengerEmail: data.empfaengerEmail,
        provision: data.provision,
        eingeloest: false, // Neu: Standard ist nicht eingelöst
        eingeloesetAm: null, // Neu: Datum der Einlösung
      }
    );
    console.log('✅ Gutscheinverkauf im Shop gespeichert:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Gutscheins im Shop:', error);
    throw error;
  }
};

// Zusätzliche Daten für Statistik
export interface GutscheinVerkaufsStatistik {
  userId: string;
  betrag: number;
  dienstleistung?: string; // Name der Dienstleistung, falls vorhanden
  isFreierBetrag: boolean;
  provision: number; // Provision in Cent, falls relevant  
}

// Hilfsfunktion: Bereinige Namen für Firebase Feldpfade
const sanitizeFieldName = (name: string): string => {
  return name
    .replace(/\./g, '_')  // Punkte durch Unterstriche ersetzen
    .replace(/\$/g, '')   // Dollar-Zeichen entfernen
    .replace(/\[/g, '')   // Eckige Klammern entfernen
    .replace(/\]/g, '')
    .replace(/\//g, '_')  // Schrägstriche durch Unterstriche
    .trim();
};

export const updateUserEinnahmenStats = async ({
  userId,
  betrag,
  dienstleistung,
  isFreierBetrag,
}: GutscheinVerkaufsStatistik) => {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const userRef = doc(db, 'users', userId);

  // Dynamische Felder für Firestore-Update
  const updates: any = {
    'Einnahmen.gesamtUmsatz': increment(betrag),
    'Einnahmen.anzahlVerkäufe': increment(1),
    [`Einnahmen.monatlich.${monat}.gesamtUmsatz`]: increment(betrag),
    [`Einnahmen.monatlich.${monat}.anzahlVerkäufe`]: increment(1),
  };

  if (isFreierBetrag) {
    updates['Einnahmen.freieBetrag.anzahl'] = increment(1);
    updates['Einnahmen.freieBetrag.umsatz'] = increment(betrag);
    updates[`Einnahmen.monatlich.${monat}.freieBetrag.anzahl`] = increment(1);
    updates[`Einnahmen.monatlich.${monat}.freieBetrag.umsatz`] = increment(betrag);
  } else if (dienstleistung) {
    // ✅ NEU: Dienstleistungsnamen bereinigen für Firebase
    const safeName = sanitizeFieldName(dienstleistung);
    updates[`Einnahmen.dienstleistungen.${safeName}.anzahl`] = increment(1);
    updates[`Einnahmen.dienstleistungen.${safeName}.umsatz`] = increment(betrag);
    updates[`Einnahmen.monatlich.${monat}.dienstleistungen.${safeName}.anzahl`] = increment(1);
    updates[`Einnahmen.monatlich.${monat}.dienstleistungen.${safeName}.umsatz`] = increment(betrag);
  }

  await updateDoc(userRef, updates);
};