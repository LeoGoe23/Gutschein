import {
  Box, Button, CircularProgress, Paper, Typography,
  TextField,
  Chip, IconButton, Divider, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, MenuItem, Select,
} from '@mui/material';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import germany from '@svg-maps/germany';
import * as XLSX from 'xlsx';
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
  leadCategory?: LeadCategory;
  leads?: LeadContact[];
  leadsSyncAt?: string;
}

interface LeadContact {
  id: string;
  name: string;
  adresse: string;
  email: string;
  mailSent: boolean;
  demoClicked: boolean;
  notes: string;
  website: string;
  instagram: string;
  anrede: string;
  vorname: string;
  nachname: string;
}

type LeadCategory = 'massage' | 'kosmetik';

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

const BUNDESLAND_QUERY_NAME: Record<string, string> = {
  bw: 'Baden-Wuerttemberg',
  by: 'Bayern',
  be: 'Berlin',
  bb: 'Brandenburg',
  hb: 'Bremen',
  hh: 'Hamburg',
  he: 'Hessen',
  ni: 'Niedersachsen',
  mv: 'Mecklenburg-Vorpommern',
  nw: 'Nordrhein-Westfalen',
  rp: 'Rheinland-Pfalz',
  sl: 'Saarland',
  sn: 'Sachsen',
  st: 'Sachsen-Anhalt',
  sh: 'Schleswig-Holstein',
  th: 'Thueringen',
};

function emptyBundesland(): BundeslandData {
  return { status: 'nicht_geplant', notizen: '', budget: 0, regionen: [], leadNamen: [], zuletzt_bearbeitet: '' };
}

function normalizeLeadContact(lead: any): LeadContact {
  return {
    id: String(lead?.id || `${lead?.name || 'lead'}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(lead?.name || '').trim(),
    adresse: String(lead?.adresse || '').trim(),
    email: String(lead?.email || '').trim(),
    mailSent: Boolean(lead?.mailSent),
    demoClicked: Boolean(lead?.demoClicked),
    notes: String(lead?.notes || '').trim(),
    website: String(lead?.website || '').trim(),
    instagram: String(lead?.instagram || '').trim(),
    anrede: String(lead?.anrede || '').trim(),
    vorname: String(lead?.vorname || '').trim(),
    nachname: String(lead?.nachname || '').trim(),
  };
}

function branchKeyForCategory(category: LeadCategory) {
  return category === 'kosmetik' ? 'kosmetik' : 'massage';
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefinedDeep(v)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

function totalContactsForBundesland(data?: BundeslandData): number {
  if (!data || !Array.isArray(data.regionen)) return 0;
  return data.regionen.reduce((sum, region) => {
    const leads = Array.isArray(region?.leads) ? region.leads : [];
    return sum + leads.filter((lead) => String(lead?.name || '').trim()).length;
  }, 0);
}

const BUNDESLAND_BADGE_POSITIONS: Record<string, { x: number; y: number }> = {
  bw: { x: 202, y: 650 },
  by: { x: 356, y: 670 },
  be: { x: 360, y: 228 },
  bb: { x: 410, y: 265 },
  hb: { x: 210, y: 195 },
  hh: { x: 258, y: 165 },
  he: { x: 216, y: 430 },
  ni: { x: 205, y: 278 },
  mv: { x: 398, y: 142 },
  nw: { x: 126, y: 322 },
  rp: { x: 142, y: 500 },
  sl: { x: 88, y: 570 },
  sn: { x: 456, y: 468 },
  st: { x: 325, y: 315 },
  sh: { x: 258, y: 88 },
  th: { x: 304, y: 435 },
};

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
  const [municipalityInfo, setMunicipalityInfo] = useState('');
  const [regionLeadLoading, setRegionLeadLoading] = useState<Record<string, boolean>>({});
  const [regionLeadError, setRegionLeadError] = useState<Record<string, string>>({});
  const [leadEditorOpen, setLeadEditorOpen] = useState(false);
  const [leadEditorRegionIndex, setLeadEditorRegionIndex] = useState<number | null>(null);
  const [leadEditorDrafts, setLeadEditorDrafts] = useState<LeadContact[]>([]);
  const [leadEditorSaving, setLeadEditorSaving] = useState(false);
  const [allContactsExpanded, setAllContactsExpanded] = useState(true);
  const [exportFromRegionIndex, setExportFromRegionIndex] = useState('');
  const [exportToRegionIndex, setExportToRegionIndex] = useState('');
  const [exportInfo, setExportInfo] = useState('');
  const [exportError, setExportError] = useState('');
  const API_URL = process.env.REACT_APP_API_URL;
  const API_BASE = API_URL || '';
  const LEAD_SOURCE = 'google';

  const getBundeslandQueryName = useCallback((location: GermanyLocation | null) => {
    if (!location) return '';
    return BUNDESLAND_QUERY_NAME[location.id] || location.name;
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
      ? existing.regionen.map((region): Region => {
        const leadCategory: LeadCategory | undefined = region?.leadCategory === 'kosmetik'
          ? 'kosmetik'
          : region?.leadCategory === 'massage'
            ? 'massage'
            : undefined;

        return {
          name: String(region?.name || '').trim(),
          status: region?.status || 'geplant',
          areaId: Number.isFinite(Number(region?.areaId)) ? Number(region.areaId) : undefined,
          leadCategory,
          leads: Array.isArray(region?.leads) ? region.leads.map((lead: any) => normalizeLeadContact(lead)) : [],
          leadsSyncAt: region?.leadsSyncAt || undefined,
        };
      }).filter((region) => region.name)
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
    setMunicipalityInfo('');
  }, [marketingData]);

  const handleSave = async () => {
    if (!selectedLocation) return;
    setSaving(true);
    const updated: MarketingMap = {
      ...marketingData,
      [selectedLocation.id]: { ...editData, zuletzt_bearbeitet: new Date().toISOString() },
    };
    await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), stripUndefinedDeep(updated));
    setMarketingData(updated);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const saveBranchLeadSnapshot = async (
    category: LeadCategory,
    region: Region,
    leads: LeadContact[],
  ) => {
    if (!selectedLocation) return;

    const branchDocId = branchKeyForCategory(category);
    const branchRef = doc(db, 'admin_marketing_branchen', branchDocId);
    const branchDoc = await getDoc(branchRef);
    const branchData = branchDoc.exists() ? branchDoc.data() : {};
    const currentBundeslaender = (branchData?.bundeslaender || {}) as Record<string, any>;
    const currentState = currentBundeslaender[selectedLocation.id] || {};
    const currentRegions = (currentState?.regionen || {}) as Record<string, any>;
    const regionKey = region.name.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-');

    const nextBranchData = {
      ...branchData,
      branche: branchDocId,
      updatedAt: new Date().toISOString(),
      bundeslaender: {
        ...currentBundeslaender,
        [selectedLocation.id]: {
          name: selectedLocation.name,
          updatedAt: new Date().toISOString(),
          regionen: {
            ...currentRegions,
            [regionKey]: {
              name: region.name,
              areaId: region.areaId || null,
              category: branchDocId,
              leads: leads.map((lead) => ({
                ...lead,
                category: branchDocId,
                bundeslandId: selectedLocation.id,
                bundeslandName: selectedLocation.name,
                regionName: region.name,
                updatedAt: new Date().toISOString(),
              })),
            },
          },
        },
      },
    };

    await setDoc(branchRef, stripUndefinedDeep(nextBranchData), { merge: true });
  };

  const handleLoadLeadNames = async () => {
    if (!selectedLocation || !user) return;

    setLeadLoading(true);
    setLeadError('');
    setLeadProgress(null);

    try {
      const token = await user.getIdToken();
      const bundeslandQueryName = getBundeslandQueryName(selectedLocation);
      const startResponse = await fetch(`${API_BASE}/api/admin/lead-research/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundesland: bundeslandQueryName, limit: 5000 }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lead-Crawl konnte nicht gestartet werden.');
      }

      let finalStatus = 'running';
      for (let i = 0; i < 240; i += 1) {
        const statusResponse = await fetch(
          `${API_BASE}/api/admin/lead-research/status?bundesland=${encodeURIComponent(bundeslandQueryName)}`,
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
        `${API_BASE}/api/admin/lead-research/results?bundesland=${encodeURIComponent(bundeslandQueryName)}&limit=5000`,
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

      await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), stripUndefinedDeep(updated));
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
    const locationName = getBundeslandQueryName(selectedLocation);

    setMunicipalityLoading(true);
    setMunicipalityError('');
    setMunicipalityInfo('');

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
      setMunicipalityInfo(`${municipalities.length} Orte geladen.`);

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

  const loadRegionLeads = async (idx: number, category: LeadCategory) => {
    if (!selectedLocation || !user) return;
    const region = editData.regionen[idx];
    const regionKey = `${selectedLocation.id}-${region?.areaId || region?.name || idx}`;

    if (!region || !region.name?.trim()) {
      setRegionLeadError((prev) => ({ ...prev, [regionKey]: 'Gemeindename fehlt.' }));
      return;
    }

    setRegionLeadLoading((prev) => ({ ...prev, [regionKey]: true }));
    setRegionLeadError((prev) => ({ ...prev, [regionKey]: '' }));

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        municipality: region.name,
        bundesland: getBundeslandQueryName(selectedLocation),
        source: LEAD_SOURCE,
        category,
        limit: '120',
      });
      if (region.areaId && region.areaId > 0) {
        params.set('areaId', String(region.areaId));
      }
      const response = await fetch(
        `${API_BASE}/api/admin/lead-research/municipality-leads?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `${category === 'massage' ? 'Massagelaeden' : 'Kosmetikstudios'} konnten nicht geladen werden.`);
      }

      const data = await response.json();
      const leadsFromApi: LeadContact[] = Array.isArray(data.leads)
        ? data.leads.map((lead: any) => normalizeLeadContact(lead)).filter((lead: LeadContact) => lead.name)
        : [];

      const nextRegionen = [...editData.regionen];
      if (!nextRegionen[idx]) {
        return;
      }
      const syncedAt = new Date().toISOString();
      nextRegionen[idx] = {
        ...nextRegionen[idx],
        leads: leadsFromApi,
        leadCategory: category,
        leadsSyncAt: syncedAt,
      };

      const nextEditData: BundeslandData = {
        ...editData,
        regionen: nextRegionen,
        zuletzt_bearbeitet: syncedAt,
      };

      setEditData(nextEditData);

      const updated: MarketingMap = {
        ...marketingData,
        [selectedLocation.id]: {
          ...nextEditData,
        },
      };

      await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), stripUndefinedDeep(updated));
      setMarketingData(updated);
      await saveBranchLeadSnapshot(category, nextRegionen[idx], leadsFromApi);
    } catch (error: any) {
      setRegionLeadError((prev) => ({
        ...prev,
        [regionKey]: error?.message || `${category === 'massage' ? 'Massagelaeden' : 'Kosmetikstudios'} konnten nicht geladen werden.`,
      }));
    } finally {
      setRegionLeadLoading((prev) => ({ ...prev, [regionKey]: false }));
    }
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

      const imported: Region[] = municipalities
        .filter((item) => !byName.has(item.name.trim().toLowerCase()))
        .map((item) => ({
          name: item.name,
          status: 'geplant' as MarketingStatus,
          areaId: item.areaId,
          leadCategory: undefined,
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

  const openRegionLeadEditor = (idx: number) => {
    const region = editData.regionen[idx];
    if (!region) return;
    setLeadEditorRegionIndex(idx);
    setLeadEditorDrafts((Array.isArray(region.leads) ? region.leads : []).map((lead) => normalizeLeadContact(lead)));
    setLeadEditorOpen(true);
  };

  const closeRegionLeadEditor = () => {
    if (leadEditorSaving) return;
    setLeadEditorOpen(false);
    setLeadEditorRegionIndex(null);
    setLeadEditorDrafts([]);
  };

  const escapeCsvField = (value: string) => {
    const normalized = String(value || '').replace(/\r?\n/g, ' ').trim();
    if (/[";\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const sanitizeExportFilePart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');

  const prepareExportRowsByRegionRange = () => {
    if (!selectedLocation) {
      setExportError('Kein Bundesland ausgewaehlt.');
      setExportInfo('');
      return null;
    }

    const namedRegions = editData.regionen
      .map((region, idx) => ({ idx, name: String(region?.name || '').trim() }))
      .filter((region) => region.name);

    if (namedRegions.length === 0) {
      setExportError('Keine Regionen zum Export vorhanden.');
      setExportInfo('');
      return null;
    }

    const firstIndex = namedRegions[0].idx;
    const lastIndex = namedRegions[namedRegions.length - 1].idx;
    const fromIdxRaw = Number.parseInt(exportFromRegionIndex, 10);
    const toIdxRaw = Number.parseInt(exportToRegionIndex, 10);
    const fromIdx = Number.isFinite(fromIdxRaw) ? fromIdxRaw : firstIndex;
    const toIdx = Number.isFinite(toIdxRaw) ? toIdxRaw : lastIndex;

    const start = Math.max(0, Math.min(fromIdx, toIdx));
    const end = Math.min(editData.regionen.length - 1, Math.max(fromIdx, toIdx));

    const rows = editData.regionen
      .filter((_, idx) => idx >= start && idx <= end)
      .flatMap((region) => {
        const leads = Array.isArray(region?.leads) ? region.leads : [];
        return leads
          .filter((lead) => String(lead?.email || '').trim())
          .map((lead) => {
            const personName = [String(lead?.vorname || '').trim(), String(lead?.nachname || '').trim()]
              .filter(Boolean)
              .join(' ')
              .trim();
            return {
              Anrede: String(lead?.anrede || '').trim(),
              Name: personName || String(lead?.name || '').trim(),
              Mail: String(lead?.email || '').trim(),
            };
          });
      });

    if (rows.length === 0) {
      setExportError('Im gewaehlten Bereich wurden keine Leads mit Mail gefunden.');
      setExportInfo('');
      return null;
    }

    const fromRegionName = String(editData.regionen[start]?.name || 'start').trim();
    const toRegionName = String(editData.regionen[end]?.name || 'ende').trim();

    return {
      selectedName: selectedLocation.name,
      fromRegionName,
      toRegionName,
      rows,
    };
  };

  const exportLeadCsvByRegionRange = () => {
    const payload = prepareExportRowsByRegionRange();
    if (!payload) return;

    const csvLines = [
      'Anrede;Name;Mail',
      ...payload.rows.map((row) => [row.Anrede, row.Name, row.Mail].map(escapeCsvField).join(';')),
    ];

    const fileName = `leads-${sanitizeExportFilePart(payload.selectedName)}-${sanitizeExportFilePart(payload.fromRegionName)}-bis-${sanitizeExportFilePart(payload.toRegionName)}.csv`;

    const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    setExportError('');
    setExportInfo(`${payload.rows.length} Leads exportiert (${payload.fromRegionName} bis ${payload.toRegionName}).`);
  };

  const exportLeadExcelByRegionRange = () => {
    const payload = prepareExportRowsByRegionRange();
    if (!payload) return;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(payload.rows, {
      header: ['Anrede', 'Name', 'Mail'],
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const fileName = `leads-${sanitizeExportFilePart(payload.selectedName)}-${sanitizeExportFilePart(payload.fromRegionName)}-bis-${sanitizeExportFilePart(payload.toRegionName)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setExportError('');
    setExportInfo(`${payload.rows.length} Leads als Excel exportiert (${payload.fromRegionName} bis ${payload.toRegionName}).`);
  };

  useEffect(() => {
    const namedRegions = editData.regionen
      .map((region, idx) => ({ idx, name: String(region?.name || '').trim() }))
      .filter((region) => region.name);

    if (namedRegions.length === 0) {
      setExportFromRegionIndex('');
      setExportToRegionIndex('');
      return;
    }

    const firstIndex = String(namedRegions[0].idx);
    const lastIndex = String(namedRegions[namedRegions.length - 1].idx);
    setExportFromRegionIndex(firstIndex);
    setExportToRegionIndex(lastIndex);
  }, [selectedLocation?.id, editData.regionen.length]);

  const updateLeadDraft = (leadIdx: number, field: keyof LeadContact, value: string | boolean) => {
    setLeadEditorDrafts((prev) => prev.map((lead, idx) => (idx === leadIdx ? { ...lead, [field]: value } : lead)));
  };

  const addLeadDraftRow = () => {
    setLeadEditorDrafts((prev) => ([
      ...prev,
      normalizeLeadContact({
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: '',
        adresse: '',
        email: '',
        mailSent: false,
        demoClicked: false,
        notes: '',
        website: '',
        instagram: '',
        anrede: '',
        vorname: '',
        nachname: '',
      }),
    ]));
  };

  const removeLeadDraftRow = (leadIdx: number) => {
    setLeadEditorDrafts((prev) => prev.filter((_, idx) => idx !== leadIdx));
  };

  const openGoogleSearchForLead = (lead: LeadContact) => {
    const regionName = leadEditorRegionIndex !== null ? (editData.regionen[leadEditorRegionIndex]?.name || '') : '';
    const query = [lead.name, regionName].filter(Boolean).join(' ').trim();
    if (!query) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const saveRegionLeadEditor = async () => {
    if (!selectedLocation || leadEditorRegionIndex === null) return;
    const region = editData.regionen[leadEditorRegionIndex];
    if (!region) return;

    setLeadEditorSaving(true);
    try {
      const cleanedLeads = leadEditorDrafts
        .map((lead) => normalizeLeadContact(lead))
        .filter((lead) => lead.name || lead.email || lead.adresse || lead.website || lead.instagram || lead.vorname || lead.nachname || lead.anrede || lead.mailSent || lead.demoClicked || lead.notes);

      const syncedAt = new Date().toISOString();
      const nextRegion = {
        ...region,
        leads: cleanedLeads,
        leadsSyncAt: syncedAt,
      };

      const nextRegionen = [...editData.regionen];
      nextRegionen[leadEditorRegionIndex] = nextRegion;

      const nextEditData: BundeslandData = {
        ...editData,
        regionen: nextRegionen,
        zuletzt_bearbeitet: syncedAt,
      };

      setEditData(nextEditData);

      const updated: MarketingMap = {
        ...marketingData,
        [selectedLocation.id]: {
          ...nextEditData,
        },
      };

      await setDoc(doc(db, 'admin_marketing', 'bundeslaender'), stripUndefinedDeep(updated));
      setMarketingData(updated);

      if (nextRegion.leadCategory) {
        await saveBranchLeadSnapshot(nextRegion.leadCategory, nextRegion, cleanedLeads);
      }

      setLeadEditorOpen(false);
      setLeadEditorRegionIndex(null);
      setLeadEditorDrafts([]);
    } finally {
      setLeadEditorSaving(false);
    }
  };

  const selectedMunicipalities = selectedLocation ? (municipalityNames[selectedLocation.id] || []) : [];
  const hasRegionBeenSearched = (region: Region) => {
    const hasSyncTimestamp = Boolean(region?.leadsSyncAt);
    const hasCategory = Boolean(region?.leadCategory);
    const hasLeadArray = Array.isArray(region?.leads);
    const hasLeadEntries = hasLeadArray && region.leads!.some((lead) => String(lead?.name || '').trim() || String(lead?.email || '').trim() || String(lead?.adresse || '').trim());
    return hasSyncTimestamp || hasCategory || hasLeadEntries;
  };
  const searchedRegionsCount = editData.regionen.filter((region) => hasRegionBeenSearched(region)).length;
  const totalRegionsCount = editData.regionen.filter((region) => String(region?.name || '').trim()).length;

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
            Klicke auf ein Bundesland → lade Orte → uebernimm als Regionen → lade pro Gemeinde Massage ODER Kosmetik.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 3, alignItems: 'start' }}>

            {/* Karte */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(180deg,#f8fbff 0%,#eef6ff 100%)' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Bundesländer
              </Typography>
              <svg viewBox={germanyMap.viewBox} width="100%" style={{ display: 'block' }} aria-label="Deutschlandkarte">
                {germanyMap.locations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  const fillColor = isSelected ? '#1d4ed8' : '#cbd5e1';
                  const contactsCount = totalContactsForBundesland(marketingData[loc.id]);
                  const countLabel = String(contactsCount);
                  const center = BUNDESLAND_BADGE_POSITIONS[loc.id] || { x: 0, y: 0 };

                  return (
                    <g key={loc.id}>
                      <Tooltip title={`${loc.name}: ${contactsCount} Kontakte`} placement="top">
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

                      <g pointerEvents="none" transform={`translate(${center.x}, ${center.y})`}>
                        <circle r="11" fill={isSelected ? '#1d4ed8' : '#ffffff'} stroke={isSelected ? '#1d4ed8' : '#94a3b8'} strokeWidth="1.2" />
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            fill: isSelected ? '#ffffff' : '#0f172a',
                          }}
                        >
                          {countLabel}
                        </text>
                      </g>
                    </g>
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
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{selectedLocation.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {searchedRegionsCount} von {totalRegionsCount} Regionen gesucht
                      </Typography>
                    </Box>
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

                  {municipalityInfo && !municipalityError && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1.5 }}>
                      {municipalityInfo}
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
                  </Box>

                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>REGIONEN</Typography>
                  </Divider>

                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 1.5, bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Export: Region von bis, nur Leads mit Mail (Anrede, Name, Mail)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto auto' }, gap: 1, alignItems: 'center' }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="export-region-from-label">Region von</InputLabel>
                        <Select
                          labelId="export-region-from-label"
                          label="Region von"
                          value={exportFromRegionIndex}
                          onChange={(e) => {
                            setExportFromRegionIndex(String(e.target.value));
                            setExportError('');
                            setExportInfo('');
                          }}
                        >
                          {editData.regionen.map((region, idx) => {
                            const regionName = String(region?.name || '').trim();
                            if (!regionName) return null;
                            return (
                              <MenuItem key={`from-${idx}-${regionName}`} value={String(idx)}>
                                {regionName}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>

                      <FormControl size="small" fullWidth>
                        <InputLabel id="export-region-to-label">Region bis</InputLabel>
                        <Select
                          labelId="export-region-to-label"
                          label="Region bis"
                          value={exportToRegionIndex}
                          onChange={(e) => {
                            setExportToRegionIndex(String(e.target.value));
                            setExportError('');
                            setExportInfo('');
                          }}
                        >
                          {editData.regionen.map((region, idx) => {
                            const regionName = String(region?.name || '').trim();
                            if (!regionName) return null;
                            return (
                              <MenuItem key={`to-${idx}-${regionName}`} value={String(idx)}>
                                {regionName}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={exportLeadCsvByRegionRange}
                        disabled={!selectedLocation || editData.regionen.length === 0}
                        sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={exportLeadExcelByRegionRange}
                        disabled={!selectedLocation || editData.regionen.length === 0}
                        sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}
                      >
                        Export Excel
                      </Button>
                    </Box>

                    {exportError && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        {exportError}
                      </Typography>
                    )}
                    {exportInfo && !exportError && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                        {exportInfo}
                      </Typography>
                    )}
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setAllContactsExpanded((prev) => !prev)}
                      sx={{ textTransform: 'none' }}
                    >
                      {allContactsExpanded ? 'Alle Kontakte einklappen' : 'Alle Kontakte ausklappen'}
                    </Button>
                  </Box>

                  {/* Regionen */}
                  {editData.regionen.map((region, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
                      {(() => {
                        const regionKey = `${selectedLocation.id}-${region.areaId || region.name || idx}`;
                        const isLoading = !!regionLeadLoading[regionKey];
                        const errorText = regionLeadError[regionKey] || '';
                        const leads = Array.isArray(region.leads) ? region.leads : [];
                        const hasLoadedLeads = Boolean(region.leadsSyncAt);

                        return (
                          <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{region.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openRegionLeadEditor(idx)}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Bearbeiten
                          </Button>
                          <IconButton size="small" color="error" onClick={() => removeRegion(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadRegionLeads(idx, 'massage')}
                          disabled={isLoading}
                          startIcon={isLoading ? <CircularProgress size={14} /> : undefined}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {isLoading ? 'Lade Massage...' : 'Massage laden'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadRegionLeads(idx, 'kosmetik')}
                          disabled={isLoading}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Kosmetik laden
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

                      {!isLoading && !errorText && hasLoadedLeads && leads.length === 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          0 Kontakte gefunden.
                        </Typography>
                      )}

                      {leads.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5, bgcolor: '#fafafa' }}>
                          {leads.map((lead, leadIdx) => (
                            <Box key={`${lead.id}-${leadIdx}`} sx={{ py: 0.5, borderBottom: leadIdx < leads.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                              <Typography variant="body2" fontWeight={700}>{lead.name}</Typography>
                              {allContactsExpanded && (
                                <Box sx={{ pt: 0.25 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Adresse: {lead.adresse || '-'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Mail: {lead.email || '-'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Mail gesendet: {lead.mailSent ? 'Ja' : 'Nein'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Demo geklickt: {lead.demoClicked ? 'Ja' : 'Nein'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Notizen: {lead.notes || '-'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Anrede: {lead.anrede || '-'} | Nachname: {lead.nachname || '-'}
                                  </Typography>
                                </Box>
                              )}
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

      <Dialog open={leadEditorOpen} onClose={closeRegionLeadEditor} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Region bearbeiten
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Hier kannst du Name, Mail, Website, Instagram und die weiteren Kontaktdaten direkt bearbeiten.
            </Typography>
            <Button variant="outlined" size="small" onClick={addLeadDraftRow} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Zeile hinzufügen
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 72 }}>Suche</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Name</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Mail</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Anrede</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Nachname</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Adresse</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Mail gesendet</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Demo geklickt</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Notizen</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Website</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Instagram</TableCell>
                  <TableCell sx={{ width: 80 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {leadEditorDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        Keine Kontakte vorhanden. Mit „Zeile hinzufügen“ kannst du einen neuen Eintrag anlegen.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leadEditorDrafts.map((lead, leadIdx) => (
                    <TableRow key={lead.id || `${lead.name}-${leadIdx}`} hover>
                      <TableCell>
                        <IconButton
                          onClick={() => openGoogleSearchForLead(lead)}
                          color="primary"
                          title="In Google suchen"
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.name}
                          onChange={(e) => updateLeadDraft(leadIdx, 'name', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.email}
                          onChange={(e) => updateLeadDraft(leadIdx, 'email', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.anrede}
                          onChange={(e) => updateLeadDraft(leadIdx, 'anrede', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.nachname}
                          onChange={(e) => updateLeadDraft(leadIdx, 'nachname', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.adresse}
                          onChange={(e) => updateLeadDraft(leadIdx, 'adresse', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => updateLeadDraft(leadIdx, 'mailSent', !lead.mailSent)}
                          color={lead.mailSent ? 'success' : 'default'}
                        >
                          {lead.mailSent ? <CheckCircleOutlineIcon fontSize="small" /> : <HighlightOffIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => updateLeadDraft(leadIdx, 'demoClicked', !lead.demoClicked)}
                          color={lead.demoClicked ? 'success' : 'default'}
                        >
                          {lead.demoClicked ? <CheckCircleOutlineIcon fontSize="small" /> : <HighlightOffIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.notes}
                          onChange={(e) => updateLeadDraft(leadIdx, 'notes', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.website}
                          onChange={(e) => updateLeadDraft(leadIdx, 'website', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={lead.instagram}
                          onChange={(e) => updateLeadDraft(leadIdx, 'instagram', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton color="error" onClick={() => removeLeadDraftRow(leadIdx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeRegionLeadEditor} disabled={leadEditorSaving} sx={{ textTransform: 'none' }}>
            Abbrechen
          </Button>
          <Button
            onClick={saveRegionLeadEditor}
            variant="contained"
            disabled={leadEditorSaving}
            sx={{ textTransform: 'none' }}
          >
            {leadEditorSaving ? 'Speichere...' : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
