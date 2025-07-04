import { Modal, Box, Typography, TextField, Button, Divider, Link } from '@mui/material';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../../auth/firebase';
import { doc, setDoc } from "firebase/firestore";
import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleLogin = () => {
    if (!email || !passwort) {
      setLoginError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    setLoginError("");

    signInWithEmailAndPassword(auth, email, passwort)
      .then(res => {
        setSuccess(true);
      })
      .catch(err => {
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
      console.log("User created successfully:", res.user); // Debugging log
      await setDoc(doc(db, "users", res.user.uid), {
        email: res.user.email,
        createdAt: new Date()
      });
      console.log("User document set successfully in Firestore."); // Debugging log
      setSuccess(true);
      setTimeout(() => {
        console.log("Closing modal after registration success."); // Debugging log
        setIsRegister(false); // Zurück auf Login-Ansicht für das nächste Öffnen
        onClose();
      }, 1000);
    })
    .catch(err => {
      console.error("Error during registration:", err); // Debugging log
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

  return (
    <Modal open={open} onClose={onClose}>
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
        {success ? (
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
                  <Link href="#" underline="hover" sx={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 500 }}>
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
  );
}
