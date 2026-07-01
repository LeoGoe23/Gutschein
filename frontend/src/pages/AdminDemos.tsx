import { Box, Typography, Paper, Button, TextField, Switch, FormControlLabel, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, LinearProgress, MenuItem } from '@mui/material';
import { Add, Edit, Delete, CloudUpload, Image, ContentCopy, OpenInNew } from '@mui/icons-material';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db, storage } from '../auth/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface DemoData {
  id?: string;
  name: string;
  bildURL: string;
  websiteUrl?: string; // Kundenwebsite-URL für relative Asset-Pfade
  demoHtml?: string;
  customValue: boolean;
  gutscheinAnzeige?: 'einzeln' | 'kategorie'; // 'paket' wird zu 'kategorie'
  rabattcodes: RabattCode[];
  dienstleistungen: Array<{
    shortDesc: string;
    longDesc: string;
    price: string;
    kategorie?: string;
  }>;
  slug: string;
  createdAt: string;
  bildFileName?: string; // Für Storage-Verwaltung
}

interface DienstleistungForm {
  shortDesc: string;
  longDesc: string;
  price: string;
  kategorie?: string;
}

interface RabattCode {
  code: string;
  percent: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

interface RabattCodeForm {
  code: string;
  percent: string;
  maxUses: string;
}

interface CheckoutSource {
  userId: string;
  slug: string;
  name: string;
}

type DienstleistungEntry = DemoData['dienstleistungen'][number];

const SINGLE_VOUCHER_GROUP = 'Einzelgutscheine';

const sanitizeForFirestore = (value: any): any => {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, sanitizeForFirestore(v)]);

    return Object.fromEntries(cleanedEntries);
  }

  return value;
};

const normalizePriceString = (value: string): string => {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return '';
  return String(Math.round(parsed * 100) / 100);
};

const extractPriceFromText = (text: string): string => {
  const fromPreis = text.match(/preis\s*:\s*([^\n]+)/i)?.[1] || text;
  const numberMatch = fromPreis.match(/(\d{1,4}(?:[\.,]\d{1,2})?)/);
  if (!numberMatch) return '';
  return normalizePriceString(numberMatch[1]);
};

const inferCategoryFromEntry = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  if (/\b(kurs|workshop|paar|praevention|prävention)\b/.test(lower)) return 'Kurse';
  if (/\b(verwoehn|verwöhn|paket)\b/.test(lower)) return 'Verwoehn-Massagen';
  if (/\b(aroma|aetherisch|ätherisch|duft|oel|öl|vetiver|zitrus|ingwer|rose)\b/.test(lower)) return 'Aroma-Massagen';
  if (/\b(massage|nacken|ruecken|rücken|ganzkoerper|ganzkörper|fuss|fuß|akupressur)\b/.test(lower)) return 'Ganzheitliche Massagen';
  return undefined;
};

const isCategoryHeading = (paragraph: string): boolean => {
  const line = paragraph.trim();
  if (!line) return false;
  if (/preis\s*:/i.test(line)) return false;
  if (/dauer\s*:/i.test(line)) return false;
  if (/\d/.test(line)) return false;
  if (line.length > 60) return false;
  const words = line.split(/\s+/).filter(Boolean).length;
  if (words > 6) return false;
  return /massag|kurs|behandlung|wellness|duft|aroma/i.test(line);
};

const parseDienstleistungenFromInput = (raw: string): DienstleistungForm[] => {
  const text = (raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const parsed: DienstleistungForm[] = [];
  let activeCategory = '';

  paragraphs.forEach((paragraph) => {
    const compact = paragraph.replace(/\s+/g, ' ').trim();
    if (!compact) return;

    if (isCategoryHeading(compact)) {
      if (compact.toLowerCase() !== 'massage') {
        activeCategory = compact;
      }
      return;
    }

    const price = extractPriceFromText(compact);
    if (!price) return;

    const beforeDauer = compact.split(/\bdauer\s*:/i)[0] || compact;
    const beforePreis = beforeDauer.split(/\bpreis\s*:/i)[0] || beforeDauer;
    const shortDesc = beforePreis.trim();
    if (!shortDesc) return;

    const longDescRaw = compact.replace(/\bpreis\s*:[\s\S]*$/i, '').trim();
    const longDesc = longDescRaw === shortDesc ? '' : longDescRaw;
    const inferredCategory = inferCategoryFromEntry(`${shortDesc} ${longDesc}`);

    parsed.push({
      shortDesc,
      longDesc,
      price,
      kategorie: activeCategory || inferredCategory || undefined,
    });
  });

  return parsed;
};

export default function AdminDemosPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [demos, setDemos] = useState<DemoData[]>([]);
  const [checkoutSources, setCheckoutSources] = useState<CheckoutSource[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDemo, setEditingDemo] = useState<DemoData | null>(null);
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imagePasteInfo, setImagePasteInfo] = useState<string>('');
  const [isPasteArmed, setIsPasteArmed] = useState(false);
  const pasteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [copySourceSlug, setCopySourceSlug] = useState('');
  const [isImportingCheckout, setIsImportingCheckout] = useState(false);
  const [importInfo, setImportInfo] = useState<string>('');
  const [prospectSlugInput, setProspectSlugInput] = useState('');
  const [prospectCopyInfo, setProspectCopyInfo] = useState('');
  
  // Formular States
  const [formData, setFormData] = useState<DemoData>({
    name: '',
    bildURL: '',
    websiteUrl: '',
    demoHtml: '',
    customValue: false,
    gutscheinAnzeige: 'einzeln',
    rabattcodes: [],
    dienstleistungen: [],
    slug: '',
    createdAt: ''
  });
  const [newDienstleistung, setNewDienstleistung] = useState<DienstleistungForm>({
    shortDesc: '',
    longDesc: '',
    price: '',
    kategorie: ''
  });
  const [bulkDienstleistungenInput, setBulkDienstleistungenInput] = useState('');
  const [bulkImportInfo, setBulkImportInfo] = useState('');
  const [newRabattCode, setNewRabattCode] = useState<RabattCodeForm>({
    code: '',
    percent: '10',
    maxUses: '10'
  });

  // Admin-Check
  useEffect(() => {
    if (user === null) return;
    if (!user) {
      navigate('/');
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        navigate('/');
      }
    };
    checkAdmin();
  }, [user, navigate]);

  // Demos laden
  useEffect(() => {
    if (isAdmin) {
      loadDemos();
      loadCheckoutSources();
    }
  }, [isAdmin]);

  const loadDemos = async () => {
    try {
      const demosCollection = collection(db, 'demos');
      const demoSnapshot = await getDocs(demosCollection);
      const demoList: DemoData[] = [];
      
      demoSnapshot.forEach((doc) => {
        const rawData = doc.data() as any;
        demoList.push({
          id: doc.id,
          name: rawData.name || '',
          bildURL: rawData.bildURL || '',
          websiteUrl: rawData.websiteUrl || '',
          demoHtml: rawData.demoHtml || '',
          customValue: Boolean(rawData.customValue),
          gutscheinAnzeige: rawData.gutscheinAnzeige === 'paket' ? 'kategorie' : (rawData.gutscheinAnzeige || 'einzeln'),
          rabattcodes: Array.isArray(rawData.rabattcodes) ? rawData.rabattcodes : [],
          dienstleistungen: Array.isArray(rawData.dienstleistungen) ? rawData.dienstleistungen : [],
          slug: rawData.slug || '',
          createdAt: rawData.createdAt || new Date(0).toISOString(),
          bildFileName: rawData.bildFileName,
        });
      });
      
      // Nach Erstellungsdatum sortieren (neueste zuerst)
      demoList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDemos(demoList);
    } catch (error) {
      console.error('Fehler beim Laden der Demos:', error);
    }
  };

  const loadCheckoutSources = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const sourceList: CheckoutSource[] = [];

      usersSnapshot.forEach((userDoc) => {
        const data = userDoc.data() as any;
        const slug = (data.slug || '').toString().trim();
        const checkout = data.Checkout || {};
        const name = (checkout.Unternehmensname || data.Unternehmensdaten?.Unternehmensname || '').toString().trim();
        const hasCheckoutConfig = Boolean(
          checkout && (
            checkout.Freibetrag ||
            checkout.BildURL ||
            checkout.Unternehmensname ||
            (checkout.Gutscheinarten && Object.keys(checkout.Gutscheinarten).length > 0)
          )
        );

        if (slug && hasCheckoutConfig) {
          sourceList.push({
            userId: userDoc.id,
            slug,
            name: name || slug,
          });
        }
      });

      sourceList.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      setCheckoutSources(sourceList);
    } catch (error) {
      console.error('Fehler beim Laden der Checkout-Quellen:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const replacements: { [key: string]: string } = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
        return replacements[match] || match;
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const normalizedProspectSlug = generateSlug(prospectSlugInput.trim());

  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set<string>();

    formData.dienstleistungen.forEach((dienstleistung) => {
      const category = (dienstleistung.kategorie || '').trim();
      if (category) uniqueCategories.add(category);
    });

    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b, 'de'));
  }, [formData.dienstleistungen]);

  const groupedDienstleistungen = useMemo(() => {
    const groups = new Map<string, Array<{ dienstleistung: DienstleistungEntry; index: number }>>();

    formData.dienstleistungen.forEach((dienstleistung, index) => {
      const category = (dienstleistung.kategorie || '').trim() || SINGLE_VOUCHER_GROUP;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push({ dienstleistung, index });
    });

    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === SINGLE_VOUCHER_GROUP) return -1;
      if (b[0] === SINGLE_VOUCHER_GROUP) return 1;
      return a[0].localeCompare(b[0], 'de');
    });
  }, [formData.dienstleistungen]);
  
  // Use production domain for demo links (even in local development)
  // Falls über const API_URL (braucht auch PUBLIC_URL)
  const PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL || 'https://gutscheinery.de';
  
  const getBaseDemoUrl = () => {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDev ? PUBLIC_URL : window.location.origin;
  };
  
  const prospectDemoUrl = normalizedProspectSlug
    ? `${getBaseDemoUrl()}/widgetdemo/${encodeURIComponent(normalizedProspectSlug)}`
    : '';

  const ensureUniqueDemoSlug = (baseSlug: string) => {
    let slug = generateSlug(baseSlug);
    let suffix = 2;

    while (demos.some((d) => d.slug === slug && d.id !== editingDemo?.id)) {
      slug = `${generateSlug(baseSlug)}-${suffix}`;
      suffix += 1;
    }

    return slug;
  };

  const mapCheckoutDienstleistungenToDemo = (gutscheinarten: any): DemoData['dienstleistungen'] => {
    const mapped: Array<{ shortDesc: string; longDesc: string; price: string; kategorie?: string; reihenfolge: number }> = [];

    Object.keys(gutscheinarten || {}).forEach((key) => {
      const item = gutscheinarten[key];
      if (!item || item.typ !== 'dienstleistung') return;

      const baseOrder = Number(item.reihenfolge || 0);

      if (Array.isArray(item.varianten) && item.varianten.length > 0) {
        item.varianten.forEach((variante: any, index: number) => {
          mapped.push({
            shortDesc: `${item.name} - ${variante.name}`,
            longDesc: variante.beschreibung || item.beschreibung || item.name || '',
            price: String(variante.preis ?? ''),
            kategorie: typeof item.kategorie === 'string'
              ? item.kategorie
              : (typeof item.category === 'string' ? item.category : ''),
            reihenfolge: baseOrder * 100 + index,
          });
        });
      } else {
        mapped.push({
          shortDesc: item.name || '',
          longDesc: item.beschreibung || item.name || '',
          price: String(item.preis ?? ''),
          kategorie: typeof item.kategorie === 'string'
            ? item.kategorie
            : (typeof item.category === 'string' ? item.category : ''),
          reihenfolge: baseOrder,
        });
      }
    });

    return mapped
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map(({ shortDesc, longDesc, price, kategorie }) => ({ shortDesc, longDesc, price, kategorie }));
  };

  const importFromCheckoutSlug = async () => {
    const sourceSlug = copySourceSlug.trim();
    if (!sourceSlug) {
      alert('Bitte zuerst einen Checkout-Slug eingeben.');
      return;
    }

    if (formData.name || formData.slug || formData.dienstleistungen.length > 0 || selectedFile) {
      const shouldOverwrite = window.confirm('Vorhandene Formularwerte werden ueberschrieben. Fortfahren?');
      if (!shouldOverwrite) return;
    }

    setIsImportingCheckout(true);
    setImportInfo('');

    try {
      const usersRef = collection(db, 'users');
      const qExact = query(usersRef, where('slug', '==', sourceSlug));
      let snap = await getDocs(qExact);

      // Fallback: Viele alte Datensaetze nutzen andere Gross-/Kleinschreibung.
      if (snap.empty && sourceSlug !== sourceSlug.toLowerCase()) {
        const qLower = query(usersRef, where('slug', '==', sourceSlug.toLowerCase()));
        snap = await getDocs(qLower);
      }

      if (snap.empty) {
        alert('Keine Checkout-Seite mit diesem Slug gefunden.');
        return;
      }

      const userData = snap.docs[0].data() as any;
      const checkout = userData.Checkout || {};

      const importedName = checkout.Unternehmensname || userData.Unternehmensdaten?.Unternehmensname || '';
      const importedImage = checkout.BildURL || '';
      const importedCustomValue = Boolean(checkout.Freibetrag);
      const importedGutscheinAnzeige = (checkout as any).gutscheinAnzeige === 'paket' ? 'kategorie' : ((checkout as any).gutscheinAnzeige || 'einzeln');
      const importedDienstleistungen = mapCheckoutDienstleistungenToDemo(checkout.Gutscheinarten || {});
      const importedSlug = ensureUniqueDemoSlug(`${(userData.slug || sourceSlug)}-demo`);

      setFormData((prev) => ({
        ...prev,
        name: importedName,
        bildURL: importedImage,
        customValue: importedCustomValue,
        gutscheinAnzeige: importedGutscheinAnzeige,
        rabattcodes: prev.rabattcodes || [],
        dienstleistungen: importedDienstleistungen,
        slug: importedSlug,
      }));

      setSelectedFile(null);
      setPreviewUrl(importedImage);
      setImportInfo(`Import abgeschlossen: ${importedDienstleistungen.length} Dienstleistungen uebernommen.`);
    } catch (error) {
      console.error('Fehler beim Import aus Checkout:', error);
      alert('Import fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsImportingCheckout(false);
    }
  };

  const copyProspectDemoLink = async () => {
    if (!prospectDemoUrl) return;
    try {
      await navigator.clipboard.writeText(prospectDemoUrl);
      setProspectCopyInfo('Demo-Link kopiert.');
      window.setTimeout(() => setProspectCopyInfo(''), 2400);
    } catch (error) {
      console.error('Kopieren fehlgeschlagen:', error);
      alert('Kopieren fehlgeschlagen. Bitte Link manuell kopieren.');
    }
  };

  // Auto-Slug generieren wenn Name sich ändert
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name) // Nur auto-generieren wenn Slug leer ist
    }));
  };

  const openCreateDialog = () => {
    setEditingDemo(null);
    setFormData({
      name: '',
      bildURL: '',
      demoHtml: '',
      customValue: false,
      gutscheinAnzeige: 'einzeln',
      rabattcodes: [],
      dienstleistungen: [],
      slug: '',
      createdAt: ''
    });
    setNewRabattCode({ code: '', percent: '10', maxUses: '10' });
    setSelectedFile(null);
    setPreviewUrl('');
    setCopySourceSlug('');
    setImportInfo('');
    setBulkDienstleistungenInput('');
    setBulkImportInfo('');
    setOpenDialog(true);
  };

  const openEditDialog = (demo: DemoData) => {
    setEditingDemo(demo);
    setFormData({ ...demo, rabattcodes: Array.isArray(demo.rabattcodes) ? demo.rabattcodes : [] });
    setSelectedFile(null);
    setPreviewUrl(demo.bildURL);
    setCopySourceSlug('');
    setImportInfo('');
    setNewRabattCode({ code: '', percent: '10', maxUses: '10' });
    setBulkDienstleistungenInput('');
    setBulkImportInfo('');
    setOpenDialog(true);
  };

  // Datei-Upload Handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    applyImageFromFile(file, 'upload');
  };

  const applyImageFromFile = (file: File, source: 'upload' | 'paste') => {
    // Validierung
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      alert('Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    setSelectedFile(file);

    // Preview erstellen
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (source === 'paste') {
      setImagePasteInfo('Bild aus Zwischenablage eingefügt.');
      setIsPasteArmed(false);
      window.setTimeout(() => setImagePasteInfo(''), 2600);
    } else {
      setImagePasteInfo('');
      setIsPasteArmed(false);
    }
  };

  const activatePasteMode = () => {
    setIsPasteArmed(true);
    setImagePasteInfo('Paste-Modus aktiv: Jetzt Strg+V drücken.');
    window.setTimeout(() => {
      pasteInputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!openDialog) return;

    const handlePaste = (event: ClipboardEvent) => {
      if (!isPasteArmed) return;

      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      event.preventDefault();
      applyImageFromFile(file, 'paste');
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [openDialog, isPasteArmed]);

  useEffect(() => {
    if (!openDialog) {
      setIsPasteArmed(false);
      setImagePasteInfo('');
    }
  }, [openDialog]);

  // Bild zu Firebase Storage hochladen
  const uploadImage = async (file: File): Promise<{ url: string; fileName: string }> => {
    const fileName = `demos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload mit Progress-Tracking (vereinfacht)
      const uploadTask = uploadBytes(storageRef, file);
      
      // Simuliere Progress (da uploadBytes keinen Progress-Listener hat)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const snapshot = await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { url: downloadURL, fileName };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Altes Bild löschen
  const deleteOldImage = async (fileName: string) => {
    if (!fileName) return;
    
    try {
      const oldImageRef = ref(storage, fileName);
      await deleteObject(oldImageRef);
    } catch (error) {
      console.warn('Altes Bild konnte nicht gelöscht werden:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Slug-Validierung
      if (!formData.slug) {
        alert('Bitte geben Sie einen Slug ein.');
        return;
      }

      // Prüfen ob Slug bereits existiert (bei neuer Demo oder geändertem Slug)
      const existingDemo = demos.find(d => 
        d.slug === formData.slug && d.id !== editingDemo?.id
      );
      if (existingDemo) {
        alert('Dieser Slug wird bereits verwendet. Bitte wählen Sie einen anderen.');
        return;
      }

      let bildURL = formData.bildURL;
      let bildFileName = formData.bildFileName;

      // Neues Bild hochladen wenn ausgewählt
      if (selectedFile) {
        const uploadResult = await uploadImage(selectedFile);
        bildURL = uploadResult.url;
        bildFileName = uploadResult.fileName;

        // Altes Bild löschen wenn vorhanden
        if (editingDemo?.bildFileName) {
          await deleteOldImage(editingDemo.bildFileName);
        }
      }

      const demoDataRaw = {
        ...formData,
        bildURL,
        bildFileName,
        slug: formData.slug.toLowerCase(),
        createdAt: editingDemo ? formData.createdAt : new Date().toISOString()
      };

      const demoData = sanitizeForFirestore(demoDataRaw);

      if (editingDemo) {
        await updateDoc(doc(db, 'demos', editingDemo.id!), demoData);
      } else {
        await addDoc(collection(db, 'demos'), demoData);
      }

      setOpenDialog(false);
      loadDemos();
      alert(editingDemo ? 'Demo erfolgreich aktualisiert!' : 'Demo erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Fehler beim Speichern der Demo: ${errorMessage}`);
    }
  };

  const handleDelete = async (demoId: string) => {
    const demo = demos.find(d => d.id === demoId);
    if (!window.confirm(`Demo "${demo?.name}" wirklich löschen?`)) return;
    
    try {
      // Bild aus Storage löschen
      if (demo?.bildFileName) {
        await deleteOldImage(demo.bildFileName);
      }

      // Demo aus Firestore löschen
      await deleteDoc(doc(db, 'demos', demoId));
      loadDemos();
      alert('Demo erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Demo');
    }
  };

  const addDienstleistung = () => {
    if (!newDienstleistung.shortDesc || !newDienstleistung.price) {
      alert('Bitte Beschreibung und Preis eingeben');
      return;
    }

    setFormData({
      ...formData,
      dienstleistungen: [...formData.dienstleistungen, { ...newDienstleistung, kategorie: (newDienstleistung.kategorie || '').trim() || undefined }]
    });

    setNewDienstleistung({ shortDesc: '', longDesc: '', price: '', kategorie: '' });
  };

  const importDienstleistungenFromText = (mode: 'append' | 'replace') => {
    const parsed = parseDienstleistungenFromInput(bulkDienstleistungenInput);
    if (parsed.length === 0) {
      alert('Keine gueltigen Dienstleistungen erkannt. Bitte Eingabe pruefen (inkl. Preisangaben).');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      dienstleistungen: mode === 'replace'
        ? parsed
        : [...prev.dienstleistungen, ...parsed],
    }));

    const actionText = mode === 'replace' ? 'ersetzt' : 'hinzugefuegt';
    setBulkImportInfo(`${parsed.length} Dienstleistungen automatisch erkannt und ${actionText}.`);
  };

  const removeDienstleistung = (index: number) => {
    setFormData({
      ...formData,
      dienstleistungen: formData.dienstleistungen.filter((_, i) => i !== index)
    });
  };

  const updateDienstleistungCategory = (index: number, category: string) => {
    const normalizedCategory = category.trim();

    setFormData((prev) => ({
      ...prev,
      dienstleistungen: prev.dienstleistungen.map((dienstleistung, i) =>
        i === index
          ? { ...dienstleistung, kategorie: normalizedCategory || undefined }
          : dienstleistung
      ),
    }));
  };

  const addRabattCode = () => {
    const normalizedCode = newRabattCode.code.trim().toUpperCase();
    const percent = Number(newRabattCode.percent);
    const maxUses = Number(newRabattCode.maxUses);

    if (!normalizedCode) {
      alert('Bitte einen Rabattcode eingeben.');
      return;
    }
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      alert('Der Rabatt muss zwischen 1 und 100 Prozent liegen.');
      return;
    }
    if (!Number.isFinite(maxUses) || maxUses <= 0) {
      alert('Das Einloeselimit muss groesser als 0 sein.');
      return;
    }
    if (formData.rabattcodes.some((c) => c.code === normalizedCode)) {
      alert('Dieser Rabattcode ist bereits vorhanden.');
      return;
    }

    setFormData({
      ...formData,
      rabattcodes: [
        ...formData.rabattcodes,
        {
          code: normalizedCode,
          percent,
          maxUses,
          usedCount: 0,
          isActive: true,
        },
      ],
    });

    setNewRabattCode({ code: '', percent: '10', maxUses: '10' });
  };

  const removeRabattCode = (index: number) => {
    setFormData({
      ...formData,
      rabattcodes: formData.rabattcodes.filter((_, i) => i !== index),
    });
  };

  const toggleRabattCodeActive = (index: number, active: boolean) => {
    setFormData({
      ...formData,
      rabattcodes: formData.rabattcodes.map((code, i) =>
        i === index ? { ...code, isActive: active } : code
      ),
    });
  };

  if (isAdmin === null) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Lade...</Box>;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>

      <Box sx={{ pt: { xs: 8, md: 12 }, px: { xs: 2, md: 8 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} color="primary">
                Demo-Verwaltung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Erstellen Sie Demo-Seiten für Kundenanfragen
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ borderRadius: 2 }}
            >
              Neue Demo erstellen
            </Button>
          </Box>

          <Paper elevation={2} sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, mb: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              Neukunden-DemoSystem
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Erzeugt sofort einen Demo-Link fuer Kunden, die noch keinen Account haben.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Kundenname oder Wunsch-Slug"
                placeholder="z.B. Wellness Oase Hamburg"
                value={prospectSlugInput}
                onChange={(e) => {
                  setProspectSlugInput(e.target.value);
                  if (prospectCopyInfo) setProspectCopyInfo('');
                }}
                size="small"
                sx={{ flex: '1 1 280px' }}
              />

              <TextField
                label="Demo-Link"
                value={prospectDemoUrl}
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ flex: '2 1 420px' }}
              />

              <Button
                variant="outlined"
                startIcon={<OpenInNew />}
                disabled={!prospectDemoUrl}
                onClick={() => window.open(prospectDemoUrl, '_blank', 'noopener,noreferrer')}
              >
                Oeffnen
              </Button>

              <Button
                variant="contained"
                startIcon={<ContentCopy />}
                disabled={!prospectDemoUrl}
                onClick={copyProspectDemoLink}
              >
                Link kopieren
              </Button>
            </Box>

            {normalizedProspectSlug && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                Verwendeter Slug: {normalizedProspectSlug}
              </Typography>
            )}

            {prospectCopyInfo && (
              <Alert severity="success" sx={{ mt: 1.5 }}>
                {prospectCopyInfo}
              </Alert>
            )}
          </Paper>

          {demos.length === 0 ? (
            <Paper elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Noch keine Demos erstellt
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Erstellen Sie Ihre erste Demo-Seite für Kundenanfragen
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ borderRadius: 3 }}>
              <List>
                {demos.map((demo) => (
                  <ListItem key={demo.id} divider>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      {demo.bildURL ? (
                        <img 
                          src={demo.bildURL} 
                          alt={demo.name}
                          style={{ 
                            width: 60, 
                            height: 60, 
                            objectFit: 'cover', 
                            borderRadius: 8 
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: 60, 
                          height: 60, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Image color="disabled" />
                        </Box>
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="h6" fontWeight={600}>
                          {demo.name}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            demo/{demo.slug}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Freier Betrag: {demo.customValue ? 'Ja' : 'Nein'} | 
                            Dienstleistungen: {demo.dienstleistungen.length} | 
                            Rabattcodes: {demo.rabattcodes?.length || 0} | 
                            Erstellt: {new Date(demo.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.open(`/widgetdemo/${demo.slug}`, '_blank')}
                        sx={{ borderRadius: 2 }}
                      >
                        Kunden-Seite
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => window.open(`/widgetdemo/${demo.slug}?layoutEdit=1`, '_blank')}
                        sx={{ borderRadius: 2 }}
                      >
                        Layout-Modus
                      </Button>
                      <IconButton onClick={() => openEditDialog(demo)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(demo.id!)} color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDemo ? 'Demo bearbeiten' : 'Neue Demo erstellen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box sx={{ border: '1px dashed #90caf9', p: 2, borderRadius: 2, backgroundColor: '#f8fbff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Aus echter Checkout-Seite kopieren
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Geben Sie einen bestehenden Checkout-Slug ein (z.B. /checkout/slug). Name, Bild, Gutscheinoptionen und Dienstleistungen werden automatisch uebernommen.
              </Typography>
              {checkoutSources.length > 0 && (
                <TextField
                  select
                  label="Vorhandene Checkout-Seite auswaehlen"
                  value={checkoutSources.some((source) => source.slug === copySourceSlug) ? copySourceSlug : ''}
                  onChange={(e) => setCopySourceSlug(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {checkoutSources.map((source) => (
                    <MenuItem key={source.userId} value={source.slug}>
                      {source.name} ({source.slug})
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  label="Checkout-Slug"
                  placeholder="z.B. massage-studio-berlin"
                  value={copySourceSlug}
                  onChange={(e) => setCopySourceSlug(e.target.value)}
                  size="small"
                  sx={{ flex: '1 1 260px' }}
                />
                <Button
                  variant="outlined"
                  onClick={importFromCheckoutSlug}
                  disabled={isImportingCheckout || !copySourceSlug.trim()}
                >
                  {isImportingCheckout ? 'Importiere...' : 'Daten uebernehmen'}
                </Button>
              </Box>
              {importInfo && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {importInfo}
                </Alert>
              )}
            </Box>

            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              helperText="Der Name der Demo (z.B. 'Musterfriseur Berlin')"
            />
            
            <TextField
              label="URL-Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              required
              helperText="URL-freundlicher Name (z.B. 'musterfriseur-berlin')"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>demo/</Typography>,
              }}
            />

            <TextField
              label="Kundenwebsite-URL"
              value={formData.websiteUrl || ''}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value.trim() })}
              placeholder="https://meggywoll.de"
              helperText="Website-URL des Kunden - wird verwendet um relative Bild-Pfade korrekt aufzulösen"
            />

            <TextField
              label="HTML-Code der grossen Seite (optional)"
              value={formData.demoHtml || ''}
              onChange={(e) => setFormData({ ...formData, demoHtml: e.target.value })}
              multiline
              minRows={8}
              maxRows={18}
              placeholder={'Fuegen Sie hier Ihre komplette HTML-Seite ein.\nNutzen Sie {{WIDGET_IFRAME}} als Platzhalter fuer das Widget.'}
              helperText="Wenn kein Platzhalter gesetzt ist, wird das Widget automatisch unter dem HTML eingefuegt."
            />

            {/* Bild-Upload Sektion */}
            <Box>
              <Typography variant="h6" gutterBottom>Hintergrundbild</Typography>
              
              {/* Aktuelles/Vorschau Bild */}
              {previewUrl && (
                <Box sx={{ mb: 2 }}>
                  <img 
                    src={previewUrl} 
                    alt="Vorschau"
                    style={{ 
                      width: '100%', 
                      maxWidth: 400, 
                      height: 200, 
                      objectFit: 'cover', 
                      borderRadius: 8,
                      border: '1px solid #ddd'
                    }}
                  />
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{ mb: 1 }}
              >
                {editingDemo && !selectedFile ? 'Bild ändern' : 'Bild hochladen'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Tipp: Auf die Box klicken und dann Strg+V druecken.
              </Typography>

              <Box
                role="button"
                tabIndex={0}
                onClick={activatePasteMode}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activatePasteMode();
                  }
                }}
                sx={{
                  mt: 1,
                  mb: 1,
                  p: 2,
                  borderRadius: 2,
                  border: isPasteArmed ? '2px solid #1976d2' : '2px dashed #90caf9',
                  backgroundColor: isPasteArmed ? '#e3f2fd' : '#f8fbff',
                  color: '#0d47a1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#eef6ff',
                  },
                  '&:focus-visible': {
                    outline: '3px solid #1976d2',
                    outlineOffset: 2,
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {isPasteArmed ? 'Bereit: Jetzt Strg+V einfuegen' : 'Hier klicken und Strg+V fuer Bild'}
                </Typography>
              </Box>

              <textarea
                ref={pasteInputRef}
                aria-hidden="true"
                tabIndex={-1}
                value=""
                onChange={() => {}}
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: 'none'
                }}
              />

              {imagePasteInfo && (
                <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
                  {imagePasteInfo}
                </Alert>
              )}

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary">
                    Upload läuft... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Neue Datei: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.customValue}
                  onChange={(e) => setFormData({ ...formData, customValue: e.target.checked })}
                />
              }
              label="Freier Betrag erlaubt"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.gutscheinAnzeige === 'kategorie'}
                  onChange={(e) => setFormData({ ...formData, gutscheinAnzeige: e.target.checked ? 'kategorie' : 'einzeln' })}
                />
              }
              label="Gutscheine als Paket anzeigen"
            />

            <Typography variant="h6">Rabattcodes (Demo)</Typography>
            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Neuen Rabattcode hinzufügen:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Code"
                  value={newRabattCode.code}
                  onChange={(e) => setNewRabattCode({ ...newRabattCode, code: e.target.value.toUpperCase() })}
                  size="small"
                  placeholder="z.B. OPEN10"
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="Rabatt in %"
                  type="number"
                  value={newRabattCode.percent}
                  onChange={(e) => setNewRabattCode({ ...newRabattCode, percent: e.target.value })}
                  size="small"
                  sx={{ flex: '0 1 140px' }}
                />
                <TextField
                  label="Max. Einlösungen"
                  type="number"
                  value={newRabattCode.maxUses}
                  onChange={(e) => setNewRabattCode({ ...newRabattCode, maxUses: e.target.value })}
                  size="small"
                  sx={{ flex: '0 1 160px' }}
                />
                <Button variant="contained" onClick={addRabattCode} sx={{ flex: '0 0 auto' }}>
                  Hinzufügen
                </Button>
              </Box>

              {formData.rabattcodes.length > 0 && (
                <Box>
                  {formData.rabattcodes.map((code, index) => (
                    <Box
                      key={`${code.code}-${index}`}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        border: '1px solid #eee',
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: '#fafafa',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {code.code} - {code.percent}% Rabatt
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Einlösungen: {code.usedCount || 0}/{code.maxUses}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={code.isActive}
                              onChange={(e) => toggleRabattCodeActive(index, e.target.checked)}
                              size="small"
                            />
                          }
                          label={code.isActive ? 'Aktiv' : 'Inaktiv'}
                          sx={{ mr: 0 }}
                        />
                        <IconButton size="small" onClick={() => removeRabattCode(index)} color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Typography variant="h6">Dienstleistungen</Typography>

            <Box sx={{ border: '1px dashed #90caf9', p: 2, borderRadius: 2, backgroundColor: '#f8fbff' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700 }}>
                Auto-Import aus Text
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Fuegen Sie einen strukturierten Block mit Kategorien, Dauer und Preis ein. Der Parser erkennt Kategorien automatisch und erstellt Dienstleistungen.
              </Typography>
              <TextField
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
                placeholder={'Beispiel:\nGanzheitliche Massagen\n\n20 Min. Schulter/Nacken Massage Dauer: 20 Min, Preis: 27 Euro'}
                value={bulkDienstleistungenInput}
                onChange={(e) => {
                  setBulkDienstleistungenInput(e.target.value);
                  if (bulkImportInfo) setBulkImportInfo('');
                }}
              />
              <Box sx={{ display: 'flex', gap: 1.25, mt: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => importDienstleistungenFromText('append')}
                  disabled={!bulkDienstleistungenInput.trim()}
                >
                  Automatisch hinzufuegen
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => importDienstleistungenFromText('replace')}
                  disabled={!bulkDienstleistungenInput.trim()}
                >
                  Bestehende ersetzen
                </Button>
              </Box>
              {bulkImportInfo && (
                <Alert severity="success" sx={{ mt: 1.5 }}>
                  {bulkImportInfo}
                </Alert>
              )}
            </Box>
            
            {/* Neue Dienstleistung hinzufügen */}
            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Neue Dienstleistung hinzufügen:</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Leer lassen = Einzelgutschein. Gleiche Kategorienamen werden später automatisch zusammengefasst.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Kurzbeschreibung"
                  value={newDienstleistung.shortDesc}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, shortDesc: e.target.value })}
                  size="small"
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="Langbeschreibung (optional)"
                  value={newDienstleistung.longDesc}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, longDesc: e.target.value })}
                  size="small"
                  sx={{ flex: '1 1 200px' }}
                />
                <TextField
                  label="Preis (€)"
                  type="number"
                  value={newDienstleistung.price}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, price: e.target.value })}
                  size="small"
                  sx={{ flex: '0 1 120px' }}
                />
                <TextField
                  label="Kategorie (optional)"
                  value={newDienstleistung.kategorie || ''}
                  onChange={(e) => setNewDienstleistung({ ...newDienstleistung, kategorie: e.target.value })}
                  size="small"
                  sx={{ flex: '1 1 260px' }}
                />
                <Button 
                  variant="contained" 
                  onClick={addDienstleistung}
                  sx={{ flex: '0 0 auto' }}
                >
                  Hinzufügen
                </Button>
              </Box>
            </Box>

            {/* Liste der Dienstleistungen */}
            {formData.dienstleistungen.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2">Aktuelle Dienstleistungen:</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {availableCategories.length > 0
                      ? `${availableCategories.length} Kategorien + Einzelgutscheine`
                      : 'Nur Einzelgutscheine'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {groupedDienstleistungen.map(([category, items]) => (
                    <Box
                      key={category}
                      sx={{
                        p: 2,
                        border: '1px solid #eee',
                        borderRadius: 2,
                        backgroundColor: category === SINGLE_VOUCHER_GROUP ? '#fafafa' : '#f8fbff',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {category}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {items.map(({ dienstleistung, index }) => (
                          <Box
                            key={`${category}-${index}`}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 2,
                              p: 1.5,
                              border: '1px solid #f0f0f0',
                              borderRadius: 2,
                              backgroundColor: '#fff',
                              flexWrap: 'wrap',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {dienstleistung.shortDesc} - {dienstleistung.price}€
                              </Typography>
                              {dienstleistung.longDesc && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {dienstleistung.longDesc}
                                </Typography>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <TextField
                                select
                                size="small"
                                label="Kategorie"
                                value={dienstleistung.kategorie || ''}
                                onChange={(e) => updateDienstleistungCategory(index, e.target.value)}
                                sx={{ minWidth: 220 }}
                              >
                                <MenuItem value="">Einzelgutschein</MenuItem>
                                {availableCategories.map((categoryName) => (
                                  <MenuItem key={categoryName} value={categoryName}>
                                    {categoryName}
                                  </MenuItem>
                                ))}
                              </TextField>

                              <IconButton size="small" onClick={() => removeDienstleistung(index)} color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {formData.slug && (
              <Alert severity="info">
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Kunden-Seite: <strong>/widgetdemo/{formData.slug}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Verkaufsseite: <strong>/demo/{formData.slug}</strong>
                  </Typography>
                </Box>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={uploading || !formData.name || !formData.slug}
          >
            {uploading ? 'Speichere...' : editingDemo ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}