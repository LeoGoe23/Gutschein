import { auth, db, storage } from '../auth/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Generiere 6-stelligen alphanumerischen Slug
export const generateSlug = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Konvertiere File zu Blob falls nötig
const fileToBlob = (file: File | string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (typeof file === 'string') {
      // Base64 string zu Blob
      fetch(file)
        .then(res => res.blob())
        .then(resolve)
        .catch(reject);
    } else {
      // File ist bereits ein Blob
      resolve(file);
    }
  });
};

// Lade Bild zu Storage hoch
export const uploadImageToStorage = async (file: File | string, path: string): Promise<string> => {
  console.log('🔄 Uploading file to:', path);
  console.log('📁 File type:', typeof file, file instanceof File ? 'File' : 'String');
  
  const blob = await fileToBlob(file);
  console.log('📦 Blob created:', blob.size, 'bytes');
  
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  console.log('✅ Upload successful:', snapshot.metadata.fullPath);
  
  const downloadURL = await getDownloadURL(snapshot.ref);
  console.log('🔗 Download URL:', downloadURL);
  
  return downloadURL;
};

// Hauptfunktion zum Speichern
export const saveGutscheinData = async (contextData: any) => {
  console.log('🚀 Starting saveGutscheinData with data:', contextData);
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ User not authenticated');
    throw new Error('User nicht authentifiziert');
  }
  
  console.log('👤 Current user:', user.uid);
  
  const slug = generateSlug();
  console.log('🏷️ Generated slug:', slug);
  
  try {
    // 1. Bilder zu Storage hochladen
    let bildURL = '';
    let gutscheinDesignURL = '';

    // Unternehmensbild hochladen
    if (contextData.bild) {
      console.log('📸 Uploading company image...');
      const bildPath = `seiten/${slug}/company-image`;
      bildURL = await uploadImageToStorage(contextData.bild, bildPath);
      console.log('✅ Company image uploaded:', bildURL);
    } else {
      console.log('⚠️ No company image found');
    }

    // Gutschein-Design hochladen (falls vorhanden)
    if (contextData.gutscheinDesign?.hintergrund && contextData.gutscheinDesign.modus === 'eigenes') {
      console.log('🎨 Uploading custom voucher design...');
      const designPath = `seiten/${slug}/voucher-design`;
      gutscheinDesignURL = await uploadImageToStorage(contextData.gutscheinDesign.hintergrund, designPath);
      console.log('✅ Custom voucher design uploaded:', gutscheinDesignURL);
    } else {
      console.log('⚠️ No custom voucher design to upload or using default design');
    }

    // Gutscheinarten verarbeiten
    console.log('🎟️ Processing voucher types...');
    const gutscheinarten: any = {};
    
    // Feste Beträge hinzufügen
    if (contextData.betraege?.length > 0) {
      console.log('💰 Adding fixed amounts:', contextData.betraege);
      contextData.betraege.forEach((betrag: string) => {
        const key = `betrag_${betrag}`;
        gutscheinarten[key] = {
          typ: 'betrag',
          wert: parseFloat(betrag),
          name: `${betrag}€ Gutschein`,
          aktiv: true
        };
      });
    }

    // Dienstleistungen hinzufügen
    if (contextData.dienstleistungen?.length > 0) {
      console.log('🛠️ Adding services:', contextData.dienstleistungen);
      contextData.dienstleistungen.forEach((service: any, index: number) => {
        const key = `service_${index}`;
        gutscheinarten[key] = {
          typ: 'dienstleistung',
          name: service.shortDesc,
          beschreibung: service.longDesc,
          preis: parseFloat(service.price) || 0,
          aktiv: true
        };
      });
    }

    // Freie Wertangabe hinzufügen
    if (contextData.customValue) {
      console.log('💸 Adding custom value option');
      gutscheinarten['frei_wert'] = {
        typ: 'frei',
        name: 'Freie Wertangabe',
        aktiv: true
      };
    }

    console.log('🎯 Final voucher types:', gutscheinarten);

    // Gutschein-Design Daten vorbereiten
    const gutscheinDesignData = {
      modus: contextData.gutscheinDesign?.modus || 'unser-design',
      designURL: gutscheinDesignURL || null,
      hintergrundTyp: contextData.gutscheinDesign?.hintergrundTyp || null,
      // Weitere Design-Eigenschaften können hier hinzugefügt werden
    };

    // 2. User-Dokument in Firestore aktualisieren
    const userDocRef = doc(db, 'users', user.uid);
    console.log('📄 Updating user document:', user.uid);
    
    const updateData: any = {
      registrationFinished: true,
      slug: slug,
      
      // Unternehmensdaten aktualisieren
      'Unternehmensdaten.Vorname': contextData.vorname || '',
      'Unternehmensdaten.Name': contextData.nachname || '',
      'Unternehmensdaten.Unternehmensname': contextData.unternehmensname || '',
      'Unternehmensdaten.Branche': contextData.geschaeftsart || '',
      'Unternehmensdaten.Telefon': contextData.telefon || '',
      'Unternehmensdaten.Website': contextData.website || '',

      // Zahlungsdaten aktualisieren
      'Zahlungsdaten.Zahlungsempfänger': contextData.kontoinhaber || '',
      'Zahlungsdaten.IBAN': contextData.iban || '',

      // Checkout-Daten aktualisieren
      'Checkout.Unternehmensname': contextData.unternehmensname || '',
      'Checkout.BildURL': bildURL,
      'Checkout.GutscheinDesignURL': gutscheinDesignURL,
      'Checkout.Dienstleistung': contextData.dienstleistungen?.length > 0 || false,
      'Checkout.Freibetrag': contextData.customValue || false,
      'Checkout.Gutscheinarten': gutscheinarten,

      // Gutschein-Details aktualisieren
      'Gutscheindetails.GutscheinDesign': gutscheinDesignData,
      'Gutscheindetails.Gutscheinarten': gutscheinarten,
    };

    console.log('📝 Update data prepared:', updateData);

    // Dokument aktualisieren
    console.log('💾 Saving to Firestore...');
    await updateDoc(userDocRef, updateData);
    console.log('✅ Successfully saved to Firestore');

    console.log('🎉 All data saved successfully:', {
      slug,
      bildURL,
      gutscheinDesignURL,
      gutscheinDesignData
    });

    return { slug, bildURL, gutscheinDesignURL };

  } catch (error) {
    console.error('❌ Error in saveGutscheinData:', error);
    
    // Detailliertes Error-Logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw error;
  }
};