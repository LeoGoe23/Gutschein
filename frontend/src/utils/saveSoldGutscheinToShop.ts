import { db } from '../auth/firebase';
import { collection, addDoc, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

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
        provision: data.provision, // <--- Wirkliche Provision speichern!
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
    updates[`Einnahmen.dienstleistungen.${dienstleistung}.anzahl`] = increment(1);
    updates[`Einnahmen.dienstleistungen.${dienstleistung}.umsatz`] = increment(betrag);
    updates[`Einnahmen.monatlich.${monat}.dienstleistungen.${dienstleistung}.anzahl`] = increment(1);
    updates[`Einnahmen.monatlich.${monat}.dienstleistungen.${dienstleistung}.umsatz`] = increment(betrag);
  }

  await updateDoc(userRef, updates);
};