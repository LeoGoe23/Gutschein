// Landing Page Templates without emojis
// Each template contains all necessary data for a landing page

const createLandingPageHTML = (config) => {
  const {
    heroGradient,
    title,
    subtitle,
    trustText,
    whyTitle,
    whyText1,
    whyText2,
    problems,
    benefits,
    emailBenefits,
    faqItems
  } = config;

  return `<div style="max-width: 900px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; color: #111827; line-height: 1.7;">

  <!-- Hero Section -->
  <div style="text-align: center; padding: 60px 20px 40px; background: ${heroGradient}; color: white; border-radius: 12px; margin-bottom: 50px;">
    <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; line-height: 1.2;">
      ${title}<br/>
      <span style="font-size: 2rem; font-weight: 600;">${subtitle}</span>
    </h1>
    <p style="font-size: 1.25rem; margin-bottom: 35px; opacity: 0.95;">
      Verkaufen Sie Gutscheine 24/7 online – automatisch per E-Mail zugestellt, sofortige Zahlung auf Ihr Konto
    </p>
    <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: white; color: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; padding: 18px 45px; font-size: 1.1rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
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
      ${whyTitle}
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      ${whyText1}
    </p>
    <p style="font-size: 1.1rem; color: #374151;">
      <strong>Mit einem digitalen Gutscheinsystem</strong> ${whyText2}
    </p>
  </div>

  <!-- Problems Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: #111827;">
      Diese Probleme kennen Sie aus Ihrem ${config.businessType}
    </h2>
    ${problems.map((problem, index) => `
    <div style="background: #fff; border-left: 4px solid #ef4444; padding: 25px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
        Problem ${index + 1}: ${problem.title}
      </h3>
      <p style="font-size: 1.05rem; color: #374151;">
        ${problem.description}
      </p>
    </div>`).join('')}
  </div>

  <!-- How It Works Section -->
  <div style="margin-bottom: 60px; background: ${config.sectionBg || '#f0f9ff'}; padding: 40px 30px; border-radius: 12px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 25px; color: #111827; text-align: center;">
      So funktioniert das digitale Gutscheinsystem von Gutscheinery
    </h2>
    <p style="font-size: 1.1rem; color: #374151; text-align: center; margin-bottom: 40px;">
      In 3 einfachen Schritten zum automatisierten Gutscheinverkauf
    </p>

    <div style="display: grid; gap: 25px;">
      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">1</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Integration in Ihre Website</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          Wir binden das Gutscheinsystem mit wenigen Klicks in Ihre bestehende Website ein. Kein technisches Wissen erforderlich.
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">2</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Kunde kauft online</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          ${config.step2Text}
        </p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="background: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; margin-right: 15px;">3</span>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin: 0; color: #111827;">Automatischer E-Mail-Versand</h3>
        </div>
        <p style="font-size: 1.05rem; color: #374151; margin: 0;">
          Der Gutschein wird sofort per E-Mail zugestellt. Sie erhalten das Geld direkt auf Ihr Konto – ohne Umwege, ohne Provisionen.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 35px;">
      <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; color: white; padding: 16px 40px; font-size: 1.05rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(102,126,234,0.4);">
        15-Minuten-Gespräch vereinbaren
      </a>
    </div>
  </div>

  <!-- Benefits Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 30px; color: #111827;">
      5 konkrete Vorteile für Ihr${config.businessTypeArticle} ${config.businessType}
    </h2>

    <div style="display: grid; gap: 20px;">
      ${benefits.map((benefit, index) => `
      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; color: #111827;">
          Vorteil ${index + 1}: ${benefit.title}
        </h3>
        <p style="font-size: 1.05rem; color: #374151;">
          ${benefit.description}
        </p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Email Delivery Section -->
  <div style="margin-bottom: 60px; background: #fffbeb; padding: 40px 30px; border-radius: 12px; border: 2px solid #fbbf24;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: #111827;">
      Warum der direkte E-Mail-Versand für ${config.businessTypePlural} perfekt ist
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      ${config.emailIntro}
    </p>
    <ul style="font-size: 1.05rem; color: #374151; margin-bottom: 20px; padding-left: 25px;">
      ${emailBenefits.map(benefit => `<li style="margin-bottom: 10px;"><strong>${benefit.title}:</strong> ${benefit.description}</li>`).join('')}
    </ul>
    <p style="font-size: 1.05rem; color: #374151; font-weight: 600;">
      Ihre Kunden lieben die Bequemlichkeit – und Sie profitieren von mehr Verkäufen.
    </p>
  </div>

  <!-- Trust/Control Section -->
  <div style="margin-bottom: 60px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: #111827;">
      Ihr ${config.businessType}, Ihre Regeln – Kein Marktplatz, keine Provisionen
    </h2>
    <p style="font-size: 1.1rem; color: #374151; margin-bottom: 20px;">
      ${config.controlIntro}
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
  <div style="text-align: center; padding: 50px 30px; background: ${heroGradient}; color: white; border-radius: 12px; margin-bottom: 40px;">
    <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 20px;">
      Jetzt kostenloses Erstgespräch buchen
    </h2>
    <p style="font-size: 1.2rem; margin-bottom: 35px; opacity: 0.95;">
      ${config.ctaText}
    </p>
    <a href="https://calendly.com/gutscheinfabrik/15-minute-meeting" target="_blank" style="display: inline-block; background: white; color: ${heroGradient.match(/#[0-9a-f]{6}/i)[0]}; padding: 18px 45px; font-size: 1.15rem; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); margin-bottom: 20px;">
      Jetzt Demo buchen
    </a>
    <p style="font-size: 0.95rem; margin: 0; opacity: 0.9;">
      Unverbindlich | Keine Kosten | Individuelle Beratung
    </p>
  </div>

  <!-- FAQ Section -->
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 40px;">
    <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; color: #111827; text-align: center;">
      Häufige Fragen von ${config.businessOwnerType}
    </h3>
    ${faqItems.map(faq => `
    <div style="margin-bottom: 20px;">
      <p style="font-size: 1.05rem; font-weight: 700; color: #111827; margin-bottom: 8px;">${faq.question}</p>
      <p style="font-size: 1rem; color: #374151; margin: 0;">${faq.answer}</p>
    </div>`).join('')}
  </div>

</div>`;
};

module.exports = { createLandingPageHTML };
