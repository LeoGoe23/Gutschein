#!/usr/bin/env node

/**
 * Seed Script for Landing Pages
 * Creates 4 industry-specific landing pages for SEO and conversion
 * Run with: node backend/seeds/seedLandingPages.js
 */

const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const { createLandingPageHTML } = require('./data/landingPageTemplates');
const landingPageData = require('./data/landingPageData');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gutscheinery';

const landingPages = [
  {
    title: 'Digitales Gutscheinsystem für Friseure – Mehr Umsatz durch automatisierten Gutscheinverkauf',
    slug: 'gutscheinsystem-friseure',
    metaTitle: 'Digitales Gutscheinsystem für Friseure | Gutscheinery',
    metaDescription: 'Verkaufen Sie Gutscheine digital und steigern Sie Ihren Umsatz. Automatischer Versand per E-Mail, sofortige Zahlung, keine Provision. Jetzt Demo buchen.',
    content: createLandingPageHTML(landingPageData.friseure),
    status: 'published',
    featuredImage: null,
    author: 'Gutscheinery Team'
  },
  {
    title: 'Digitales Gutscheinsystem für Floristen – Mehr Liquidität vor Valentinstag und Muttertag',
    slug: 'gutscheinsystem-floristen',
    metaTitle: 'Digitales Gutscheinsystem für Floristen | Gutscheinery',
    metaDescription: 'Verkaufen Sie Blumen-Gutscheine digital – perfekt für Valentinstag & Muttertag. Automatischer E-Mail-Versand, sofortige Zahlung, keine Provision.',
    content: createLandingPageHTML(landingPageData.floristen),
    status: 'published',
    featuredImage: null,
    author: 'Gutscheinery Team'
  },
  {
    title: 'Digitales Gutscheinsystem für Massage-Salons – Mehr Liquidität und weniger Terminausfälle',
    slug: 'gutscheinsystem-massage-salons',
    metaTitle: 'Digitales Gutscheinsystem für Massage-Salons | Gutscheinery',
    metaDescription: 'Verkaufen Sie Massage-Gutscheine digital – perfekt für Geschenke. Automatischer E-Mail-Versand, sofortige Zahlung, mehr Liquidität. Jetzt Demo buchen.',
    content: createLandingPageHTML(landingPageData.massagesalons),
    status: 'published',
    featuredImage: null,
    author: 'Gutscheinery Team'
  },
  {
    title: 'Digitales Gutscheinsystem für Wellness-Clubs – Mehr Mitglieder und planbare Liquidität',
    slug: 'gutscheinsystem-wellness-clubs',
    metaTitle: 'Digitales Gutscheinsystem für Wellness-Clubs | Gutscheinery',
    metaDescription: 'Verkaufen Sie Wellness-Gutscheine digital – perfekt für Day-Spa & Fitness. Automatischer E-Mail-Versand, sofortige Zahlung, mehr Mitglieder. Jetzt Demo.',
    content: createLandingPageHTML(landingPageData.wellnessclubs),
    status: 'published',
    featuredImage: null,
    author: 'Gutscheinery Team'
  }
];

async function seedLandingPages() {
  try {
    console.log('Starting landing page seed...\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clear existing landing pages
    console.log('Clearing existing landing pages...');
    const deleteResult = await BlogPost.deleteMany({
      slug: {
        $in: [
          'gutscheinsystem-friseure',
          'gutscheinsystem-floristen',
          'gutscheinsystem-massage-salons',
          'gutscheinsystem-wellness-clubs'
        ]
      }
    });
    console.log(`✓ Deleted ${deleteResult.deletedCount} existing landing pages\n`);

    // Insert new landing pages
    console.log('Inserting new landing pages...');
    const result = await BlogPost.insertMany(landingPages);
    console.log(`✓ Successfully inserted ${result.length} landing pages:\n`);

    // Display created pages with details
    result.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title}`);
      console.log(`   Slug: ${page.slug}`);
      console.log(`   URL: https://gutscheinery.de/${page.slug}`);
      console.log(`   Status: ${page.status}`);
      console.log(`   ID: ${page._id}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('Landing pages successfully seeded!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Routes are already configured in App.tsx');
    console.log('2. Update sitemap.xml with the new URLs');
    console.log('3. Add "Branchen" menu to TopBar navigation');
    console.log('4. Test the pages at:');
    console.log('   - /gutscheinsystem-friseure');
    console.log('   - /gutscheinsystem-floristen');
    console.log('   - /gutscheinsystem-massage-salons');
    console.log('   - /gutscheinsystem-wellness-clubs');
    console.log('');

  } catch (error) {
    console.error('✗ Error seeding landing pages:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedLandingPages();
}

module.exports = seedLandingPages;
