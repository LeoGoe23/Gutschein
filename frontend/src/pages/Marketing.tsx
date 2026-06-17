import {
  Box, Button, CircularProgress, Paper, Typography,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Divider, Tooltip,
} from '@mui/material';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import germany from '@svg-maps/germany';
import useAuth from '../auth/useAuth';
import { auth, db } from '../auth/firebase';

type GermanyLocation = { id: string; name: string; path: string };
type GermanyMapData = { viewBox: string; locations: GermanyLocation[] };
const germanyMap = germany as unknown as GermanyMapData;

type MarketingStatus = 'nicht_geplant' | 'geplant' | 'aktiv' | 'pausiert' | 'abgeschlossen';

interface Region {
  name: string;
  status: MarketingStatus;
  areaId?: number;
  leads?: LeadContact[];
  leadsSyncAt?: string;
}

interface LeadContact {
  id: string;
  name: string;
  adresse: string;
  email: string;
  anrede: string;
  vorname: string;
  nachname: string;
}

interface BundeslandData {
  status: MarketingStatus;
  notizen: string;
  budget: number;
  regionen: Region[];
  leadNamen: string[];
  leadSyncAt?: string;
  zuletzt_bearbeitet: string;
}

type MarketingMap = Record<string, BundeslandData>;
type MunicipalityItem = { name: string; areaId: number };
type MunicipalityMap = Record<string, MunicipalityItem[]>;

const STATUS_LABELS: Record<MarketingStatus, string> = {
  nicht_geplant: 'Nicht geplant',
  geplant: 'Geplant',
  aktiv: 'Aktiv',
  pausiert: 'Pausiert',
  abgeschlossen: 'Abgeschlossen',
};

const STATUS_COLORS: Record<MarketingStatus, string> = {
  nicht_geplant: '#cbd5e1',
  geplant: '#fbbf24',
  aktiv: '#22c55e',
  pausiert: '#f97316',
  abgeschlossen: '#6366f1',
};

function emptyBundesland(): BundeslandData {
  return { status: 'nicht_geplant', notizen: '', budget: 0, regionen: [], leadNamen: [], zuletzt_bearbeitet: '' };
}

export default function Marketing() {
  const user = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GermanyLocation | null>(null);
  const [marketingData, setMarketingData] = useState<MarketingMap>({});
  const [editData, setEditData] = useState<BundeslandData>(emptyBundesland());
  const [newRegionName, setNewRegionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadProgress, setLeadProgress] = useState<{ status: string; processed: number; total: number; count: number; failed: number } | null>(null);
  const [municipalityNames, setMunicipalityNames] = useState<MunicipalityMap>({});
  const [municipalityLoading, setMunicipalityLoading] = useState(false);
  const [municipalityError, setMunicipalityError] = useState('');
  const [regionLeadLoading, setRegionLeadLoading] = useState<Record<string, boolean>>({});
  const [regionLeadError, setRegionLeadError] = useState<Record<string, string>>({});
  const [regionAutoCollecting, setRegionAutoCollecting] = useState<Record<string, boolean>>({});
  const [regionLeadLogs, setRegionLeadLogs] = useState<Record<string, string[]>>({});
  const autoCollectTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const API_URL = process.env.REACT_APP_API_URL;
  const API_BASE = API_URL || '';

  useEffect(() => () => {
    Object.values(autoCollectTimersRef.current).forEach((timer) => clearTimeout(timer));
    autoCollectTimersRef.current = {};
  }, []);

  // Admin-Check + Daten laden
  useEffect(() => {
    if (user === null) { setIsAdmin(null); return; }
    if (!user) { navigate('/'); return; }

    const init = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().isAdmin !== true) {
        setIsAdmin(false); navigate('/'); return;
      }
      setIsAdmin(true);
      const mktDoc = await getDoc(doc(db, 'admin_marketing', 'bundeslaender'));
      if (mktDoc.exists()) {
        setMarketingData(mktDoc.data() as MarketingMap);
      }
    };
    init();
  }, [user, navigate]);

  const handleSelectBundesland = useCallback((location: GermanyLocation) => {
    setSelectedLocation(location);
    const existing = marketingData[location.id];
    const normalizedRegionen: Region[] = Array.isArray(existing?.regionen)
      ? existing.regionen.map((region) => ({
        name: String(region?.name || '').trim(),
        status: region?.status || 'geplant',
        areaId: Number.isFinite(Number(region?.areaId)) ? Number(region.areaId) : undefined,
        leads: Array.isArray(region?.leads) ? region.leads.map((lead: any) => ({
          id: String(lead?.id || `${lead?.name || 'lead'}-${Math.random().toString(36).slice(2, 8)}`),
          name: String(lead?.name || '').trim(),
          adresse: String(lead?.adresse || '').trim(),
          email: String(lead?.email || '').trim(),
          anrede: String(lead?.anrede || '').trim(),
          vorname: String(lead?.vorname || '').trim(),
          nachname: String(lead?.nachname || '').trim(),
        })) : [],
        leadsSyncAt: region?.leadsSyncAt || undefined,
      })).filter((region) => region.name)
      : [];

    setEditData(existing
      ? {
        ...emptyBundesland(),
        ...existing,
        regionen: normalizedRegionen,
        leadNamen: Array.isArray(existing.leadNamen) ? existing.leadNamen : [],
      }
      : emptyBundesland());
    setNewRegionName('');
    setSaveSuccess(false);
    setLeadError('');
    setMunicipalityError('');
  }, [marketingData]);

  const handleSave = async () => {
    if (!selectedLocation) return;
    setSaving(true);
    const updated: MarketingMap = {
      ...marketingData,
      [selectedLocation.id]: { ...editData, zuletzt_bearbeitet: new Date().toISOString() },
    };
    await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), updated);
    setMarketingData(updated);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLoadLeadNames = async () => {
    if (!selectedLocation || !user) return;

    setLeadLoading(true);
    setLeadError('');
    setLeadProgress(null);

    try {
      const token = await user.getIdToken();
      const startResponse = await fetch(`${API_BASE}/api/admin/lead-research/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundesland: selectedLocation.name, limit: 5000 }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lead-Crawl konnte nicht gestartet werden.');
      }

      let finalStatus = 'running';
      for (let i = 0; i < 240; i += 1) {
        const statusResponse = await fetch(
          `${API_BASE}/api/admin/lead-research/status?bundesland=${encodeURIComponent(selectedLocation.name)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const job = statusData?.job || {};
          setLeadProgress({
            status: job.status || 'running',
            processed: Number(job.processed || 0),
            total: Number(job.total || 0),
            count: Number(job.count || 0),
            failed: Number(job.failed || 0),
          });
          finalStatus = job.status || 'running';
          if (finalStatus === 'completed' || finalStatus === 'failed') {
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (finalStatus === 'failed') {
        throw new Error('Lead-Crawl ist fehlgeschlagen.');
      }

      const resultsResponse = await fetch(
        `${API_BASE}/api/admin/lead-research/results?bundesland=${encodeURIComponent(selectedLocation.name)}&limit=5000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ergebnisse konnten nicht geladen werden.');
      }

      const resultsData = await resultsResponse.json();
      const names: string[] = Array.isArray(resultsData.names) ? resultsData.names : [];

      const nextEditData: BundeslandData = {
        ...editData,
        leadNamen: names,
        leadSyncAt: new Date().toISOString(),
      };

      setEditData(nextEditData);

      const updated: MarketingMap = {
        ...marketingData,
        [selectedLocation.id]: {
          ...nextEditData,
          zuletzt_bearbeitet: new Date().toISOString(),
        },
      };

      await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), updated);
      setMarketingData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error: any) {
      setLeadError(error?.message || 'OSM-Recherche fehlgeschlagen.');
    } finally {
      setLeadLoading(false);
    }
  };

  const handleLoadMunicipalities = async () => {
    if (!selectedLocation || !user) return;

    const locationId = selectedLocation.id;
    const locationName = selectedLocation.name;

    setMunicipalityLoading(true);
    setMunicipalityError('');

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE}/api/admin/lead-research/municipalities?bundesland=${encodeURIComponent(locationName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Staedte konnten nicht geladen werden.');
      }

      const data = await response.json();
      const municipalities: MunicipalityItem[] = Array.isArray(data.municipalities)
        ? data.municipalities
          .map((item: { name?: string; areaId?: number }) => ({
            name: typeof item?.name === 'string' ? item.name.trim() : '',
            areaId: Number(item?.areaId || 0),
          }))
          .filter((item: MunicipalityItem) => item.name && Number.isFinite(item.areaId) && item.areaId > 0)
        : [];

      setMunicipalityNames((prev) => ({ ...prev, [locationId]: municipalities }));

      // Backfill fuer bereits gespeicherte Regionen ohne areaId
      setEditData((prev) => {
        if (!Array.isArray(prev.regionen) || prev.regionen.length === 0) return prev;

        const byName = new Map<string, number>();
        municipalities.forEach((m: MunicipalityItem) => {
          byName.set(m.name.trim().toLowerCase(), m.areaId);
        });

        const nextRegionen: Region[] = prev.regionen.map((region) => {
          if (region.areaId && region.areaId > 0) return region;
          const matchAreaId = byName.get(region.name.trim().toLowerCase());
          return typeof matchAreaId === 'number' && Number.isFinite(matchAreaId) && matchAreaId > 0
            ? { ...region, areaId: matchAreaId }
            : region;
        });

        return { ...prev, regionen: nextRegionen };
      });
    } catch (error: any) {
      setMunicipalityError(error?.message || 'Staedte konnten nicht geladen werden.');
    } finally {
      setMunicipalityLoading(false);
    }
  };

  const loadRegionLeads = async (idx: number) => {
    if (!selectedLocation || !user) return;
    const region = editData.regionen[idx];
    const regionKey = `${selectedLocation.id}-${region?.areaId || region?.name || idx}`;

    if (!region || !region.name?.trim()) {
      setRegionLeadError((prev) => ({ ...prev, [regionKey]: 'Gemeindename fehlt.' }));
      return;
    }

    const appendRegionLog = (message: string) => {
      const ts = new Date().toLocaleTimeString('de-DE');
      setRegionLeadLogs((prev) => {
        const existing = prev[regionKey] || [];
        const next = [`[${ts}] ${message}`, ...existing].slice(0, 14);
        return { ...prev, [regionKey]: next };
      });
    };

    setRegionLeadLoading((prev) => ({ ...prev, [regionKey]: true }));
    setRegionLeadError((prev) => ({ ...prev, [regionKey]: '' }));
    appendRegionLog(`Start: Gemeinde=${region.name}, Bundesland=${selectedLocation.name}`);

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        municipality: region.name,
        bundesland: selectedLocation.name,
        source: 'auto',
        limit: '5000',
        debug: '1',
      });
      if (region.areaId && region.areaId > 0) {
        params.set('areaId', String(region.areaId));
      }
      appendRegionLog(`Request: ${params.toString()}`);
      const response = await fetch(
        `${API_BASE}/api/admin/lead-research/municipality-leads?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Massagelaeden konnten nicht geladen werden.');
      }

      const data = await response.json();
      appendRegionLog(`Response: source=${data?.source || '-'} count=${Number(data?.count || 0)}`);
      if (Array.isArray(data?.debug?.attempts)) {
        data.debug.attempts.slice(-6).forEach((attempt: any) => {
          const label = `${attempt.step || 'step'}${typeof attempt.count === 'number' ? ` count=${attempt.count}` : ''}${attempt.error ? ` err=${attempt.error}` : ''}`;
          appendRegionLog(`Try: ${label}`);
        });
      }
      const leadsFromApi: LeadContact[] = Array.isArray(data.leads)
        ? data.leads.map((lead: any, leadIndex: number) => ({
          id: String(lead?.id || `${region.areaId}-${leadIndex}`),
          name: String(lead?.name || '').trim(),
          adresse: String(lead?.adresse || '').trim(),
          email: String(lead?.email || '').trim(),
          anrede: String(lead?.anrede || '').trim(),
          vorname: String(lead?.vorname || '').trim(),
          nachname: String(lead?.nachname || '').trim(),
        })).filter((lead: LeadContact) => lead.name)
        : [];

      const mergeLeads = (existing: LeadContact[], incoming: LeadContact[]): LeadContact[] => {
        const map = new Map<string, LeadContact>();
        [...existing, ...incoming].forEach((lead) => {
          const key = `${lead.name.trim().toLowerCase()}::${lead.adresse.trim().toLowerCase()}`;
          if (!key) return;
          if (!map.has(key)) {
            map.set(key, lead);
          }
        });
        return Array.from(map.values());
      };

      setEditData((prev) => {
        const nextRegionen = [...prev.regionen];
        if (!nextRegionen[idx]) return prev;
        const existingLeads = Array.isArray(nextRegionen[idx].leads) ? nextRegionen[idx].leads as LeadContact[] : [];
        nextRegionen[idx] = {
          ...nextRegionen[idx],
          leads: mergeLeads(existingLeads, leadsFromApi),
          leadsSyncAt: new Date().toISOString(),
        };
        return { ...prev, regionen: nextRegionen };
      });
      appendRegionLog(`Merge: +${leadsFromApi.length} (gesamt nach merge)`);
    } catch (error: any) {
      setRegionLeadError((prev) => ({
        ...prev,
        [regionKey]: error?.message || 'Massagelaeden konnten nicht geladen werden.',
      }));
      appendRegionLog(`Error: ${error?.message || 'Massagelaeden konnten nicht geladen werden.'}`);
    } finally {
      setRegionLeadLoading((prev) => ({ ...prev, [regionKey]: false }));
    }
  };

  const startRegionAutoCollect = (idx: number) => {
    if (!selectedLocation) return;
    const region = editData.regionen[idx];
    const regionKey = `${selectedLocation.id}-${region?.areaId || region?.name || idx}`;
    if (!region || !region.name?.trim()) return;

    if (autoCollectTimersRef.current[regionKey]) {
      clearTimeout(autoCollectTimersRef.current[regionKey]);
      delete autoCollectTimersRef.current[regionKey];
    }

    const endAt = Date.now() + (30 * 60 * 1000);
    setRegionAutoCollecting((prev) => ({ ...prev, [regionKey]: true }));
    setRegionLeadLogs((prev) => ({
      ...prev,
      [regionKey]: [`[${new Date().toLocaleTimeString('de-DE')}] AutoCollect gestartet (30 Min, alle 2 Min)`, ...(prev[regionKey] || [])].slice(0, 14),
    }));

    const run = async () => {
      await loadRegionLeads(idx);

      if (Date.now() >= endAt) {
        setRegionAutoCollecting((prev) => ({ ...prev, [regionKey]: false }));
        setRegionLeadLogs((prev) => ({
          ...prev,
          [regionKey]: [`[${new Date().toLocaleTimeString('de-DE')}] AutoCollect beendet`, ...(prev[regionKey] || [])].slice(0, 14),
        }));
        delete autoCollectTimersRef.current[regionKey];
        return;
      }

      autoCollectTimersRef.current[regionKey] = setTimeout(run, 120000);
    };

    run();
  };

  const addRegion = () => {
    const normalized = newRegionName.trim();
    if (!normalized) return;

    const alreadyExists = editData.regionen.some(
      (region) => region.name.trim().toLowerCase() === normalized.toLowerCase()
    );
    if (alreadyExists) {
      setNewRegionName('');
      return;
    }

    setEditData(prev => ({
      ...prev,
      regionen: [...prev.regionen, { name: normalized, status: 'geplant', leads: [] }],
    }));
    setNewRegionName('');
  };

  const sortRegionenAZ = () => {
    setEditData((prev) => ({
      ...prev,
      regionen: [...prev.regionen].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }));
  };

  const importMunicipalitiesAsRegions = () => {
    if (!selectedLocation) return;
    const municipalities = municipalityNames[selectedLocation.id] || [];
    if (municipalities.length === 0) return;

    setEditData((prev) => {
      const byName = new Map<string, number>(prev.regionen.map((region, idx) => [region.name.trim().toLowerCase(), idx]));
      const nextRegionen = [...prev.regionen];

      municipalities.forEach((item) => {
        const key = item.name.trim().toLowerCase();
        const existingIndex = byName.get(key);
        if (existingIndex === undefined) return;

        const existingRegion = nextRegionen[existingIndex];
        if (!existingRegion.areaId || existingRegion.areaId <= 0) {
          nextRegionen[existingIndex] = { ...existingRegion, areaId: item.areaId };
        }
      });

      const imported = municipalities
        .filter((item) => !byName.has(item.name.trim().toLowerCase()))
        .map((item) => ({
          name: item.name,
          status: 'geplant' as MarketingStatus,
          areaId: item.areaId,
          leads: [],
        }));

      return {
        ...prev,
        regionen: [...nextRegionen, ...imported].sort((a, b) => a.name.localeCompare(b.name, 'de')),
      };
    });
  };

  const updateRegion = (idx: number, patch: Partial<Region>) => {
    setEditData(prev => {
      const r = [...prev.regionen];
      r[idx] = { ...r[idx], ...patch };
      return { ...prev, regionen: r };
    });
  };

  const removeRegion = (idx: number) => {
    setEditData(prev => ({ ...prev, regionen: prev.regionen.filter((_, i) => i !== idx) }));
  };

  const selectedMunicipalities = selectedLocation ? (municipalityNames[selectedLocation.id] || []) : [];

  if (isAdmin === null) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: '#f8fafc' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          width: '100%',
          py: 1,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 32, height: 32 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={850} color="text.primary" sx={{ lineHeight: 1.1 }}>
              GutscheinFabrik
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Admin-Bereich
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          <Button
            onClick={() => navigate('/admin')}
            size="small"
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
            }}
          >
            Uebersicht
          </Button>
          <Button
            onClick={() => navigate('/admin/demos')}
            size="small"
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
            }}
          >
            Demos
          </Button>
          <Button
            onClick={() => navigate('/admin/gutschein-erstellen')}
            size="small"
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
            }}
          >
            Gutschein erstellen
          </Button>
          <Button
            onClick={() => navigate('/admin/blog')}
            size="small"
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
            }}
          >
            Blog
          </Button>
          <Button
            onClick={() => navigate('/admin/extra')}
            size="small"
            sx={{
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f1f5f9', color: '#1e293b' },
            }}
          >
            Extraslug
          </Button>
          <Button
            onClick={() => navigate('/admin/marketing')}
            size="small"
            sx={{
              color: '#2563eb',
              fontWeight: 700,
              fontSize: '0.775rem',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: '#f0f7ff',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#e0f2fe' },
            }}
          >
            Marketing
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/admin')}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              borderColor: '#e2e8f0',
              color: '#475569',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
            }}
          >
            Admin
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/')}
            sx={{
              borderColor: '#e2e8f0',
              color: '#475569',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
            }}
          >
            Zur Website
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              if (window.confirm('Wirklich abmelden?')) {
                signOut(auth).then(() => navigate('/'));
              }
            }}
            sx={{
              fontWeight: 650,
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Abmelden
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Paper
          elevation={1}
          sx={{ width: '100%', maxWidth: 1400, borderRadius: 3, p: { xs: 2, md: 3 }, mx: 'auto' }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Marketing – Regionale Planung</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            Klicke auf ein Bundesland → lade Orte → uebernimm als Regionen → lade Massagelaeden pro Gemeinde.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 3, alignItems: 'start' }}>

            {/* Karte */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(180deg,#f8fbff 0%,#eef6ff 100%)' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Bundesländer
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                  <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
                    <Typography variant="caption" color="text.secondary">{STATUS_LABELS[s as MarketingStatus]}</Typography>
                  </Box>
                ))}
              </Box>
              <svg viewBox={germanyMap.viewBox} width="100%" style={{ display: 'block' }} aria-label="Deutschlandkarte">
                {germanyMap.locations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  const blData = marketingData[loc.id];
                  const fillColor = isSelected ? '#1d4ed8' : blData ? STATUS_COLORS[blData.status] : '#cbd5e1';
                  return (
                    <Tooltip key={loc.id} title={`${loc.name}${blData ? ' – ' + STATUS_LABELS[blData.status] : ''}`} placement="top">
                      <path
                        d={loc.path}
                        onClick={() => handleSelectBundesland(loc)}
                        style={{
                          cursor: 'pointer',
                          fill: fillColor,
                          stroke: '#ffffff',
                          strokeWidth: isSelected ? 2 : 0.8,
                          transition: 'fill 0.15s ease',
                          filter: isSelected ? 'drop-shadow(0 0 4px #2563eb88)' : 'none',
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </svg>
            </Paper>

            {/* Detail-Panel */}
            <Box>
              {!selectedLocation ? (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Kein Bundesland ausgewaehlt</Typography>
                  <Typography variant="body2">Klicke auf ein Bundesland links in der Karte.</Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>{selectedLocation.name}</Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                      color={saveSuccess ? 'success' : 'primary'}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      {saveSuccess ? 'Gespeichert!' : 'Speichern'}
                    </Button>
                  </Box>

                  {/* Bundesland-Status */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mb: 2 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as MarketingStatus }))}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <MenuItem key={val} value={val}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[val as MarketingStatus] }} />
                              {label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>LEADS (NUR NAMEN)</Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleLoadLeadNames}
                      disabled={leadLoading}
                      startIcon={leadLoading ? <CircularProgress size={14} /> : undefined}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      {leadLoading ? 'Sammle Namen...' : 'Namen aus OSM laden'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleLoadMunicipalities}
                      disabled={municipalityLoading}
                      startIcon={municipalityLoading ? <CircularProgress size={14} /> : undefined}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      {municipalityLoading ? 'Lade alle Orte...' : 'Alle Orte laden'}
                    </Button>
                    <Chip label={`${editData.leadNamen.length} Namen`} size="small" />
                    <Chip label={`${selectedMunicipalities.length} Orte`} size="small" />
                  </Box>

                  {leadProgress && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status: {leadProgress.status} | Fortschritt: {leadProgress.processed}/{leadProgress.total || '?'} |
                      Namen: {leadProgress.count} | Fehler: {leadProgress.failed}
                    </Typography>
                  )}

                  {leadError && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1.5 }}>
                      {leadError}
                    </Typography>
                  )}

                  {municipalityError && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1.5 }}>
                      {municipalityError}
                    </Typography>
                  )}

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      mb: 2.5,
                      borderRadius: 1.5,
                      maxHeight: 180,
                      overflow: 'auto',
                      bgcolor: '#fafafa',
                    }}
                  >
                    {editData.leadNamen.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">Noch keine Namen geladen.</Typography>
                    ) : (
                      editData.leadNamen.map((name, idx) => (
                        <Typography key={`${name}-${idx}`} variant="body2" sx={{ py: 0.25 }}>
                          {idx + 1}. {name}
                        </Typography>
                      ))
                    )}
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      mb: 2.5,
                      borderRadius: 1.5,
                      maxHeight: 180,
                      overflow: 'auto',
                      bgcolor: '#fafafa',
                    }}
                  >
                    {selectedMunicipalities.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">Noch keine Staedte geladen.</Typography>
                    ) : (
                      selectedMunicipalities.map((item, idx) => (
                        <Typography key={`${item.areaId}-${idx}`} variant="body2" sx={{ py: 0.25 }}>
                          {idx + 1}. {item.name}
                        </Typography>
                      ))
                    )}
                  </Paper>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={importMunicipalitiesAsRegions}
                      disabled={selectedMunicipalities.length === 0}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Alle Orte als Regionen uebernehmen
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={sortRegionenAZ}
                      disabled={editData.regionen.length < 2}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Regionen A-Z sortieren
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>REGIONEN</Typography>
                  </Divider>

                  {/* Regionen */}
                  {editData.regionen.map((region, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
                      {(() => {
                        const regionKey = `${selectedLocation.id}-${region.areaId || region.name || idx}`;
                        const isLoading = !!regionLeadLoading[regionKey];
                        const isAutoCollecting = !!regionAutoCollecting[regionKey];
                        const errorText = regionLeadError[regionKey] || '';
                        const debugLines = regionLeadLogs[regionKey] || [];
                        const leads = Array.isArray(region.leads) ? region.leads : [];

                        return (
                          <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{region.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" color="error" onClick={() => removeRegion(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadRegionLeads(idx)}
                          disabled={isLoading || isAutoCollecting}
                          startIcon={isLoading ? <CircularProgress size={14} /> : undefined}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {isLoading ? 'Lade Massagelaeden...' : 'Massagelaeden laden'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => startRegionAutoCollect(idx)}
                          disabled={isAutoCollecting}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {isAutoCollecting ? 'Sammelt 30 Min...' : '30 Min sammeln'}
                        </Button>
                        <Chip label={`${leads.length} Kontakte`} size="small" />
                      </Box>

                      {!region.areaId && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
                          areaId fehlt. Es wird per Gemeindename automatisch versucht.
                        </Typography>
                      )}

                      {errorText && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                          {errorText}
                        </Typography>
                      )}

                      {debugLines.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5, mb: 1, maxHeight: 120, overflow: 'auto', bgcolor: '#f8fafc' }}>
                          {debugLines.map((line, i) => (
                            <Typography key={`${regionKey}-log-${i}`} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {line}
                            </Typography>
                          ))}
                        </Paper>
                      )}

                      {leads.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5, maxHeight: 260, overflow: 'auto', bgcolor: '#fafafa' }}>
                          {leads.map((lead, leadIdx) => (
                            <Box key={`${lead.id}-${leadIdx}`} sx={{ py: 0.75, borderBottom: leadIdx < leads.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                              <Typography variant="body2" fontWeight={700}>{lead.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Adresse: {lead.adresse || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Mail: {lead.email || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Anrede: {lead.anrede || '-'} | Vorname: {lead.vorname || '-'} | Nachname: {lead.nachname || '-'}
                              </Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                          </>
                        );
                      })()}
                    </Paper>
                  ))}

                  {/* Neue Region hinzufügen */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <TextField
                      size="small"
                      label="Neue Region (z.B. München Innenstadt)"
                      fullWidth
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addRegion(); }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addRegion}
                      startIcon={<AddIcon />}
                      sx={{ whiteSpace: 'nowrap', textTransform: 'none', borderRadius: 2 }}
                    >
                      Hinzufügen
                    </Button>
                  </Box>

                  {editData.zuletzt_bearbeitet && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Zuletzt gespeichert: {new Date(editData.zuletzt_bearbeitet).toLocaleString('de-DE')}
                    </Typography>
                  )}
                  {editData.leadSyncAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Lead-Sync: {new Date(editData.leadSyncAt).toLocaleString('de-DE')}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
