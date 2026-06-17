import { signOut } from "firebase/auth";
import { Box, CircularProgress, Typography, Paper, List, ListItem, ListItemText, Select, MenuItem, FormControl, InputLabel, Button, Chip, IconButton, TextField } from '@mui/material';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../auth/firebase';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;
const API_BASE = API_URL || '';
const ADMIN_NODE_ENV = ((globalThis as any).process?.env?.NODE_ENV as string | undefined) || '';
const ADMIN_HOSTNAME = typeof window !== 'undefined' ? window.location.hostname : '';
const IS_DEV = ADMIN_NODE_ENV === 'development' || ADMIN_HOSTNAME === 'localhost' || ADMIN_HOSTNAME === '127.0.0.1';

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string; }) {
  return (
    <Box sx={{
      flex: '1 1 250px',
      minWidth: '250px',
      display: 'flex',
      alignItems: 'center',
      p: 3,
      borderRadius: '16px',
      boxShadow: 3,
      backgroundColor: '#fff',
      borderLeft: `5px solid ${color}`,
      gap: 3,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 5,
      }
    }}>
      <Box sx={{ backgroundColor: `${color}20`, borderRadius: '12px', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ fontSize: '2rem', display: 'flex', color: color }}>
          {icon}
        </Box>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.75rem', color: '#333' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

type ResetLinkResponse = {
  resetLink?: string;
};

type StartPasswordResponse = {
  temporaryPassword?: string;
};

export default function AdminPage() {
  const user = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [monatStats, setMonatStats] = useState<any[]>([]);
  const [selectedMonat, setSelectedMonat] = useState<string>('');
  const [tagStats, setTagStats] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [kontaktanfragen, setKontaktanfragen] = useState<any[]>([]);
  const [demoGutscheine, setDemoGutscheine] = useState<any[]>([]);
  const [selectedCustomerShopId, setSelectedCustomerShopId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authActionError, setAuthActionError] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');
  const [generatedStartPassword, setGeneratedStartPassword] = useState('');
  const [authActionSuccess, setAuthActionSuccess] = useState('');
  const navigate = useNavigate();
  const customerShopsWithEmail = shops.filter(
    (shop) => typeof shop.email === 'string' && shop.email.trim().length > 0
  );
  const stripeLinkedShops = shops.filter((shop) => Boolean(shop.stripeAccountId));
  const stripeUnlinkedShops = shops.filter((shop) => !shop.stripeAccountId);

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setAuthActionSuccess(successMessage);
    } catch (error) {
      setAuthActionError('Konnte nicht in die Zwischenablage kopieren.');
    }
  };

  const withAdminAuthHeaders = async () => {
    if (!user) throw new Error('Nicht angemeldet.');
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const validateCustomerEmail = () => {
    const normalized = customerEmail.trim().toLowerCase();
    if (!normalized) {
      setAuthActionError('Bitte eine Kunden-E-Mail eingeben.');
      return null;
    }
    return normalized;
  };

  const handleSelectCustomerShop = (shopId: string) => {
    setSelectedCustomerShopId(shopId);

    const selectedShop = shops.find((shop) => shop.id === shopId);
    if (selectedShop?.email) {
      setCustomerEmail(String(selectedShop.email).trim().toLowerCase());
      setAuthActionError('');
      setAuthActionSuccess('');
    }
  };

  const handleGenerateResetLink = async () => {
    const email = validateCustomerEmail();
    if (!email) return;

    setAuthActionLoading(true);
    setAuthActionError('');
    setAuthActionSuccess('');
    setGeneratedStartPassword('');

    try {
      const headers = await withAdminAuthHeaders();
      const response = await axios.post<ResetLinkResponse>(
        `${API_BASE}/api/admin/customer-auth/reset-link`,
        { email },
        { headers }
      );

      setGeneratedResetLink(response.data.resetLink || '');
      setAuthActionSuccess('Reset-Link wurde erfolgreich erstellt.');
    } catch (err: any) {
      setGeneratedResetLink('');
      setAuthActionError(err.response?.data?.error || err.message || 'Fehler beim Erstellen des Reset-Links.');
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSetStartPassword = async () => {
    const email = validateCustomerEmail();
    if (!email) return;

    const confirmed = window.confirm(
      'Neues Startpasswort für diesen Kunden setzen? Das alte Passwort wird sofort ersetzt.'
    );
    if (!confirmed) return;

    setAuthActionLoading(true);
    setAuthActionError('');
    setAuthActionSuccess('');
    setGeneratedResetLink('');

    try {
      const headers = await withAdminAuthHeaders();
      const response = await axios.post<StartPasswordResponse>(
        `${API_BASE}/api/admin/customer-auth/start-password`,
        { email },
        { headers }
      );

      setGeneratedStartPassword(response.data.temporaryPassword || '');
      setAuthActionSuccess('Startpasswort wurde gesetzt. Bitte sicher an den Kunden weitergeben.');
    } catch (err: any) {
      setGeneratedStartPassword('');
      setAuthActionError(err.response?.data?.error || err.message || 'Fehler beim Setzen des Startpassworts.');
    } finally {
      setAuthActionLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      setIsAdmin(null);
      return;
    }
    if (!user) {
      navigate('/');
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        navigate('/');
      }
    };
    checkAdmin();
  }, [user, navigate]);

  // Admin Stats laden
  useEffect(() => {
    const fetchStats = async () => {
      // Monatsstatistiken laden
      const monatCol = collection(doc(db, 'admin_stats', 'globalAdmin'), 'Details');
      const monatSnaps = await getDocs(monatCol);
      const monate: any[] = [];
      monatSnaps.forEach(docSnap => {
        monate.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMonatStats(monate);
    };
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  // Tagesstatistiken laden, wenn Monat gewählt
  useEffect(() => {
    const fetchTagStats = async () => {
      if (!selectedMonat) {
        setTagStats([]);
        return;
      }
      const tageCol = collection(doc(db, 'admin_stats', 'globalAdmin', 'Details', selectedMonat), 'Tage');
      const tageSnaps = await getDocs(tageCol);
      const tage: any[] = [];
      tageSnaps.forEach(docSnap => {
        tage.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTagStats(tage);
    };
    if (selectedMonat) fetchTagStats();
  }, [selectedMonat]);

  // Lade alle User/Shop-Daten
  useEffect(() => {
    const fetchShops = async () => {
      const usersCol = collection(db, 'users');
      const usersSnap = await getDocs(usersCol);
      const shopsArr: any[] = [];
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        shopsArr.push({
          id: docSnap.id,
          unternehmensname: data.Checkout?.Unternehmensname || data.Unternehmensdaten?.Unternehmensname || '',
          stripeAccountId: data.Checkout?.StripeAccountId || '',
          email: data.email || '',
        });
      });
      setShops(shopsArr);
    };
    if (isAdmin) fetchShops();
  }, [isAdmin]);

  // Lade Kontaktanfragen
  useEffect(() => {
    const fetchKontaktanfragen = async () => {
      try {
        const q = query(collection(db, 'kontaktanfragen'), orderBy('timestamp', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const anfragen: any[] = [];
        snapshot.forEach(docSnap => {
          anfragen.push({ id: docSnap.id, ...docSnap.data() });
        });
        setKontaktanfragen(anfragen);
      } catch (error) {
        console.error('Fehler beim Laden der Kontaktanfragen:', error);
        setKontaktanfragen([]);
      }
    };
    if (isAdmin) fetchKontaktanfragen();
  }, [isAdmin]);

  // Lade Demo-Gutscheine
  useEffect(() => {
    const fetchDemoGutscheine = async () => {
      try {
        // Alle Dokumente laden (ohne orderBy um Index-Fehler zu vermeiden)
        const snapshot = await getDocs(collection(db, 'demo-gutscheine'));
        const demos: any[] = [];
        snapshot.forEach(docSnap => {
          demos.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Im Code sortieren (unterstützt beide Feldnamen)
        demos.sort((a, b) => {
          const dateA = new Date(a.kaufdatum || a.erstelltAm || 0).getTime();
          const dateB = new Date(b.kaufdatum || b.erstelltAm || 0).getTime();
          return dateB - dateA;
        });
        
        // Nur die letzten 10
        setDemoGutscheine(demos.slice(0, 10));
      } catch (error) {
        console.error('Fehler beim Laden der Demo-Gutscheine:', error);
        setDemoGutscheine([]);
      }
    };
    if (isAdmin) fetchDemoGutscheine();
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

return (
    <Box sx={{ width: "100%", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sleek Compact Admin-Header */}
      <Box sx={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        width: "100%",
        py: 1,
        px: { xs: 2, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)"
      }}>
        {/* Left: compact Logo/Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate("/")}>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 32, height: 32 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={850} color="text.primary" sx={{ lineHeight: 1.1 }}>
              GutscheinFabrik
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Admin-Bereich
            </Typography>
          </Box>
        </Box>

        {/* Center: Desktop Navigation tabs */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
          <Button
             onClick={() => navigate("/admin")}
             size="small"
             sx={{
               color: "#2563eb",
               fontWeight: 700,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               backgroundColor: "#f0f7ff",
               textTransform: "none",
               "&:hover": { backgroundColor: "#e0f2fe" }
             }}
          >
            Übersicht
          </Button>
          <Button
             onClick={() => navigate("/admin/demos")}
             size="small"
             sx={{
               color: "#475569",
               fontWeight: 600,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               textTransform: "none",
               "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" }
             }}
          >
            Demos
          </Button>
          <Button
             onClick={() => navigate("/admin/gutschein-erstellen")}
             size="small"
             sx={{
               color: "#475569",
               fontWeight: 600,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               textTransform: "none",
               "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" }
             }}
          >
            Gutschein erstellen
          </Button>
          <Button
             onClick={() => navigate("/admin/blog")}
             size="small"
             sx={{
               color: "#475569",
               fontWeight: 600,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               textTransform: "none",
               "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" }
             }}
          >
            Blog
          </Button>
          <Button
             onClick={() => navigate("/admin/extra")}
             size="small"
             sx={{
               color: "#475569",
               fontWeight: 600,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               textTransform: "none",
               "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" }
             }}
          >
            Extraslug
          </Button>
          <Button
             onClick={() => navigate("/admin/marketing")}
             size="small"
             sx={{
               color: "#475569",
               fontWeight: 600,
               fontSize: "0.775rem",
               px: 1.5,
               py: 0.5,
               borderRadius: 2,
               textTransform: "none",
               "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" }
             }}
          >
            Marketing
          </Button>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/admin/marketing')}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              borderColor: '#e2e8f0',
              color: '#475569',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }
            }}
          >
            Marketing
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/")}
            sx={{
              borderColor: "#e2e8f0",
              color: "#475569",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.75rem",
              borderRadius: 2,
              py: 0.5,
              "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" }
            }}
          >
            Zur Website
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              if (window.confirm("Wirklich abmelden?")) {
                signOut(auth).then(() => navigate("/"));
              }
            }}
            sx={{
              fontWeight: 650,
              textTransform: "none",
              fontSize: "0.75rem",
              borderRadius: 2,
              py: 0.5,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" }
            }}
          >
            Abmelden
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          width: "100%",
          minHeight: "calc(100vh - 60px)",
          pt: { xs: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          pl: { xs: 2, md: 4 },
          pr: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>

          {/* Kontaktanfragen & Demo-Mails */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 5 }}>
            {/* Kontaktanfragen */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <ContactMailIcon sx={{ color: "#2563eb" }} />
                <Typography variant="subtitle1" fontWeight={750} color="text.primary">
                  Kontaktanfragen (letzte 10)
                </Typography>
              </Box>
              {kontaktanfragen.length > 0 ? (
                <List sx={{ maxHeight: 350, overflow: "auto", py: 0 }}>
                  {kontaktanfragen.map((anfrage) => (
                    <ListItem
                      key={anfrage.id}
                      disableGutters
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        borderBottom: "1px solid #f1f5f9",
                        py: 1,
                        "&:last-child": { borderBottom: "none", pb: 0 },
                        "&:first-of-type": { pt: 0 }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, width: "100%", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={anfrage.source || anfrage.quelle || "Kontakt"}
                            size="small"
                            sx={{
                              fontSize: "0.65rem",
                              height: "18px",
                              fontWeight: 650,
                              bgcolor: "#eff6ff",
                              color: "#1d4ed8"
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {(() => {
                              const dt = anfrage.timestamp || anfrage.erstelltAm;
                              if (!dt) return "Keine Zeit";
                              if (typeof dt.toDate === "function") {
                                return dt.toDate().toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
                              }
                              const parsed = new Date(dt);
                              return isNaN(parsed.getTime()) ? String(dt) : parsed.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
                            })()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            if (!window.confirm("Kontaktanfrage wirklich löschen?")) return;
                            try {
                              await deleteDoc(doc(db, "kontaktanfragen", anfrage.id));
                              setKontaktanfragen(prev => prev.filter(k => k.id !== anfrage.id));
                            } catch (error) {
                              console.error("Fehler beim Löschen:", error);
                              alert("Fehler beim Löschen der Kontaktanfrage");
                            }
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <DeleteIcon fontSize="small" sx={{ fontSize: "1rem" }} />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ wordBreak: "break-word", fontSize: "0.85rem" }}>
                        {anfrage.name || anfrage.kontakt || "Kein Name"}
                        {(anfrage.email || anfrage.telefon) && (
                          <Box component="span" sx={{ fontWeight: 400, color: "text.secondary", display: "block", mt: 0.25, fontSize: "0.75rem" }}>
                            {anfrage.email && <span>{anfrage.email}</span>}
                            {anfrage.email && anfrage.telefon && <span> | </span>}
                            {anfrage.telefon && <span>Tel: {anfrage.telefon}</span>}
                          </Box>
                        )}
                      </Typography>
                      {(anfrage.nachricht || anfrage.message) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: "break-word", whiteSpace: "pre-line", fontSize: "0.8rem", lineHeight: 1.4 }}>
                          {anfrage.nachricht || anfrage.message}
                        </Typography>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" variant="body2">Keine Kontaktanfragen vorhanden.</Typography>
              )}
            </Paper>

            {/* Demo-Gutscheine */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "white" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <EmailIcon sx={{ color: "#059669" }} />
                <Typography variant="subtitle1" fontWeight={750} color="text.primary">
                  Demo-Mails (letzte 10)
                </Typography>
              </Box>
              {demoGutscheine.length > 0 ? (
                <List sx={{ maxHeight: 350, overflow: "auto", py: 0 }}>
                  {demoGutscheine.map((demo) => (
                    <ListItem
                      key={demo.id}
                      disableGutters
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        borderBottom: "1px solid #f1f5f9",
                        py: 1,
                        "&:last-child": { borderBottom: "none", pb: 0 },
                        "&:first-of-type": { pt: 0 }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, width: "100%", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {new Date(demo.kaufdatum || demo.erstelltAm).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                          </Typography>
                          <Chip
                            label={`${demo.betrag || 0} €`}
                            size="small"
                            sx={{
                              fontSize: "0.65rem",
                              height: "18px",
                              fontWeight: 700,
                              bgcolor: "#dcfce7",
                              color: "#15803d"
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            if (!window.confirm("Demo-Mail wirklich löschen?")) return;
                            try {
                              await deleteDoc(doc(db, "demo-gutscheine", demo.id));
                              setDemoGutscheine(prev => prev.filter(d => d.id !== demo.id));
                            } catch (error) {
                              console.error("Fehler beim Löschen:", error);
                              alert("Fehler beim Löschen der Demo-Mail");
                            }
                          }}
                          sx={{ p: 0.25 }}
                        >
                          <DeleteIcon fontSize="small" sx={{ fontSize: "1rem" }} />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" fontWeight={710} color="text.primary" sx={{ wordBreak: "break-word", fontSize: "0.85rem" }}>
                        {demo.customerEmail || demo.empfaengerEmail}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.75rem" }}>
                        Code: <Box component="span" sx={{ fontFamily: "monospace", bgcolor: "#f8fafc", px: 0.5, py: 0.25, borderRadius: 0.5, border: "1px solid #f1f5f9" }}>{demo.gutscheinCode}</Box>
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" variant="body2">Keine Demo-Mails vorhanden.</Typography>
              )}
            </Paper>
          </Box>

          {/* Filter für Monat und Tag */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="monat-select-label">Monat wählen</InputLabel>
              <Select
                labelId="monat-select-label"
                value={selectedMonat}
                label="Monat wählen"
                onChange={e => {
                  setSelectedMonat(e.target.value);
                  setSelectedTag('');
                }}
              >
                <MenuItem value="">Alle Monate</MenuItem>
                {monatStats.map(monat => (
                  <MenuItem key={monat.id} value={monat.id}>{monat.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedMonat && (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="tag-select-label">Tag wählen</InputLabel>
                <Select
                  labelId="tag-select-label"
                  value={selectedTag}
                  label="Tag wählen"
                  onChange={e => setSelectedTag(e.target.value)}
                >
                  <MenuItem value="">Alle Tage</MenuItem>
                  {tagStats.map(tag => (
                    <MenuItem key={tag.id} value={tag.id}>{tag.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {selectedMonat && (
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Monat: {selectedMonat}</Typography>
              {monatStats.filter(m => m.id === selectedMonat).map(monat => (
                <Box key={monat.id} sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <StatCard
                    label="Monatsumsatz"
                    value={`${monat.monatsUmsatz ?? 0} €`}
                    icon={<MonetizationOnIcon />}
                    color="#3b82f6"
                  />
                  <StatCard
                    label="Monatsgutscheine"
                    value={monat.monatsGutscheine ?? 0}
                    icon={<LocalActivityIcon />}
                    color="#10b981"
                  />
                  <StatCard
                    label="Monatsshops"
                    value={monat.monatsShops ?? 0}
                    icon={<StorefrontIcon />}
                    color="#f59e0b"
                  />
                  <StatCard
                    label="Monatshits"
                    value={monat.monatsHits ?? 0}
                    icon={<VisibilityIcon />}
                    color="#6366f1"
                  />
                </Box>
              ))}
            </Paper>
          )}

          {/* Tagesstatistik */}
          {selectedTag && (
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Tag: {selectedTag}</Typography>
              {tagStats.filter(t => t.id === selectedTag).map(tag => (
                <Box key={tag.id} sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <StatCard
                    label="Tagesumsatz"
                    value={`${tag.tagesUmsatz ?? 0} €`}
                    icon={<MonetizationOnIcon />}
                    color="#3b82f6"
                  />
                  <StatCard
                    label="Tagesgutscheine"
                    value={tag.tagesGutscheine ?? 0}
                    icon={<LocalActivityIcon />}
                    color="#10b981"
                  />
                  <StatCard
                    label="Tagsshops"
                    value={tag.tagesShops ?? 0}
                    icon={<StorefrontIcon />}
                    color="#f59e0b"
                  />
                  <StatCard
                    label="Tageshits"
                    value={tag.tagesHits ?? 0}
                    icon={<VisibilityIcon />}
                    color="#6366f1"
                  />
                </Box>
              ))}
            </Paper>
          )}

          {/* Shops & Stripe-Konten */}
          <Box sx={{ mt: 6 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Kundenzugang verwalten
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Erzeuge für Kunden einen direkten Passwort-Reset-Link oder setze ein neues Startpasswort.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 280, flex: '1 1 280px' }}>
                  <InputLabel id="customer-account-select-label">Bestehenden Account wählen</InputLabel>
                  <Select
                    labelId="customer-account-select-label"
                    value={selectedCustomerShopId}
                    label="Bestehenden Account wählen"
                    onChange={(e) => handleSelectCustomerShop(String(e.target.value))}
                  >
                    <MenuItem value="">Bitte wählen</MenuItem>
                    {customerShopsWithEmail.map((shop) => (
                      <MenuItem key={shop.id} value={shop.id}>
                        {(shop.unternehmensname || 'Ohne Unternehmensname') + ' - ' + shop.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Kunden-E-Mail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  size="small"
                  sx={{ minWidth: 280, flex: '1 1 280px' }}
                />
                <Button
                  variant="contained"
                  disabled={authActionLoading}
                  onClick={handleGenerateResetLink}
                >
                  Reset-Link erzeugen
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={authActionLoading}
                  onClick={handleSetStartPassword}
                >
                  Startpasswort setzen
                </Button>
              </Box>

              {authActionError && (
                <Typography sx={{ mt: 1.5, color: 'error.main', fontWeight: 500 }}>
                  {authActionError}
                </Typography>
              )}

              {authActionSuccess && (
                <Typography sx={{ mt: 1.5, color: 'success.main', fontWeight: 500 }}>
                  {authActionSuccess}
                </Typography>
              )}

              {generatedResetLink && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Reset-Link</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{generatedResetLink}</Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => copyToClipboard(generatedResetLink, 'Reset-Link wurde kopiert.')}
                    >
                      Link kopieren
                    </Button>
                  </Box>
                </Box>
              )}

              {generatedStartPassword && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: '#fff7ed', border: '1px solid #fdba74' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Neues Startpasswort</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.03em' }}>
                    {generatedStartPassword}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Nur einmal sicher weitergeben. Empfiehl dem Kunden direkt danach ein eigenes Passwort zu setzen.
                  </Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => copyToClipboard(generatedStartPassword, 'Startpasswort wurde kopiert.')}
                    >
                      Passwort kopieren
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Shops & Stripe-Konten
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/admin/extra')}
                >
                  Extra-Slug Seite
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => navigate('/admin/gutschein-erstellen')}
                >
                  Gutschein erstellen
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/demos')}
                >
                  Demo-Verwaltung
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/blog')}
                >
                  Blog verwalten
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => navigate('/admin/marketing')}
                >
                  Marketing
                </Button>
              </Box>
            </Box>

            {IS_DEV && (
              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Dev-only: Kundensicht testen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Nur in Development aktiv. Öffnet die Profilansicht eines ausgewählten Kunden im sicheren Nur-Lesen-Modus.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 260, flex: '1 1 260px' }}>
                    <InputLabel id="dev-preview-user-label">Kunde wählen</InputLabel>
                    <Select
                      labelId="dev-preview-user-label"
                      value={selectedShopId || ''}
                      label="Kunde wählen"
                      onChange={(e) => setSelectedShopId(e.target.value || null)}
                    >
                      <MenuItem value="">Bitte wählen</MenuItem>
                      {shops.map((shop) => (
                        <MenuItem key={shop.id} value={shop.id}>
                          {shop.unternehmensname || shop.email || shop.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    disabled={!selectedShopId}
                    onClick={() => {
                      if (!selectedShopId) return;
                      navigate(`/profil/einnahmen?devPreview=1&asUser=${encodeURIComponent(selectedShopId)}`);
                    }}
                  >
                    Kundensicht öffnen
                  </Button>
                </Box>
              </Paper>
            )}
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Stripe verknuepfte Shops
              </Typography>
              <List>
                {stripeLinkedShops.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Keine Stripe-verknuepften Shops gefunden." />
                  </ListItem>
                )}
                {stripeLinkedShops.map(shop => (
                  <ListItem key={shop.id} divider>
                    <ListItemText
                      primary={shop.unternehmensname || shop.email || shop.id}
                      secondary={`StripeAccountId: ${shop.stripeAccountId}`}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ ml: 2 }}
                      onClick={() => navigate(`/admin/shop/${shop.id}/manage`)}
                    >
                      Bearbeiten
                    </Button>                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2.5, mb: 1.5 }}>
                Nicht verknuepfte Shops
              </Typography>
              <List>
                {stripeUnlinkedShops.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Alle Shops sind mit Stripe verknuepft." />
                  </ListItem>
                )}
                {stripeUnlinkedShops.map(shop => (
                  <ListItem key={shop.id} divider>
                    <ListItemText
                      primary={shop.unternehmensname || shop.email || shop.id}
                      secondary="Kein Stripe-Konto verknuepft"
                    />
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ ml: 2 }}
                      onClick={() => navigate(`/admin/shop/${shop.id}/manage`)}
                    >
                      Bearbeiten
                    </Button>                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
