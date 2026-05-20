import { Box, Button, Drawer, FormControl, IconButton, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Typography } from '@mui/material';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import DesignServicesIcon from '@mui/icons-material/DesignServices'; // Neues Icon importieren
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import useProfileViewContext from '../../auth/useProfileViewContext';

interface PreviewUser {
  id: string;
  label: string;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isDevMode, authUserId, isImpersonating } = useProfileViewContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<PreviewUser[]>([]);
  const [selectedPreviewUser, setSelectedPreviewUser] = useState('');
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const asUser = urlParams.get('asUser') || '';
    setSelectedPreviewUser(asUser);
  }, [urlParams]);

  useEffect(() => {
    const loadPreviewUsers = async () => {
      if (!isDevMode || !isAdmin) {
        setPreviewUsers([]);
        return;
      }

      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            label:
              data?.Checkout?.Unternehmensname ||
              data?.Unternehmensdaten?.Unternehmensname ||
              data?.email ||
              docSnap.id,
          };
        })
        .filter((u) => u.id !== authUserId)
        .sort((a, b) => a.label.localeCompare(b.label, 'de'));

      setPreviewUsers(users);
    };

    loadPreviewUsers();
  }, [isAdmin, isDevMode, authUserId]);

  const navigateWithSearch = (path: string) => {
    navigate(`${path}${location.search || ''}`);
    setMobileOpen(false);
  };

  const openPreviewView = () => {
    if (!selectedPreviewUser) return;
    const params = new URLSearchParams(location.search);
    params.set('devPreview', '1');
    params.set('asUser', selectedPreviewUser);
    navigate(`${location.pathname}?${params.toString()}`);
    setMobileOpen(false);
  };

  const clearPreviewView = () => {
    navigate(location.pathname);
    setMobileOpen(false);
  };

  // Navigate to '/profil/einnahmen' on initial load
  useEffect(() => {
    if (location.pathname === '/profil') {
      navigate(`/profil/einnahmen${location.search || ''}`);
    }
  }, [location.pathname, location.search, navigate]);

  const navItems = [
    { path: '/profil/einnahmen', label: 'Einnahmen', icon: <MonetizationOnIcon sx={{ fontSize: '1.9rem' }} /> },
    { path: '/profil/gutscheine', label: 'Meine Gutscheine', icon: <LocalActivityIcon sx={{ fontSize: '1.9rem' }} /> },
    { path: '/profil/selbstdesign', label: 'Design', icon: <DesignServicesIcon sx={{ fontSize: '1.9rem' }} /> },
    { path: '/profil/einstellungen', label: 'Einstellungen', icon: <SettingsIcon sx={{ fontSize: '1.9rem' }} /> },
  ];

  const navContent = (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, md: '4rem 2rem 2rem 2rem' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, md: 4 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.9rem', md: '1.35rem' },
            lineHeight: 1.1,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          Gutscheinfabrik
        </Typography>
        <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#fff' }} onClick={() => setMobileOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigateWithSearch(item.path)}
              sx={{
                justifyContent: 'flex-start',
                px: 1.25,
                py: 1.2,
                borderRadius: '12px',
                backgroundColor: location.pathname === item.path ? '#1f2937' : 'transparent',
                '&:hover': { backgroundColor: '#1f2937' },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#4F46E5' : '#fff', minWidth: 42 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: { xs: '1.22rem', md: '1.05rem' }, fontWeight: 600, lineHeight: 1.2 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isDevMode && isAdmin && (
        <Box sx={{ width: '100%', mt: 'auto', pt: 2 }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#93c5fd', mb: 1 }}>DEV: Kundensicht</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel id="profil-preview-user-label" sx={{ color: '#cbd5e1' }}>Kunde</InputLabel>
            <Select
              labelId="profil-preview-user-label"
              value={selectedPreviewUser}
              label="Kunde"
              onChange={(e) => setSelectedPreviewUser(e.target.value)}
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '& .MuiSvgIcon-root': { color: '#cbd5e1' },
              }}
            >
              <MenuItem value="">Bitte wählen</MenuItem>
              {previewUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>{user.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            fullWidth
            variant="contained"
            size="small"
            disabled={!selectedPreviewUser}
            onClick={openPreviewView}
            sx={{ textTransform: 'none', mb: isImpersonating ? 1 : 0 }}
          >
            Kundensicht öffnen
          </Button>
          {isImpersonating && (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={clearPreviewView}
              sx={{ textTransform: 'none', color: '#e2e8f0', borderColor: '#475569' }}
            >
              Eigene Sicht
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', top: 10, left: 10, zIndex: 6 }}>
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{ backgroundColor: '#111827', color: '#fff', '&:hover': { backgroundColor: '#1f2937' } }}
          aria-label="Navigation öffnen"
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 294, borderTopRightRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' } }}
      >
        {navContent}
      </Drawer>

      <Box
        sx={{
          width: 280,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 2,
          display: { xs: 'none', md: 'block' },
          borderRadius: '0 1rem 1rem 0',
          overflow: 'hidden',
        }}
      >
        {navContent}
      </Box>
    </>
  );
}
