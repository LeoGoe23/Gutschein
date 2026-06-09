import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import useAuth from '../auth/useAuth';
import { db, storage } from '../auth/firebase';

type GutscheinTyp = 'wert' | 'dienstleistung';

interface ExtraOfferConfig {
  enabled: boolean;
  slug: string;
  pageTitle: string;
  introText: string;
  longDescription: string;
  imageURL: string;
  externalLink: string;
  externalLinkLabel: string;
  voucherType: GutscheinTyp;
  voucherTitle: string;
  voucherDescription: string;
  voucherAmount: number;
}

interface ShopOption {
  id: string;
  unternehmensname: string;
  extraOffer?: Partial<ExtraOfferConfig>;
}

const defaultConfig: ExtraOfferConfig = {
  enabled: false,
  slug: '',
  pageTitle: 'Zusaetzliches Angebot',
  introText: 'Entdecken Sie unser zusaetzliches Angebot.',
  longDescription: '',
  imageURL: '',
  externalLink: '',
  externalLinkLabel: 'Mehr erfahren',
  voucherType: 'wert',
  voucherTitle: 'Extra Gutschein',
  voucherDescription: '',
  voucherAmount: 140,
};

export default function AdminExtraOffer() {
  const user = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [config, setConfig] = useState<ExtraOfferConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewURL, setImagePreviewURL] = useState('');

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) || null,
    [shops, selectedShopId]
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
    if (!isAdmin) return;

    const loadShops = async () => {
      setIsLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(db, 'users'));
        const items: ShopOption[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const unternehmensname = data?.Checkout?.Unternehmensname || data?.Unternehmensdaten?.Unternehmensname || data?.email || docSnap.id;
          items.push({
            id: docSnap.id,
            unternehmensname,
            extraOffer: data?.Checkout?.ExtraOffer || {},
          });
        });

        items.sort((a, b) => a.unternehmensname.localeCompare(b.unternehmensname, 'de'));
        setShops(items);

        const preselectedShopId = location.state?.preselectedShopId;
        if (preselectedShopId && items.some((s) => s.id === preselectedShopId)) {
          setSelectedShopId(preselectedShopId);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Shops:', err);
        setError('Shops konnten nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    };

    loadShops();
  }, [isAdmin, location.state]);

  useEffect(() => {
    if (!selectedShop) {
      setConfig(defaultConfig);
      return;
    }

    setConfig({
      ...defaultConfig,
      ...selectedShop.extraOffer,
    });
    setImageFile(null);
    setImagePreviewURL(String(selectedShop.extraOffer?.imageURL || ''));
    setError('');
    setSuccess('');
  }, [selectedShopId, selectedShop]);

  const setImageFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien verwenden.');
      return;
    }

    const localURL = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewURL(localURL);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedShopId) return;

    const normalizedSlug = config.slug.trim().toLowerCase();
    if (!normalizedSlug) {
      setError('Bitte einen Extra-Slug vergeben.');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(normalizedSlug)) {
      setError('Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
      return;
    }

    if (!config.voucherAmount || config.voucherAmount <= 0) {
      setError('Bitte einen gueltigen Gutscheinbetrag angeben.');
      return;
    }

    const slugUsedByOtherShop = shops.some(
      (shop) =>
        shop.id !== selectedShopId &&
        String(shop.extraOffer?.slug || '').trim().toLowerCase() === normalizedSlug
    );

    if (slugUsedByOtherShop) {
      setError('Dieser Extra-Slug wird bereits von einem anderen Shop verwendet.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      let finalImageURL = config.imageURL.trim();

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png';
        const cleanSlug = normalizedSlug || 'extra';
        const storageRef = ref(
          storage,
          `seiten/${selectedShopId}/extra-offer-${cleanSlug}.${ext}`
        );
        await uploadBytes(storageRef, imageFile);
        finalImageURL = await getDownloadURL(storageRef);
      }

      const payload: ExtraOfferConfig = {
        ...config,
        slug: normalizedSlug,
        externalLink: config.externalLink.trim(),
        externalLinkLabel: config.externalLinkLabel.trim() || 'Mehr erfahren',
        pageTitle: config.pageTitle.trim(),
        introText: config.introText.trim(),
        longDescription: config.longDescription.trim(),
        imageURL: finalImageURL,
        voucherTitle: config.voucherTitle.trim(),
        voucherDescription: config.voucherDescription.trim(),
      };

      await updateDoc(doc(db, 'users', selectedShopId), {
        'Checkout.ExtraOffer': payload,
      });

      setShops((prev) =>
        prev.map((shop) =>
          shop.id === selectedShopId
            ? { ...shop, extraOffer: payload }
            : shop
        )
      );

      setConfig(payload);
      setImageFile(null);
      setImagePreviewURL(payload.imageURL || '');

      setSuccess(`Gespeichert. Seite verfuegbar unter /extra/${payload.slug}`);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError('Speichern fehlgeschlagen.');
    } finally {
      setIsSaving(false);
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
        <Box sx={{ width: '100%', maxWidth: 980, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/admin')}>
              Zurueck
            </Button>
            <Typography variant="h4" fontWeight={700} color="primary">
              Extra-Slug Seite konfigurieren
            </Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2.5 }}>
                  <InputLabel>Shop auswaehlen</InputLabel>
                  <Select
                    value={selectedShopId}
                    label="Shop auswaehlen"
                    onChange={(e) => setSelectedShopId(String(e.target.value))}
                  >
                    <MenuItem value="">Bitte waehlen</MenuItem>
                    {shops.map((shop) => (
                      <MenuItem key={shop.id} value={shop.id}>
                        {shop.unternehmensname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedShopId && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Typography sx={{ mr: 2 }}>Extra-Seite aktiv</Typography>
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="Extra-Slug"
                      helperText="Aufruf: /extra/dein-slug"
                      value={config.slug}
                      onChange={(e) => setConfig((prev) => ({ ...prev, slug: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Titel auf der Seite"
                      value={config.pageTitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, pageTitle: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Einleitung"
                      value={config.introText}
                      onChange={(e) => setConfig((prev) => ({ ...prev, introText: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Laengere Beschreibung"
                      value={config.longDescription}
                      onChange={(e) => setConfig((prev) => ({ ...prev, longDescription: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Bild fuer Extra-Seite
                    </Typography>

                    <Box
                      tabIndex={0}
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        for (let i = 0; i < items.length; i += 1) {
                          const item = items[i];
                          if (item.type.startsWith('image/')) {
                            const file = item.getAsFile();
                            if (file) {
                              setImageFromFile(file);
                              e.preventDefault();
                            }
                            return;
                          }
                        }
                      }}
                      sx={{
                        border: '1px dashed #bbb',
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                        outline: 'none',
                        '&:focus': {
                          borderColor: '#1976d2',
                          boxShadow: '0 0 0 2px rgba(25,118,210,0.15)',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Bild hier hochladen oder diesen Bereich anklicken und mit Strg+V einfuegen.
                      </Typography>

                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ textTransform: 'none' }}
                      >
                        Bild waehlen
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setImageFromFile(file);
                          }}
                        />
                      </Button>

                      {!!imageFile && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                          Neues Bild ausgewaehlt: {imageFile.name}
                        </Typography>
                      )}
                    </Box>

                    {!!imagePreviewURL && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                          Vorschau (ohne Zuschnitt)
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            maxHeight: 420,
                            borderRadius: 2,
                            border: '1px solid #ddd',
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component="img"
                            src={imagePreviewURL}
                            alt="Extra Seite Bild Vorschau"
                            sx={{
                              width: '100%',
                              maxHeight: 420,
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    <TextField
                      fullWidth
                      label="Anderes Bild (URL)"
                      helperText="Optional: Direkte Bild-URL. Wenn ein Upload/Paste-Bild gewaehlt ist, wird dieses verwendet."
                      value={config.imageURL}
                      onChange={(e) => setConfig((prev) => ({ ...prev, imageURL: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Externer Link (optional)"
                      value={config.externalLink}
                      onChange={(e) => setConfig((prev) => ({ ...prev, externalLink: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Text fuer externen Link"
                      value={config.externalLinkLabel}
                      onChange={(e) => setConfig((prev) => ({ ...prev, externalLinkLabel: e.target.value }))}
                      sx={{ mb: 2.5 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Gutschein-Typ</InputLabel>
                      <Select
                        value={config.voucherType}
                        label="Gutschein-Typ"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            voucherType: e.target.value as GutscheinTyp,
                          }))
                        }
                      >
                        <MenuItem value="wert">Wertgutschein</MenuItem>
                        <MenuItem value="dienstleistung">Dienstleistungsgutschein</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Gutschein Titel"
                      value={config.voucherTitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, voucherTitle: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Gutschein Beschreibung"
                      value={config.voucherDescription}
                      onChange={(e) => setConfig((prev) => ({ ...prev, voucherDescription: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Gutschein Betrag in EUR"
                      value={config.voucherAmount}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, voucherAmount: Number(e.target.value) || 0 }))
                      }
                      sx={{ mb: 2.5 }}
                    />

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Speichere...' : 'Speichern'}
                    </Button>
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
