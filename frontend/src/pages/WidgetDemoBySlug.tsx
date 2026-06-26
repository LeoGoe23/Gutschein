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

const stripLayoutEditorArtifacts = (html: string): string => {
  try {
    // Keep original HTML structure untouched (including style/link tags),
    // and only remove editor-specific markers and inline style fragments.
    let cleaned = html;

    cleaned = cleaned.replace(/\sdata-layout-editable=("[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\sdata-layout-node-id=("[^"]*"|'[^']*')/gi, '');
    cleaned = cleaned.replace(/\sdata-layout-ignore=("[^"]*"|'[^']*')/gi, '');

    // Remove temporary widget overlay helper nodes injected by layout editor.
    cleaned = cleaned.replace(/<div[^>]*data-widget-overlay=("[^"]*"|'[^']*')[^>]*><\/div>/gi, '');

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
  // Make relative src/href paths root-absolute so routes like /widgetdemo/:slug
  // do not rewrite assets to /widgetdemo/media/... in dev/prod.
  let normalized = html.replace(
    /(\b(?:src|href)\s*=\s*["'])(?!https?:\/\/|\/\/|\/|#|data:|mailto:|tel:)([^"']+)(["'])/gi,
    (_match, prefix, path, suffix) => `${prefix}/${path}${suffix}`
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

const WidgetDemoBySlug: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState<string>('');
  const [shopFound, setShopFound] = useState(true);
  const [demoTemplate, setDemoTemplate] = useState<DemoTemplateData | null>(null);
  const [demoDocId, setDemoDocId] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [workingHtml, setWorkingHtml] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [editAction, setEditAction] = useState<EditAction>('remove');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedNodeInfo, setSelectedNodeInfo] = useState('');
  const [showSelectableElements, setShowSelectableElements] = useState(true);
  const [widgetCount, setWidgetCount] = useState(0);
  const [selectedWidgetIndex, setSelectedWidgetIndex] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');
  const [exportHtml, setExportHtml] = useState('');
  const [copyState, setCopyState] = useState('');
  const [isSavingHtml, setIsSavingHtml] = useState(false);
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

        const parent = iframe.parentElement;
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

  // No need for widget script - iframe handles everything

  const embedSourceSlug = isRealShop
    ? resolvedSlug
    : (demoTemplate?.slug || slug || 'DEMO');

  const layoutStorageKey = useMemo(
    () => `demo-layout-edit:${embedSourceSlug.toLowerCase()}:html`,
    [embedSourceSlug]
  );

  const embedSrc = isProspectDemo
    ? `/embed/${encodeURIComponent(embedSourceSlug)}?demoMode=1&demoLabel=${encodeURIComponent(displaySlug)}`
    : `/embed/${encodeURIComponent(resolvedSlug)}`;

  const widgetIframeMarkup = `
    <div data-widget-root="1" style="width: 100%;">
      <iframe
        data-widget-iframe="1"
        data-gutschein-widget="1"
        src="${embedSrc}"
        style="width: 100%; border: none; overflow: hidden; height: auto; background: white; display: block; min-height: 600px;"
        title="Gutschein Widget"
      ></iframe>
    </div>
  `;

  const createWidgetWrapperNode = (): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-widget-root', '1');
    wrapper.style.width = '100%';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-widget-iframe', '1');
    iframe.setAttribute('data-gutschein-widget', '1');
    iframe.setAttribute('src', embedSrc);
    iframe.setAttribute('title', 'Gutschein Widget');
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.height = 'auto';
    iframe.style.background = 'white';
    iframe.style.display = 'block';
    iframe.style.minHeight = '600px';

    wrapper.appendChild(iframe);
    return wrapper;
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
            ${widgetIframeMarkup}
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
        ${widgetIframeMarkup}
      </div>
    </section>
  `;

  const originalHTML = (() => {
    if (demoTemplate?.demoHtml) {
      const cleanedTemplate = stripLayoutEditorArtifacts(demoTemplate.demoHtml);
      const normalizedTemplate = normalizeRelativeAssetUrls(cleanedTemplate);
      const withImage = normalizedTemplate.replaceAll('{{BILD_URL}}', demoTemplate.bildURL || '');
      if (withImage.includes('{{WIDGET_IFRAME}}')) {
        return withImage.replaceAll('{{WIDGET_IFRAME}}', widgetIframeMarkup);
      }

      if (containsWidgetMarkup(withImage)) {
        return withImage;
      }

      return `${withImage}\n<section class="gutschein-section"><div class="gutschein-container">${widgetIframeMarkup}</div></section>`;
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

    const getWidgetWrappers = () => findWidgetWrappers(root);

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

      const target = from.closest<HTMLElement>('section, div, header, nav, main, footer, article');
      if (!target) return null;
      if (target.closest('[data-layout-toolbar="true"]')) return null;
      if (target.getAttribute('data-layout-ignore') === '1') return null;
      if (target.getAttribute('data-widget-root') === '1') return target;
      if (target.getAttribute('data-widget-iframe') === '1') {
        return target.closest<HTMLElement>('[data-widget-root="1"]');
      }
      return target;
    };

    const assignEditableMarkers = () => {
      const candidates = Array.from(root.querySelectorAll<HTMLElement>('section, div, header, nav, main, footer, article, aside'));
      let maxId = 0;
      candidates.forEach((node) => {
        const current = Number(node.dataset.layoutNodeId || '0');
        if (Number.isFinite(current) && current > maxId) {
          maxId = current;
        }
      });

      let changed = false;
      candidates.forEach((node) => {
        node.dataset.layoutEditable = '1';
        if (!node.dataset.layoutNodeId) {
          maxId += 1;
          node.dataset.layoutNodeId = String(maxId);
          changed = true;
        }
        node.style.cursor = 'pointer';
        if (showSelectableElements) {
          node.style.outline = '1px dashed rgba(59,130,246,0.45)';
          node.style.outlineOffset = '1px';
        } else {
          node.style.outline = '';
          node.style.outlineOffset = '';
        }
      });

      // Persist generated ids once so selection remains stable across rerenders.
      if (changed) {
        setWorkingHtml(root.innerHTML);
      }

      if (selectedNodeId) {
        const selectedNode = root.querySelector<HTMLElement>(`[data-layout-node-id="${selectedNodeId}"]`);
        if (selectedNode) {
          selectedNode.style.outline = '2px solid #2563eb';
          selectedNode.style.outlineOffset = '2px';
        }
      }

      const widgetWrappers = getWidgetWrappers();
      widgetWrappers.forEach((widgetWrapper) => {
        widgetWrapper.style.position = 'relative';
        widgetWrapper.style.outline = '2px dashed #16a34a';
        widgetWrapper.style.outlineOffset = '3px';

        let overlay = widgetWrapper.querySelector<HTMLElement>('[data-widget-overlay="1"]');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.setAttribute('data-widget-overlay', '1');
          overlay.setAttribute('data-layout-ignore', '1');
          widgetWrapper.appendChild(overlay);
        }

        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.cursor = 'pointer';
        overlay.style.background = 'transparent';
        overlay.style.zIndex = '8';
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
    };

    assignEditableMarkers();

    const clickHandler = (event: MouseEvent) => {
      const path = event.composedPath();

      const toolbarNode = path.find(
        (node) => node instanceof HTMLElement && node.closest('[data-layout-toolbar="true"]')
      );
      if (toolbarNode) return;

      const firstElementFromPath = path.find((node) => node instanceof HTMLElement) as HTMLElement | undefined;
      if (!firstElementFromPath) return;
      if (!root.contains(firstElementFromPath)) return;

      let candidate = resolveEditableTarget(firstElementFromPath);
      if (!candidate || !root.contains(candidate)) return;

      // Repeated click on same node climbs up to a bigger parent container.
      const currentNodeId = candidate.dataset.layoutNodeId || '';
      if (currentNodeId && currentNodeId === selectedNodeId) {
        const parentCandidate = candidate.parentElement?.closest<HTMLElement>('[data-layout-node-id]');
        if (parentCandidate && root.contains(parentCandidate)) {
          candidate = parentCandidate;
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
    };

    document.addEventListener('click', clickHandler, true);
    return () => {
      document.removeEventListener('click', clickHandler, true);
    };
  }, [isLayoutEditMode, selectedNodeId, showSelectableElements, renderedHtml]);

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
    const existingWidgetWrapper = findWidgetWrappers(root)[0] || null;

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
      setStatusText(existingWidgetWrapper ? 'Widget vor der Auswahl platziert' : 'Neues Widget vor der Auswahl eingefuegt');
    } else if (editAction === 'placeWidgetInside') {
      const widgetWrapper = existingWidgetWrapper || createWidgetWrapperNode();
      if (widgetWrapper.contains(candidate)) {
        setStatusText('Ziel liegt im Widget-Container und ist ungueltig');
        return;
      }
      candidate.appendChild(widgetWrapper);
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

          {isLayoutEditMode && (
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
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Layout Edit Modus
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
                  {showSelectableElements ? 'Elemente ausblenden' : 'Alle Elemente anzeigen'}
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
