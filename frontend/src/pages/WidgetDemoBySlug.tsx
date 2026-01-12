import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { Helmet } from 'react-helmet';

const WidgetDemoBySlug: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle iframe resize messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'gutschein-widget-resize') {
        const iframe = document.getElementById('gutschein-widget-iframe') as HTMLIFrameElement;
        if (iframe && event.data.height) {
          iframe.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const loadShopData = async () => {
      if (!slug) return;

      try {
        // Try uppercase slug first (JANKIP)
        let shopDoc = await getDoc(doc(db, 'users', slug.toUpperCase()));
        if (shopDoc.exists()) {
          setShopData(shopDoc.data());
        } else {
          // Try lowercase slug
          shopDoc = await getDoc(doc(db, 'users', slug.toLowerCase()));
          if (shopDoc.exists()) {
            setShopData(shopDoc.data());
          } else {
            // Set empty data to allow rendering anyway
            setShopData({});
          }
        }
      } catch (error) {
        console.error('Error loading shop data:', error);
        // Set empty data to allow rendering anyway
        setShopData({});
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [slug]);

  // No need for widget script - iframe handles everything

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Laden...</p>
      </div>
    );
  }

  // Only show for JANKIP demo
  if (slug?.toUpperCase() !== 'JANKIP') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Demo nicht gefunden</h1>
        <p>Diese Demo-Seite existiert nur für JANKIP.</p>
      </div>
    );
  }

  // Original HTML structure with widget integration
  const originalHTML = `
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
            <img loading="lazy" src="https://www.somaticvitality.com/images/66b9e4c0b7869ba7599b37e7_630f0dde08f9af97672ca084_5f4e2ee6806bd25f72b98a05_ornament_wei.webp" alt="Ornament" class="deko1 filter">
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
            <div style="width: 100%;">
                <iframe
                    id="gutschein-widget-iframe"
                    src="/embed/JANKIP"
                    style="width: 100%; border: none; overflow: hidden; height: auto; background: white; display: block; min-height: 600px;"
                    title="Gutschein Widget"
                />
            </div>
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

  return (
    <>
      <Helmet>
        <title>Somatic Vitality | Bodywork | Massage | Berlin - Widget Demo</title>
        <meta name="description" content="Widget Demo für Somatic Vitality - Hier bist du eingeladen, anzukommen – bei dir selbst, in deinem Körper und in deiner inneren Weisheit." />
      </Helmet>

      <div dangerouslySetInnerHTML={{ __html: originalHTML }} />
    </>
  );
};

export default WidgetDemoBySlug;
