import { db } from '../auth/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface DemoData {
  name: string;
  bildURL: string;
  customValue: boolean;
  dienstleistungen: Array<{
    shortDesc: string;
    longDesc: string;
    price: string;
    kategorie?: string;
  }>;
  slug: string;
}

export const loadDemoDataBySlug = async (demoSlug: string): Promise<DemoData | null> => {
  try {
    console.log('🎭 Loading demo data for slug:', demoSlug);

    const demosRef = collection(db, 'demos');
    const q = query(demosRef, where('slug', '==', demoSlug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No demo found with slug:', demoSlug);
      return null;
    }

    const demoDoc = querySnapshot.docs[0];
    const demoData = demoDoc.data() as DemoData;

    console.log('🎭 Loaded demo data:', demoData);
    return demoData;

  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    return null;
  }
};