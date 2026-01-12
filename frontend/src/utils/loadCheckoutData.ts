import { db } from '../auth/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface DienstleistungVariante {
  name: string;
  preis: string;
  beschreibung?: string;
}

export interface Dienstleistung {
  shortDesc: string;
  longDesc: string;
  price?: string; // Für flache Dienstleistungen
  reihenfolge: number;
  varianten?: DienstleistungVariante[]; // Optional: Für Dienstleistungen mit Varianten
}

export interface CheckoutData {
  unternehmensname: string;
  bildURL: string;
  gutscheinURL: string;
  dienstleistungen: Dienstleistung[];
  customValue: boolean;
  gutscheinarten: any;
  slug: string;
  StripeAccountId: string;
  website: string;
  telefon: string;
  userId: string;
  Provision: number;
  // KORRIGIERT: Positionen sind jetzt DIREKTE PIXEL-WERTE
  designConfig?: {
    betrag: { x: number; y: number; size: number }; // x,y = Pixel (absolut)
    code: { x: number; y: number; size: number };   // x,y = Pixel (absolut)
  };
}

export const loadCheckoutDataBySlug = async (slug: string): Promise<CheckoutData | null> => {
  try {
    console.log('🔍 Loading data for slug:', slug);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No user found with slug:', slug);
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    const checkoutData: CheckoutData = {
      unternehmensname: userData.Checkout?.Unternehmensname || userData.Unternehmensdaten?.Unternehmensname || '',
      bildURL: userData.Checkout?.BildURL || '',
      gutscheinURL: userData.Checkout?.GutscheinDesignURL || '',
      dienstleistungen: extractDienstleistungen(userData.Checkout?.Gutscheinarten || {}),
      customValue: userData.Checkout?.Freibetrag || false,
      gutscheinarten: userData.Checkout?.Gutscheinarten || {},
      slug: userData.slug || '',
      StripeAccountId: userData.Checkout?.StripeAccountId || '',
      website: userData.Unternehmensdaten?.Website || '',
      telefon: userData.Unternehmensdaten?.Telefon || '',
      userId: userDoc.id,
      Provision: userData.Provision || 0,
      // NEU:
      designConfig: userData.Checkout?.DesignConfig || undefined
    };

    console.log('📦 Processed checkout data:', checkoutData);
    return checkoutData;

  } catch (error) {
    console.error('❌ Error loading checkout data:', error);
    return null;
  }
};

// Hilfsfunktion um Dienstleistungen aus Gutscheinarten zu extrahieren
const extractDienstleistungen = (gutscheinarten: any): Dienstleistung[] => {
  const dienstleistungen: Dienstleistung[] = [];
  
  Object.keys(gutscheinarten).forEach(key => {
    const item = gutscheinarten[key];
    if (item.typ === 'dienstleistung') {
      const dienstleistung: Dienstleistung = {
        shortDesc: item.name,
        longDesc: item.beschreibung || item.name,
        reihenfolge: item.reihenfolge || 0
      };

      // Check ob Varianten vorhanden sind
      if (item.varianten && Array.isArray(item.varianten) && item.varianten.length > 0) {
        // Dienstleistung mit Varianten
        dienstleistung.varianten = item.varianten.map((v: any) => ({
          name: v.name,
          preis: v.preis.toString(),
          beschreibung: v.beschreibung || ''
        }));
      } else {
        // Flache Dienstleistung (wie bisher)
        dienstleistung.price = item.preis.toString();
      }

      dienstleistungen.push(dienstleistung);
    }
  });
  
  // Nach Reihenfolge sortieren
  dienstleistungen.sort((a, b) => a.reihenfolge - b.reihenfolge);
  
  return dienstleistungen;
};