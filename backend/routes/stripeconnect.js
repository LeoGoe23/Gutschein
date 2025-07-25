const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('DOMAIN:', process.env.DOMAIN);
console.log('STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY);

router.post('/stripe-connect-link', async (req, res) => {
  const { firebaseUid, email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email erforderlich' });
  }

  try {
    // Hier solltest du prüfen, ob schon ein Stripe-Account existiert (z.B. in der DB)
    // Beispiel: Unternehmen.findOne({ firebaseUid })
    // Falls nicht, erstelle einen neuen Stripe-Account:
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    // Erstelle einen Onboarding-Link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.DOMAIN}/gutschein/step4`,
      return_url: `${process.env.DOMAIN}/gutschein/step4`,
      type: 'account_onboarding',
    });

    // Speichere account.id in deiner DB beim Unternehmen (TODO)

    res.json({ url: accountLink.url, stripeAccountId: account.id });
  } catch (err) {
    console.error('Stripe Connect Fehler:', err); // Das gibt das ganze Error-Objekt aus!
    res.status(500).json({ error: err.message, details: err });
  }
});

router.post('/check-account', async (req, res) => {
  const { firebaseUid } = req.body;
  // Hole Stripe-Account-ID aus deiner DB anhand firebaseUid
  const stripeAccountId = await getStripeAccountIdFromDB(firebaseUid); // Implementiere diese Funktion!

  if (!stripeAccountId) {
    return res.status(404).json({ error: 'Kein Stripe-Account gefunden.' });
  }

  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (account.charges_enabled) {
      // Stripe-Konto ist wirklich aktiviert!
      return res.json({ stripeAccountId });
    } else {
      return res.status(400).json({ error: 'Stripe-Konto noch nicht aktiviert.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;