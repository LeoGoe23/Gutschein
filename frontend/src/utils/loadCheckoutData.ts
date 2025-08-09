import { db } from '../auth/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface CheckoutData {
  unternehmensname: string;
  bildURL: string;
  gutscheinURL: string;
  dienstleistungen: any[];
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
const extractDienstleistungen = (gutscheinarten: any): any[] => {
  const dienstleistungen: any[] = [];
  
  Object.keys(gutscheinarten).forEach(key => {
    const item = gutscheinarten[key];
    if (item.typ === 'dienstleistung') {
      dienstleistungen.push({
        shortDesc: item.name,
        longDesc: item.beschreibung || item.name,
        price: item.preis.toString()
      });
    }
  });
  
  return dienstleistungen;
};