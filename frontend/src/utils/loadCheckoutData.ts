import { db } from '../auth/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface CheckoutData {
  unternehmensname: string;
  bildURL: string;
  gutscheinURL: string;
  dienstleistungen: any[];
  customValue: boolean;
  gutscheinDesign: any;
  website: string;
  telefon: string;
  iban: string;
  gutscheinarten: any;
  // Weitere Felder nach Bedarf
}

export const loadCheckoutDataBySlug = async (slug: string): Promise<CheckoutData | null> => {
  try {
    console.log('🔍 Loading data for slug:', slug);
    
    // Suche nach User mit diesem Slug
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No user found with slug:', slug);
      return null;
    }
    
    // Nimm den ersten (und hoffentlich einzigen) User
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Found user data:', userData);
    
    // Extrahiere die relevanten Checkout-Daten
    const checkoutData: CheckoutData = {
      unternehmensname: userData.Checkout?.Unternehmensname || userData.Unternehmensdaten?.Unternehmensname || '',
      bildURL: userData.Checkout?.BildURL || '',
      gutscheinURL: userData.Checkout?.GutscheinDesignURL || '', // ✅ KORRIGIERT: GutscheinDesignURL statt GutscheinURL
      dienstleistungen: extractDienstleistungen(userData.Checkout?.Gutscheinarten || {}),
      customValue: userData.Checkout?.Freibetrag || false,
      gutscheinDesign: userData.Gutscheindetails?.Gutscheindesign || {},
      website: userData.Unternehmensdaten?.Website || '',
      telefon: userData.Unternehmensdaten?.Telefon || '',
      iban: userData.Zahlungsdaten?.IBAN || '',
      gutscheinarten: userData.Checkout?.Gutscheinarten || {},
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