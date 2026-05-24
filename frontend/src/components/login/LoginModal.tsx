import { Modal, Box, Typography, TextField, Button, Divider, Link } from '@mui/material';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { auth, db } from '../../auth/firebase';
import { doc, setDoc, getDoc, DocumentReference } from "firebase/firestore";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importiere useNavigate

interface Props {
  open: boolean;
  onClose: () => void;
  openResetPassword?: boolean;
}

export default function LoginModal({ open, onClose, openResetPassword = false }: Props) {
  const navigate = useNavigate(); // Initialisiere den Navigator

  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(openResetPassword);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [forcePasswordOpen, setForcePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forcePasswordError, setForcePasswordError] = useState('');
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);
  const [postLoginRoute, setPostLoginRoute] = useState('/profil');

  useEffect(() => {
    if (openResetPassword) {
      setResetPasswordOpen(true);
    }
  }, [openResetPassword]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setIsRegister(false); // Zurück auf Login-Ansicht für das nächste Öffnen
        onClose(); // Modal schließen
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const mergeUserData = async (userDocRef: DocumentReference, newUserData: Record<string, any>) => {
    const userDoc = await getDoc(userDocRef);

    const currentMonth = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit' }); // Format: MM.YYYY

    if (userDoc.exists()) {
        const existingData = userDoc.data() as Record<string, any>;
        const monthlyData = existingData.Einnahmen?.monatlich || {};

        // Falls der aktuelle Monat nicht existiert, füge ihn hinzu
        if (!monthlyData[currentMonth]) {
            monthlyData[currentMonth] = {
                verkaufteGutscheine: 0,
                gesamtUmsatz: 0,
            };
        }

        // Datenfelder zusammenführen, ohne Überschreiben
        const mergedGutscheine = {
            ...newUserData.Gutscheine,
            ...existingData.Gutscheine, // Bestehende Gutscheine beibehalten
        };

        const mergedUnternehmensdaten = {
            ...newUserData.Unternehmensdaten,
            ...existingData.Unternehmensdaten, // Bestehende Unternehmensdaten beibehalten
        };

        const mergedZahlungsdaten = {
            ...newUserData.Zahlungsdaten,
            ...existingData.Zahlungsdaten, // Bestehende Zahlungsdaten beibehalten
        };

        const mergedGutscheindetails = {
            ...newUserData.Gutscheindetails,
            ...existingData.Gutscheindetails, // Bestehende Gutscheindetails beibehalten
        };

        const mergedCheckout = {
            ...newUserData.Checkout,
            ...existingData.Checkout, // Bestehende Checkout-Daten beibehalten
        };

        const mergedData = {
            ...newUserData,
            ...existingData,
            Gutscheine: mergedGutscheine,
            Unternehmensdaten: mergedUnternehmensdaten,
            Zahlungsdaten: mergedZahlungsdaten,
            Gutscheindetails: mergedGutscheindetails,
            Checkout: mergedCheckout,
            Einnahmen: {
                ...newUserData.Einnahmen,
                ...existingData.Einnahmen,
                monatlich: monthlyData,
            },
        };

        // Speichere die zusammengeführten Daten in der Datenbank
        await setDoc(userDocRef, mergedData);
    } else {
        // Initialisiere die monatlichen Daten für den aktuellen Monat
        newUserData.Einnahmen.monatlich = {
            [currentMonth]: {
                verkaufteGutscheine: 0,
                gesamtUmsatz: 0,
            },
        };

        await setDoc(userDocRef, newUserData);
    }
  };

  // Funktion zur Erstellung von Standard-Benutzerdaten
  const createDefaultUserData = (email: string) => {
    return {
      email,
      createdAt: new Date(),
      registrationFinished: false,
      slug: "",
      Unternehmensdaten: {
        Vorname: "",
        Name: "",
        Unternehmensname: "",
        Branche: "",
        Telefon: "",
        Website: "",
      },
      Checkout: {
        Unternehmensname: "",
        Gutscheinarten: {},
        BildURL: "",
        GutscheinURL: "",
        Dienstleistung: false,
        Freibetrag: false,
        GutscheinDesignURL: "",
      },
    };
  };

  const handleLogin = () => {
    if (!email || !passwort) {
      setLoginError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    setLoginError("");

    signInWithEmailAndPassword(auth, email, passwort)
      .then(async (res) => {
        const user = res.user;
        const userDocRef = doc(db, "users", user.uid);

        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        const registrationFinished = Boolean(userData.registrationFinished);
        const forcePasswordChange = Boolean(userData.forcePasswordChange);
        const nextRoute = registrationFinished ? '/profil' : '/gutschein/step1';

        if (forcePasswordChange) {
          setPostLoginRoute(nextRoute);
          setForcePasswordError('');
          setNewPassword('');
          setConfirmPassword('');
          setForcePasswordOpen(true);
          return;
        }

        navigate(nextRoute);

        setSuccess(true);
      })
      .catch((err) => {
        setLoginError("E-Mail oder Passwort ist falsch.");
      });
  };

  const handleRegister = () => {
    if (!email || !passwort) {
      setLoginError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    setLoginError("");

    createUserWithEmailAndPassword(auth, email, passwort)
      .then(async (res) => {
        const newUserData = createDefaultUserData(res.user.email || "");

        await setDoc(doc(db, "users", res.user.uid), newUserData);

        navigate('/gutschein/step1'); // Nach Registrierung immer zu /gutschein/step1
        setSuccess(true);
      })
      .catch((err) => {
        switch (err.code) {
          case "auth/email-already-in-use":
            setLoginError("Diese E-Mail-Adresse wird bereits verwendet.");
            break;
          case "auth/invalid-email":
            setLoginError("Die eingegebene E-Mail-Adresse ist ungültig.");
            break;
          case "auth/weak-password":
            setLoginError("Das Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort.");
            break;
          default:
            setLoginError("Registrierung fehlgeschlagen: " + err.message);
        }
      });
  };

  const handlePasswordReset = () => {
    if (!resetEmail) {
      setResetError("Bitte geben Sie Ihre E-Mail-Adresse ein.");
      return;
    }

    setResetError("");

    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        setResetSuccess(true);
        setTimeout(() => {
          setResetPasswordOpen(false);
          setResetSuccess(false);
        }, 2000);
      })
      .catch((err) => {
        setResetError("Passwort-Zurücksetzen fehlgeschlagen: " + err.message);
      });
  };

  const handleForcePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setForcePasswordError('Bitte beide Passwort-Felder ausfüllen.');
      return;
    }

    if (newPassword.length < 8) {
      setForcePasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForcePasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (!auth.currentUser) {
      setForcePasswordError('Sitzung nicht gefunden. Bitte erneut einloggen.');
      return;
    }

    setForcePasswordLoading(true);
    setForcePasswordError('');

    try {
      await updatePassword(auth.currentUser, newPassword);

      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          forcePasswordChange: false,
          forcePasswordChangeSetAt: null,
        },
        { merge: true }
      );

      setForcePasswordOpen(false);
      navigate(postLoginRoute);
      setSuccess(true);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setForcePasswordError('Bitte neu einloggen und das Passwort sofort ändern.');
      } else {
        setForcePasswordError('Passwort konnte nicht geändert werden: ' + (err?.message || 'Unbekannter Fehler'));
      }
    } finally {
      setForcePasswordLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={(_event, reason) => {
          if (forcePasswordOpen) return;
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            onClose();
            return;
          }
          onClose();
        }}
        disableEscapeKeyDown={forcePasswordOpen}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: 24,
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {forcePasswordOpen ? (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Passwort ändern erforderlich
              </Typography>

              <Typography sx={{ textAlign: 'center', color: '#666', fontSize: '0.95rem' }}>
                Bitte setze jetzt ein eigenes Passwort. Mit dem Startpasswort ist keine weitere Nutzung möglich.
              </Typography>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Neues Passwort"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />

                <TextField
                  label="Neues Passwort wiederholen"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Box>

              {forcePasswordError && (
                <Typography sx={{ color: 'red', fontSize: '0.85rem', mt: 0.5, textAlign: 'center' }}>
                  {forcePasswordError}
                </Typography>
              )}

              <Button
                fullWidth
                disabled={forcePasswordLoading}
                sx={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  padding: '0.9rem',
                  borderRadius: 3,
                  mt: 1,
                  '&:hover': { backgroundColor: '#4338CA' },
                }}
                onClick={handleForcePasswordChange}
              >
                {forcePasswordLoading ? 'Speichere...' : 'Passwort jetzt ändern'}
              </Button>
            </>
          ) : success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: 'green', fontWeight: 700 }}>
                Erfolgreich!
              </Typography>
              <Typography sx={{ fontSize: '2rem', color: 'green' }}>✔</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {isRegister ? "Registrieren" : "Anmelden"}
              </Typography>

              <Typography sx={{ textAlign: 'center', color: '#666', fontSize: '0.95rem', mb: 2 }}>
                {isRegister
                  ? "Erstelle deinen Account, um Gutscheine zu verwalten."
                  : "Melde dich an, um deine Gutscheine einfach zu verwalten."
                }
              </Typography>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="E-Mail"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />

                <TextField
                  label="Passwort"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  error={Boolean(loginError && !isRegister)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />

                {!isRegister && (
                  <Box sx={{ textAlign: 'right', mt: '-0.5rem' }}>
                    <Link
                      href="#"
                      underline="hover"
                      sx={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}
                      onClick={() => setResetPasswordOpen(true)}
                    >
                      Passwort vergessen?
                    </Link>
                  </Box>
                )}
              </Box>

              {loginError && (
                <Typography sx={{ color: 'red', fontSize: '0.85rem', mt: 1, textAlign: 'center' }}>
                  {loginError}
                </Typography>
              )}

              <Button
                fullWidth
                sx={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  padding: '0.9rem',
                  borderRadius: 3,
                  mt: 1,
                  '&:hover': { backgroundColor: '#4338CA' },
                }}
                onClick={isRegister ? handleRegister : handleLogin}
              >
                {isRegister ? "Jetzt registrieren" : "Jetzt einloggen"}
              </Button>

              <Divider sx={{ width: '100%', my: 2 }} />

              <Typography sx={{ fontSize: '0.9rem', color: '#555' }}>
                {isRegister ? "Du hast bereits ein Konto?" : "Du hast noch kein Konto?"}{" "}
                <span
                  style={{ color: '#4F46E5', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setLoginError("");
                  }}
                >
                  {isRegister ? "Anmelden" : "Registrieren"}
                </span>
              </Typography>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: 24,
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {resetSuccess ? (
            <Typography variant="h5" sx={{ color: 'green', fontWeight: 700 }}>
              Eine E-Mail zum Zurücksetzen Ihres Passworts wurde gesendet!
            </Typography>
          ) : (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Passwort zurücksetzen
              </Typography>

              <TextField
                label="E-Mail-Adresse"
                variant="outlined"
                fullWidth
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />

              {resetError && (
                <Typography sx={{ color: 'red', fontSize: '0.85rem', mt: 1, textAlign: 'center' }}>
                  {resetError}
                </Typography>
              )}

              <Button
                fullWidth
                sx={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  padding: '0.9rem',
                  borderRadius: 3,
                  mt: 1,
                  '&:hover': { backgroundColor: '#4338CA' },
                }}
                onClick={handlePasswordReset}
              >
                Passwort zurücksetzen
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}
