import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import TopLeftLogo from '../components/home/TopLeftLogo';
import { db } from '../auth/firebase';
import { generateGutscheinPDF } from '../utils/generateGutscheinPDF';
import { uploadPDFToStorage, saveGutscheinLink } from '../utils/firebaseStorage';
import { saveSoldGutscheinToShop, updateUserEinnahmenStats } from '../utils/saveSoldGutscheinToShop';
import { saveAdminStats, saveAdminHit } from '../utils/saveAdminStats';

const API_URL = process.env.REACT_APP_API_URL;

interface ExtraOfferConfig {
  enabled: boolean;
  slug: string;
  pageTitle: string;
  introText: string;
  longDescription: string;
  imageURL: string;
  externalLink: string;
  externalLinkLabel: string;
  voucherType: 'wert' | 'dienstleistung';
  voucherTitle: string;
  voucherDescription: string;
  voucherAmount: number;
}

interface ExtraCheckoutData {
  userId: string;
  unternehmensname: string;
  slug: string;
  website: string;
  bildURL: string;
  gutscheinURL: string;
  StripeAccountId: string;
  Provision: number;
  designConfig?: {
    betrag: { x: number; y: number; size: number; width?: number };
    code: { x: number; y: number; size: number; width?: number };
  };
  extraOffer: ExtraOfferConfig;
}

function generateCode() {
  return `GS-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function trackWebsiteHit(userId: string) {
  const now = new Date();
  const monat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    'Einnahmen.gesamtHits': increment(1),
    [`Einnahmen.monatlich.${monat}.hits`]: increment(1),
  });
  await saveAdminHit('globalAdmin');
}

function PaymentForm({
  betrag,
  stripeAccountId,
  shopSlug,
  provision,
  onPaymentSuccess,
}: {
  betrag: number;
  stripeAccountId: string;
  shopSlug: string;
  provision: number;
  onPaymentSuccess: (email: string) => void;
}) {
  const [customerEmail, setCustomerEmail] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const initStripe = async () => {
      try {
        if (!API_URL) {
          setError('Stripe Initialisierung fehlgeschlagen: REACT_APP_API_URL fehlt (oft nur lokal/dev).');
          return;
        }

        let attempts = 0;
        while (!(window as any).Stripe && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts += 1;
        }

        if (!(window as any).Stripe) {
          setError('Stripe JS konnte nicht geladen werden.');
          return;
        }

        const response = await fetch(`${API_URL}/api/zahlung/test-mode-status`);
        if (!response.ok) {
          setError('Test/Live Status konnte nicht geladen werden.');
          return;
        }

        const modeData = await response.json();
        setIsTestMode(!!modeData.testMode);

        const stripeKey = modeData.testMode
          ? process.env.REACT_APP_STRIPE_TEST_KEY
          : process.env.REACT_APP_STRIPE_PUBLIC_KEY;

        if (!stripeKey) {
          setError('Stripe Key fehlt.');
          return;
        }

        const stripeConfig: any = stripeAccountId ? { stripeAccount: stripeAccountId } : {};
        const stripeInstance = (window as any).Stripe(stripeKey, stripeConfig);
        setStripe(stripeInstance);
      } catch (err: any) {
        console.error(err);
        setError(`Stripe Initialisierung fehlgeschlagen: ${err?.message || 'Unbekannter Fehler'}`);
      }
    };

    initStripe();
  }, [stripeAccountId]);

  useEffect(() => {
    if (!stripe || !betrag || betrag <= 0) return;

    const createPaymentIntent = async () => {
      try {
        const amountInCents = Math.round(betrag * 100);
        const response = await fetch(`${API_URL}/api/zahlung/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountInCents,
            customerEmail: 'placeholder@example.com',
            stripeAccountId,
            slug: shopSlug,
            provision,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.clientSecret) {
          setError(data.error || 'Payment Intent konnte nicht erstellt werden.');
          return;
        }

        setClientSecret(data.clientSecret);
        const elementsInstance = stripe.elements({
          clientSecret: data.clientSecret,
          appearance: {
            theme: 'stripe' as const,
            variables: {
              colorPrimary: '#1976d2',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: '8px',
            },
          },
          loader: 'auto' as const,
        });
        setElements(elementsInstance);
      } catch (err) {
        console.error(err);
        setError('Payment Intent fehlgeschlagen.');
      }
    };

    createPaymentIntent();
  }, [stripe, betrag, stripeAccountId, shopSlug, provision]);

  useEffect(() => {
    if (!elements || !clientSecret) return;
    const container = document.getElementById('payment-element-extra');
    if (!container) return;

    const paymentElement = elements.create('payment', {
      layout: {
        type: 'tabs',
        defaultCollapsed: false,
        radios: false,
        spacedAccordionItems: true,
      },
      fields: {
        billingDetails: {
          name: 'auto',
          email: 'auto',
          address: 'auto',
        },
      },
      terms: { sepaDebit: 'always' },
      wallets: { applePay: 'auto', googlePay: 'auto' },
    });

    paymentElement.mount('#payment-element-extra');

    return () => {
      try {
        paymentElement.unmount();
      } catch (err) {
        // already unmounted
      }
    };
  }, [elements, clientSecret]);

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      alert('Stripe ist noch nicht bereit.');
      return;
    }

    if (!customerEmail.trim()) {
      alert('Bitte E-Mail eingeben.');
      return;
    }

    setIsProcessing(true);
    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: customerEmail,
          payment_method_data: {
            billing_details: {
              email: customerEmail,
              address: { country: 'DE' },
            },
          },
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || 'Zahlung fehlgeschlagen.');
        return;
      }

      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        onPaymentSuccess(customerEmail.trim().toLowerCase());
      }
    } catch (err: any) {
      setError(err?.message || 'Zahlung fehlgeschlagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {isTestMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          TEST-MODUS: Testkarte 4242 4242 4242 4242 verwenden.
        </Alert>
      )}

      <TextField
        fullWidth
        label="E-Mail-Adresse"
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        sx={{ mb: 2 }}
      />

      {clientSecret && (
        <Box id="payment-element-extra" sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 2, backgroundColor: '#fafafa' }} />
      )}

      <Button
        variant="contained"
        onClick={handlePayment}
        disabled={isProcessing || !clientSecret || !customerEmail.trim() || !!error}
        sx={{ width: '100%', py: 1.3 }}
      >
        {isProcessing ? 'Zahlung wird verarbeitet...' : `Jetzt zahlen (${betrag} EUR)`}
      </Button>
    </Box>
  );
}

export default function CheckoutExtra() {
  const { extraSlug } = useParams<{ extraSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ExtraCheckoutData | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const hasSentRef = useRef(false);
  const hitTrackedRef = useRef(false);

  const voucherAmount = useMemo(() => Number(data?.extraOffer?.voucherAmount || 0), [data]);

  useEffect(() => {
    if (!data) return;

    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute('content') || '';

    const pageTitle = data.extraOffer.pageTitle?.trim() || 'Gutschein';
    document.title = `${pageTitle} Gutschein kaufen | ${voucherAmount} EUR`;

    const nextDescription = `${pageTitle} jetzt online als Gutschein kaufen. Betrag: ${voucherAmount} EUR.`;
    if (metaDescription) {
      metaDescription.setAttribute('content', nextDescription);
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [data, voucherAmount]);

  useEffect(() => {
    const load = async () => {
      if (!extraSlug) {
        setError('Kein Extra-Slug gefunden.');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('Checkout.ExtraOffer.slug', '==', extraSlug));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('Seite nicht gefunden.');
          setLoading(false);
          return;
        }

        const docSnap = snap.docs[0];
        const raw = docSnap.data();
        const extraOffer = raw?.Checkout?.ExtraOffer as ExtraOfferConfig;

        if (!extraOffer?.enabled) {
          setError('Dieses Extra-Angebot ist nicht aktiv.');
          setLoading(false);
          return;
        }

        const parsed: ExtraCheckoutData = {
          userId: docSnap.id,
          unternehmensname: raw?.Checkout?.Unternehmensname || raw?.Unternehmensdaten?.Unternehmensname || '',
          slug: raw?.slug || '',
          website: raw?.Unternehmensdaten?.Website || '',
          bildURL: raw?.Checkout?.BildURL || '',
          gutscheinURL: raw?.Checkout?.GutscheinDesignURL || '',
          StripeAccountId: raw?.Checkout?.StripeAccountId || '',
          Provision: raw?.Provision || 0,
          designConfig: raw?.Checkout?.DesignConfig,
          extraOffer,
        };

        setData(parsed);

        if (parsed.userId && !hitTrackedRef.current) {
          hitTrackedRef.current = true;
          trackWebsiteHit(parsed.userId);
        }
      } catch (err) {
        console.error(err);
        setError('Fehler beim Laden der Extra-Seite.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [extraSlug]);

  useEffect(() => {
    if (!showSuccess || !data || !customerEmail || hasSentRef.current) return;
    if (!voucherAmount || voucherAmount <= 0) return;

    hasSentRef.current = true;
    setIsSending(true);

    const sendVoucher = async () => {
      try {
        const gutscheinCode = generateCode();
        const paymentId = `extra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const dienstleistung = data.extraOffer.voucherType === 'dienstleistung'
          ? {
              shortDesc: data.extraOffer.voucherTitle,
              longDesc: data.extraOffer.voucherDescription || data.extraOffer.voucherTitle,
            }
          : undefined;

        const pdfBlob = await generateGutscheinPDF({
          unternehmen: data.unternehmensname,
          betrag: dienstleistung ? '' : String(voucherAmount),
          gutscheinCode,
          ausstelltAm: new Date().toLocaleDateString(),
          website: data.website,
          bildURL: data.bildURL,
          dienstleistung,
          gutscheinDesignURL: data.gutscheinURL,
          designConfig: data.designConfig,
        });

        const fileName = `${data.slug}_${gutscheinCode}_${Date.now()}_extra.pdf`;
        const downloadURL = await uploadPDFToStorage(pdfBlob, fileName);

        const linkId = await saveGutscheinLink({
          gutscheinCode,
          downloadURL,
          betrag: voucherAmount,
          empfaengerEmail: customerEmail,
          unternehmensname: data.unternehmensname,
          slug: data.slug,
          createdAt: new Date().toISOString(),
          dienstleistung: dienstleistung?.shortDesc,
          paymentIntentId: paymentId,
        });

        const publicDownloadLink = `${API_URL}/api/gutscheine/download/${linkId}`;
        setDownloadLink(publicDownloadLink);
        setPdfGenerated(true);

        const pdfBase64 = arrayBufferToBase64(await pdfBlob.arrayBuffer());

        const response = await fetch(`${API_URL}/api/gutscheine/send-gutschein`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empfaengerEmail: customerEmail,
            unternehmensname: data.unternehmensname,
            gutscheinCode,
            betrag: voucherAmount,
            dienstleistung,
            pdfBuffer: pdfBase64,
            paymentIntentId: paymentId,
            slug: data.slug,
            downloadLink: publicDownloadLink,
          }),
        });

        if (!response.ok) {
          const responseData = await response.json().catch(() => ({}));
          throw new Error(responseData.error || 'E-Mail Versand fehlgeschlagen.');
        }

        await saveSoldGutscheinToShop({
          gutscheinCode,
          betrag: voucherAmount,
          kaufdatum: new Date().toISOString(),
          empfaengerEmail: customerEmail,
          slug: data.slug,
          provision: data.Provision,
        });

        if (data.userId) {
          await updateUserEinnahmenStats({
            userId: data.userId,
            betrag: voucherAmount,
            dienstleistung: dienstleistung?.shortDesc,
            isFreierBetrag: !dienstleistung,
            provision: data.Provision,
          });
        }

        await saveAdminStats({
          adminId: 'globalAdmin',
          gutschein: {
            gutscheinCode,
            betrag: voucherAmount,
            kaufdatum: new Date().toISOString(),
            empfaengerEmail: customerEmail,
            dienstleistung: dienstleistung?.shortDesc,
          },
        });

        setEmailSent(true);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsSending(false);
      }
    };

    sendVoucher();
  }, [showSuccess, data, customerEmail, voucherAmount]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Alert severity="error">{error || 'Seite nicht verfuegbar'}</Alert>
      </Box>
    );
  }

  const imageURL = data.extraOffer.imageURL || data.bildURL;
  const normalizedVoucherTitle =
    !data.extraOffer.voucherTitle || data.extraOffer.voucherTitle.trim().toLowerCase() === 'extra gutschein'
      ? 'Gutschein'
      : data.extraOffer.voucherTitle;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: '#f7f7f5',
      }}
    >
      <TopLeftLogo />

      <Box
        sx={{
          width: { xs: '100%', md: '52%' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, md: 8 },
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: '560px',
            width: '100%',
            textAlign: { xs: 'center', md: 'left' },
            mt: { xs: 10, md: 5 },
          }}
        >
          {!showSuccess ? (
            <>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  mb: 2.5,
                  color: '#111827',
                  lineHeight: 1.08,
                  fontSize: { xs: '2rem', md: '3rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                {data.extraOffer.pageTitle || 'Zusaetzliches Angebot'}
              </Typography>

              {!!data.extraOffer.introText && (
                <Typography variant="body1" sx={{ color: 'grey.700', mb: 3, lineHeight: 1.6 }}>
                  {data.extraOffer.introText}
                </Typography>
              )}

              <Box
                sx={{
                  position: 'relative',
                  p: { xs: 2.4, md: 2.8 },
                  borderRadius: 4,
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.07)',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    backgroundColor: '#1d4ed8',
                  }}
                />

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.8 }}>
                  {normalizedVoucherTitle}
                </Typography>
                {!!data.extraOffer.voucherDescription && (
                  <Typography variant="body2" sx={{ mb: 1.4, color: '#4b5563' }}>
                    {data.extraOffer.voucherDescription}
                  </Typography>
                )}

                <Typography sx={{ fontSize: { xs: '2rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.1, mb: 2.1, color: '#111827' }}>
                  {voucherAmount} EUR
                </Typography>

                {!showPaymentForm ? (
                  <Button
                    variant="contained"
                    onClick={() => setShowPaymentForm(true)}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor: '#1d4ed8',
                      boxShadow: '0 6px 14px rgba(29,78,216,0.2)',
                      '&:hover': {
                        backgroundColor: '#1e40af',
                      },
                    }}
                  >
                    Gutschein kaufen
                  </Button>
                ) : null}
              </Box>

              {showPaymentForm && (
                <PaymentForm
                  betrag={voucherAmount}
                  stripeAccountId={data.StripeAccountId}
                  shopSlug={data.slug}
                  provision={data.Provision || 0.08}
                  onPaymentSuccess={(email) => {
                    setCustomerEmail(email);
                    setShowSuccess(true);
                  }}
                />
              )}

              {!!data.extraOffer.longDescription && (
                <Typography variant="body2" sx={{ color: 'grey.700', mt: 0.5, mb: 2, lineHeight: 1.8 }}>
                  {data.extraOffer.longDescription}
                </Typography>
              )}

              {!!data.extraOffer.externalLink && (
                <Button
                  component="a"
                  href={data.extraOffer.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="text"
                  sx={{ textTransform: 'none', px: 0, py: 0.5, fontWeight: 600 }}
                >
                  {data.extraOffer.externalLinkLabel || 'Mehr erfahren'}
                </Button>
              )}
            </>
          ) : (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#4caf50' }}>
                Vielen Dank fuer Ihren Einkauf!
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, color: 'grey.700' }}>
                Ihr Gutschein wird erstellt.
              </Typography>

              {isSending && !pdfGenerated && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Gutschein wird erstellt...
                </Alert>
              )}

              {isSending && pdfGenerated && !emailSent && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Gutschein erstellt, E-Mail wird versendet...
                </Alert>
              )}

              {emailSent && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Gutschein wurde erfolgreich an {customerEmail} gesendet.
                </Alert>
              )}

              {pdfGenerated && downloadLink && (
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      const response = await fetch(downloadLink);
                      const dataResp = await response.json();
                      if (dataResp.success && dataResp.downloadURL) {
                        window.open(dataResp.downloadURL, '_blank');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Gutschein herunterladen
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          width: { xs: '100%', md: '48%' },
          position: { xs: 'relative', md: 'fixed' },
          right: { md: 0 },
          top: { md: 0 },
          height: { xs: '52vh', md: '100vh' },
          minHeight: { xs: 430, md: 0 },
          backgroundColor: '#ecebe7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 3 },
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: '100%', md: '92%' },
            borderRadius: { xs: 3, md: 5 },
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(17, 24, 39, 0.15)',
            border: '1px solid rgba(255,255,255,0.55)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: imageURL ? `url(${imageURL})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: { xs: 'center 20%', md: 'center' },
              transform: 'scale(1.01)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 15%, rgba(17,24,39,0.18) 100%)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
