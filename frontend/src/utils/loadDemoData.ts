import { db } from '../auth/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface DemoCheckoutData {
  unternehmensname: string;
  bildURL: string;
  gutscheinURL: string;
  dienstleistungen: any[];
  customValue: boolean;
  gutscheinarten: any;
  slug: string;
  website: string;
  telefon: string;
  designConfig?: {
    betrag: { x: number; y: number; size: number };
    code: { x: number; y: number; size: number };
  };
}

export const loadDemoDataBySlug = async (demoSlug: string): Promise<DemoCheckoutData | null> => {
  try {
    console.log('🎭 Loading demo data for slug:', demoSlug);

    const demosRef = collection(db, 'demo_shops');
    const q = query(demosRef, where('demoSlug', '==', demoSlug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No demo found with slug:', demoSlug);
      return null;
    }

    const demoDoc = querySnapshot.docs[0];
    const demoData = demoDoc.data();

    // Prüfe ob Demo abgelaufen ist
    if (demoData.expiresAt) {
      const expiryDate = new Date(demoData.expiresAt);
      const now = new Date();
      if (now > expiryDate) {
        console.log('⏰ Demo expired:', demoSlug);
        return null;
      }
    }

    // Konvertiere Demo-Daten zu CheckoutData-Format
    const checkoutData: DemoCheckoutData = {
      unternehmensname: demoData.Checkout?.Unternehmensname || demoData.Unternehmensdaten?.Unternehmensname || 'Demo-Shop',
      bildURL: demoData.Checkout?.BildURL || '',
      gutscheinURL: demoData.Checkout?.GutscheinDesignURL || '',
      dienstleistungen: extractDienstleistungen(demoData.Checkout?.Gutscheinarten || {}),
      customValue: demoData.Checkout?.Freibetrag || false,
      gutscheinarten: demoData.Checkout?.Gutscheinarten || {},
      slug: demoData.demoSlug || '',
      website: demoData.Unternehmensdaten?.Website || '',
      telefon: demoData.Unternehmensdaten?.Telefon || '',
      designConfig: demoData.Checkout?.DesignConfig || undefined
    };

    console.log('🎭 Processed demo data:', checkoutData);
    return checkoutData;

  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    return null;
  }
};

// Hilfsfunktion - identisch zu loadCheckoutData.ts
const extractDienstleistungen = (gutscheinarten: any): any[] => {
  const dienstleistungen: any[] = [];
  
  Object.keys(gutscheinarten).forEach(key => {
    const item = gutscheinarten[key];
    if (item.typ === 'dienstleistung' && item.aktiv !== false) {
      dienstleistungen.push({
        shortDesc: item.name,
        longDesc: item.beschreibung || item.name,
        price: item.preis.toString(),
        reihenfolge: item.reihenfolge || 0
      });
    }
  });
  
  dienstleistungen.sort((a, b) => a.reihenfolge - b.reihenfolge);
  return dienstleistungen;
};