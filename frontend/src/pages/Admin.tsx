import { Box, CircularProgress, Typography, Paper, Divider, List, ListItem, ListItemText, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import TopLeftLogo from '../components/home/TopLeftLogo';
import TopBar from '../components/home/TopBar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../auth/firebase';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import GutscheinDesignAdminEdit from './GutscheinDesignAdminEdit'; // Import hinzufügen
const API_URL = process.env.REACT_APP_API_URL;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string; }) {
  return (
    <Box sx={{
      flex: '1 1 180px',
      minWidth: '180px',
      display: 'flex',
      alignItems: 'center',
      p: 2,
      borderRadius: '12px',
      boxShadow: 1,
      backgroundColor: '#fff',
      borderLeft: `4px solid ${color}`,
      gap: 2
    }}>
      <Box sx={{ backgroundColor: `${color}20`, borderRadius: '8px', p: 1 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" sx={{ color: '#555' }}>{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5, fontSize: '1.25rem' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function AdminPage() {
  const user = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [monatStats, setMonatStats] = useState<any[]>([]);
  const [selectedMonat, setSelectedMonat] = useState<string>('');
  const [tagStats, setTagStats] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const navigate = useNavigate();

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
      const statsDoc = await getDoc(doc(db, 'admin_stats', 'globalAdmin'));
      if (statsDoc.exists()) {
        setStats(statsDoc.data());
      }
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

  if (isAdmin === null) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f4f4f4', position: 'relative' }}>
      <TopLeftLogo />
      <Box sx={{ position: 'absolute', top: { xs: '0.5rem', md: '1.5rem' }, right: { xs: '1rem', md: '4rem' }, zIndex: 3 }}>
        <TopBar />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
          minHeight: 'calc(100vh - 80px)',
          pt: { xs: 8, md: 12 },
          pl: { xs: 0, md: 8 },
          pr: { xs: 0, md: 8 }, // rechter Abstand
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
            Admin-Bereich
          </Typography>
          <Typography variant="h6" fontWeight={500} gutterBottom>
            Du bist als <b>Admin</b> eingeloggt.
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Übersicht der wichtigsten Statistiken:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 5, mt: 3 }}>
            <StatCard
              label="Gesamtumsatz"
              value={`${stats?.gesamtUmsatz ?? 0} €`}
              icon={<MonetizationOnIcon />}
              color="#3b82f6"
            />
            <StatCard
              label="Gesamtgutscheine"
              value={stats?.gesamtGutscheine ?? 0}
              icon={<LocalActivityIcon />}
              color="#10b981"
            />
            <StatCard
              label="Gesamtshops"
              value={stats?.gesamtShops ?? 0}
              icon={<StorefrontIcon />}
              color="#f59e0b"
            />
            <StatCard
              label="Gesamthits"
              value={stats?.gesamtHits ?? 0}
              icon={<VisibilityIcon />}
              color="#6366f1"
            />
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

          <Paper
            elevation={4}
            sx={{
              p: { xs: 3, md: 5 },
              mt: { xs: 2, md: 4 },
              borderRadius: 4,
              minWidth: 320,
              maxWidth: 420,
              width: '100%',
              textAlign: 'left',
              background: 'white',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Letzte 3 Gutscheine</Typography>
            {stats?.letzteDreiGutscheine && stats.letzteDreiGutscheine.length > 0 ? (
              <List>
                {stats.letzteDreiGutscheine.map((g: any, i: number) => (
                  <ListItem key={i}>
                    <ListItemText
                      primary={`${g.gutscheinCode} (${g.betrag} €)`}
                      secondary={`am ${g.kaufdatum}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">Keine Gutscheine gefunden.</Typography>
            )}
          </Paper>

          {/* Shops & Stripe-Konten */}
          <Box sx={{ mt: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Shops & Stripe-Konten
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/demos')}
                >
                  Demo-Verwaltung
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/gutscheine')}
                  sx={{ ml: 2 }}
                >
                  Gutscheine verwalten
                </Button>
              </Box>
            </Box>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <List>
                {shops.map(shop => (
                  <ListItem key={shop.id} divider>
                    <ListItemText
                      primary={shop.unternehmensname || shop.email || shop.id}
                      secondary={
                        shop.stripeAccountId
                          ? `StripeAccountId: ${shop.stripeAccountId}`
                          : 'Kein Stripe-Konto verknüpft'
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ ml: 2 }}
                      onClick={() => navigate(`/admin/shop/${shop.id}/design`)}
                    >
                      Design bearbeiten
                    </Button>
                    {shop.stripeAccountId && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={async () => {
                          if (!window.confirm('Stripe-Konto wirklich löschen?')) return;
                          try {
                            await axios.post(`${API_URL}/api/stripeconnect/delete-stripe-account`, { // <--- HIER geändert
                              stripeAccountId: shop.stripeAccountId,
                            });
                            alert('Stripe-Konto gelöscht!');
                            window.location.reload();
                          } catch (err: any) {
                            alert('Fehler beim Löschen: ' + (err.response?.data?.error || err.message));
                          }
                        }}
                        sx={{ ml: 2 }}
                      >
                        Stripe-Konto löschen
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}