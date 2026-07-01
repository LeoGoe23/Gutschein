import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import useAuth from '../auth/useAuth';
import { db } from '../auth/firebase';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';
import { uploadPDFToStorage, saveGutscheinLink } from '../utils/firebaseStorage';
import { saveSoldGutscheinToShop } from '../utils/saveSoldGutscheinToShop';

const API_URL = process.env.REACT_APP_API_URL;

type GutscheinTyp = 'wert' | 'dienstleistung';

interface DienstleistungOption {
  id: string;
  shortDesc: string;
  longDesc: string;
  price: number;
}

interface ShopOption {
  id: string;
  unternehmensname: string;
  slug: string;
  website: string;
  bildURL: string;
  gutscheinURL: string;
  designConfig?: {
    betrag: { x: number; y: number; size: number };
    code: { x: number; y: number; size: number };
  };
  customValue: boolean;
  dienstleistungen: DienstleistungOption[];
}

function generateGutscheinCode() {
  return `GS-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}

function toBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function extractDienstleistungen(gutscheinarten: any): DienstleistungOption[] {
  const options: Array<DienstleistungOption & { reihenfolge: number }> = [];

  Object.keys(gutscheinarten || {}).forEach((key) => {
    const item = gutscheinarten[key];
    if (item?.typ !== 'dienstleistung' || item?.aktiv === false) {
      return;
    }

    const reihenfolge = item?.reihenfolge ?? 0;

    if (Array.isArray(item?.varianten) && item.varianten.length > 0) {
      item.varianten.forEach((variante: any, idx: number) => {
        const preis = Number(variante?.preis ?? 0);
        if (!preis || preis <= 0) return;

        options.push({
          id: `${key}_variante_${idx}`,
          shortDesc: `${item.name} - ${variante.name}`,
          longDesc: variante?.beschreibung || item?.beschreibung || item?.name || '',
          price: preis,
          reihenfolge,
        });
      });
      return;
    }

    const preis = Number(item?.preis ?? 0);
    if (!preis || preis <= 0) return;

    options.push({
      id: key,
      shortDesc: item?.name || '',
      longDesc: item?.beschreibung || item?.name || '',
      price: preis,
      reihenfolge,
    });
  });

  return options
    .sort((a, b) => a.reihenfolge - b.reihenfolge)
    .map(({ reihenfolge, ...rest }) => rest);
}

export default function AdminCreateGutschein() {
  const user = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shops, setShops] = useState<ShopOption[]>([]);

  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [gutscheinTyp, setGutscheinTyp] = useState<GutscheinTyp>('wert');
  const [betrag, setBetrag] = useState<number | null>(null);
  const [selectedDienstleistungId, setSelectedDienstleistungId] = useState<string>('');
  const [empfaengerEmail, setEmpfaengerEmail] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ gutscheinCode: string; downloadLink?: string; mode: 'send' | 'print' } | null>(null);

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) || null,
    [shops, selectedShopId]
  );

  const selectedDienstleistung = useMemo(
    () => selectedShop?.dienstleistungen.find((item) => item.id === selectedDienstleistungId) || null,
    [selectedShop, selectedDienstleistungId]
  );

  useEffect(() => {
    if (user === null) {
      setIsAdmin(null);
      return;
    }

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

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const preselectedShopId = location.state?.preselectedShopId;

    const fetchShops = async () => {
      setLoadingShops(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const parsed: ShopOption[] = [];

        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const slug = data?.slug || '';
          const unternehmensname = data?.Checkout?.Unternehmensname || data?.Unternehmensdaten?.Unternehmensname || '';
          if (!slug || !unternehmensname) return;

          parsed.push({
            id: docSnap.id,
            unternehmensname,
            slug,
            website: data?.Unternehmensdaten?.Website || '',
            bildURL: data?.Checkout?.BildURL || '',
            gutscheinURL: data?.Checkout?.GutscheinDesignURL || '',
            designConfig: data?.Checkout?.DesignConfig,
            customValue: data?.Checkout?.Freibetrag || false,
            dienstleistungen: extractDienstleistungen(data?.Checkout?.Gutscheinarten || {}),
          });
        });

        parsed.sort((a, b) => a.unternehmensname.localeCompare(b.unternehmensname, 'de'));
        setShops(parsed);

        if (preselectedShopId && parsed.some((shop) => shop.id === preselectedShopId)) {
          setSelectedShopId(preselectedShopId);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Shops:', err);
        setError('Shops konnten nicht geladen werden.');
      } finally {
        setLoadingShops(false);
      }
    };

    fetchShops();
  }, [isAdmin, location.state]);

  useEffect(() => {
    if (!selectedShop) return;

    if (!selectedShop.customValue && selectedShop.dienstleistungen.length > 0) {
      setGutscheinTyp('dienstleistung');
    }

    if (selectedShop.customValue) {
      setGutscheinTyp('wert');
    }

    setBetrag(null);
    setSelectedDienstleistungId('');
  }, [selectedShopId]);

  const hasValidVoucherSelection = !!selectedShop && ((gutscheinTyp === 'wert' && !!betrag && betrag > 0) || (gutscheinTyp === 'dienstleistung' && !!selectedDienstleistung));
  const canSend = hasValidVoucherSelection && !!empfaengerEmail.trim();
  const canPrint = hasValidVoucherSelection;

  const handleCreate = async (mode: 'send' | 'print') => {
    if (!selectedShop) return;

    const normalizedEmail = empfaengerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'send' && !emailRegex.test(normalizedEmail)) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }

    if (gutscheinTyp === 'wert' && (!betrag || betrag <= 0)) {
      setError('Bitte einen gültigen Betrag eingeben.');
      return;
    }

    if (gutscheinTyp === 'dienstleistung' && !selectedDienstleistung) {
      setError('Bitte eine Dienstleistung auswählen.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const gutscheinCode = generateGutscheinCode();
      const effektiverBetrag = selectedDienstleistung ? selectedDienstleistung.price : Number(betrag);

      const pdfBlob = await generateGutscheinPDF({
        unternehmen: selectedShop.unternehmensname,
        betrag: selectedDienstleistung ? '' : effektiverBetrag.toString(),
        gutscheinCode,
        ausstelltAm: new Date().toLocaleDateString(),
        website: selectedShop.website,
        bildURL: selectedShop.bildURL,
        dienstleistung: selectedDienstleistung
          ? {
              shortDesc: selectedDienstleistung.shortDesc,
              longDesc: selectedDienstleistung.longDesc,
            }
          : undefined,
        gutscheinDesignURL: selectedShop.gutscheinURL,
        designConfig: selectedShop.designConfig,
      });

      if (mode === 'print') {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');

        if (!printWindow) {
          URL.revokeObjectURL(pdfUrl);
          throw new Error('Druckfenster konnte nicht geöffnet werden. Bitte Popups erlauben.');
        }

        const revoke = () => URL.revokeObjectURL(pdfUrl);
        printWindow.addEventListener('load', () => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {
            // Druckdialog konnte im Browser nicht automatisch gestartet werden.
          }
        });
        printWindow.addEventListener('beforeunload', revoke);
        setTimeout(revoke, 120000);

        await saveSoldGutscheinToShop({
          gutscheinCode,
          betrag: effektiverBetrag,
          kaufdatum: new Date().toISOString(),
          empfaengerEmail: normalizedEmail || 'druck@lokal',
          slug: selectedShop.slug,
          provision: 0,
        });

        setSuccess({ gutscheinCode, mode: 'print' });
        setEmpfaengerEmail('');
        setBetrag(null);
        setSelectedDienstleistungId('');
        return;
      }

      const fileName = `${selectedShop.slug}_${gutscheinCode}_${Date.now()}_admin.pdf`;
      const downloadURL = await uploadPDFToStorage(pdfBlob, fileName);

      const linkId = await saveGutscheinLink({
        gutscheinCode,
        downloadURL,
        betrag: effektiverBetrag,
        empfaengerEmail: normalizedEmail,
        unternehmensname: selectedShop.unternehmensname,
        slug: selectedShop.slug,
        createdAt: new Date().toISOString(),
        dienstleistung: selectedDienstleistung?.shortDesc,
        paymentIntentId: `manual_admin_${Date.now()}`,
      });

      const publicDownloadLink = `${API_URL}/api/gutscheine/download/${linkId}`;

      const pdfArrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBase64 = toBase64(pdfArrayBuffer);

      const response = await fetch(`${API_URL}/api/gutscheine/send-gutschein`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empfaengerEmail: normalizedEmail,
          unternehmensname: selectedShop.unternehmensname,
          gutscheinCode,
          betrag: effektiverBetrag,
          dienstleistung: selectedDienstleistung
            ? {
                shortDesc: selectedDienstleistung.shortDesc,
                longDesc: selectedDienstleistung.longDesc,
              }
            : undefined,
          pdfBuffer: pdfBase64,
          stripeSessionId: `manual_admin_${Date.now()}`,
          slug: selectedShop.slug,
          downloadLink: publicDownloadLink,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'E-Mail konnte nicht versendet werden.');
      }

      await saveSoldGutscheinToShop({
        gutscheinCode,
        betrag: effektiverBetrag,
        kaufdatum: new Date().toISOString(),
        empfaengerEmail: normalizedEmail,
        slug: selectedShop.slug,
        provision: 0,
      });

      setSuccess({ gutscheinCode, downloadLink: publicDownloadLink, mode: 'send' });
      setEmpfaengerEmail('');
      setBetrag(null);
      setSelectedDienstleistungId('');
    } catch (err: any) {
      console.error('Fehler beim manuellen Erstellen:', err);
      setError(err?.message || 'Gutschein konnte nicht erstellt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdmin === null) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          pt: { xs: 8, md: 12 },
          pl: { xs: 2, md: 8 },
          pr: { xs: 2, md: 8 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/admin')}>
              ← Zurück
            </Button>
            <Typography variant="h4" fontWeight={700} color="primary">
              Gutschein erstellen
            </Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            {loadingShops ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2.5 }}>
                  <InputLabel>Shop auswählen</InputLabel>
                  <Select
                    value={selectedShopId}
                    label="Shop auswählen"
                    onChange={(e) => setSelectedShopId(String(e.target.value))}
                  >
                    <MenuItem value="">Bitte Shop wählen</MenuItem>
                    {shops.map((shop) => (
                      <MenuItem key={shop.id} value={shop.id}>
                        {shop.unternehmensname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedShop && (
                  <>
                    <Box sx={{ mb: 2.5 }}>
                      <ToggleButtonGroup
                        value={gutscheinTyp}
                        exclusive
                        onChange={(_event, value: GutscheinTyp | null) => {
                          if (!value) return;
                          setGutscheinTyp(value);
                          setBetrag(null);
                          setSelectedDienstleistungId('');
                        }}
                      >
                        <ToggleButton value="wert" disabled={!selectedShop.customValue}>
                          Wertgutschein
                        </ToggleButton>
                        <ToggleButton value="dienstleistung" disabled={selectedShop.dienstleistungen.length === 0}>
                          Dienstleistung
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {gutscheinTyp === 'wert' && (
                      <TextField
                        fullWidth
                        type="number"
                        label="Betrag in €"
                        value={betrag ?? ''}
                        onChange={(e) => setBetrag(Number(e.target.value))}
                        sx={{ mb: 2.5 }}
                      />
                    )}

                    {gutscheinTyp === 'dienstleistung' && (
                      <FormControl fullWidth sx={{ mb: 2.5 }}>
                        <InputLabel>Dienstleistung auswählen</InputLabel>
                        <Select
                          value={selectedDienstleistungId}
                          label="Dienstleistung auswählen"
                          onChange={(e) => setSelectedDienstleistungId(String(e.target.value))}
                        >
                          <MenuItem value="">Bitte wählen</MenuItem>
                          {selectedShop.dienstleistungen.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.shortDesc} ({item.price}€)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <TextField
                      fullWidth
                      type="email"
                      label="Empfänger E-Mail (nur für Versand nötig)"
                      value={empfaengerEmail}
                      onChange={(e) => setEmpfaengerEmail(e.target.value)}
                      sx={{ mb: 2.5 }}
                    />

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {success && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        {success.mode === 'send'
                          ? `Gutschein ${success.gutscheinCode} wurde erstellt und versendet.`
                          : `Gutschein ${success.gutscheinCode} wurde erstellt und zum Drucken geöffnet.`}
                        {success.downloadLink && (
                          <>
                            <br />
                            Download-Link: {success.downloadLink}
                          </>
                        )}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        onClick={() => handleCreate('send')}
                        disabled={!canSend || isSubmitting}
                        sx={{ minWidth: 220 }}
                      >
                        {isSubmitting ? 'Wird erstellt...' : 'Erstellen & versenden'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleCreate('print')}
                        disabled={!canPrint || isSubmitting}
                        sx={{ minWidth: 220 }}
                      >
                        {isSubmitting ? 'Wird erstellt...' : 'Erstellen & drucken'}
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
