const admin = require('firebase-admin');

function readServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  return null;
}

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = readServiceAccountFromEnv();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // Falls GOOGLE_APPLICATION_CREDENTIALS gesetzt ist, verwendet das SDK automatisch ADC.
  return admin.initializeApp();
}

function getFirebaseAdmin() {
  getFirebaseAdminApp();
  return admin;
}

module.exports = { getFirebaseAdmin };
