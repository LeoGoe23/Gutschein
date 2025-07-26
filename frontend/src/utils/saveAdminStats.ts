import { db } from '../auth/firebase';
import { doc, setDoc, getDoc, increment, collection } from 'firebase/firestore';

interface GutscheinInfo {
  gutscheinCode: string;
  betrag: number;
  kaufdatum: string;
  empfaengerEmail: string;
  dienstleistung?: string;
}

export async function saveAdminStats({
  adminId,
  gutschein,
}: {
  adminId: string;
  gutschein: GutscheinInfo;
}) {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const tag = `${now.getFullYear()}-${String(now.getDate()).padStart(2, '0')}`;

  // Hauptdokument für Gesamtstatistik
  const statsRef = doc(db, 'admin_stats', adminId);

  // Monats-Subcollection
  const monatRef = doc(collection(statsRef, 'Details'), monat);

  // Tages-Subcollection im Monatsordner
  const tagRef = doc(collection(monatRef, 'Tage'), tag);

  // Hole aktuelle Daten für die letzten drei Gutscheine
  let lastGutscheine: GutscheinInfo[] = [];
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      lastGutscheine = snap.data().letzteDreiGutscheine || [];
    }
  } catch {}

  // Gesamtstatistik updaten
  let updates: any = {};
  if (gutschein) {
    updates['gesamtUmsatz'] = increment(gutschein.betrag);
    updates['gesamtGutscheine'] = increment(1);
    const neueListe = [cleanGutschein(gutschein), ...lastGutscheine.map(cleanGutschein)].slice(0, 3);
    updates['letzteDreiGutscheine'] = neueListe;
  }
  if (Object.keys(updates).length > 0) {
    await setDoc(statsRef, updates, { merge: true });
  }

  // Monatsstatistik updaten
  let monatUpdates: any = {};
  if (gutschein) {
    monatUpdates['monatsUmsatz'] = increment(gutschein.betrag);
    monatUpdates['monatsGutscheine'] = increment(1);
  }
  if (Object.keys(monatUpdates).length > 0) {
    await setDoc(monatRef, monatUpdates, { merge: true });
  }

  // Tagesstatistik updaten
  let tagUpdates: any = {};
  if (gutschein) {
    tagUpdates['tagesUmsatz'] = increment(gutschein.betrag);
    tagUpdates['tagesGutscheine'] = increment(1);
  }
  if (Object.keys(tagUpdates).length > 0) {
    await setDoc(tagRef, tagUpdates, { merge: true });
  }
}

export async function saveAdminHit(adminId: string) {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const tag = `${now.getFullYear()}-${String(now.getDate()).padStart(2, '0')}`;

  const statsRef = doc(db, 'admin_stats', adminId);
  const monatRef = doc(collection(statsRef, 'Details'), monat);
  const tagRef = doc(collection(monatRef, 'Tage'), tag);

  await setDoc(statsRef, { gesamtHits: increment(1) }, { merge: true });
  await setDoc(monatRef, { monatsHits: increment(1) }, { merge: true });
  await setDoc(tagRef, { tagesHits: increment(1) }, { merge: true });
}

export async function saveAdminNewShop(adminId: string) {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const tag = `${now.getFullYear()}-${String(now.getDate()).padStart(2, '0')}`;

  const statsRef = doc(db, 'admin_stats', adminId);
  const monatRef = doc(collection(statsRef, 'Details'), monat);
  const tagRef = doc(collection(monatRef, 'Tage'), tag);

  // Zähle Shops direkt in den Statistiken
  await setDoc(statsRef, { gesamtShops: increment(1) }, { merge: true });
  await setDoc(monatRef, { monatsShops: increment(1) }, { merge: true });
  await setDoc(tagRef, { tagesShops: increment(1) }, { merge: true });
}

function cleanGutschein(obj: GutscheinInfo): GutscheinInfo {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if ((obj as unknown as Record<string, unknown>)[key] !== undefined) {
      cleaned[key] = ((obj as unknown) as Record<string, unknown>)[key];
    }
  });
  return cleaned;
}