const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { createLandingPageHTML } = require('../seeds/data/landingPageTemplates');
const landingPageData = require('../seeds/data/landingPageData');
const { getFirebaseAdmin } = require('../lib/firebaseAdmin');

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

async function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Nicht autorisiert: Token fehlt.' });
    }

    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);
    const requesterUid = decodedToken.uid;

    const requesterDoc = await admin.firestore().collection('users').doc(requesterUid).get();
    const requesterData = requesterDoc.exists ? requesterDoc.data() : null;

    if (!requesterData || requesterData.isAdmin !== true) {
      return res.status(403).json({ error: 'Nicht erlaubt: Admin-Rechte erforderlich.' });
    }

    req.requesterUid = requesterUid;
    next();
  } catch (error) {
    console.error('Admin-Autorisierung fehlgeschlagen:', error);
    return res.status(401).json({ error: 'Ungultiges oder abgelaufenes Token.' });
  }
}

function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return password;
}

async function fetchMassageNamesFromOverpass(bundesland, limit = 1000) {
  const query = `
[out:json][timeout:90];
area["name"="${bundesland}"]["boundary"="administrative"]["admin_level"="4"]->.searchArea;
(
  nwr["name"]["shop"="massage"](area.searchArea);
  nwr["name"]["beauty"="massage"](area.searchArea);
  nwr["name"]["amenity"="spa"](area.searchArea);
);
out tags;
`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const data = await response.json();
  const elements = Array.isArray(data?.elements) ? data.elements : [];

  const uniqueNames = Array.from(
    new Set(
      elements
        .map((el) => (el?.tags?.name || '').trim())
        .filter((name) => name.length > 0)
    )
  );

  return uniqueNames.slice(0, Math.max(1, Math.min(limit, 5000)));
}

// Admin endpoint to seed landing pages
// POST /api/admin/seed-landing-pages
router.post('/seed-landing-pages', async (req, res) => {
  try {
    console.log('Starting landing page seed...');

    // Delete existing landing pages
    const slugs = [
      'gutscheinsystem-friseure',
      'gutscheinsystem-floristen',
      'gutscheinsystem-massage-salons',
      'gutscheinsystem-wellness-clubs'
    ];

    const deletedCount = await BlogPost.deleteMany({ slug: { $in: slugs } });
    console.log(`Deleted ${deletedCount.deletedCount} existing landing pages`);

    // Create landing pages
    const landingPages = [
      {
        title: 'Digitales Gutscheinsystem für Friseure – Mehr Umsatz durch automatisierten Gutscheinverkauf',
        slug: 'gutscheinsystem-friseure',
        metaTitle: 'Digitales Gutscheinsystem für Friseure | Gutscheinery',
        metaDescription: 'Automatischer Gutscheinverkauf für Friseursalons. Verkaufen Sie digitale Gutscheine 24/7, ohne Verwaltungsaufwand. Mehr Liquidität und planbare Einnahmen.',
        content: createLandingPageHTML(landingPageData.friseure),
        status: 'published',
        featuredImage: null,
        author: 'Gutscheinery Team',
        tags: ['Friseure', 'Digitale Gutscheine', 'Salon-Software'],
        views: 0
      },
      {
        title: 'Digitales Gutscheinsystem für Floristen – Mehr Liquidität vor Valentinstag und Muttertag',
        slug: 'gutscheinsystem-floristen',
        metaTitle: 'Digitales Gutscheinsystem für Floristen | Gutscheinery',
        metaDescription: 'Verkaufen Sie Blumen-Gutscheine digital und automatisiert. Perfekt für Hochsaisons wie Valentinstag, Muttertag und Weihnachten. Einfache Integration.',
        content: createLandingPageHTML(landingPageData.floristen),
        status: 'published',
        featuredImage: null,
        author: 'Gutscheinery Team',
        tags: ['Floristen', 'Blumengeschäft', 'Digitale Gutscheine'],
        views: 0
      },
      {
        title: 'Digitales Gutscheinsystem für Massage-Salons – Mehr Liquidität und weniger Terminausfälle',
        slug: 'gutscheinsystem-massage-salons',
        metaTitle: 'Digitales Gutscheinsystem für Massage-Salons | Gutscheinery',
        metaDescription: 'Automatisierter Gutscheinverkauf für Massage-Salons. Verkaufen Sie Massage-Gutscheine rund um die Uhr. Reduzieren Sie Terminausfälle und steigern Sie Ihre Einnahmen.',
        content: createLandingPageHTML(landingPageData.massagesalons),
        status: 'published',
        featuredImage: null,
        author: 'Gutscheinery Team',
        tags: ['Massage', 'Wellness', 'Spa', 'Digitale Gutscheine'],
        views: 0
      },
      {
        title: 'Digitales Gutscheinsystem für Wellness-Clubs – Mehr Mitglieder und planbare Liquidität',
        slug: 'gutscheinsystem-wellness-clubs',
        metaTitle: 'Digitales Gutscheinsystem für Wellness-Clubs | Gutscheinery',
        metaDescription: 'Verkaufen Sie Wellness-Gutscheine automatisiert. Perfekt für Fitness-Studios, Spa-Bereiche und Wellness-Clubs. Mehr Liquidität und neue Kunden gewinnen.',
        content: createLandingPageHTML(landingPageData.wellnessclubs),
        status: 'published',
        featuredImage: null,
        author: 'Gutscheinery Team',
        tags: ['Wellness', 'Fitness', 'Spa', 'Digitale Gutscheine'],
        views: 0
      }
    ];

    const result = await BlogPost.insertMany(landingPages);
    console.log(`Successfully inserted ${result.length} landing pages`);

    res.json({
      success: true,
      message: `Successfully seeded ${result.length} landing pages`,
      landingPages: result.map(page => ({
        id: page._id,
        title: page.title,
        slug: page.slug,
        url: `https://gutscheinery.de/${page.slug}`
      }))
    });

  } catch (error) {
    console.error('Error seeding landing pages:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding landing pages',
      error: error.message
    });
  }
});

// POST /api/admin/customer-auth/reset-link
router.post('/customer-auth/reset-link', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-Mail ist erforderlich.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = getFirebaseAdmin();

    await admin.auth().getUserByEmail(normalizedEmail);

    const resetLink = await admin.auth().generatePasswordResetLink(normalizedEmail);

    return res.json({
      success: true,
      email: normalizedEmail,
      resetLink,
    });
  } catch (error) {
    console.error('Fehler beim Erzeugen des Reset-Links:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Zu dieser E-Mail wurde kein Nutzer gefunden.' });
    }

    return res.status(500).json({ error: 'Reset-Link konnte nicht erstellt werden.' });
  }
});

// POST /api/admin/customer-auth/start-password
router.post('/customer-auth/start-password', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-Mail ist erforderlich.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = getFirebaseAdmin();
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const temporaryPassword = generateTemporaryPassword(12);

    await admin.auth().updateUser(userRecord.uid, {
      password: temporaryPassword,
    });

    await admin
      .firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set(
        {
          forcePasswordChange: true,
          forcePasswordChangeSetAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return res.json({
      success: true,
      email: normalizedEmail,
      temporaryPassword,
    });
  } catch (error) {
    console.error('Fehler beim Setzen des Startpassworts:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Zu dieser E-Mail wurde kein Nutzer gefunden.' });
    }

    return res.status(500).json({ error: 'Startpasswort konnte nicht gesetzt werden.' });
  }
});

// GET /api/admin/lead-research/osm-massage-names?bundesland=Bayern&limit=1000
router.get('/lead-research/osm-massage-names', requireAdmin, async (req, res) => {
  try {
    const bundeslandRaw = (req.query.bundesland || '').toString().trim();
    const limitRaw = parseInt((req.query.limit || '1000').toString(), 10);

    if (!bundeslandRaw) {
      return res.status(400).json({ error: 'Query-Parameter "bundesland" ist erforderlich.' });
    }

    const names = await fetchMassageNamesFromOverpass(bundeslandRaw, Number.isNaN(limitRaw) ? 1000 : limitRaw);

    return res.json({
      success: true,
      source: 'openstreetmap-overpass',
      bundesland: bundeslandRaw,
      count: names.length,
      names,
    });
  } catch (error) {
    console.error('Fehler bei OSM-Recherche:', error);
    return res.status(500).json({ error: 'OSM-Recherche fehlgeschlagen.' });
  }
});

module.exports = router;
