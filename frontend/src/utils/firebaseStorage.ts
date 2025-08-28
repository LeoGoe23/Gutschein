import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';

const storage = getStorage();

// PDF zu Firebase Storage hochladen
export const uploadPDFToStorage = async (pdfBlob: Blob, fileName: string): Promise<string> => {
  try {
    console.log('📤 Uploading PDF to Firebase Storage:', fileName);
    
    const storageRef = ref(storage, `gutscheine/${fileName}`);
    
    // PDF hochladen
    const snapshot = await uploadBytes(storageRef, pdfBlob);
    console.log('✅ PDF uploaded successfully');
    
    // Download-URL abrufen
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL generated:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading PDF:', error);
    throw error;
  }
};

// Gutschein-Link in Firestore speichern
export const saveGutscheinLink = async (gutscheinData: {
  gutscheinCode: string;
  downloadURL: string;
  betrag: number;
  empfaengerEmail: string;
  unternehmensname: string;
  slug: string;
  createdAt: string;
  dienstleistung?: string;
  stripeSessionId?: string;
}): Promise<string> => {
  try {
    console.log('💾 Saving gutschein link to Firestore');
    
    // NEU: Undefined-Werte filtern
    const cleanData = {
      gutscheinCode: gutscheinData.gutscheinCode,
      downloadURL: gutscheinData.downloadURL,
      betrag: gutscheinData.betrag,
      empfaengerEmail: gutscheinData.empfaengerEmail,
      unternehmensname: gutscheinData.unternehmensname,
      slug: gutscheinData.slug,
      createdAt: gutscheinData.createdAt,
      clicks: 0, // Download-Counter
      lastAccessed: null,
      // Nur hinzufügen wenn nicht undefined
      ...(gutscheinData.dienstleistung && { dienstleistung: gutscheinData.dienstleistung }),
      ...(gutscheinData.stripeSessionId && { stripeSessionId: gutscheinData.stripeSessionId })
    };
    
    console.log('📋 Clean data to save:', cleanData);
    
    const docRef = await addDoc(collection(db, 'gutscheinLinks'), cleanData);
    
    console.log('✅ Gutschein link saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving gutschein link:', error);
    throw error;
  }
};

// Gutschein-Link abrufen und Download-Counter erhöhen
export const getGutscheinLink = async (linkId: string) => {
  try {
    const docRef = doc(db, 'gutscheinLinks', linkId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Gutschein-Link nicht gefunden');
    }
    
    const data = docSnap.data();
    
    // Download-Counter erhöhen
    const updatedClicks = (data.clicks || 0) + 1;
    await updateDoc(docRef, {
      clicks: updatedClicks,
      lastAccessed: new Date().toISOString()
    });
    
    return {
      id: docSnap.id,
      ...data,
      clicks: updatedClicks
    };
  } catch (error) {
    console.error('❌ Error fetching gutschein link:', error);
    throw error;
  }
};