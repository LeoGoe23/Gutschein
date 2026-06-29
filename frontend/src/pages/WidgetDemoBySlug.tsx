import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { Helmet } from 'react-helmet';

interface DemoTemplateData {
  slug: string;
  name?: string;
  demoHtml?: string;
  bildURL?: string;
}

type EditAction =
  | 'remove'
  | 'swapUp'
  | 'swapDown'
  | 'placeWidgetBefore'
  | 'placeWidgetInside';

interface StoredLayoutPayload {
  baseFingerprint: string;
  workingHtml: string;
}

const escapeHtmlAttribute = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const stripLayoutEditorArtifacts = (html: string): string => {
  try {
    // Keep original HTML structure untouched (including style/link tags),
    // and only remove editor-specific markers and inline style fragments.
    let cleaned = html;

    cleaned = cleaned.replace(/\sdata-layout-editable=("[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\sdata-layout-node-id=("[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\sdata-layout-ignore=("[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\sdata-layout-selected=("[^"]*"|'[^']*')/gi, '');

    // Remove temporary widget overlay helper nodes injected by layout editor.
    cleaned = cleaned.replace(/<div[^>]*data-widget-overlay=("[^"]*"|'[^']*')[^>]*><\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*data-widget-drag-handle=("[^"]*"|'[^']*')[^>]*>.*?<\/div>/gi, '');

    cleaned = cleaned.replace(/style=("[^"]*"|'[^']*')/gi, (fullMatch, styleValueWithQuotes) => {
      const quote = styleValueWithQuotes[0];
      const styleBody = styleValueWithQuotes.slice(1, -1);

      const parts = styleBody
        .split(';')
        .map((part: string) => part.trim())
        .filter(Boolean)
        .filter((part: string) => {
          const normalized = part.toLowerCase();
          return !normalized.startsWith('outline:')
            && !normalized.startsWith('outline-offset:')
            && !normalized.startsWith('cursor:');
        });

      if (parts.length === 0) return '';
      return `style=${quote}${parts.join('; ')}${quote}`;
    });

    return cleaned;
  } catch (error) {
    console.warn('Konnte Layout-Artefakte nicht bereinigen:', error);
    return html;
  }
};

const normalizeRelativeAssetUrls = (html: string): string => {
  const inferSourceOrigin = (value: string): string => {
    const matcher = /(\b(?:src|href|action)\s*=\s*["'])(https?:\/\/[^"'\s>]+)(["'])/gi;
    let match: RegExpExecArray | null = null;
    const originCounts = new Map<string, number>();
    const blockedHosts = [
      'consent.cookiebot.com',
      'consentcdn.cookiebot.com',
      'use.typekit.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'www.googletagmanager.com',
      'www.google-analytics.com',
      'connect.facebook.net',
      'static.doubleclick.net',
    ];

    const isBlockedHost = (hostname: string): boolean => {
      const lower = hostname.toLowerCase();
      return blockedHosts.some((blocked) => lower === blocked || lower.endsWith(`.${blocked}`));
    };

    while ((match = matcher.exec(value)) !== null) {
      const rawUrl = match[2];
      try {
        const parsed = new URL(rawUrl);
        if (!parsed.hostname) continue;
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') continue;
        if (isBlockedHost(parsed.hostname)) continue;

        const key = parsed.origin;
        originCounts.set(key, (originCounts.get(key) || 0) + 1);
      } catch {
        // ignore malformed urls
      }
    }

    if (originCounts.size > 0) {
      const ranked = Array.from(originCounts.entries()).sort((a, b) => b[1] - a[1]);
      return ranked[0][0];
    }

    // Fallback: if only third-party urls exist, use the first non-local absolute origin.
    matcher.lastIndex = 0;
    while ((match = matcher.exec(value)) !== null) {
      const rawUrl = match[2];
      try {
        const parsed = new URL(rawUrl);
        if (!parsed.hostname) continue;
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') continue;
        return parsed.origin;
      } catch {
        // ignore malformed urls
      }
    }

    return '';
  };

  const sourceOrigin = inferSourceOrigin(html);
  const keepLocalPrefixes = ['/embed/', '/demo/', '/widgetdemo/', '/checkoutdemo/', '/api/'];
  const shouldKeepLocalPath = (path: string): boolean => {
    return keepLocalPrefixes.some((prefix) => path.startsWith(prefix));
  };

  const absolutizePath = (path: string): string => {
    if (path.startsWith('/') && shouldKeepLocalPath(path)) {
      return path;
    }
    if (sourceOrigin) {
      try {
        return new URL(path, `${sourceOrigin}/`).toString();
      } catch {
        // fallback below
      }
    }
    return `/${path.replace(/^\/+/, '')}`;
  };

  // Rewrite relative src/href/action to absolute URLs.
  let normalized = html.replace(
    /(\b(?:src|href|action)\s*=\s*["'])(?!https?:\/\/|\/\/|\/|#|data:|mailto:|tel:|javascript:)([^"']+)(["'])/gi,
    (_match, prefix, path, suffix) => `${prefix}${absolutizePath(path)}${suffix}`
  );

  // Rewrite root-absolute src/href/action paths as well (except local app routes).
  normalized = normalized.replace(
    /(\b(?:src|href|action)\s*=\s*["'])(\/[^"']+)(["'])/gi,
    (_match, prefix, path, suffix) => `${prefix}${absolutizePath(path)}${suffix}`
  );

  // Rewrite additional media-bearing attributes used by many templates.
  normalized = normalized.replace(
    /(\b(?:data-sticky-logo|data-src|data-bg|poster)\s*=\s*["'])(?!https?:\/\/|\/\/|#|data:)([^"']+)(["'])/gi,
    (_match, prefix, path, suffix) => `${prefix}${absolutizePath(path)}${suffix}`
  );

  // Rewrite relative URLs in srcset attributes.
  normalized = normalized.replace(
    /(\bsrcset\s*=\s*["'])([^"']+)(["'])/gi,
    (_match, prefix, srcsetValue, suffix) => {
      const rewritten = srcsetValue
        .split(',')
        .map((entry: string) => entry.trim())
        .filter(Boolean)
        .map((entry: string) => {
          const [urlPart, descriptor] = entry.split(/\s+/, 2);
          if (!urlPart) return entry;
          if (/^(https?:\/\/|\/\/|data:|#)/i.test(urlPart)) return entry;
          if (urlPart.startsWith('/') && shouldKeepLocalPath(urlPart)) return entry;
          const absoluteUrl = absolutizePath(urlPart);
          return descriptor ? `${absoluteUrl} ${descriptor}` : absoluteUrl;
        })
        .join(', ');
      return `${prefix}${rewritten}${suffix}`;
    }
  );

  // Rewrite CSS url(...) references in inline styles and style tags.
  normalized = normalized.replace(
    /url\((['"]?)(?!https?:\/\/|\/\/|data:|#)([^'"\)]+)\1\)/gi,
    (_match, quote, path) => {
      const trimmedPath = String(path || '').trim();
      if (!trimmedPath) return _match;
      if (trimmedPath.startsWith('/') && shouldKeepLocalPath(trimmedPath)) return _match;
      const absoluteUrl = absolutizePath(trimmedPath);
      return `url(${quote}${absoluteUrl}${quote})`;
    }
  );

  // In local CRA dev, /media/* requests go through the proxy (:8080). If backend is
  // not running, use production origin as a fallback so partner/footer logos still load.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    normalized = normalized.replace(
      /(\b(?:src|href)\s*=\s*["'])\/media\//gi,
      '$1https://gutscheinery.de/media/'
    );
    normalized = normalized.replace(
      /url\((['"]?)\/media\//gi,
      'url($1https://gutscheinery.de/media/'
    );
  }

  return normalized;
};

const containsWidgetMarkup = (html: string): boolean => {
  return /<iframe[^>]+(data-widget-iframe\s*=|id\s*=\s*["']gutschein-widget-iframe["']|src\s*=\s*["'][^"']*\/embed\/[^"']*["'])/i.test(html)
    || /data-widget-root\s*=\s*["']1["']/i.test(html)
    || /id\s*=\s*["']gutschein-widget-wrapper["']/i.test(html);
};

const hasMainHeroImage = (html: string): boolean => {
  return /background-image\s*:\s*url\(/i.test(html)
    || /<img[^>]+class\s*=\s*["'][^"']*(hero|slider|banner)[^"']*["'][^>]*>/i.test(html)
    || /<section[^>]+id\s*=\s*["']slider["'][^>]*>/i.test(html);
};

const WidgetDemoBySlug: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState<string>('');
  const [shopFound, setShopFound] = useState(true);
  const [demoTemplate, setDemoTemplate] = useState<DemoTemplateData | null>(null);
  const [demoDocId, setDemoDocId] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledToWidgetRef = useRef(false);
  const [workingHtml, setWorkingHtml] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [editAction, setEditAction] = useState<EditAction>('remove');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedNodeInfo, setSelectedNodeInfo] = useState('');
  const [showSelectableElements, setShowSelectableElements] = useState(true);
  const [showClickHints, setShowClickHints] = useState(true);
  const [widgetCount, setWidgetCount] = useState(0);
  const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');
  const [exportHtml, setExportHtml] = useState('');
  const [copyState, setCopyState] = useState('');
  const [isSavingHtml, setIsSavingHtml] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const hasDemoTemplate = Boolean(demoTemplate?.slug);
  const displaySlug = resolvedSlug || (slug ? slug.toUpperCase() : 'NEUKUNDE');
  const isRealShop = shopFound && Boolean(resolvedSlug) && !hasDemoTemplate;
  const isProspectDemo = !isRealShop;
  const isLayoutEditMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('layoutEdit') === '1';
  }, []);

  const findWidgetWrappers = (container: ParentNode): HTMLElement[] => {
    const wrappers = new Set<HTMLElement>();

    const addWrapper = (node: HTMLElement | null) => {
      if (!node) return;
      wrappers.add(node);
    };

    container
      .querySelectorAll<HTMLElement>('[data-widget-root="1"], #gutschein-widget-wrapper')
      .forEach((node) => addWrapper(node));

    container
      .querySelectorAll<HTMLIFrameElement>('#gutschein-widget-iframe, iframe[data-widget-iframe="1"], iframe[data-gutschein-widget="1"], iframe[src*="/embed/"], iframe[src*="embed/"]')
      .forEach((iframe) => {
        const closestMarked = iframe.closest<HTMLElement>('[data-widget-root="1"], #gutschein-widget-wrapper');
        if (closestMarked) {
          addWrapper(closestMarked);
          return;
        }

        const parent = iframe.closest<HTMLElement>('div, section, article, main, aside') || iframe.parentElement;
        if (parent) {
          addWrapper(parent);
        }
      });

    return Array.from(wrappers);
  };

  useEffect(() => {
    const currentOrigin = new URL(window.location.origin);
    const isAllowedOrigin = (origin: string) => {
      if (origin === window.location.origin) return true;
      try {
        const parsed = new URL(origin);
        const isLocalVariant =
          (currentOrigin.hostname === 'localhost' && parsed.hostname === '127.0.0.1') ||
          (currentOrigin.hostname === '127.0.0.1' && parsed.hostname === 'localhost');
        return (
          isLocalVariant &&
          parsed.protocol === currentOrigin.protocol &&
          parsed.port === currentOrigin.port
        );
      } catch {
        return false;
      }
    };

    // Handle iframe resize messages
    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;

      const openInNewTab = (targetUrl: string) => {
        // Do not fallback to same-tab navigation here: some browsers return null
        // with noopener/noreferrer even when the new tab was opened successfully.
        const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          setStatusText('Neuer Tab wurde blockiert. Bitte Popups fuer diese Seite erlauben.');
        }
      };

      if (event.data.type === 'gutschein-widget-resize') {
        const iframes = Array.from(
          document.querySelectorAll<HTMLIFrameElement>('#gutschein-widget-iframe, iframe[data-widget-iframe="1"], iframe[src*="/embed/"]')
        );
        if (!event.data.height) return;
        iframes.forEach((iframe) => {
          iframe.style.height = `${event.data.height}px`;
        });
      }

      if (event.data.type === 'gutscheinSelected') {
        const betrag = Number(event.data.betrag);
        if (!Number.isFinite(betrag) || betrag <= 0) return;
        const targetSlug = typeof event.data.slug === 'string' && event.data.slug.trim()
          ? event.data.slug.trim()
          : (resolvedSlug || demoTemplate?.slug || slug || 'DEMO');

        const params = new URLSearchParams({
          betrag: String(betrag),
          source: 'widget-demo-slug',
          openPayment: '1'
        });

        if (typeof event.data.titel === 'string' && event.data.titel.trim()) {
          params.set('titel', event.data.titel.trim());
        }

        if (demoTemplate?.slug) {
          openInNewTab(`/demo/${encodeURIComponent(demoTemplate.slug)}?${params.toString()}`);
          return;
        }

        if (isProspectDemo) {
          params.set('slug', targetSlug);
          openInNewTab(`/checkoutdemo?${params.toString()}`);
          return;
        }

        openInNewTab(`/demo/${encodeURIComponent(targetSlug)}?${params.toString()}`);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [slug, resolvedSlug, demoTemplate, isProspectDemo]);

  useEffect(() => {
    const loadShopData = async () => {
      if (!slug) {
        setShopFound(false);
        setLoading(false);
        return;
      }

      try {
        const normalizedSlug = slug.toLowerCase();

        // Prioritaet 1: gespeichertes Demo-Template mit eigener HTML-Kundenseite
        const demosRef = collection(db, 'demos');
        const qDemo = query(demosRef, where('slug', '==', normalizedSlug));
        const demoSnap = await getDocs(qDemo);
        if (!demoSnap.empty) {
          const demoDoc = demoSnap.docs[0];
          const rawDemo = demoDoc.data() as DemoTemplateData;
          setDemoDocId(demoDoc.id);
          setDemoTemplate({
            slug: (rawDemo.slug || slug).toLowerCase(),
            name: rawDemo.name,
            demoHtml: rawDemo.demoHtml,
            bildURL: rawDemo.bildURL,
          });
        } else {
          setDemoDocId('');
          setDemoTemplate(null);
        }

        // Try uppercase slug first
        let shopDoc = await getDoc(doc(db, 'users', slug.toUpperCase()));
        if (shopDoc.exists()) {
          setResolvedSlug(shopDoc.id);
          setShopFound(true);
        } else {
          // Try lowercase slug
          shopDoc = await getDoc(doc(db, 'users', normalizedSlug));
          if (shopDoc.exists()) {
            setResolvedSlug(shopDoc.id);
            setShopFound(true);
          } else {
            setShopFound(false);
            setResolvedSlug('');
          }
        }
      } catch (error) {
        console.error('Error loading shop data:', error);
        setShopFound(false);
        setResolvedSlug('');
        setDemoDocId('');
        setDemoTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [slug]);

  const embedSourceSlug = isRealShop
    ? resolvedSlug
    : (demoTemplate?.slug || slug || 'DEMO');

  const layoutStorageKey = useMemo(
    () => `demo-layout-edit:${embedSourceSlug.toLowerCase()}:html`,
    [embedSourceSlug]
  );

  const widgetSlug = isRealShop ? resolvedSlug : embedSourceSlug;
  const widgetLoaderMarkup = `
    <div data-widget-root="1" style="width: 100%;">
      <div
        id="gutschein-widget"
        data-slug="${escapeHtmlAttribute(widgetSlug)}"
        data-theme="auto"
        ${isProspectDemo ? `data-demo-mode="1" data-demo-label="${escapeHtmlAttribute(displaySlug)}"` : ''}
      ></div>
    </div>
  `;

  const createWidgetWrapperNode = (): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-widget-root', '1');
    wrapper.style.width = '100%';

    const container = document.createElement('div');
    container.id = 'gutschein-widget';
    container.setAttribute('data-slug', widgetSlug);
    container.setAttribute('data-theme', 'auto');
    if (isProspectDemo) {
      container.setAttribute('data-demo-mode', '1');
      container.setAttribute('data-demo-label', displaySlug);
    }

    wrapper.appendChild(container);
    return wrapper;
  };

  const ensureSingleWidget = (root: ParentNode, preferred?: HTMLElement | null): HTMLElement | null => {
    const widgets = findWidgetWrappers(root);
    if (widgets.length === 0) return null;

    const keep = preferred && widgets.includes(preferred)
      ? preferred
      : widgets[0];

    widgets.forEach((node) => {
      if (node !== keep) {
        node.remove();
      }
    });

    return keep;
  };

  const buildFingerprint = (value: string) => {
    let checksum = 0;
    for (let i = 0; i < value.length; i += 1) {
      checksum = (checksum + value.charCodeAt(i) * (i + 1)) % 1000000007;
    }
    return `${value.length}:${checksum}`;
  };

  // Original HTML structure with widget integration
  const defaultHTML = `
    <style>
    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        box-shadow: inset 0 0 5px #a5aaad;
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb {
        background: #bb9c76;
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #bb9c76;
    }
    
    /* Prevent default body margins/padding */
    body { margin: 0; padding: 0; }
    
    /* Widget section styling */
    .gutschein-section {
        background-color: white;
        padding: 40px 0 60px 0;
    }
    .gutschein-container {
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        padding: 0 40px;
    }
    .gutschein-title {
        color: #5a6652;
        margin-bottom: 40px;
        text-align: center;
    }

    @media (max-width: 768px) {
      .gutschein-section {
        padding: 24px 0 36px 0;
      }
      .gutschein-container {
        padding: 0 12px;
      }
    }
    </style>
    <link href="https://www.somaticvitality.com/css/26visu8056.min.css" rel="stylesheet" type="text/css">

    <div data-collapse="medium" data-animation="default" data-duration="800" data-easing="ease-out-quint" data-easing2="ease-out-quint" role="banner" class="navbar home-navbar w-nav">
        <div class="nav_wrap">
            <a href="#" aria-current="page" class="brand logo-home w-nav-brand w--current">
                <img sizes="(max-width: 517px) 98vw, 507px" srcset="https://www.somaticvitality.com/images/67751082c3b3dc52ca20e5f6_Logo-p-500.webp 500w,https://www.somaticvitality.com/images/67751082c3b3dc52ca20e5f6_Logo.webp 507w" alt="Somatic Vitality Logo" src="https://www.somaticvitality.com/images/67751082c3b3dc52ca20e5f6_Logo.webp" loading="lazy" class="logo-img">
            </a>
            <nav role="navigation" class="nav-menu w-nav-menu">
                <div class="nav-menu-content">
                    <div class="nav-links-wrapper">
                        <a href="#" aria-current="page" class="nav-link-wrap w-inline-block w--current">
                            <div class="text-color-white">
                                <strong class="semibold">HOME</strong>
                            </div>
                        </a>
                        <div data-delay="0" data-hover="true" class="dropdown-nav w-dropdown">
                            <div class="nav-link-wrap w-dropdown-toggle">
                                <div class="icon-10 w-icon-dropdown-toggle"></div>
                                <div>
                                    <strong class="semibold">Angebote</strong>
                                </div>
                            </div>
                        </div>
                        <a href="#" class="nav-link-wrap w-inline-block">
                            <div>
                                <strong class="semibold">ÜBER MICH</strong>
                            </div>
                        </a>
                        <a href="#gutscheine" class="nav-link-wrap w-inline-block">
                            <div>
                                <strong class="semibold">Gutscheine</strong>
                            </div>
                        </a>
                        <a href="#" class="nav-link-wrap w-inline-block">
                            <div>
                                <strong class="semibold">KONTAKT</strong>
                            </div>
                        </a>
                    </div>
                </div>
            </nav>
            <div class="menu-button w-nav-button">
                <img alt="Menu" src="https://www.somaticvitality.com/images/5e22878bdaefb8776748017e_Burger.svg" class="burger-icon">
            </div>
        </div>
    </div>

    <section class="titel_start">
        <div class="div-block-img">
            <h2 class="subheading heading-2 filter">Pauline Zimnoch</h2>
            <h1 class="slogan1-title heading-1">
                Somatic Vitality
                <br>
            </h1>
            <h2 class="slogan1-small heading-1">
                Bodywork &amp; Massage
                <br>
            </h2>
        </div>
    </section>

    <section class="section-gro-e-abst-nde1">
        <div class="content-80">
            <h2 class="heading-mittig heading-1 size">
                Willkommen
                <br>
            </h2>
            <div class="divider highlights"></div>
            <p class="text-mittig1 flie-text">
                <strong>Jeder Körper, jede Berührung, jeder Moment erzählt eine Geschichte.</strong>
                <br>
                Hier bist du eingeladen, anzukommen – bei dir selbst, in deinem Körper und in deiner inneren Weisheit.
                <br>
                <br>
                Somatic Vitality steht für das Verstehen und Einbeziehen der Körpersprache sowie für die Verbindung zu dem, was in dir lebendig werden möchte.
            </p>
        </div>
    </section>

    <section id="gutscheine" class="gutschein-section">
        <div class="gutschein-container">
            <h2 class="heading-mittig heading-1 size gutschein-title">
                Gutschein kaufen
            </h2>
            
            <!-- WIDGET INTEGRATION -->
            ${widgetLoaderMarkup}
        </div>
    </section>

    <div class="footer-2 hauptfarbe">
        <div class="div-block-footer1">
            <div class="inhalt-footer">
                <div class="heading-footer heading-3">Kontakt</div>
                <p class="email">E-Mail: somatic.vitality.berlin@gmail.com</p>
            </div>
            <div class="inhalt-footer">
                <div class="heading-footer heading-3">ANSCHRIFT</div>
                <div class="address">
                    <p class="adresse">
                        Praxis für ganzheitliche Körperarbeit 
                        <br>
                        Weichselplatz 4
                        <br>
                        12045 Berlin
                    </p>
                </div>
            </div>
            <div class="inhalt-footer">
                <div class="heading-footer heading-3">Sonstiges</div>
                <div class="impdat-2 flie-text">
                    <span style="color: white; display: block; margin-bottom: 10px;">Impressum</span>
                    <span style="color: white; display: block;">Datenschutz</span>
                </div>
            </div>
        </div>
    </div>
  `;

  const generatedDemoHtml = `
    <style>
      body { margin: 0; padding: 0; }
      .demo-hero {
        min-height: 62vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        position: relative;
        overflow: hidden;
        background: #0f172a;
      }
      .demo-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0.65));
        z-index: 1;
      }
      .demo-hero-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .demo-hero-inner {
        position: relative;
        z-index: 2;
        padding: 24px;
      }
      .demo-title {
        font-size: clamp(2rem, 5vw, 4rem);
        font-weight: 700;
        margin: 0 0 12px 0;
      }
      .demo-subtitle {
        font-size: clamp(1rem, 2.5vw, 1.4rem);
        margin: 0;
        opacity: 0.95;
      }
      .gutschein-section {
        background-color: white;
        padding: 40px 0 60px 0;
      }
      .gutschein-container {
        max-width: 1160px;
        margin: 0 auto;
        width: 100%;
        padding: 0 24px;
      }
      .gutschein-title {
        color: #0f172a;
        margin-bottom: 28px;
        text-align: center;
        font-size: clamp(1.6rem, 2vw, 2.2rem);
      }
    </style>

    <section class="demo-hero">
      ${demoTemplate?.bildURL ? `<img class="demo-hero-bg" src="${demoTemplate.bildURL}" alt="${demoTemplate?.name || 'Demo'}">` : ''}
      <div class="demo-hero-inner">
        <h1 class="demo-title">${demoTemplate?.name || displaySlug}</h1>
        <p class="demo-subtitle">Digitale Gutschein-Demo</p>
      </div>
    </section>

    <section id="gutscheine" class="gutschein-section">
      <div class="gutschein-container">
        <h2 class="gutschein-title">Gutschein kaufen</h2>
        ${widgetLoaderMarkup}
      </div>
    </section>
  `;

  const originalHTML = (() => {
    if (demoTemplate?.demoHtml) {
      const cleanedTemplate = stripLayoutEditorArtifacts(demoTemplate.demoHtml);
      const normalizedTemplate = normalizeRelativeAssetUrls(cleanedTemplate);
      const withImage = normalizedTemplate.replaceAll('{{BILD_URL}}', demoTemplate.bildURL || '');

      let enhancedTemplate = withImage;
      if (demoTemplate.bildURL && !hasMainHeroImage(withImage)) {
        enhancedTemplate = `
          <section class="demo-auto-hero" style="position: relative; min-height: 46vh; background-image: url('${demoTemplate.bildURL}'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0.18), rgba(15,23,42,0.46));"></div>
            <h1 style="position: relative; z-index: 1; color: #fff; margin: 0; padding: 24px; text-align: center; font-size: clamp(2rem, 5vw, 4rem); line-height: 1.08; text-shadow: 0 8px 24px rgba(0,0,0,0.38);">${demoTemplate?.name || displaySlug}</h1>
          </section>
        ${withImage}`;
      }

      if (enhancedTemplate.includes('{{WIDGET_IFRAME}}')) {
        return enhancedTemplate.replaceAll('{{WIDGET_IFRAME}}', widgetLoaderMarkup);
      }

      if (containsWidgetMarkup(enhancedTemplate)) {
        return enhancedTemplate;
      }

      return `${enhancedTemplate}\n<section class="gutschein-section"><div class="gutschein-container">${widgetLoaderMarkup}</div></section>`;
    }

    if (demoTemplate) {
      return generatedDemoHtml;
    }

    return defaultHTML;
  })();

  const renderedHtml = isLayoutEditMode
    ? (workingHtml || originalHTML)
    : originalHTML;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const containers = Array.from(root.querySelectorAll<HTMLElement>('[id^="gutschein-widget"][data-slug]'));
    if (containers.length === 0) return;

    const resetWidgetInstances = () => {
      containers.forEach((container) => {
        container.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
      });
      root
        .querySelectorAll<HTMLIFrameElement>('iframe[data-widget-iframe="1"], iframe[data-gutschein-widget="1"], iframe[src*="/embed/"]')
        .forEach((iframe) => {
          if (!iframe.closest('[id^="gutschein-widget"][data-slug]')) {
            iframe.remove();
          }
        });
    };

    const runLoader = () => {
      resetWidgetInstances();
      const loaderApi = (window as any).GutscheinWidget;
      if (loaderApi && typeof loaderApi.init === 'function') {
        loaderApi.init();
      }
    };

    const existingLoader = (window as any).GutscheinWidget;
    if (existingLoader && typeof existingLoader.init === 'function') {
      runLoader();
      return;
    }

    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    script.onload = () => {
      runLoader();
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [renderedHtml]);

  useEffect(() => {
    if (loading) return;
    if (isLayoutEditMode) return;
    if (hasAutoScrolledToWidgetRef.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('autoScrollWidget') === '0') return;

    const scrollToWidget = () => {
      const root = rootRef.current;
      if (!root) return false;

      const preferredTarget = root.querySelector<HTMLElement>('#gutscheine')
        || root.querySelector<HTMLElement>('[data-widget-root="1"]')
        || root.querySelector<HTMLElement>('#gutschein-widget-iframe');

      if (!preferredTarget) return false;

      preferredTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      hasAutoScrolledToWidgetRef.current = true;
      return true;
    };

    // Wait briefly so imported templates and images can settle layout.
    const timerId = window.setTimeout(() => {
      if (!scrollToWidget()) {
        window.requestAnimationFrame(() => {
          scrollToWidget();
        });
      }
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [loading, renderedHtml, isLayoutEditMode]);

  useEffect(() => {
    if (!isLayoutEditMode) return;

    try {
      const storedRaw = localStorage.getItem(layoutStorageKey);
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw) as StoredLayoutPayload;
        const expectedFingerprint = buildFingerprint(originalHTML);
        if (parsed && parsed.workingHtml && parsed.baseFingerprint === expectedFingerprint) {
          setWorkingHtml(parsed.workingHtml);
          setExportHtml(parsed.workingHtml);
          return;
        }
        localStorage.removeItem(layoutStorageKey);
      }
      setWorkingHtml(originalHTML);
      setExportHtml(originalHTML);
    } catch (error) {
      console.warn('Konnte Layout-Edit-Status nicht laden:', error);
      localStorage.removeItem(layoutStorageKey);
      setWorkingHtml(originalHTML);
      setExportHtml(originalHTML);
    }
  }, [isLayoutEditMode, layoutStorageKey, originalHTML]);

  useEffect(() => {
    if (!isLayoutEditMode) return;

    const payload: StoredLayoutPayload = {
      baseFingerprint: buildFingerprint(originalHTML),
      workingHtml: renderedHtml,
    };
    localStorage.setItem(layoutStorageKey, JSON.stringify(payload));
    setExportHtml(renderedHtml);
  }, [isLayoutEditMode, layoutStorageKey, renderedHtml, originalHTML]);

  useEffect(() => {
    if (!isLayoutEditMode) return;

    const root = rootRef.current;
    if (!root) return;

    root.setAttribute('data-layout-edit-mode', '1');
    root.setAttribute('data-layout-show-selectable', showSelectableElements ? '1' : '0');
    root.setAttribute('data-layout-click-hints', showClickHints ? '1' : '0');

    const getWidgetWrappers = () => findWidgetWrappers(root);
    let hoverRing: HTMLDivElement | null = null;
    let selectedRing: HTMLDivElement | null = null;
    let dropLine: HTMLDivElement | null = null;
    let selectionStyleTag: HTMLStyleElement | null = null;
    let mutationObserver: MutationObserver | null = null;
    let hoverRafId = 0;
    let pendingHoverEvent: MouseEvent | null = null;
    let refreshRafId = 0;
    let lastHoverNodeId = '';
    let draggingWidget: HTMLElement | null = null;
    let dropTargetNode: HTMLElement | null = null;
    let dropPlacement: 'before' | 'after' = 'before';

    const installSelectionStyles = () => {
      selectionStyleTag = document.createElement('style');
      selectionStyleTag.setAttribute('data-layout-selection-styles', '1');
      selectionStyleTag.textContent = `
        [data-layout-edit-mode="1"] [data-layout-node-id] {
          cursor: pointer !important;
        }

        [data-layout-edit-mode="1"][data-layout-show-selectable="1"] [data-layout-node-id] {
          outline: 2px dashed rgba(37, 99, 235, 0.88) !important;
          outline-offset: 2px !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 0 2px rgba(37, 99, 235, 0.08) !important;
        }

        [data-layout-edit-mode="1"][data-layout-show-selectable="0"] [data-layout-node-id] {
          outline: none !important;
          box-shadow: none !important;
        }

        [data-layout-edit-mode="1"][data-layout-show-selectable="1"] [data-layout-node-id]:hover {
          outline-color: rgba(29, 78, 216, 1) !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 0 3px rgba(37, 99, 235, 0.14) !important;
        }

        @keyframes layoutHintPulse {
          0% { outline-color: rgba(37, 99, 235, 0.9); }
          50% { outline-color: rgba(14, 116, 144, 1); }
          100% { outline-color: rgba(37, 99, 235, 0.9); }
        }

        [data-layout-edit-mode="1"][data-layout-click-hints="1"] [data-layout-node-id]:not([data-layout-selected="1"]) {
          outline-width: 3px !important;
          outline-style: dashed !important;
          outline-offset: 2px !important;
          animation: layoutHintPulse 1.35s ease-in-out infinite !important;
          box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.1), inset 0 0 0 9999px rgba(37, 99, 235, 0.03) !important;
        }

        [data-layout-edit-mode="1"] [data-layout-node-id][data-layout-selected="1"] {
          outline: 3px solid rgba(37, 99, 235, 1) !important;
          outline-offset: 3px !important;
          animation: none !important;
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.18), inset 0 0 0 4px rgba(37, 99, 235, 0.14) !important;
        }

        [data-layout-edit-mode="1"] [data-widget-root="1"] {
          outline: 2px dashed #16a34a !important;
          outline-offset: 3px !important;
        }
      `;
      document.head.appendChild(selectionStyleTag);
    };

    const createRing = (border: string, background: string, zIndex: number) => {
      const ring = document.createElement('div');
      ring.setAttribute('data-layout-ignore', '1');
      ring.style.position = 'fixed';
      ring.style.left = '0';
      ring.style.top = '0';
      ring.style.width = '0';
      ring.style.height = '0';
      ring.style.border = border;
      ring.style.background = background;
      ring.style.pointerEvents = 'none';
      ring.style.zIndex = String(zIndex);
      ring.style.borderRadius = '4px';
      ring.style.boxSizing = 'border-box';
      ring.style.display = 'none';
      return ring;
    };

    const mountRings = () => {
      hoverRing = createRing('2px dashed rgba(59,130,246,0.95)', 'rgba(59,130,246,0.08)', 9996);
      selectedRing = createRing('2px solid #2563eb', 'rgba(37,99,235,0.08)', 9997);
      dropLine = document.createElement('div');
      dropLine.setAttribute('data-layout-ignore', '1');
      dropLine.style.position = 'fixed';
      dropLine.style.left = '0';
      dropLine.style.top = '0';
      dropLine.style.width = '0';
      dropLine.style.height = '0';
      dropLine.style.borderTop = '3px solid #10b981';
      dropLine.style.boxShadow = '0 0 0 1px rgba(16,185,129,0.25)';
      dropLine.style.pointerEvents = 'none';
      dropLine.style.zIndex = '9998';
      dropLine.style.display = 'none';
      document.body.appendChild(hoverRing);
      document.body.appendChild(selectedRing);
      document.body.appendChild(dropLine);
    };

    const placeRing = (ring: HTMLDivElement | null, node: HTMLElement | null) => {
      if (!ring) return;
      if (!node) {
        ring.style.display = 'none';
        return;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) {
        ring.style.display = 'none';
        return;
      }

      ring.style.display = 'block';
      ring.style.left = `${Math.max(0, rect.left)}px`;
      ring.style.top = `${Math.max(0, rect.top)}px`;
      ring.style.width = `${rect.width}px`;
      ring.style.height = `${rect.height}px`;
    };

    const placeDropLine = (node: HTMLElement | null, placement: 'before' | 'after') => {
      if (!dropLine || !node) {
        if (dropLine) dropLine.style.display = 'none';
        return;
      }

      const rect = node.getBoundingClientRect();
      dropLine.style.display = 'block';
      dropLine.style.left = `${Math.max(0, rect.left)}px`;
      dropLine.style.width = `${Math.max(0, rect.width)}px`;
      dropLine.style.top = `${placement === 'before' ? rect.top - 1 : rect.bottom - 1}px`;
      dropLine.style.height = '0';
    };

    const isLineLikeRect = (rect: DOMRect): boolean => {
      const horizontalLine = rect.width >= 120 && rect.height >= 1 && rect.height <= 10;
      const verticalLine = rect.height >= 120 && rect.width >= 1 && rect.width <= 10;
      return horizontalLine || verticalLine;
    };

    const isSelectableRect = (rect: DOMRect): boolean => {
      return (rect.width >= 16 && rect.height >= 16) || isLineLikeRect(rect);
    };

    const resolveEditableTarget = (from: HTMLElement): HTMLElement | null => {
      const widgetOverlay = from.closest<HTMLElement>('[data-widget-overlay="1"]');
      if (widgetOverlay) {
        return widgetOverlay.closest<HTMLElement>('[data-widget-root="1"]');
      }

      // Clicking the iframe itself should still select a parent container.
      if (from.tagName.toLowerCase() === 'iframe') {
        const iframeElement = from as HTMLIFrameElement;
        const widgetWrapper = iframeElement.closest<HTMLElement>('[data-widget-root="1"], #gutschein-widget-wrapper');
        if (widgetWrapper) return widgetWrapper;
        const parentContainer = iframeElement.parentElement?.closest<HTMLElement>('section, div, main, article');
        if (parentContainer) return parentContainer;
      }

      const target = from.closest<HTMLElement>('section, div, header, nav, main, footer, article, aside, hr');
      if (!target) return null;
      if (target.closest('[data-layout-toolbar="true"]')) return null;
      if (target.getAttribute('data-layout-ignore') === '1') return null;
      if (target.getAttribute('data-widget-root') === '1') return target;
      if (target.getAttribute('data-widget-iframe') === '1') {
        return target.closest<HTMLElement>('[data-widget-root="1"]');
      }
      return target;
    };

    const pickBestNodeAtPoint = (clientX: number, clientY: number): HTMLElement | null => {
      const allNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-layout-node-id]'));
      const matching: Array<{ node: HTMLElement; area: number }> = [];

      allNodes.forEach((node) => {
        if (node.closest('[data-layout-toolbar="true"]')) return;
        if (node.getAttribute('data-layout-ignore') === '1') return;

        const rect = node.getBoundingClientRect();
        if (!isSelectableRect(rect)) return;

        const inside = clientX >= rect.left
          && clientX <= rect.right
          && clientY >= rect.top
          && clientY <= rect.bottom;

        if (!inside) return;

        matching.push({ node, area: rect.width * rect.height });
      });

      if (matching.length === 0) return null;

      // Prefer the most specific visible container at cursor position.
      matching.sort((a, b) => a.area - b.area);
      return matching[0].node;
    };

    const normalizeCandidate = (node: HTMLElement | null): HTMLElement | null => {
      if (!node) return null;
      let current: HTMLElement | null = node;

      while (current && root.contains(current)) {
        if (!current.dataset.layoutNodeId) {
          current = current.parentElement?.closest<HTMLElement>('[data-layout-node-id]') || null;
          continue;
        }

        const rect = current.getBoundingClientRect();
        if (isSelectableRect(rect)) {
          return current;
        }

        current = current.parentElement?.closest<HTMLElement>('[data-layout-node-id]') || null;
      }

      return null;
    };

    const assignEditableMarkers = () => {
      let changed = false;

      // Normalize existing widget iframes so they are always manageable as one wrapper block.
      const orphanWidgetIframes = Array.from(
        root.querySelectorAll<HTMLIFrameElement>('#gutschein-widget-iframe, iframe[data-widget-iframe="1"], iframe[data-gutschein-widget="1"], iframe[src*="/embed/"], iframe[src*="embed/"]')
      );
      orphanWidgetIframes.forEach((iframe) => {
        const alreadyWrapped = iframe.closest<HTMLElement>('[data-widget-root="1"], #gutschein-widget-wrapper');
        if (alreadyWrapped) return;
        if (!iframe.parentElement) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-widget-root', '1');
        wrapper.style.width = '100%';
        iframe.parentElement.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);
        changed = true;
      });

      const candidates = Array.from(root.querySelectorAll<HTMLElement>('section, div, header, nav, main, footer, article, aside, hr'));
      let maxId = 0;
      candidates.forEach((node) => {
        const current = Number(node.dataset.layoutNodeId || '0');
        if (Number.isFinite(current) && current > maxId) {
          maxId = current;
        }
      });

      candidates.forEach((node) => {
        node.dataset.layoutEditable = '1';
        if (!node.dataset.layoutNodeId) {
          maxId += 1;
          node.dataset.layoutNodeId = String(maxId);
          changed = true;
        }
        node.style.removeProperty('cursor');
        node.style.removeProperty('outline');
        node.style.removeProperty('outline-offset');
        node.style.removeProperty('box-shadow');
        node.dataset.layoutSelected = node.dataset.layoutNodeId === selectedNodeId ? '1' : '0';
      });

      // Persist generated ids once so selection remains stable across rerenders.
      if (changed) {
        setWorkingHtml(root.innerHTML);
      }

      if (selectedNodeId) {
        const selectedNode = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
        if (selectedNode) {
          selectedNode.dataset.layoutSelected = '1';
        }
        placeRing(selectedRing, selectedNode || null);
      } else {
        placeRing(selectedRing, null);
      }

      const widgetWrappers = getWidgetWrappers();
      widgetWrappers.forEach((widgetWrapper) => {
        widgetWrapper.style.setProperty('position', 'relative', 'important');

        let overlay = widgetWrapper.querySelector<HTMLElement>('[data-widget-overlay="1"]');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.setAttribute('data-widget-overlay', '1');
          overlay.setAttribute('data-layout-ignore', '1');
          widgetWrapper.appendChild(overlay);
        }

        overlay.style.setProperty('position', 'absolute', 'important');
        overlay.style.setProperty('inset', '0', 'important');
        overlay.style.setProperty('cursor', 'pointer', 'important');
        overlay.style.setProperty('background', 'transparent', 'important');
        overlay.style.setProperty('z-index', '8', 'important');

        let dragHandle = widgetWrapper.querySelector<HTMLElement>('[data-widget-drag-handle="1"]');
        if (!dragHandle) {
          dragHandle = document.createElement('div');
          dragHandle.setAttribute('data-widget-drag-handle', '1');
          dragHandle.setAttribute('data-layout-ignore', '1');
          dragHandle.textContent = 'Widget ziehen';
          widgetWrapper.appendChild(dragHandle);
        }

        dragHandle.style.setProperty('position', 'absolute', 'important');
        dragHandle.style.setProperty('top', '8px', 'important');
        dragHandle.style.setProperty('right', '8px', 'important');
        dragHandle.style.setProperty('z-index', '10', 'important');
        dragHandle.style.setProperty('padding', '4px 8px', 'important');
        dragHandle.style.setProperty('font-size', '12px', 'important');
        dragHandle.style.setProperty('font-weight', '700', 'important');
        dragHandle.style.setProperty('line-height', '1.2', 'important');
        dragHandle.style.setProperty('color', '#ffffff', 'important');
        dragHandle.style.setProperty('background', 'rgba(2,132,199,0.92)', 'important');
        dragHandle.style.setProperty('border', '1px solid rgba(3,105,161,0.95)', 'important');
        dragHandle.style.setProperty('border-radius', '999px', 'important');
        dragHandle.style.setProperty('cursor', 'grab', 'important');
        dragHandle.style.setProperty('user-select', 'none', 'important');
        dragHandle.style.setProperty('pointer-events', 'auto', 'important');
      });

      setWidgetCount(widgetWrappers.length);

      if (selectedNodeId) {
        const index = widgetWrappers.findIndex((node) => node.dataset.layoutNodeId === selectedNodeId);
        setSelectedWidgetIndex(index >= 0 ? index : null);
      } else {
        setSelectedWidgetIndex(null);
      }

      // Prevent accidental navigation/click handlers inside customer page while editing.
      const interactives = Array.from(root.querySelectorAll<HTMLElement>('a, button, input, textarea, select, label, summary'));
      interactives.forEach((node) => {
        node.style.pointerEvents = 'none';
      });

      const clearSelectionFlags = () => {
        root.querySelectorAll<HTMLElement>('[data-layout-node-id][data-layout-selected="1"]').forEach((node) => {
          if (node.dataset.layoutNodeId !== selectedNodeId) {
            node.dataset.layoutSelected = '0';
          }
        });
      };

      clearSelectionFlags();
    };

    const scheduleRefresh = () => {
      if (refreshRafId) return;
      refreshRafId = window.requestAnimationFrame(() => {
        refreshRafId = 0;
        assignEditableMarkers();
      });
    };

    installSelectionStyles();
    mountRings();
    assignEditableMarkers();

    mutationObserver = new MutationObserver(() => {
      scheduleRefresh();
    });
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-layout-node-id', 'data-widget-root', 'data-widget-iframe'],
    });

    const resolveFromEventPath = (event: MouseEvent): HTMLElement | null => {
      const path = event.composedPath();

      const toolbarNode = path.find(
        (node) => node instanceof HTMLElement && node.closest('[data-layout-toolbar="true"]')
      );
      if (toolbarNode) return null;

      const firstElementFromPath = path.find((node) => node instanceof HTMLElement) as HTMLElement | undefined;
      if (firstElementFromPath && root.contains(firstElementFromPath)) {
        const resolved = resolveEditableTarget(firstElementFromPath);
        const normalized = normalizeCandidate(resolved);
        if (normalized) return normalized;
      }

      // Fallback for complex imported pages where composedPath may miss useful nodes.
      const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (elementAtPoint && root.contains(elementAtPoint)) {
        const resolvedFromPoint = resolveEditableTarget(elementAtPoint);
        const normalizedFromPoint = normalizeCandidate(resolvedFromPoint);
        if (normalizedFromPoint) return normalizedFromPoint;
      }

      return pickBestNodeAtPoint(event.clientX, event.clientY);
    };

    const processHover = () => {
      hoverRafId = 0;
      if (!pendingHoverEvent) return;
      if (draggingWidget) return;

      const candidate = resolveFromEventPath(pendingHoverEvent);
      pendingHoverEvent = null;

      const nextId = candidate?.dataset.layoutNodeId || '';
      if (nextId === lastHoverNodeId) return;
      lastHoverNodeId = nextId;
      placeRing(hoverRing, candidate);
    };

    const hoverHandler = (event: MouseEvent) => {
      if (draggingWidget) return;
      pendingHoverEvent = event;
      if (hoverRafId) return;
      hoverRafId = window.requestAnimationFrame(processHover);
    };

    const updateDropTargetFromPoint = (clientX: number, clientY: number) => {
      if (!draggingWidget) return;

      const rawElement = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      if (!rawElement || !root.contains(rawElement)) {
        dropTargetNode = null;
        placeDropLine(null, 'before');
        return;
      }

      const resolved = normalizeCandidate(resolveEditableTarget(rawElement));
      if (!resolved) {
        dropTargetNode = null;
        placeDropLine(null, 'before');
        return;
      }

      if (resolved === draggingWidget || draggingWidget.contains(resolved)) {
        dropTargetNode = null;
        placeDropLine(null, 'before');
        return;
      }

      const rect = resolved.getBoundingClientRect();
      dropPlacement = clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      dropTargetNode = resolved;
      placeDropLine(dropTargetNode, dropPlacement);
    };

    const startWidgetDrag = (event: MouseEvent, widgetWrapper: HTMLElement) => {
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      draggingWidget = widgetWrapper;
      dropTargetNode = null;
      placeRing(hoverRing, null);
      widgetWrapper.style.opacity = '0.72';
      document.body.style.userSelect = 'none';
      setStatusText('Widget ziehen: Ziel-Container anfahren und loslassen');
      updateDropTargetFromPoint(event.clientX, event.clientY);
    };

    const clickHandler = (event: MouseEvent) => {
      if (draggingWidget) return;
      let candidate = resolveFromEventPath(event);
      if (!candidate) {
        setStatusText('Kein auswaehlbarer Container an dieser Stelle');
        return;
      }

      // Repeated click on same node climbs up to a bigger parent container.
      const currentNodeId = candidate.dataset.layoutNodeId || '';
      if (currentNodeId && currentNodeId === selectedNodeId) {
        const parentCandidate = candidate.parentElement?.closest<HTMLElement>('[data-layout-node-id]');
        if (parentCandidate && root.contains(parentCandidate)) {
          candidate = normalizeCandidate(parentCandidate) || parentCandidate;
        }
      }

      event.preventDefault();
      event.stopPropagation();

      const nodeId = candidate.dataset.layoutNodeId || '';
      setSelectedNodeId(nodeId);
      const tagName = candidate.tagName.toLowerCase();
      const className = (candidate.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      setSelectedNodeInfo(className ? `${tagName}.${className}` : tagName);
      setStatusText('Element ausgewaehlt');
      placeRing(selectedRing, candidate);
    };

    const refreshSelectedRing = () => {
      if (!selectedNodeId) {
        placeRing(selectedRing, null);
        return;
      }
      const selectedNode = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
      placeRing(selectedRing, selectedNode || null);
    };

    const dragMouseDownHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const handle = target.closest<HTMLElement>('[data-widget-drag-handle="1"]');
      if (!handle) return;

      const widgetWrapper = handle.closest<HTMLElement>('[data-widget-root="1"], #gutschein-widget-wrapper');
      if (!widgetWrapper || !root.contains(widgetWrapper)) return;

      startWidgetDrag(event, widgetWrapper);
    };

    const dragMouseMoveHandler = (event: MouseEvent) => {
      if (!draggingWidget) return;
      event.preventDefault();
      updateDropTargetFromPoint(event.clientX, event.clientY);
    };

    const dragMouseUpHandler = () => {
      if (!draggingWidget) return;

      const beforeHtml = root.innerHTML;
      const dragged = draggingWidget;

      dragged.style.opacity = '';
      document.body.style.userSelect = '';

      if (dropTargetNode && dropTargetNode.parentElement) {
        if (dropPlacement === 'before') {
          dropTargetNode.parentElement.insertBefore(dragged, dropTargetNode);
        } else {
          dropTargetNode.parentElement.insertBefore(dragged, dropTargetNode.nextSibling);
        }

        setHistory((prev) => [...prev, beforeHtml]);
        const nextHtml = root.innerHTML;
        setWorkingHtml(nextHtml);
        setExportHtml(nextHtml);
        setSelectedNodeId(dragged.dataset.layoutNodeId || '');
        setStatusText('Widget per Drag&Drop verschoben');
      } else {
        setStatusText('Widget-Drag abgebrochen (kein Ziel)');
      }

      placeDropLine(null, 'before');
      draggingWidget = null;
      dropTargetNode = null;
    };

    document.addEventListener('mousemove', hoverHandler, true);
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('mousedown', dragMouseDownHandler, true);
    document.addEventListener('mousemove', dragMouseMoveHandler, true);
    document.addEventListener('mouseup', dragMouseUpHandler, true);
    window.addEventListener('scroll', refreshSelectedRing, true);
    window.addEventListener('resize', refreshSelectedRing);

    return () => {
      document.removeEventListener('mousemove', hoverHandler, true);
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('mousedown', dragMouseDownHandler, true);
      document.removeEventListener('mousemove', dragMouseMoveHandler, true);
      document.removeEventListener('mouseup', dragMouseUpHandler, true);
      window.removeEventListener('scroll', refreshSelectedRing, true);
      window.removeEventListener('resize', refreshSelectedRing);
      if (hoverRafId) {
        window.cancelAnimationFrame(hoverRafId);
      }
      if (refreshRafId) {
        window.cancelAnimationFrame(refreshRafId);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      document.body.style.userSelect = '';
      if (hoverRing?.parentElement) hoverRing.parentElement.removeChild(hoverRing);
      if (selectedRing?.parentElement) selectedRing.parentElement.removeChild(selectedRing);
      if (dropLine?.parentElement) dropLine.parentElement.removeChild(dropLine);
      if (selectionStyleTag?.parentElement) selectionStyleTag.parentElement.removeChild(selectionStyleTag);
      root.removeAttribute('data-layout-edit-mode');
      root.removeAttribute('data-layout-show-selectable');
      root.removeAttribute('data-layout-click-hints');
    };
  }, [isLayoutEditMode, selectedNodeId, showSelectableElements, showClickHints, renderedHtml]);

  const applyActionToSelection = () => {
    if (!isLayoutEditMode) return;
    const root = rootRef.current;
    if (!root) return;
    if (!selectedNodeId) {
      setStatusText('Bitte zuerst ein Element auswaehlen');
      return;
    }

    setStatusText(`Aktion wird ausgefuehrt fuer Auswahl ${selectedNodeId}`);

    const candidate = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
    if (!candidate) {
      setStatusText('Auswahl nicht mehr gueltig, bitte erneut klicken');
      setSelectedNodeId('');
      return;
    }

    const beforeHtml = root.innerHTML;
    const existingWidgetWrapper = ensureSingleWidget(root, findWidgetWrappers(root)[0] || null);

    if (editAction === 'remove') {
      candidate.remove();
      setStatusText('Auswahl entfernt');
      setSelectedNodeId('');
    } else if (editAction === 'swapUp') {
      const previous = candidate.previousElementSibling;
      if (previous && candidate.parentElement) {
        candidate.parentElement.insertBefore(candidate, previous);
        setStatusText('Auswahl nach oben getauscht');
      } else {
        setStatusText('Kein Element oberhalb zum Tauschen');
        return;
      }
    } else if (editAction === 'swapDown') {
      const next = candidate.nextElementSibling;
      if (next && candidate.parentElement) {
        candidate.parentElement.insertBefore(next, candidate);
        setStatusText('Auswahl nach unten getauscht');
      } else {
        setStatusText('Kein Element unterhalb zum Tauschen');
        return;
      }
    } else if (editAction === 'placeWidgetBefore') {
      if (!candidate.parentElement) {
        setStatusText('Ziel-Container ungueltig');
        return;
      }

      const widgetWrapper = existingWidgetWrapper || createWidgetWrapperNode();
      if (widgetWrapper.contains(candidate)) {
        setStatusText('Ziel liegt im Widget-Container und ist ungueltig');
        return;
      }
      candidate.parentElement.insertBefore(widgetWrapper, candidate);
      ensureSingleWidget(root, widgetWrapper);
      setStatusText(existingWidgetWrapper ? 'Widget vor der Auswahl platziert' : 'Neues Widget vor der Auswahl eingefuegt');
    } else if (editAction === 'placeWidgetInside') {
      const widgetWrapper = existingWidgetWrapper || createWidgetWrapperNode();
      if (widgetWrapper.contains(candidate)) {
        setStatusText('Ziel liegt im Widget-Container und ist ungueltig');
        return;
      }
      candidate.appendChild(widgetWrapper);
      ensureSingleWidget(root, widgetWrapper);
      setStatusText(existingWidgetWrapper ? 'Widget in die Auswahl verschoben' : 'Neues Widget in die Auswahl eingefuegt');
    }

    setHistory((prev) => [...prev, beforeHtml]);
    const nextHtml = root.innerHTML;
    setWorkingHtml(nextHtml);
    setExportHtml(nextHtml);
  };

  const selectParentNode = () => {
    const root = rootRef.current;
    if (!root || !selectedNodeId) return;

    const current = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
    const parent = current?.parentElement?.closest<HTMLElement>('[data-layout-node-id]');
    if (!parent || !root.contains(parent)) {
      setStatusText('Kein uebergeordneter Container gefunden');
      return;
    }

    const nodeId = parent.dataset.layoutNodeId || '';
    setSelectedNodeId(nodeId);
    const tagName = parent.tagName.toLowerCase();
    const className = (parent.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    setSelectedNodeInfo(className ? `${tagName}.${className}` : tagName);
    setStatusText('Auswahl auf uebergeordneten Container gesetzt');
  };

  const selectChildNode = () => {
    const root = rootRef.current;
    if (!root || !selectedNodeId) return;

    const current = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
    const child = current?.querySelector<HTMLElement>('[data-layout-node-id]');
    if (!child || child === current || !root.contains(child)) {
      setStatusText('Kein untergeordneter Container gefunden');
      return;
    }

    const nodeId = child.dataset.layoutNodeId || '';
    setSelectedNodeId(nodeId);
    const tagName = child.tagName.toLowerCase();
    const className = (child.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    setSelectedNodeInfo(className ? `${tagName}.${className}` : tagName);
    setStatusText('Auswahl auf Unter-Container gesetzt');
  };

  const selectNextWidget = () => {
    const root = rootRef.current;
    if (!root) return;
    const widgets = findWidgetWrappers(root);
    if (widgets.length === 0) {
      setStatusText('Kein Widget gefunden');
      return;
    }

    const nextIndex = selectedWidgetIndex === null
      ? 0
      : (selectedWidgetIndex + 1) % widgets.length;

    const nodeId = widgets[nextIndex].dataset.layoutNodeId || '';
    setSelectedNodeId(nodeId);
    setSelectedWidgetIndex(nextIndex);
    setStatusText(`Widget ${nextIndex + 1} von ${widgets.length} ausgewaehlt`);
  };

  const removeSelectedWidget = () => {
    const root = rootRef.current;
    if (!root) return;
    const widgets = findWidgetWrappers(root);
    if (widgets.length === 0) {
      setStatusText('Kein Widget vorhanden');
      return;
    }

    const target = selectedWidgetIndex !== null && widgets[selectedWidgetIndex]
      ? widgets[selectedWidgetIndex]
      : widgets[0];

    const beforeHtml = root.innerHTML;
    target.remove();

    setHistory((prev) => [...prev, beforeHtml]);
    const nextHtml = root.innerHTML;
    setWorkingHtml(nextHtml);
    setExportHtml(nextHtml);
    setSelectedNodeId('');
    setSelectedWidgetIndex(null);
    setStatusText('Ausgewaehltes Widget entfernt');
  };

  const removeDuplicateWidgetsKeepFirst = () => {
    const root = rootRef.current;
    if (!root) return;
    const widgets = findWidgetWrappers(root);
    if (widgets.length <= 1) {
      setStatusText('Keine doppelten Widgets gefunden');
      return;
    }

    const beforeHtml = root.innerHTML;
    widgets.slice(1).forEach((node) => node.remove());

    setHistory((prev) => [...prev, beforeHtml]);
    const nextHtml = root.innerHTML;
    setWorkingHtml(nextHtml);
    setExportHtml(nextHtml);
    setSelectedNodeId('');
    setSelectedWidgetIndex(null);
    setStatusText(`${widgets.length - 1} Duplikat-Widget(s) entfernt`);
  };

  const removeBottomMostWidget = () => {
    const root = rootRef.current;
    if (!root) return;

    const widgets = findWidgetWrappers(root);
    if (widgets.length === 0) {
      setStatusText('Kein Widget vorhanden');
      return;
    }

    const withPosition = widgets.map((node) => ({
      node,
      y: node.getBoundingClientRect().top + window.scrollY,
    }));

    withPosition.sort((a, b) => a.y - b.y);
    const target = withPosition[withPosition.length - 1].node;

    const beforeHtml = root.innerHTML;
    target.remove();

    setHistory((prev) => [...prev, beforeHtml]);
    const nextHtml = root.innerHTML;
    setWorkingHtml(nextHtml);
    setExportHtml(nextHtml);
    setSelectedNodeId('');
    setSelectedWidgetIndex(null);
    setStatusText('Unterstes Widget entfernt');
  };

  const undoLastChange = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setWorkingHtml(previous);
    setExportHtml(previous);
    setSelectedNodeId('');
    setSelectedNodeInfo('');
    setStatusText('Letzte Aenderung rueckgaengig gemacht');
  };

  const resetLayout = () => {
    setWorkingHtml(originalHTML);
    setHistory([]);
    setExportHtml(originalHTML);
    setSelectedNodeId('');
    setSelectedNodeInfo('');
    setStatusText('Layout zurueckgesetzt');
    localStorage.removeItem(layoutStorageKey);
  };

  const copyEditedHtml = async () => {
    if (!exportHtml) return;
    try {
      const cleanedHtml = stripLayoutEditorArtifacts(exportHtml);
      const normalizedHtml = normalizeRelativeAssetUrls(cleanedHtml);
      await navigator.clipboard.writeText(normalizedHtml);
      setCopyState('HTML kopiert');
      window.setTimeout(() => setCopyState(''), 1800);
    } catch (error) {
      console.error('Konnte HTML nicht kopieren:', error);
      setCopyState('Kopieren fehlgeschlagen');
      window.setTimeout(() => setCopyState(''), 1800);
    }
  };

  const saveEditedHtmlToDemo = async () => {
    if (!hasDemoTemplate || !demoDocId) {
      setStatusText('Speichern nur fuer Demo-Seiten mit Demo-Dokument moeglich');
      return;
    }
    if (!exportHtml?.trim()) {
      setStatusText('Kein HTML zum Speichern vorhanden');
      return;
    }

    try {
      setIsSavingHtml(true);
      const cleanedHtml = stripLayoutEditorArtifacts(exportHtml);
      const normalizedHtml = normalizeRelativeAssetUrls(cleanedHtml);
      await updateDoc(doc(db, 'demos', demoDocId), {
        demoHtml: normalizedHtml,
        updatedAt: new Date().toISOString(),
      });
      setStatusText('HTML erfolgreich in der Demo gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern des HTML:', error);
      setStatusText('Speichern fehlgeschlagen');
    } finally {
      setIsSavingHtml(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Widget Demo | ${demoTemplate?.name || displaySlug}`}</title>
        <meta name="description" content="Live Widget-Demo für den ausgewählten Kunden-Slug." />
      </Helmet>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Laden...</p>
        </div>
      ) : (
        <>
          {isProspectDemo && !hasDemoTemplate && !isLayoutEditMode && (
            <div style={{
              maxWidth: '980px',
              margin: '20px auto 0 auto',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #f4e2b8',
              background: '#fff8e8',
              color: '#725016',
              fontSize: '14px',
              fontWeight: 500,
              textAlign: 'center'
            }}>
              Prospect-Demo aktiv fuer {displaySlug}: Es werden Beispielangebote angezeigt, ohne bestehenden Kundenshop.
            </div>
          )}

          {isLayoutEditMode && isToolbarCollapsed && (
            <button
              data-layout-toolbar="true"
              onClick={() => setIsToolbarCollapsed(false)}
              style={{
                position: 'fixed',
                right: 16,
                top: 16,
                zIndex: 9999,
                background: '#0f172a',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: 999,
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.28)'
              }}
            >
              Layout Edit oeffnen
            </button>
          )}

          {isLayoutEditMode && !isToolbarCollapsed && (
            <div
              data-layout-toolbar="true"
              style={{
                position: 'fixed',
                right: 16,
                top: 16,
                zIndex: 9999,
                width: 'min(360px, calc(100vw - 32px))',
                background: '#0f172a',
                color: 'white',
                borderRadius: 12,
                padding: 12,
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
                fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Layout Edit Modus
                </div>
                <button
                  onClick={() => setIsToolbarCollapsed(true)}
                  style={{
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  Minimieren
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>
                1) Element anklicken, 2) Aktion waehlen, 3) Aktion ausfuehren.
              </div>
              <div style={{ fontSize: 12, opacity: 0.95, marginBottom: 8 }}>
                Auswahl: {selectedNodeId || 'keine'}
              </div>
              {selectedNodeInfo && (
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                  Ziel: {selectedNodeInfo}
                </div>
              )}
              <div style={{ fontSize: 12, opacity: 0.95, marginBottom: 8 }}>
                Widgets: {widgetCount} {selectedWidgetIndex !== null ? `(aktiv: ${selectedWidgetIndex + 1})` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <button
                  style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                  onClick={() => setShowSelectableElements((prev) => !prev)}
                >
                  {showSelectableElements ? 'Linien ausblenden' : 'Linien anzeigen'}
                </button>
                <button
                  style={{ background: showClickHints ? '#0f766e' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}
                  onClick={() => setShowClickHints((prev) => !prev)}
                >
                  {showClickHints ? 'Klick-Hinweise AN' : 'Klick-Hinweise AUS'}
                </button>
                <button style={{ background: editAction === 'remove' ? '#2563eb' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditAction('remove')}>Entfernen</button>
                <button style={{ background: editAction === 'swapUp' ? '#2563eb' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditAction('swapUp')}>Tauschen hoch</button>
                <button style={{ background: editAction === 'swapDown' ? '#2563eb' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditAction('swapDown')}>Tauschen runter</button>
                <button style={{ background: editAction === 'placeWidgetBefore' ? '#2563eb' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditAction('placeWidgetBefore')}>Widget davor</button>
                <button style={{ background: editAction === 'placeWidgetInside' ? '#2563eb' : '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditAction('placeWidgetInside')}>Widget hinein</button>
                <button style={{ background: '#059669', color: '#fff', border: '1px solid #047857', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontWeight: 700 }} onClick={applyActionToSelection}>Aktion ausfuehren</button>
                <button style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={undoLastChange}>Undo</button>
                <button style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={resetLayout}>Reset</button>
                <button style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={copyEditedHtml}>HTML kopieren</button>
                <button
                  style={{ background: hasDemoTemplate ? '#7c3aed' : '#334155', color: '#fff', border: '1px solid #4c1d95', borderRadius: 6, padding: '6px 8px', cursor: hasDemoTemplate ? 'pointer' : 'not-allowed', opacity: hasDemoTemplate ? 1 : 0.65 }}
                  onClick={saveEditedHtmlToDemo}
                  disabled={!hasDemoTemplate || isSavingHtml}
                >
                  {isSavingHtml ? 'Speichert...' : 'In Demo speichern'}
                </button>
                <button style={{ background: '#1f2937', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={selectNextWidget}>Naechstes Widget</button>
                <button style={{ background: '#b91c1c', color: '#fff', border: '1px solid #7f1d1d', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={removeSelectedWidget}>Widget entfernen</button>
                <button style={{ background: '#7f1d1d', color: '#fff', border: '1px solid #63171b', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={removeBottomMostWidget}>Unterstes Widget entfernen</button>
                <button style={{ background: '#991b1b', color: '#fff', border: '1px solid #7f1d1d', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={removeDuplicateWidgetsKeepFirst}>Duplikate entfernen</button>
                <button style={{ background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={selectParentNode}>Auswahl nach oben</button>
                <button style={{ background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }} onClick={selectChildNode}>Auswahl nach unten</button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Aktiv: {editAction}
              </div>
              {statusText && (
                <div style={{ fontSize: 12, marginTop: 6, color: '#a7f3d0' }}>
                  {statusText}
                </div>
              )}
              {copyState && (
                <div style={{ fontSize: 12, marginTop: 6, color: '#93c5fd' }}>
                  {copyState}
                </div>
              )}
            </div>
          )}

          <div ref={rootRef} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </>
      )}
    </>
  );
};

export default WidgetDemoBySlug;
