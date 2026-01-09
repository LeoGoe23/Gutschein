const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gutscheinery';

const landingPages = [
  {
    title: 'Digitales Gutscheinsystem für Friseure – Mehr Umsatz durch automatisierten Gutscheinverkauf',
    slug: 'gutscheinsystem-friseure',
    metaTitle: 'Digitales Gutscheinsystem für Friseure | Gutscheinery',
    metaDescription: 'Verkaufen Sie Gutscheine digital und steigern Sie Ihren Umsatz. Automatischer Versand per E-Mail, sofortige Zahlung, keine Provision. Jetzt Demo buchen.',
    content: `<div style="max-width: 900px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; color: #111827; line-height: 1.7;">

  <!-- Hero Section -->
  <div style="text-align: center; padding: 60px 20px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 50px;">
    <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; line-height: 1.2;">
      Digitales Gutscheinsystem für Friseure<br/>
      <span style="font-size: 2rem; font-weight: 600;">Mehr Umsatz durch automatisierten Gutscheinverkauf</span>
    </h1>
    <p style="font-size: 1.25rem; margin-bottom: 35px; opacity: 0.95;">
      Verkaufen Sie Gutscheine 24/7 online – automatisch per E-Mail zugestellt, sofortige Zahlung auf Ihr Konto, keine Provisionen
    </p>
    <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: white; color: #667eea; padding: 18px 45px; font-size: 1.1rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;">
      Kostenlose Demo buchen
    </a>
    <p style="font-size: 0.9rem; margin-top: 15px; opacity: 0.9;">15-Minuten-Gespräch | Unverbindlich | Sofort umsetzbar</p>
  </div>

  <!-- Trust Section -->
  <div style="text-align: center; margin-bottom: 50px; padding: 30px 20px; background: #f9fafb; border-radius: 8px;">
    <p style="font-size: 1rem; color: #6b7280; font-weight: 600; margin-bottom: 10px;">Unser System ist erfolgreich bei Kunden im Einsatz</p>
    <p style="font-size: 0.95rem; color: #9ca3af;">Einfache Integration | Keine Vertragslaufzeit | Faire Preise</p>
  </div>

  <!-- Why Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 25px; color: #111827;">
      Warum Friseure auf digitale Gutscheine setzen sollten
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      Gutscheine sind eine der profitabelsten Einnahmequellen für Friseursalons. Doch der manuelle Verkauf kostet Zeit, die Sie in Ihre Kunden investieren sollten. Mit einem digitalen Gutscheinsystem verkaufen Sie automatisch – auch außerhalb Ihrer Öffnungszeiten.
    </p>
    <p style="font-size: 1.1rem; color: #374151;">
      <strong>Das Ergebnis:</strong> Mehr Umsatz, mehr Liquidität und zufriedenere Kunden, die Ihre Gutscheine sofort per E-Mail erhalten.
    </p>
  </div>

  <!-- Problems Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: #111827;">
      Diese Probleme kennen Sie aus Ihrem Salon-Alltag
    </h2>

    <div style="background: #fff; border-left: 4px solid #ef4444; padding: 25px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
        Problem 1: Leerlaufzeiten zwischen Terminen
      </h3>
      <p style="font-size: 1.05rem; color: #374151;">
        Ein Kunde fragt nach einem Gutschein, aber Sie sind gerade mitten im Haarschnitt. Der Kunde geht ohne Gutschein – und Sie verlieren Umsatz.
      </p>
    </div>

    <div style="background: #fff; border-left: 4px solid #ef4444; padding: 25px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
        Problem 2: Aufwändiger manueller Gutscheinverkauf
      </h3>
      <p style="font-size: 1.05rem; color: #374151;">
        Gutscheine von Hand ausfüllen, Kassenbuch führen, Belege aufbewahren – das kostet Zeit, die Sie nicht haben.
      </p>
    </div>

    <div style="background: #fff; border-left: 4px solid #ef4444; padding: 25px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
        Problem 3: Liquiditätsengpässe in ruhigen Monaten
      </h3>
      <p style="font-size: 1.05rem; color: #374151;">
        Im Januar und Februar sind die Salons leer – aber die Kosten laufen weiter. Gutscheine bringen sofort Geld in die Kasse, auch wenn sie erst später eingelöst werden.
      </p>
    </div>
  </div>

  <!-- How It Works Section -->
  <div style="margin-bottom: 60px; background: #f0f9ff; padding: 40px 30px; border-radius: 12px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 25px; color: #111827; text-align: center;">
      So funktioniert das digitale Gutscheinsystem von Gutscheinery
    </h2>
    <p style="font-size: 1.1rem; color: #374151; text-align: center; margin-bottom: 40px;">
      In 3 einfachen Schritten zum automatisierten Gutscheinverkauf
    </p>

    <div style="display: grid; gap: 25px;">
      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: #667eea; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">1</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Integration in Ihre Website</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          Wir binden das Gutscheinsystem mit wenigen Klicks in Ihre bestehende Website ein. Kein technisches Wissen erforderlich.
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: #667eea; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">2</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Kunde kauft online</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          Ihre Kunden kaufen Gutscheine rund um die Uhr auf Ihrer Website – auch abends, am Wochenende oder an Feiertagen.
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: #667eea; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">3</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Automatischer E-Mail-Versand</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          Der Gutschein wird sofort per E-Mail zugestellt. Sie erhalten das Geld direkt auf Ihr Konto – ohne Umwege, ohne Provisionen.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 35px;">
      <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: #667eea; color: white; padding: 16px 40px; font-size: 1.05rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(102,126,234,0.4);">
        15-Minuten-Gespräch vereinbaren
      </a>
    </div>
  </div>

  <!-- Benefits Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: #111827;">
      5 konkrete Vorteile für Ihren Friseursalon
    </h2>

    <div style="display: grid; gap: 20px;">
      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil 1: Automatischer Gutscheinverkauf rund um die Uhr
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          Verkaufen Sie Gutscheine auch außerhalb Ihrer Öffnungszeiten. Ihr System arbeitet für Sie – auch nachts und am Wochenende.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil 2: Sofortige Zahlung direkt auf Ihr Konto
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          Keine Wartezeiten, keine Auszahlungslimits. Das Geld aus dem Gutscheinverkauf landet sofort auf Ihrem Konto.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil 3: Liquidität in schwachen Monaten
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          Vor Weihnachten und zum Valentinstag verkaufen Sie besonders viele Gutscheine – und haben Geld in der Kasse, bevor die Leistung erbracht wird.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil 4: Kein technisches Know-how erforderlich
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          Wir kümmern uns um die Technik. Sie konzentrieren sich auf Ihre Kunden und Ihr Handwerk.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil 5: Mehr Zeit für Ihre Kunden
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          Kein Ausfüllen von Gutscheinen per Hand, keine Buchführung. Sie sparen Zeit und können sich auf das konzentrieren, was Sie am besten können.
        </p>
      </div>
    </div>
  </div>

  <!-- Email Delivery Section -->
  <div style="margin-bottom: 60px; background: #fffbeb; padding: 40px 30px; border-radius: 12px; border: 2px solid #fbbf24;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: #111827;">
      Warum der direkte E-Mail-Versand für Friseure perfekt ist
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      Ihre Kunden wollen Gutscheine <strong>sofort</strong> verschenken können. Mit dem E-Mail-Versand geht das in Sekunden:
    </p>
    <ul style="font-size: 1.05rem; color: #374151; margin-bottom: 20px; padding-left: 25px;">
      <li style="margin-bottom: 10px;"><strong>Kein Warten:</strong> Der Gutschein kommt sofort nach dem Kauf per E-Mail</li>
      <li style="margin-bottom: 10px;"><strong>Perfekt zum Verschenken:</strong> Kann direkt an den Beschenkten weitergeleitet werden</li>
      <li style="margin-bottom: 10px;"><strong>Umweltfreundlich:</strong> Kein Papier, kein Druck, keine Versandkosten</li>
      <li style="margin-bottom: 10px;"><strong>Immer griffbereit:</strong> Der Gutschein kann nicht verloren gehen</li>
    </ul>
    <p style="font-size: 1.05rem; color: #374151; font-weight: 600;">
      Ihre Kunden lieben die Bequemlichkeit – und Sie profitieren von mehr Verkäufen.
    </p>
  </div>

  <!-- Trust/Control Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: #111827;">
      Ihr Salon, Ihre Regeln – Kein Marktplatz, keine Provisionen
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      Anders als bei Groupon, Treatwell oder anderen Gutschein-Plattformen behalten <strong>Sie</strong> die volle Kontrolle:
    </p>
    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <ul style="font-size: 1.05rem; color: #374151; padding-left: 25px; margin: 0;">
        <li style="margin-bottom: 15px;"><strong>Keine Provisionen:</strong> Sie behalten 100% des Gutscheinwerts</li>
        <li style="margin-bottom: 15px;"><strong>Ihre Preise:</strong> Sie legen fest, was Ihre Gutscheine kosten</li>
        <li style="margin-bottom: 15px;"><strong>Ihre Kunden:</strong> Die Kundendaten gehören Ihnen, nicht uns</li>
        <li style="margin-bottom: 15px;"><strong>Ihre Marke:</strong> Der Gutschein trägt Ihr Logo und Ihr Design</li>
        <li style="margin-bottom: 15px;"><strong>Sofortige Zahlung:</strong> Das Geld geht direkt auf Ihr Konto, nicht über Umwege</li>
      </ul>
    </div>
  </div>

  <!-- Final CTA Section -->
  <div style="text-align: center; padding: 50px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin-bottom: 40px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px;">
      Jetzt kostenloses Erstgespräch buchen
    </h2>
    <p style="font-size: 1.2rem; margin-bottom: 35px; opacity: 0.95;">
      Erfahren Sie in 15 Minuten, wie Sie mit Gutscheinery Ihren Gutscheinverkauf automatisieren und mehr Umsatz generieren.
    </p>
    <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: white; color: #667eea; padding: 18px 45px; font-size: 1.15rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom: 20px;">
      Jetzt Demo buchen
    </a>
    <p style="font-size: 0.95rem; margin: 0; opacity: 0.9;">
      Unverbindlich | Keine Kosten | Individuelle Beratung
    </p>
  </div>

</div>`,
    status: 'published',
    featuredImage: null,
    author: 'Gutscheinery Team'
  },
  // ... I'll add the other 3 landing pages in the next messages due to length
];

async function seedLandingPages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing landing pages
    await BlogPost.deleteMany({
      slug: {
        $in: [
          'gutscheinsystem-friseure',
          'gutscheinsystem-floristen',
          'gutscheinsystem-massage-salons',
          'gutscheinsystem-wellness-clubs'
        ]
      }
    });
    console.log('Cleared existing landing pages');

    // Insert new landing pages
    const result = await BlogPost.insertMany(landingPages);
    console.log(`Successfully inserted ${result.length} landing pages`);

    // Display created slugs
    result.forEach(page => {
      console.log(`  - ${page.slug} (ID: ${page._id})`);
    });

  } catch (error) {
    console.error('Error seeding landing pages:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedLandingPages();
