import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import useAuth from '../auth/useAuth';
import { db } from '../auth/firebase';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

type GutscheinTyp = 'wert' | 'dienstleistung';

type ExtraOfferConfig = {
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
};

type WidgetVoucherSource = 'checkout' | 'custom';

type WidgetVoucherOption = {
  id: string;
  type: 'gutschein' | 'contact';
  titel: string;
  betrag: number;
  abPreis: boolean;
  inhalt: string;
  beschreibung: string;
  contactUrl: string;
  buttonLabel: string;
};

type WidgetConfig = {
  enabled: boolean;
  source: WidgetVoucherSource;
  customValue: boolean;
  customVouchers: WidgetVoucherOption[];
};

type ShopRecord = {
  id: string;
  unternehmensname: string;
  stripeAccountId: string;
  website: string;
  bildURL: string;
  extraOffer: ExtraOfferConfig;
  widgetConfig: WidgetConfig;
  designURL: string;
};

const defaultExtraOffer: ExtraOfferConfig = {
  enabled: false,
  slug: '',
  pageTitle: 'Zusatzangebot',
  introText: 'Entdecken Sie unser Zusatzangebot.',
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

const createDefaultWidgetVoucher = (): WidgetVoucherOption => ({
  id: `voucher-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: 'gutschein',
  titel: '',
  betrag: 50,
  abPreis: false,
  inhalt: '',
  beschreibung: '',
  contactUrl: '',
  buttonLabel: '',
});

const defaultWidgetConfig: WidgetConfig = {
  enabled: true,
  source: 'checkout',
  customValue: false,
  customVouchers: [createDefaultWidgetVoucher()],
};

const normalizeWidgetConfig = (value: unknown): WidgetConfig => {
  const raw = (value || {}) as Partial<WidgetConfig>;
  const source: WidgetVoucherSource = raw.source === 'custom' ? 'custom' : 'checkout';
  const customValue = Boolean(raw.customValue);

  const rawVouchers = Array.isArray(raw.customVouchers) ? raw.customVouchers : [];
  const vouchers: WidgetVoucherOption[] = rawVouchers
    .map((entry, index) => {
      const voucher = entry as Partial<WidgetVoucherOption>;
      const voucherType: 'gutschein' | 'contact' = voucher.type === 'contact' ? 'contact' : 'gutschein';
      const betrag = Number(voucher.betrag);
      return {
        id: typeof voucher.id === 'string' && voucher.id.trim() ? voucher.id : `voucher-${index + 1}`,
        type: voucherType,
        titel: typeof voucher.titel === 'string' ? voucher.titel : '',
        betrag: Number.isFinite(betrag) ? betrag : 0,
        abPreis: Boolean(voucher.abPreis),
        inhalt: typeof voucher.inhalt === 'string' ? voucher.inhalt : '',
        beschreibung: typeof voucher.beschreibung === 'string' ? voucher.beschreibung : '',
        contactUrl: typeof voucher.contactUrl === 'string' ? voucher.contactUrl : '',
        buttonLabel: typeof voucher.buttonLabel === 'string' ? voucher.buttonLabel : '',
      };
    })
    .filter((voucher) => voucher.titel.trim().length > 0 && (voucher.type === 'contact' || voucher.betrag > 0));

  return {
    enabled: raw.enabled === undefined ? true : Boolean(raw.enabled),
    source,
    customValue,
    customVouchers: vouchers.length > 0 ? vouchers : [createDefaultWidgetVoucher()],
  };
};

export default function AdminShopManage() {
  const user = useAuth();
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shop, setShop] = useState<ShopRecord | null>(null);
  const [form, setForm] = useState({
    unternehmensname: '',
    website: '',
    bildURL: '',
    extraOffer: defaultExtraOffer,
    widgetConfig: defaultWidgetConfig,
  });

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
    const loadShop = async () => {
      if (!shopId) {
        setError('Ungültige Shop-ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const snap = await getDoc(doc(db, 'users', shopId));
        if (!snap.exists()) {
          setError('Shop nicht gefunden.');
          setShop(null);
          return;
        }

        const data = snap.data() as any;
        const nextShop: ShopRecord = {
          id: snap.id,
          unternehmensname: data?.Checkout?.Unternehmensname || data?.Unternehmensdaten?.Unternehmensname || data?.email || snap.id,
          stripeAccountId: data?.Checkout?.StripeAccountId || '',
          website: data?.Checkout?.Website || '',
          bildURL: data?.Checkout?.BildURL || '',
          designURL: data?.Checkout?.GutscheinDesignURL || '',
          extraOffer: {
            ...defaultExtraOffer,
            ...(data?.Checkout?.ExtraOffer || {}),
          },
          widgetConfig: normalizeWidgetConfig(data?.Checkout?.WidgetConfig),
        };

        setShop(nextShop);
        setForm({
          unternehmensname: nextShop.unternehmensname || '',
          website: nextShop.website || '',
          bildURL: nextShop.bildURL || '',
          extraOffer: nextShop.extraOffer,
          widgetConfig: nextShop.widgetConfig,
        });
      } catch (err) {
        console.error('Fehler beim Laden des Shops:', err);
        setError('Shop konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) loadShop();
  }, [isAdmin, shopId]);

  const updateField = (field: 'unternehmensname' | 'website' | 'bildURL', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateExtraOffer = (field: keyof ExtraOfferConfig, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      extraOffer: {
        ...prev.extraOffer,
        [field]: value,
      },
    }));
  };

  const updateWidgetField = <K extends keyof WidgetConfig>(field: K, value: WidgetConfig[K]) => {
    setForm((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        [field]: value,
      },
    }));
  };

  const updateWidgetVoucher = (
    voucherId: string,
    field: keyof WidgetVoucherOption,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        customVouchers: prev.widgetConfig.customVouchers.map((voucher) => {
          if (voucher.id !== voucherId) return voucher;
          if (field === 'betrag') {
            const amount = Number(value);
            return { ...voucher, betrag: Number.isFinite(amount) ? amount : 0 };
          }
          if (field === 'abPreis') {
            return { ...voucher, abPreis: Boolean(value) };
          }
          return { ...voucher, [field]: String(value) };
        }),
      },
    }));
  };

  const addWidgetVoucher = () => {
    setForm((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        customVouchers: [...prev.widgetConfig.customVouchers, createDefaultWidgetVoucher()],
      },
    }));
  };

  const removeWidgetVoucher = (voucherId: string) => {
    setForm((prev) => {
      const nextVouchers = prev.widgetConfig.customVouchers.filter((voucher) => voucher.id !== voucherId);
      return {
        ...prev,
        widgetConfig: {
          ...prev.widgetConfig,
          customVouchers: nextVouchers.length > 0 ? nextVouchers : [createDefaultWidgetVoucher()],
        },
      };
    });
  };

  const handleSave = async () => {
    if (!shopId) return;

    const normalizedSlug = String(form.extraOffer.slug || '').trim().toLowerCase();
    if (form.extraOffer.enabled && !normalizedSlug) {
      setError('Bitte einen Slug vergeben, wenn das Zusatzangebot aktiv ist.');
      return;
    }

    const sanitizedWidgetVouchers = form.widgetConfig.customVouchers
      .map((voucher) => ({
        id: voucher.id,
        type: voucher.type,
        titel: voucher.titel.trim(),
        betrag: Number(voucher.betrag),
        abPreis: Boolean(voucher.abPreis),
        inhalt: voucher.inhalt.trim(),
        beschreibung: voucher.beschreibung.trim(),
        contactUrl: voucher.contactUrl.trim(),
        buttonLabel: voucher.buttonLabel.trim(),
      }))
      .filter((voucher) =>
        voucher.titel.length > 0 &&
        (voucher.type === 'contact' ? voucher.contactUrl.length > 0 : Number.isFinite(voucher.betrag) && voucher.betrag > 0)
      );

    if (form.widgetConfig.enabled && form.widgetConfig.source === 'custom' && sanitizedWidgetVouchers.length === 0) {
      setError('Bitte mindestens einen gültigen Eintrag (Gutschein mit Betrag oder Kontakt mit Link) hinterlegen.');
      return;
    }

    const normalizedWidgetConfig: WidgetConfig = {
      enabled: form.widgetConfig.enabled,
      source: form.widgetConfig.source,
      customValue: form.widgetConfig.customValue,
      customVouchers: sanitizedWidgetVouchers,
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', shopId), {
        'Checkout.Unternehmensname': form.unternehmensname.trim(),
        'Unternehmensdaten.Unternehmensname': form.unternehmensname.trim(),
        'Checkout.Website': form.website.trim(),
        'Checkout.BildURL': form.bildURL.trim(),
        'Checkout.ExtraOffer': {
          ...form.extraOffer,
          slug: normalizedSlug,
          pageTitle: form.extraOffer.pageTitle.trim(),
          introText: form.extraOffer.introText.trim(),
          longDescription: form.extraOffer.longDescription.trim(),
          externalLink: form.extraOffer.externalLink.trim(),
          externalLinkLabel: form.extraOffer.externalLinkLabel.trim() || 'Mehr erfahren',
          voucherTitle: form.extraOffer.voucherTitle.trim(),
          voucherDescription: form.extraOffer.voucherDescription.trim(),
        },
        'Checkout.WidgetConfig': normalizedWidgetConfig,
      });

      setSuccess('Shop-Einstellungen erfolgreich gespeichert.');
      setShop((prev) =>
        prev
          ? {
              ...prev,
              unternehmensname: form.unternehmensname.trim(),
              website: form.website.trim(),
              bildURL: form.bildURL.trim(),
              extraOffer: {
                ...form.extraOffer,
                slug: normalizedSlug,
              },
              widgetConfig: normalizedWidgetConfig,
            }
          : prev
      );
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError('Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const deleteStripeAccount = async () => {
    if (!shop?.stripeAccountId) return;
    if (!window.confirm('Stripe-Konto wirklich löschen?')) return;

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/stripeconnect/delete-stripe-account`, {
        stripeAccountId: shop.stripeAccountId,
      });
      setShop((prev) => (prev ? { ...prev, stripeAccountId: '' } : prev));
      setSuccess('Stripe-Konto gelöscht!');
      setError('');
    } catch (err: any) {
      setError('Fehler beim Löschen des Stripe-Kontos: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (isAdmin === null || loading) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f8fafc', py: 4 }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: '1.5rem', right: '4rem', zIndex: 3 }}>
        <TopBar />
      </Box>

      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: 3, pt: 8 }}>
        {/* Header Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/admin')} sx={{ mb: 1 }}>
              ← Zurück zur Übersicht
            </Button>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              {shop?.unternehmensname}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ID: {shop?.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={shop?.stripeAccountId ? "Stripe verbunden" : "Kein Stripe"}
              color={shop?.stripeAccountId ? "success" : "default"}
              sx={{ fontWeight: 600 }}
            />
            {form.extraOffer.enabled && <Chip label="Extra-Seite aktiv" color="primary" sx={{ fontWeight: 600 }} />}
            {form.widgetConfig.enabled && <Chip label="Widget aktiv" color="info" sx={{ fontWeight: 600 }} />}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        {/* Quick-Tools Card */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 4, background: 'white' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Direkt-Aktionen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/admin/shop/${shopId}/design`)}
              sx={{ fontWeight: 600 }}
            >
              Gutschein-Design anpassen
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/gutscheine', { state: { preselectedShopId: shopId } })}
              sx={{ fontWeight: 600 }}
            >
              Gutscheine & Varianten verwalten
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={() => navigate('/admin/gutschein-erstellen', { state: { preselectedShopId: shopId } })}
              sx={{ fontWeight: 600 }}
            >
              Gutschein manuell erstellen
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/extra', { state: { preselectedShopId: shopId } })}
              sx={{ fontWeight: 600 }}
            >
              Extra-Slug Seite detail-editieren
            </Button>
            {shop?.stripeAccountId && (
              <Button
                variant="outlined"
                color="error"
                onClick={deleteStripeAccount}
                sx={{ ml: 'auto', fontWeight: 600 }}
              >
                Stripe-Konto trennen
              </Button>
            )}
          </Box>
        </Paper>

        {/* Main Settings Forms Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 3 }}>
          {/* Stammdaten */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', background: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              Stammdaten
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Basis-Informationen des Shops im Gutscheinsystem.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Unternehmensname"
                value={form.unternehmensname}
                onChange={(e) => updateField('unternehmensname', e.target.value)}
              />
              <TextField
                fullWidth
                label="Website-URL"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
              />
              <TextField
                fullWidth
                label="Logo / Bild-URL"
                value={form.bildURL}
                onChange={(e) => updateField('bildURL', e.target.value)}
                multiline
                maxRows={2}
              />
            </Box>
          </Paper>

          {/* Zusatzangebot */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', background: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="h6" fontWeight={700}>
                Extra-Aktion (Zusatzangebot)
              </Typography>
              <Switch
                checked={form.extraOffer.enabled}
                onChange={(e) => updateExtraOffer('enabled', e.target.checked)}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Zusätzliche Landingpage und exklusive Gutschein-Kaufoption aktivieren.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                fullWidth
                label="Extra-Slug"
                value={form.extraOffer.slug}
                onChange={(e) => updateExtraOffer('slug', e.target.value)}
                helperText={form.extraOffer.slug ? `Erreichbar unter: /${form.extraOffer.slug.toLowerCase()}` : "Nur Kleinbuchstaben & Bindestriche"}
              />
              <TextField
                fullWidth
                label="Seitentitel der Landingpage"
                value={form.extraOffer.pageTitle}
                onChange={(e) => updateExtraOffer('pageTitle', e.target.value)}
              />
              <TextField
                fullWidth
                label="Button/Link-Beschriftung"
                value={form.extraOffer.externalLinkLabel}
                onChange={(e) => updateExtraOffer('externalLinkLabel', e.target.value)}
              />
              <TextField
                fullWidth
                label="Externer Link (optional)"
                value={form.extraOffer.externalLink}
                onChange={(e) => updateExtraOffer('externalLink', e.target.value)}
              />
              <TextField
                fullWidth
                label="Exklusiver Gutschein-Wert (€)"
                type="number"
                value={form.extraOffer.voucherAmount}
                onChange={(e) => updateExtraOffer('voucherAmount', Number(e.target.value))}
              />
              <TextField
                fullWidth
                label="Gutschein-Titel"
                value={form.extraOffer.voucherTitle}
                onChange={(e) => updateExtraOffer('voucherTitle', e.target.value)}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Zusatz-Introtext"
                value={form.extraOffer.introText}
                onChange={(e) => updateExtraOffer('introText', e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Gutschein-Beschreibung"
                value={form.extraOffer.voucherDescription}
                onChange={(e) => updateExtraOffer('voucherDescription', e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }}
              />
            </Box>
          </Paper>
        </Box>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', background: 'white', mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Widget-Einstellungen
            </Typography>
            <Switch
              checked={form.widgetConfig.enabled}
              onChange={(e) => updateWidgetField('enabled', e.target.checked)}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Definiert, ob das Website-Widget aktiv ist und welche Gutscheine dort angezeigt werden.
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel id="widget-source-label">Gutscheinquelle im Widget</InputLabel>
              <Select
                labelId="widget-source-label"
                value={form.widgetConfig.source}
                label="Gutscheinquelle im Widget"
                disabled={!form.widgetConfig.enabled}
                onChange={(e) => updateWidgetField('source', e.target.value as WidgetVoucherSource)}
              >
                <MenuItem value="checkout">Aktuelle Gutscheine des Kunden verwenden</MenuItem>
                <MenuItem value="custom">Neue Gutscheine verwenden</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="widget-custom-value-label">Freier Betrag</InputLabel>
              <Select
                labelId="widget-custom-value-label"
                value={form.widgetConfig.customValue ? 'enabled' : 'disabled'}
                label="Freier Betrag"
                disabled={!form.widgetConfig.enabled}
                onChange={(e) => updateWidgetField('customValue', e.target.value === 'enabled')}
              >
                <MenuItem value="enabled">Im Widget anzeigen</MenuItem>
                <MenuItem value="disabled">Nicht anzeigen</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {form.widgetConfig.source === 'custom' && form.widgetConfig.enabled && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={650} sx={{ mb: 1.5 }}>
                Neue Widget-Gutscheine
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Diese Einträge werden nur im Widget angezeigt und überschreiben dort die normalen Gutscheinarten.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {form.widgetConfig.customVouchers.map((voucher) => (
                  <Box
                    key={voucher.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'start' }}>
                      <TextField
                        fullWidth
                        label="Titel"
                        value={voucher.titel}
                        onChange={(e) => updateWidgetVoucher(voucher.id, 'titel', e.target.value)}
                      />
                      <FormControl fullWidth>
                        <InputLabel id={`voucher-type-${voucher.id}`}>Typ</InputLabel>
                        <Select
                          labelId={`voucher-type-${voucher.id}`}
                          value={voucher.type}
                          label="Typ"
                          onChange={(e) => updateWidgetVoucher(voucher.id, 'type', e.target.value)}
                        >
                          <MenuItem value="gutschein">Gutschein kaufen</MenuItem>
                          <MenuItem value="contact">Kontakt / Link</MenuItem>
                        </Select>
                      </FormControl>
                      {voucher.type === 'gutschein' ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label={voucher.abPreis ? 'Startpreis ab (€)' : 'Betrag (€)'}
                            value={voucher.betrag}
                            onChange={(e) => updateWidgetVoucher(voucher.id, 'betrag', Number(e.target.value))}
                          />
                          <Box
                            component="label"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', userSelect: 'none', pl: 0.5 }}
                          >
                            <Switch
                              size="small"
                              checked={voucher.abPreis}
                              onChange={(e) => updateWidgetVoucher(voucher.id, 'abPreis', e.target.checked)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Startpreis anzeigen ("ab X€")
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <TextField
                            fullWidth
                            label="Button-Text (optional)"
                            placeholder="Jetzt anfragen"
                            value={voucher.buttonLabel}
                            onChange={(e) => updateWidgetVoucher(voucher.id, 'buttonLabel', e.target.value)}
                          />
                          <Box
                            component="label"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', userSelect: 'none', pl: 0.5 }}
                          >
                            <Switch
                              size="small"
                              checked={voucher.abPreis}
                              onChange={(e) => updateWidgetVoucher(voucher.id, 'abPreis', e.target.checked)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Startpreis anzeigen ("ab X€")
                            </Typography>
                          </Box>
                          {voucher.abPreis && (
                            <TextField
                              fullWidth
                              type="number"
                              label="Startpreis ab (€)"
                              value={voucher.betrag}
                              onChange={(e) => updateWidgetVoucher(voucher.id, 'betrag', Number(e.target.value))}
                            />
                          )}
                        </Box>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeWidgetVoucher(voucher.id)}
                        sx={{ minHeight: 56 }}
                      >
                        Entfernen
                      </Button>
                    </Box>
                    {voucher.type === 'contact' && (
                      <TextField
                        fullWidth
                        label="Link-URL"
                        placeholder="https://..."
                        value={voucher.contactUrl}
                        onChange={(e) => updateWidgetVoucher(voucher.id, 'contactUrl', e.target.value)}
                        sx={{ mt: 1.5 }}
                      />
                    )}
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Inhalt (sofort sichtbar, optional)"
                      value={voucher.inhalt}
                      onChange={(e) => updateWidgetVoucher(voucher.id, 'inhalt', e.target.value)}
                      sx={{ mt: 1.5 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Beschreibung (beim Ausklappen, optional)"
                      value={voucher.beschreibung}
                      onChange={(e) => updateWidgetVoucher(voucher.id, 'beschreibung', e.target.value)}
                      sx={{ mt: 1.5 }}
                    />
                  </Box>
                ))}
              </Box>

              <Button variant="outlined" onClick={addWidgetVoucher} sx={{ mt: 2 }}>
                Gutschein hinzufügen
              </Button>
            </Box>
          )}
        </Paper>

        {/* Global Save Trigger bar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 6, py: 1.5, borderRadius: 2, fontWeight: 700, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
          >
            {saving ? 'Speichert...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
