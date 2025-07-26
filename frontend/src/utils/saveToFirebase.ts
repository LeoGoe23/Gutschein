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
    let unserDesignPdfURL = '';

    // Unternehmensbild hochladen
    if (contextData.bild) {
      console.log('📸 Uploading company image...');
      const bildPath = `seiten/${slug}/company-image`;
      bildURL = await uploadImageToStorage(contextData.bild, bildPath);
      console.log('✅ Company image uploaded:', bildURL);
    } else {
      console.log('⚠️ No company image found');
    }

    // Gutschein-Design hochladen basierend auf Modus
    if (contextData.gutscheinDesign?.modus === 'eigenes' && contextData.gutscheinDesign?.hintergrund) {
      console.log('🎨 Uploading custom voucher design...');
      const designPath = `seiten/${slug}/voucher-design`;
      gutscheinDesignURL = await uploadImageToStorage(contextData.gutscheinDesign.hintergrund, designPath);
      console.log('✅ Custom voucher design uploaded:', gutscheinDesignURL);
    } else if (contextData.gutscheinDesign?.modus === 'unser-design') {
      console.log('🎨 Using "Unser Design" - no file upload needed');
      // Kein Upload in Storage für "unser-design" Modus
    } else {
      console.log('⚠️ No valid voucher design data found or mode is "wir-designen"');
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
    // 2. User-Dokument in Firestore aktualisieren
    const userDocRef = doc(db, 'users', user.uid);
    console.log('📄 Updating user document:', user.uid);
    
    const updateData: any = {
      registrationFinished: true,
      slug: slug,
      Provision: contextData.provision || 0.08, // <--- NEU: Standard 8%, überschreibbar

      Unternehmensdaten: {
        Vorname: contextData.vorname || '',
        Name: contextData.nachname || '',
        Unternehmensname: contextData.unternehmensname || '',
        Branche: contextData.geschaeftsart || '',
        Telefon: contextData.telefon || '',
        Website: contextData.website || '',
      },

      Checkout: {
        Unternehmensname: contextData.unternehmensname || '',
        BildURL: bildURL,
        GutscheinDesignURL: gutscheinDesignURL || null,
        Dienstleistung: contextData.dienstleistungen?.length > 0 || false,
        Freibetrag: contextData.customValue || false,
        Gutscheinarten: gutscheinarten,
        StripeAccountId: contextData.stripeAccountId || '', // StripeAccountId wieder speichern!
      },
    };

    console.log('📝 Update data prepared:', updateData);

    // Dokument aktualisieren
    console.log('💾 Saving to Firestore...');
    await updateDoc(userDocRef, updateData);
    console.log('✅ Successfully saved to Firestore');

    console.log('🎉 All data saved successfully:', {
      slug,
      bildURL,
      gutscheinDesignURL: gutscheinDesignURL || null // Entfernt: unserDesignPdfURL
    });

    return { slug, bildURL, gutscheinDesignURL: gutscheinDesignURL || null }; // Entfernt: unserDesignPdfURL

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