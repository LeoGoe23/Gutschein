import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Divider, TextField, MenuItem } from '@mui/material';
import { CheckoutData, WidgetVoucherOption, loadCheckoutDataBySlug } from '../utils/loadCheckoutData';
import { loadDemoDataBySlug } from '../utils/loadDemoData';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseCssColor = (value: string): RgbColor | null => {
  const input = (value || '').trim();
  if (!input || input === 'transparent' || input === 'rgba(0, 0, 0, 0)') return null;

  const rgbMatch = input.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => Number(part.trim()));
    if (parts.length >= 3 && parts.every((part) => Number.isFinite(part))) {
      return {
        r: clamp(Math.round(parts[0]), 0, 255),
        g: clamp(Math.round(parts[1]), 0, 255),
        b: clamp(Math.round(parts[2]), 0, 255),
      };
    }
  }

  const hexMatch = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1].length === 3
      ? hexMatch[1].split('').map((ch) => `${ch}${ch}`).join('')
      : hexMatch[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
};

const rgbToCss = (rgb: RgbColor): string => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

const rgbToRgba = (rgb: RgbColor, alpha: number): string => {
  const a = clamp(alpha, 0, 1);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};

const mix = (a: RgbColor, b: RgbColor, amount: number): RgbColor => {
  const t = clamp(amount, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
};

const relativeLuminance = (rgb: RgbColor): number => {
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a: RgbColor, b: RgbColor): number => {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const isLikelyDefaultLinkBlue = (rgb: RgbColor): boolean => {
  const classicBlue = Math.abs(rgb.r - 0) <= 20 && Math.abs(rgb.g - 0) <= 30 && Math.abs(rgb.b - 238) <= 30;
  const safariBlue = Math.abs(rgb.r - 0) <= 25 && Math.abs(rgb.g - 102) <= 35 && Math.abs(rgb.b - 204) <= 35;
  return classicBlue || safariBlue;
};

interface GutscheinOption {
  titel: string;
  betrag: number;
  kategorie?: string;
  abPreis?: boolean;
  inhalt?: string;
  beschreibung?: string;
  type?: 'gutschein' | 'contact';
  contactUrl?: string;
  buttonLabel?: string;
}

const normalizeCategory = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const inferCategoryFromText = (titel: string, beschreibung?: string): string | undefined => {
  const text = `${titel} ${beschreibung || ''}`.toLowerCase();

  if (/\b(kurs|workshop|paar|praevention|prävention)\b/.test(text)) {
    return 'Kurse';
  }
  if (/\b(verwoehn|verwöhn|paket)\b/.test(text)) {
    return 'Verwoehn-Massagen';
  }
  if (/\b(aroma|aetherisch|ätherisch|duft|oel|öl)\b/.test(text)) {
    return 'Aroma-Massagen';
  }
  if (/\b(massage|nacken|ruecken|rücken|ganzkoerper|ganzkörper|fuss|fuß|akupressur)\b/.test(text)) {
    return 'Ganzheitliche Massagen';
  }

  return undefined;
};

const PROSPECT_DEMO_OPTIONS: GutscheinOption[] = [
  {
    titel: 'Klassische Massage 60 Min',
    betrag: 79,
    beschreibung: 'Beliebtes Beispielangebot fuer Neukunden-Demos.',
    type: 'gutschein',
  },
  {
    titel: 'Aroma Oel Massage 90 Min',
    betrag: 109,
    beschreibung: 'Ideal fuer Geschenk-Kampagnen in der Demo.',
    type: 'gutschein',
  },
  {
    titel: 'Freier Betrag',
    betrag: 0,
    beschreibung: 'Sie bestimmen den Wert',
    type: 'gutschein',
  }
];

const buildOptionsFromDemo = (
  demoDienstleistungen: Array<{ shortDesc: string; longDesc: string; price: string; kategorie?: string }>,
  includeCustomValue: boolean
): GutscheinOption[] => {
  const loadedOptions: GutscheinOption[] = [];

  if (includeCustomValue) {
    loadedOptions.push({
      titel: 'Freier Betrag',
      betrag: 0,
      beschreibung: 'Sie bestimmen den Wert',
      type: 'gutschein',
    });
  }

  demoDienstleistungen.forEach((dienstleistung) => {
    const amount = toAmount(dienstleistung.price);
    if (amount <= 0) return;

    const beschreibung = dienstleistung.longDesc || undefined;
    const kategorie = normalizeCategory((dienstleistung as any).kategorie)
      || inferCategoryFromText(dienstleistung.shortDesc, beschreibung);

    loadedOptions.push({
      titel: dienstleistung.shortDesc,
      betrag: amount,
      beschreibung,
      kategorie,
      type: 'gutschein',
    });
  });

  return loadedOptions;
};

const toAmount = (value: string | number | undefined): number => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const buildOptionsFromCheckout = (data: CheckoutData, includeCustomValue: boolean): GutscheinOption[] => {
  const loadedOptions: GutscheinOption[] = [];

  if (includeCustomValue) {
    loadedOptions.push({
      titel: 'Freier Betrag',
      betrag: 0,
      beschreibung: 'Sie bestimmen den Wert',
    });
  }

  if (data.dienstleistungen && data.dienstleistungen.length > 0) {
    data.dienstleistungen.forEach((dienstleistung) => {
      if (dienstleistung.varianten && dienstleistung.varianten.length > 0) {
        dienstleistung.varianten.forEach((variant) => {
          const amount = toAmount(variant.preis);
          if (amount <= 0) return;
          const beschreibung = variant.beschreibung || dienstleistung.longDesc;
          const kategorie = normalizeCategory((dienstleistung as any).kategorie)
            || inferCategoryFromText(`${dienstleistung.shortDesc} - ${variant.name}`, beschreibung);
          loadedOptions.push({
            titel: `${dienstleistung.shortDesc} - ${variant.name}`,
            betrag: amount,
            beschreibung,
            kategorie,
          });
        });
      } else {
        const amount = toAmount(dienstleistung.price);
        if (amount <= 0) return;
        const beschreibung = dienstleistung.longDesc !== dienstleistung.shortDesc ? dienstleistung.longDesc : undefined;
        const kategorie = normalizeCategory((dienstleistung as any).kategorie)
          || inferCategoryFromText(dienstleistung.shortDesc, beschreibung);
        loadedOptions.push({
          titel: dienstleistung.shortDesc,
          betrag: amount,
          beschreibung,
          kategorie,
        });
      }
    });
  }

  return loadedOptions;
};

const buildOptionsFromCustom = (
  customVouchers: WidgetVoucherOption[],
  includeCustomValue: boolean
): GutscheinOption[] => {
  const loadedOptions: GutscheinOption[] = [];

  if (includeCustomValue) {
    loadedOptions.push({
      titel: 'Freier Betrag',
      betrag: 0,
      beschreibung: 'Sie bestimmen den Wert',
    });
  }

  customVouchers.forEach((voucher) => {
    if (!voucher.titel?.trim()) return;
    if (voucher.type === 'contact') {
      const url = typeof voucher.contactUrl === 'string' ? voucher.contactUrl.trim() : '';
      if (!url) return;
      const amount = toAmount(voucher.betrag);
      const beschreibung = (voucher as any).beschreibung?.trim() || undefined;
      const kategorie = normalizeCategory((voucher as any).kategorie || (voucher as any).category)
        || inferCategoryFromText(voucher.titel.trim(), beschreibung);
      loadedOptions.push({
        titel: voucher.titel.trim(),
        betrag: amount,
        abPreis: Boolean((voucher as any).abPreis),
        inhalt: (voucher as any).inhalt?.trim() || undefined,
        beschreibung,
        kategorie,
        type: 'contact',
        contactUrl: url,
        buttonLabel: (voucher as any).buttonLabel?.trim() || undefined,
      });
    } else {
      const amount = toAmount(voucher.betrag);
      if (amount <= 0) return;
      const beschreibung = (voucher as any).beschreibung?.trim() || undefined;
      const kategorie = normalizeCategory((voucher as any).kategorie || (voucher as any).category)
        || inferCategoryFromText(voucher.titel.trim(), beschreibung);
      loadedOptions.push({
        titel: voucher.titel.trim(),
        betrag: amount,
        abPreis: Boolean((voucher as any).abPreis),
        inhalt: (voucher as any).inhalt?.trim() || undefined,
        beschreibung,
        kategorie,
        type: 'gutschein',
      });
    }
  });

  return loadedOptions;
};

const EmbedWidget: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<GutscheinOption[]>([]);
  const [widgetDisplayMode, setWidgetDisplayMode] = useState<'categorized' | 'flat'>('categorized');
  const [error, setError] = useState('');
  const [customAmounts, setCustomAmounts] = useState<{[key: number]: string}>({});
  const [selectedOptionByCategory, setSelectedOptionByCategory] = useState<{ [kategorie: string]: number }>({});
  const [hasUserSelectionByCategory, setHasUserSelectionByCategory] = useState<{ [kategorie: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [autoFontFamily, setAutoFontFamily] = useState('');
  const [autoPrimaryColor, setAutoPrimaryColor] = useState('');
  const [autoTextColor, setAutoTextColor] = useState('');
  const [autoMutedColor, setAutoMutedColor] = useState('');
  const [autoSurfaceColor, setAutoSurfaceColor] = useState('');
  const [autoBorderColor, setAutoBorderColor] = useState('');

  // URL parameters für Customization
  const params = new URLSearchParams(window.location.search);
  const paramPrimaryColor = params.get('primaryColor') || '';
  const isProspectDemo = params.get('demoMode') === '1';
  const paramFontFamily = params.get('fontFamily') || '';
  const defaultFontFamily = (slug?.toUpperCase() === 'JANKIP' 
    ? "'Cormorant Garamond', Georgia, serif" 
    : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
  const paramBackgroundColor = params.get('backgroundColor') || '';
  const primaryColor = paramPrimaryColor || autoPrimaryColor || '#1976d2';
  const fontFamily = paramFontFamily || autoFontFamily || defaultFontFamily;
  const backgroundColor = paramBackgroundColor || 'transparent';
  const textStrongColor = autoTextColor || '#1f2937';
  const textMutedColor = autoMutedColor || '#64748b';
  const surfaceColor = autoSurfaceColor || 'rgba(255, 255, 255, 0.74)';
  const borderColor = autoBorderColor || '#dbe4ee';
  const buttonTextColor = (() => {
    const primaryRgb = parseCssColor(primaryColor);
    if (!primaryRgb) return '#ffffff';
    const white = { r: 255, g: 255, b: 255 };
    const dark = { r: 17, g: 24, b: 39 };
    return contrastRatio(primaryRgb, white) >= 4.5 ? '#ffffff' : rgbToCss(dark);
  })();
  const parentOrigin = (() => {
    try {
      return document.referrer ? new URL(document.referrer).origin : '*';
    } catch {
      return '*';
    }
  })();

  useEffect(() => {
    try {
      const frameEl = window.frameElement as HTMLIFrameElement | null;
      if (!frameEl) return;

      const hostElement = frameEl.parentElement || frameEl;
      const parentDoc = frameEl.ownerDocument;
      if (!parentDoc) return;

      const hostStyles = window.parent.getComputedStyle(hostElement);
      const bodyStyles = window.parent.getComputedStyle(parentDoc.body);

      const hostFont = hostStyles.fontFamily?.trim();
      const bodyFont = bodyStyles.fontFamily?.trim();
      const resolvedFont = hostFont || bodyFont || '';

      const hostBg = parseCssColor(hostStyles.backgroundColor || '');
      const bodyBg = parseCssColor(bodyStyles.backgroundColor || '');
      const baseBg = hostBg || bodyBg || { r: 248, g: 250, b: 252 };

      const hostText = parseCssColor(hostStyles.color || '');
      const bodyText = parseCssColor(bodyStyles.color || '');
      const baseText = hostText || bodyText || { r: 31, g: 41, b: 55 };

      const backgroundIsDark = relativeLuminance(baseBg) < 0.42;
      const cardSurface = backgroundIsDark
        ? mix(baseBg, { r: 255, g: 255, b: 255 }, 0.16)
        : mix(baseBg, { r: 255, g: 255, b: 255 }, 0.72);
      const dividerBorder = backgroundIsDark
        ? mix(baseBg, { r: 255, g: 255, b: 255 }, 0.34)
        : mix(baseBg, { r: 15, g: 23, b: 42 }, 0.16);
      const mutedText = mix(baseText, baseBg, backgroundIsDark ? 0.36 : 0.48);

      const pickPrimaryFromSelectors = (selectors: string[]): RgbColor | null => {
        for (const selector of selectors) {
          const nodes = Array.from(hostElement.querySelectorAll<HTMLElement>(selector));
          for (const node of nodes) {
            const styles = window.parent.getComputedStyle(node);
            const bg = parseCssColor(styles.backgroundColor || '');
            if (bg && !isLikelyDefaultLinkBlue(bg)) return bg;

            const border = parseCssColor(styles.borderColor || '');
            if (border && !isLikelyDefaultLinkBlue(border)) return border;

            const fg = parseCssColor(styles.color || '');
            if (fg && !isLikelyDefaultLinkBlue(fg)) return fg;
          }
        }
        return null;
      };

      const pickedPrimary = pickPrimaryFromSelectors([
        'button',
        '[class*="btn"]',
        '[role="button"]',
        'h1, h2, h3',
        '.nav a',
        'a'
      ]);

      const primaryRgb = pickedPrimary || mix(baseText, baseBg, 0.18);
      const contrastOnSurface = contrastRatio(primaryRgb, cardSurface);
      const tunedPrimary = contrastOnSurface < 3
        ? (backgroundIsDark
          ? mix(primaryRgb, { r: 255, g: 255, b: 255 }, 0.28)
          : mix(primaryRgb, { r: 15, g: 23, b: 42 }, 0.22))
        : primaryRgb;

      const softenedSurface = backgroundIsDark
        ? mix(baseBg, { r: 255, g: 255, b: 255 }, 0.12)
        : mix(baseBg, { r: 255, g: 255, b: 255 }, 0.28);
      const softenedBorder = backgroundIsDark
        ? mix(baseBg, { r: 255, g: 255, b: 255 }, 0.24)
        : mix(baseBg, { r: 17, g: 24, b: 39 }, 0.12);

      if (resolvedFont) setAutoFontFamily(resolvedFont);
      setAutoPrimaryColor(rgbToCss(tunedPrimary));
      setAutoTextColor(rgbToCss(baseText));
      setAutoMutedColor(rgbToCss(mutedText));
      setAutoSurfaceColor(rgbToRgba(softenedSurface, backgroundIsDark ? 0.42 : 0.74));
      setAutoBorderColor(rgbToCss(softenedBorder));
    } catch {
      // Cross-origin embedding may block parent style access.
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!slug) {
        setError('Kein Slug angegeben.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        const data = await loadCheckoutDataBySlug(slug);
        
        if (data) {
          if (!data.widgetConfig.enabled) {
            setOptions([]);
            setError('Das Widget ist für diesen Shop aktuell deaktiviert.');
            return;
          }

          const useCustomVouchers = data.widgetConfig.source === 'custom';
          const includeCustomValue = useCustomVouchers ? data.widgetConfig.customValue : data.customValue;

          const loadedOptions = useCustomVouchers
            ? buildOptionsFromCustom(data.widgetConfig.customVouchers, includeCustomValue)
            : buildOptionsFromCheckout(data, includeCustomValue);

          setWidgetDisplayMode(data.widgetConfig.displayMode === 'flat' ? 'flat' : 'categorized');

          if (loadedOptions.length === 0) {
            setError('Keine Widget-Gutscheine verfügbar.');
            setOptions([]);
            return;
          }

          setOptions(loadedOptions);
        } else {
          if (isProspectDemo) {
            const demoData = await loadDemoDataBySlug(slug.toLowerCase());
            if (demoData) {
              const demoOptions = buildOptionsFromDemo(demoData.dienstleistungen || [], demoData.customValue);
              setOptions(demoOptions.length > 0 ? demoOptions : PROSPECT_DEMO_OPTIONS);
              setWidgetDisplayMode('categorized');
            } else {
              setOptions(PROSPECT_DEMO_OPTIONS);
              setWidgetDisplayMode('categorized');
            }
          } else {
            setError('Gutschein-Daten nicht gefunden');
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        if (isProspectDemo) {
          const demoData = slug ? await loadDemoDataBySlug(slug.toLowerCase()) : null;
          if (demoData) {
            const demoOptions = buildOptionsFromDemo(demoData.dienstleistungen || [], demoData.customValue);
            setOptions(demoOptions.length > 0 ? demoOptions : PROSPECT_DEMO_OPTIONS);
            setWidgetDisplayMode('categorized');
          } else {
            setOptions(PROSPECT_DEMO_OPTIONS);
            setWidgetDisplayMode('categorized');
          }
          setError('');
        } else {
          setError('Fehler beim Laden der Daten');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, isProspectDemo]);

  const categoryCards = useMemo(() => {
    if (widgetDisplayMode === 'flat') {
      return options.map((option, originalIndex) => ({
        kategorie: `item-${originalIndex}`,
        items: [{ option, originalIndex }],
      }));
    }

    const grouped = new Map<string, Array<{ option: GutscheinOption; originalIndex: number }>>();

    options.forEach((option, originalIndex) => {
      const kategorie = option.kategorie?.trim() || 'Weitere Angebote';
      if (!grouped.has(kategorie)) {
        grouped.set(kategorie, []);
      }
      grouped.get(kategorie)!.push({ option, originalIndex });
    });

    return Array.from(grouped.entries())
      .map(([kategorie, items]) => ({ kategorie, items }))
      .sort((a, b) => a.items[0].originalIndex - b.items[0].originalIndex);
  }, [options, widgetDisplayMode]);

  useEffect(() => {
    setSelectedOptionByCategory((prev) => {
      const next = { ...prev };
      const validCategories = new Set<string>();
      let changed = false;

      categoryCards.forEach((card) => {
        validCategories.add(card.kategorie);
        const selectedIndex = next[card.kategorie];
        const existsInCard = card.items.some((item) => item.originalIndex === selectedIndex);
        if (!existsInCard) {
          next[card.kategorie] = card.items[0].originalIndex;
          changed = true;
        }
      });

      Object.keys(next).forEach((kategorie) => {
        if (!validCategories.has(kategorie)) {
          delete next[kategorie];
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    setHasUserSelectionByCategory((prev) => {
      const next: { [kategorie: string]: boolean } = {};
      let changed = false;

      categoryCards.forEach((card) => {
        const current = Boolean(prev[card.kategorie]);
        next[card.kategorie] = current;
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      } else {
        for (const key of Object.keys(next)) {
          if (prev[key] !== next[key]) {
            changed = true;
            break;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [categoryCards]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollLeft(container.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - container.scrollLeft > 8);
    };

    updateScrollState();
    const rafId = window.requestAnimationFrame(updateScrollState);

    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categoryCards, loading]);

  useEffect(() => {
    const updateHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'gutschein-widget-resize', height }, parentOrigin);
    };

    // Setze body background auf transparent
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [loading, categoryCards, selectedOptionByCategory, backgroundColor, parentOrigin, canScrollLeft, canScrollRight]);

  const scrollCards = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-widget-card="true"]')
    );
    if (cards.length === 0) return;

    const currentLeft = container.scrollLeft;
    let targetIndex = 0;

    if (direction === 'right') {
      const nextIndex = cards.findIndex((card) => card.offsetLeft > currentLeft + 8);
      targetIndex = nextIndex === -1 ? cards.length - 1 : nextIndex;
    } else {
      const prevCandidates = cards
        .map((card, index) => ({ index, left: card.offsetLeft }))
        .filter((item) => item.left < currentLeft - 8);
      targetIndex = prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1].index : 0;
    }

    container.scrollTo({
      left: cards[targetIndex].offsetLeft,
      behavior: 'smooth'
    });
  };

  const handleWeiterZurZahlung = (option: GutscheinOption, index: number) => {
    if (option.type === 'contact' && option.contactUrl) {
      window.open(option.contactUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    let betrag = option.betrag;
    
    // Wenn Freier Betrag, nutze den eingegebenen Wert
    if (option.betrag === 0 && customAmounts[index]) {
      betrag = parseFloat(customAmounts[index]) || 0;
    }
    
    window.parent.postMessage({ 
      type: 'gutscheinSelected', 
      slug, 
      betrag,
      titel: option.titel 
    }, parentOrigin);
  };

  const handleCustomAmountChange = (index: number, value: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [index]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '200px',
        fontFamily
      }}>
        <Typography>Laden...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        p: 3,
        fontFamily
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: backgroundColor,
      fontFamily,
      pt: { xs: 10, md: 11 },
      pb: { xs: 7, md: 8 },
      px: { xs: 0, md: 2 },
      position: 'relative',
      '& *': {
        fontFamily: `${fontFamily} !important`
      }
    }}>
      {/* Oberer Divider */}
      <Box sx={{ mb: 1.5 }}>
        <Divider sx={{ borderColor }} />
      </Box>

      {/* Powered by rechts oben */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, px: { xs: 1, md: 0 } }}>
        <Typography 
          component="a" 
          href="https://gutscheinery.de" 
          target="_blank" 
          rel="noopener noreferrer"
          variant="caption" 
          sx={{ 
            color: '#9ca3af',
            fontSize: '0.75rem',
            lineHeight: 1,
            textDecoration: 'none',
            '&:hover': {
              color: '#6b7280',
              textDecoration: 'underline'
            }
          }}
        >
          powered by GutscheinFabrik
        </Typography>
      </Box>

      <Typography
        variant="h5"
        sx={{
          textAlign: 'center',
          mb: 1,
          color: textStrongColor,
          fontSize: { xs: '1.35rem', md: '1.55rem' },
          fontWeight: 700,
          letterSpacing: '-0.01em'
        }}
      >
        Gutschein kaufen
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: 'center', 
          mb: 4.5,
          color: textMutedColor,
          fontSize: '1rem'
        }}
      >
        Jetzt kaufen und sofort per E-Mail erhalten
      </Typography>

      {categoryCards.length > 1 && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            px: 0.5
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.75,
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Box
              component="button"
              onClick={() => scrollCards('left')}
              disabled={!canScrollLeft}
              sx={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid #dbe2ea',
                bgcolor: 'white',
                color: '#1f2937',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                opacity: canScrollLeft ? 1 : 0.35,
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: 0,
                boxShadow: canScrollLeft ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: canScrollLeft ? 'translateY(-1px)' : 'none',
                  boxShadow: canScrollLeft ? '0 4px 10px rgba(0,0,0,0.12)' : 'none',
                  borderColor: canScrollLeft ? '#c8d2de' : '#dbe2ea'
                }
              }}
            >
              {'<'}
            </Box>

            <Box
              component="button"
              onClick={() => scrollCards('right')}
              disabled={!canScrollRight}
              sx={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: '1px solid #dbe2ea',
                bgcolor: 'white',
                color: '#1f2937',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                opacity: canScrollRight ? 1 : 0.35,
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: 0,
                boxShadow: canScrollRight ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: canScrollRight ? 'translateY(-1px)' : 'none',
                  boxShadow: canScrollRight ? '0 4px 10px rgba(0,0,0,0.12)' : 'none',
                  borderColor: canScrollRight ? '#c8d2de' : '#dbe2ea'
                }
              }}
            >
              {'>'}
            </Box>
          </Box>
        </Box>
      )}

      <Box 
        ref={scrollContainerRef}
        sx={{ 
          display: 'flex',
          overflowX: 'auto',
          gap: { xs: 2, md: 3.5 },
          pb: 2.5,
          px: { xs: 0, md: 1 },
          alignItems: 'stretch',
          justifyContent: categoryCards.length <= 3 ? 'center' : 'flex-start',
          scrollSnapType: { xs: 'x mandatory', md: 'none' },
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a0aec0',
          },
        }}
      >
        {categoryCards.map((card) => {
          const selectedIndex = selectedOptionByCategory[card.kategorie] ?? card.items[0].originalIndex;
          const selectedItem = card.items.find((item) => item.originalIndex === selectedIndex) || card.items[0];
          const option = selectedItem.option;
          const originalIndex = selectedItem.originalIndex;
          const pricedItems = card.items.filter((item) => item.option.type !== 'contact' && item.option.betrag > 0);
          const minCategoryAmount = pricedItems.length > 0
            ? Math.min(...pricedItems.map((item) => item.option.betrag))
            : 0;
          const userHasChosen = Boolean(hasUserSelectionByCategory[card.kategorie]);
          const showAbPrice = !userHasChosen && card.items.length > 1 && minCategoryAmount > 0 && option.type !== 'contact';
          const detailText = option.inhalt || option.beschreibung || option.titel;
          const isFlatCard = widgetDisplayMode === 'flat';

          return (
          <Card
            key={`${card.kategorie}-${card.items[0].originalIndex}`}
            data-widget-card="true"
            sx={{
              minWidth: { xs: '92vw', sm: '260px' },
              flex: '1 1 280px',
              maxWidth: '360px',
              scrollSnapAlign: { xs: 'start', md: 'none' },
              bgcolor: surfaceColor,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              boxShadow: 'none',
              borderRadius: '12px',
              border: `1px solid ${borderColor}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: surfaceColor,
                borderColor,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              },
            }}
          >
            <CardContent sx={{ 
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Kategorie-Titel */}
              <Typography 
                variant="h6" 
                title={isFlatCard ? option.titel : card.kategorie}
                sx={{ 
                  mb: 1,
                  fontWeight: 600,
                  color: textStrongColor,
                  fontSize: '1.15rem',
                  minHeight: '34px',
                  lineHeight: 1.25,
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}
              >
                {isFlatCard ? option.titel : card.kategorie}
              </Typography>

              {card.items.length > 1 ? (
                <TextField
                  select
                  size="small"
                  label="Leistung"
                  value={originalIndex}
                  onChange={(e) => {
                    const nextIndex = Number(e.target.value);
                    setSelectedOptionByCategory((prev) => ({
                      ...prev,
                      [card.kategorie]: nextIndex,
                    }));
                    setHasUserSelectionByCategory((prev) => ({
                      ...prev,
                      [card.kategorie]: true,
                    }));
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                >
                  {card.items.map((item) => (
                    <MenuItem key={`${card.kategorie}-${item.originalIndex}`} value={item.originalIndex}>
                      {item.option.titel}
                      {item.option.type !== 'contact' && item.option.betrag > 0 ? ` - ${item.option.betrag}€` : ''}
                      {item.option.type === 'contact' && item.option.betrag > 0 ? ` - ${item.option.betrag}€` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                !isFlatCard ? <Typography
                  variant="body2"
                  title={option.titel}
                  sx={{
                    mb: 1,
                    color: textStrongColor,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    minHeight: '38px',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word'
                  }}
                >
                  {option.titel}
                </Typography> : <Box sx={{ mb: 1 }} />
              )}

              {/* Inhalt / Beschreibung */}
              <Typography 
                variant="body2" 
                title={detailText}
                sx={{ 
                  mb: 1.5,
                  color: textMutedColor,
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  minHeight: '24px',
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}
              >
                {detailText}
              </Typography>

              <Box sx={{ flex: 1, minHeight: 12 }} />

              <Divider sx={{ mb: 1.5, borderColor }} />

              {/* Preis - zentriert */}
              {option.type === 'contact' && option.betrag <= 0 ? (
                <Box sx={{ minHeight: '60px' }} />
              ) : option.betrag === 0 ? (
                <Box sx={{ 
                  mb: 1.5, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '60px'
                }}>
                  <TextField
                    type="number"
                    placeholder="50"
                    value={customAmounts[originalIndex] || ''}
                    onChange={(e) => handleCustomAmountChange(originalIndex, e.target.value)}
                    inputProps={{ min: 10, step: 5 }}
                    sx={{
                      width: '90px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        '& fieldset': {
                            borderColor,
                        },
                        '&:hover fieldset': {
                            borderColor,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor,
                        },
                      },
                      '& input': {
                        textAlign: 'center',
                        padding: '10px 8px',
                        color: textStrongColor,
                      },
                      '& input::placeholder': {
                        color: textMutedColor,
                        opacity: 1,
                      }
                    }}
                  />
                  <Typography 
                    sx={{ 
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: textStrongColor,
                      ml: 0.5
                    }}
                  >
                    €
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 1.5,
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      color: textStrongColor,
                      fontSize: '2rem'
                    }}
                  >
                    {(showAbPrice || option.abPreis) && (
                      <Box component="span" sx={{ fontSize: '1.1rem', fontWeight: 500, color: textMutedColor, mr: 0.5 }}>ab</Box>
                    )}
                    {showAbPrice ? minCategoryAmount : option.betrag}€
                  </Typography>
                </Box>
              )}

              <Box
                component="button"
                onClick={() => handleWeiterZurZahlung(option, originalIndex)}
                sx={{
                  width: '100%',
                  bgcolor: primaryColor,
                  color: buttonTextColor,
                  py: 1.25,
                  px: 3,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'background-color 0.2s ease',
                  fontFamily: 'inherit',
                  mt: 'auto',
                  '&:hover': {
                    opacity: 0.92,
                  },
                  '&:active': {
                    opacity: 0.85,
                  }
                }}
              >
                {option.type === 'contact'
                  ? (option.buttonLabel || 'Jetzt anfragen')
                  : 'Zum Gutschein'}
              </Box>
            </CardContent>
          </Card>
          );
        })}
      </Box>

      {/* Unterer Divider */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ borderColor }} />
      </Box>
    </Box>
  );
};

export default EmbedWidget;
