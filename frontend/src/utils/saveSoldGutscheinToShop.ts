import { db } from '../auth/firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface SoldGutscheinData {
  gutscheinCode: string;
  betrag: number;
  kaufdatum: string; // ISO-String
  empfaengerEmail: string;
  slug: string; // Shop-Slug
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
      }
    );
    console.log('✅ Gutscheinverkauf im Shop gespeichert:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Gutscheins im Shop:', error);
    throw error;
  }
};