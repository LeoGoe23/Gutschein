const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { createLandingPageHTML } = require('../seeds/data/landingPageTemplates');
const landingPageData = require('../seeds/data/landingPageData');

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

module.exports = router;
