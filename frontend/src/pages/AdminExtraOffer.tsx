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
import { useEffect, useMemo, useRef, useState } from 'react';
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
  imageURL2: string;
  imageURL3: string;
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
  imageURL2: '',
  imageURL3: '',
  externalLink: '',
  externalLinkLabel: 'Mehr erfahren',
  voucherType: 'wert',
  voucherTitle: 'Gutschein',
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
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null]);
  const [imagePreviewURLs, setImagePreviewURLs] = useState<string[]>(['', '', '']);
  const configSectionRef = useRef<HTMLDivElement | null>(null);

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) || null,
    [shops, selectedShopId]
  );

  const handleEditActivePage = (shopId: string) => {
    setSelectedShopId(shopId);

    window.requestAnimationFrame(() => {
      configSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const activePages = useMemo(
    () =>
      shops
        .map((shop) => ({
          id: shop.id,
          unternehmensname: shop.unternehmensname,
          slug: String(shop.extraOffer?.slug || '').trim(),
          enabled: !!shop.extraOffer?.enabled,
        }))
        .filter((item) => item.enabled && item.slug),
    [shops]
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
      setImageFiles([null, null, null]);
      setImagePreviewURLs(['', '', '']);
      return;
    }

    const nextConfig = {
      ...defaultConfig,
      ...selectedShop.extraOffer,
    };

    setConfig({
      ...nextConfig,
    });
    setImageFiles([null, null, null]);
    setImagePreviewURLs([
      String(nextConfig.imageURL || ''),
      String(nextConfig.imageURL2 || ''),
      String(nextConfig.imageURL3 || ''),
    ]);
    setError('');
    setSuccess('');
  }, [selectedShopId, selectedShop]);

  const setImageFromFile = (slotIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien verwenden.');
      return;
    }

    const localURL = URL.createObjectURL(file);
    setImageFiles((prev) => prev.map((item, index) => (index === slotIndex ? file : item)));
    setImagePreviewURLs((prev) => prev.map((item, index) => (index === slotIndex ? localURL : item)));
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

    const reservedSlugs = new Set([
      'admin', 'blog', 'kontakt', 'impressum', 'datenschutz', 'agb', 'profil',
      'gutschein', 'checkoutdemo', 'checkout', 'checkoutadmin', 'success',
      'widget-demo', 'widgetdemo', 'embed', 'demo', 'app-info', 'extra'
    ]);
    if (reservedSlugs.has(normalizedSlug)) {
      setError('Dieser Slug ist reserviert. Bitte einen anderen waehlen.');
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
      const selectedImageURLs = [config.imageURL.trim(), config.imageURL2.trim(), config.imageURL3.trim()];
      const finalImageURLs = [...selectedImageURLs];

      for (let index = 0; index < imageFiles.length; index += 1) {
        const file = imageFiles[index];
        if (!file) continue;

        const ext = file.name.split('.').pop() || 'png';
        const cleanSlug = normalizedSlug || 'extra';
        const storageRef = ref(
          storage,
          `seiten/${selectedShopId}/extra-offer-${cleanSlug}-${index + 1}.${ext}`
        );
        await uploadBytes(storageRef, file);
        finalImageURLs[index] = await getDownloadURL(storageRef);
      }

      const payload: ExtraOfferConfig = {
        ...config,
        slug: normalizedSlug,
        externalLink: config.externalLink.trim(),
        externalLinkLabel: config.externalLinkLabel.trim() || 'Mehr erfahren',
        pageTitle: config.pageTitle.trim(),
        introText: config.introText.trim(),
        longDescription: config.longDescription.trim(),
        imageURL: finalImageURLs[0] || '',
        imageURL2: finalImageURLs[1] || '',
        imageURL3: finalImageURLs[2] || '',
        voucherTitle: config.voucherTitle.trim(),
        voucherDescription: config.voucherDescription.trim(),
      };

      await updateDoc(doc(db, 'users', selectedShopId), {
        'Checkout.ExtraOffer': payload,
      });

      setImageFiles([null, null, null]);
      setImagePreviewURLs([payload.imageURL || '', payload.imageURL2 || '', payload.imageURL3 || '']);
      setShops((prev) =>
        prev.map((shop) =>
          shop.id === selectedShopId
            ? { ...shop, extraOffer: payload }
            : shop
        )
      );
      setConfig(payload);

      setSuccess(`Gespeichert. Seite verfuegbar unter /${payload.slug}`);
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

                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, backgroundColor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Aktive Seiten
                  </Typography>
                  {activePages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Noch keine aktive Seite vorhanden.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {activePages.map((page) => (
                        <Box
                          key={page.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="body2">
                            {page.unternehmensname}: /{page.slug}
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            component="a"
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ textTransform: 'none', px: 0.5 }}
                          >
                            Oeffnen
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditActivePage(page.id)}
                            sx={{ textTransform: 'none', px: 1 }}
                          >
                            Bearbeiten
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>

                {selectedShopId && (
                  <>
                    <Box ref={configSectionRef} sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Typography sx={{ mr: 2 }}>Extra-Seite aktiv</Typography>
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="Extra-Slug"
                      helperText="Aufruf: /dein-slug"
                      value={config.slug}
                      onChange={(e) => setConfig((prev) => ({ ...prev, slug: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    {config.slug.trim() && (
                      <Box sx={{ mb: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={`/${config.slug.trim().toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none' }}
                        >
                          Vorschau unter /{config.slug.trim().toLowerCase()} oeffnen
                        </Button>
                      </Box>
                    )}

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
                      Bilder fuer die Collage
                    </Typography>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      {[0, 1, 2].map((slotIndex) => (
                        <Box
                          key={slotIndex}
                          tabIndex={0}
                          onPaste={(e) => {
                            const items = e.clipboardData?.items;
                            if (!items) return;

                            for (let i = 0; i < items.length; i += 1) {
                              const item = items[i];
                              if (item.type.startsWith('image/')) {
                                const file = item.getAsFile();
                                if (file) {
                                  setImageFromFile(slotIndex, file);
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
                            backgroundColor: '#fcfcfc',
                            outline: 'none',
                            '&:focus': {
                              borderColor: '#1976d2',
                              boxShadow: '0 0 0 2px rgba(25,118,210,0.15)',
                            },
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Bild {slotIndex + 1}
                          </Typography>

                          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                            Bild hier einfuegen mit Strg+V oder per Button auswaehlen.
                          </Typography>

                          <Button variant="outlined" component="label" sx={{ textTransform: 'none', mb: 1.5 }}>
                            Bild waehlen
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setImageFromFile(slotIndex, file);
                              }}
                            />
                          </Button>

                          {!!imageFiles[slotIndex] && (
                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                              Neues Bild ausgewaehlt: {imageFiles[slotIndex]?.name}
                            </Typography>
                          )}

                          {!!imagePreviewURLs[slotIndex] && (
                            <Box
                              sx={{
                                width: '100%',
                                height: 160,
                                borderRadius: 2,
                                border: '1px solid #ddd',
                                backgroundColor: '#f5f5f5',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                component="img"
                                src={imagePreviewURLs[slotIndex]}
                                alt={`Extra Seite Bild ${slotIndex + 1} Vorschau`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            </Box>
                          )}

                          {!imagePreviewURLs[slotIndex] && (
                            <Typography variant="body2" color="text.secondary">
                              Kein Bild hinterlegt.
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>

                    <TextField
                      fullWidth
                      label="Bild 1 URL (optional)"
                      helperText="Optional: Direkte Bild-URL. Wenn ein Upload gewaehlt ist, wird dieser verwendet."
                      value={config.imageURL}
                      onChange={(e) => setConfig((prev) => ({ ...prev, imageURL: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Bild 2 URL (optional)"
                      value={config.imageURL2}
                      onChange={(e) => setConfig((prev) => ({ ...prev, imageURL2: e.target.value }))}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Bild 3 URL (optional)"
                      value={config.imageURL3}
                      onChange={(e) => setConfig((prev) => ({ ...prev, imageURL3: e.target.value }))}
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
