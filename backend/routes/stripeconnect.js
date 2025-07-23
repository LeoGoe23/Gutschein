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

module.exports = router;