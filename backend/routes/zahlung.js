require("dotenv").config();
const express = require("express");
const querystring = require("querystring");
const mongoose = require("mongoose");
const Unternehmen = require("../models/Unternehmen");

const router = express.Router();

// optional Mollie API usage if module is installed
let mollie = null;
try {
  const createMollieClient = require("@mollie/api-client");
  mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
} catch (e) {
  // module might not be installed in offline environment
}

const CLIENT_ID = process.env.MOLLIE_CLIENT_ID;
const CLIENT_SECRET = process.env.MOLLIE_CLIENT_SECRET;
const DOMAIN = process.env.DOMAIN || "";

// Konto erstellen und in der Datenbank verknüpfen
router.post("/create-account", async (req, res) => {
  const { firebaseUid, name, email } = req.body || {};
  if (!firebaseUid || !name || !email) {
    return res.status(400).json({ error: "firebaseUid, name und email erforderlich" });
  }
  try {
    let unternehmen = await Unternehmen.findOne({ firebaseUid });
    if (!unternehmen) {
      unternehmen = new Unternehmen({ firebaseUid, name, email });
    }
    if (!unternehmen.mollieAccountId) {
      unternehmen.mollieAccountId = new mongoose.Types.ObjectId().toString();
    }
    await unternehmen.save();
    res.json({ accountId: unternehmen.mollieAccountId });
  } catch (err) {
    console.error("create-account error", err);
    res.status(500).json({ error: err.message });
  }
});

// OAuth Authorize URL für das Onboarding erzeugen
router.get("/onboard/:accountId", (req, res) => {
  const { accountId } = req.params;
  const redirectUri = `${DOMAIN}/api/zahlung/oauth/callback`;
  const query = querystring.stringify({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "organizations.read organizations.write payments.write onboarding.read",
    state: accountId,
  });
  const url = `https://my.mollie.com/oauth2/authorize?${query}`;
  res.json({ url });
});

// OAuth Callback zum Tauschen des Codes gegen Tokens
router.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }
  try {
    const body = querystring.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${DOMAIN}/api/zahlung/oauth/callback`,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    const resp = await fetch("https://api.mollie.com/oauth2/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await resp.json();
    await Unternehmen.findOneAndUpdate(
      { mollieAccountId: state },
      { mollieAccessToken: data.access_token, mollieRefreshToken: data.refresh_token }
    );
    res.redirect(`${DOMAIN}/success?mollie=connected`);
  } catch (err) {
    console.error("OAuth callback error", err);
    res.status(500).send("OAuth error");
  }
});

// Accountdaten abrufen
router.get("/account/:uid", async (req, res) => {
  try {
    const unternehmen = await Unternehmen.findOne({ firebaseUid: req.params.uid });
    if (unternehmen && unternehmen.mollieAccountId) {
      return res.json({ accountId: unternehmen.mollieAccountId });
    }
    res.json({});
  } catch (err) {
    console.error("account lookup error", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/create-payment", async (req, res) => {
  const { amount, customerEmail, method } = req.body;
  if (amount == null || !customerEmail || !method) {
    return res.status(400).json({ error: "amount, customerEmail und method sind erforderlich" });
  }
  if (!mollie) {
    return res.status(501).json({ error: "Mollie client not available" });
  }
  try {
    const payment = await mollie.payments.create({
      amount: { value: (amount / 100).toFixed(2), currency: "EUR" },
      description: "Gutschein",
      redirectUrl: `${process.env.DOMAIN}/success`,
      webhookUrl: `${process.env.DOMAIN}/api/webhook`,
      method,
      metadata: { customerEmail }
    });
    res.json({ paymentUrl: payment._links.checkout.href });
  } catch (err) {
    console.error("Mollie-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
  });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-stripe-session', async (req, res) => {
  const { amount, customerEmail, stripeAccountId, slug, provision } = req.body;
  if (!amount || !customerEmail || !stripeAccountId || !slug) {
    return res.status(400).json({ error: "amount, customerEmail, stripeAccountId und slug sind erforderlich" });
  }
  try {
    const provisionRate = provision || 0.08; // <--- NEU: Default 8%
    const provisionAmount = Math.round(amount * provisionRate);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sofort', 'giropay', 'klarna', 'bancontact', 'ideal', 'eps'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Gutschein' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.DOMAIN}/checkoutc/${slug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/checkoutc/${slug}?canceled=true`,
      payment_intent_data: {
        application_fee_amount: provisionAmount, // <--- Provision an Plattform
        transfer_data: {
          destination: 'acct_1RhHIGJTiwdsp5bo' // <--- DEIN Plattformkonto erhält die Gebühr
        }
      }
    }, {
      stripeAccount: stripeAccountId
    });

    res.json({ paymentUrl: session.url, sessionId: session.id }); // sessionId für redirectToCheckout
  } catch (err) {
    console.error("Stripe-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stripe-session-info', async (req, res) => {
  const { session_id, stripeAccountId } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id erforderlich' });
  if (!stripeAccountId) return res.status(400).json({ error: 'stripeAccountId erforderlich' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      stripeAccount: stripeAccountId
    });
    res.json({
      amount: session.amount_total,
      customerEmail: session.customer_email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;