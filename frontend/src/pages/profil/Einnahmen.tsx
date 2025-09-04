import React from 'react';
import PageContainer from '../../components/profil/PageContainer';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FilterListIcon from '@mui/icons-material/FilterList';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

export default function EinnahmenPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verkaufteGutscheine, setVerkaufteGutscheine] = useState<any[]>([]);
  const [allGutscheine, setAllGutscheine] = useState<any[]>([]);
  const [filter, setFilter] = useState<'alle' | 'eingeloest' | 'offen'>('alle');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const SHOP_ID = data?.slug;
    if (!SHOP_ID) return;

    const fetchGutscheine = async () => {
      const gutscheineRef = collection(db, 'shops', SHOP_ID, 'verkaufte_gutscheine');
      const q = query(gutscheineRef, orderBy('kaufdatum', 'desc'));
      const querySnapshot = await getDocs(q);
      const gutscheine = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllGutscheine(gutscheine);
    };

    fetchGutscheine();
  }, [data]);

  // Gefilterte und sortierte Gutscheine
  useEffect(() => {
    let filtered = [...allGutscheine];
    
    // Filter anwenden
    if (filter === 'eingeloest') {
      filtered = filtered.filter(g => g.eingeloest === true);
    } else if (filter === 'offen') {
      filtered = filtered.filter(g => g.eingeloest !== true);
    }

    // Sortierung anwenden
    filtered.sort((a, b) => {
      const dateA = new Date(a.kaufdatum).getTime();
      const dateB = new Date(b.kaufdatum).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setVerkaufteGutscheine(filtered.slice(0, 50)); // Limit für Performance
  }, [allGutscheine, filter, sortOrder]);

  const toggleEinloesen = async (gutscheinId: string, currentStatus: boolean) => {
    const SHOP_ID = data?.slug;
    if (!SHOP_ID) return;

    try {
      const gutscheinRef = doc(db, 'shops', SHOP_ID, 'verkaufte_gutscheine', gutscheinId);
      const newStatus = !currentStatus;
      
      await updateDoc(gutscheinRef, {
        eingeloest: newStatus,
        eingeloesetAm: newStatus ? new Date().toISOString() : null
      });

      // Lokale State aktualisieren
      setAllGutscheine(prev => prev.map(g => 
        g.id === gutscheinId 
          ? { ...g, eingeloest: newStatus, eingeloesetAm: newStatus ? new Date().toISOString() : null }
          : g
      ));
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Einlösestatus:', error);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  // Hilfsfunktionen für aktuelle Monatsdaten
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monatData = data?.Einnahmen?.monatlich?.[currentMonth] || {};

  const chartData = Object.entries(data?.Einnahmen?.monatlich || {}).map(([monat, werte]: any) => ({
    monat,
    umsatz: werte.gesamtUmsatz || 0,
    anzahl: werte.anzahlVerkäufe || 0,
    hits: werte.hits || 0
  })).sort((a, b) => a.monat.localeCompare(b.monat));

  // Statistiken für die Filter
  const eingeloestCount = allGutscheine.filter(g => g.eingeloest === true).length;
  const offenCount = allGutscheine.filter(g => g.eingeloest !== true).length;

  return (
    <PageContainer title="Einnahmen">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
        <StatCard label="Gesamtumsatz" value={`${data?.Einnahmen?.gesamtUmsatz ?? 0} €`} icon={<MonetizationOnIcon />} color="#3b82f6" />
        <StatCard label="Gesamtverkäufe" value={data?.Einnahmen?.anzahlVerkäufe ?? 0} icon={<LocalActivityIcon />} color="#10b981" />
        <StatCard label="Umsatz aktueller Monat" value={`${monatData.gesamtUmsatz ?? 0} €`} icon={<TrendingUpIcon />} color="#f59e0b" />
        <StatCard 
          label="Aufrufe aktueller Monat" 
          value={monatData.hits ?? 0}
          icon={<AccessTimeIcon />} 
          color="#6366f1" 
        />
      </Box>

      <Paper elevation={2} sx={{ mt: 4, borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Umsatzentwicklung
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="monat" />
              <YAxis yAxisId="left" />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => String(Math.floor(value))}
                domain={[0, 'dataMax']} 
              />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="umsatz" stroke="#3b82f6" strokeWidth={3} name="Umsatz (€)" />
              <Line yAxisId="right" type="monotone" dataKey="anzahl" stroke="#10b981" strokeWidth={3} name="Verkaufte Gutscheine" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ mt: 4, borderRadius: '16px', overflow: 'hidden' }}>
        <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Verkaufte Gutscheine ({verkaufteGutscheine.length})
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter Buttons */}
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '10px !important',
                    border: '2px solid #e0e0e0 !important',
                    '&.Mui-selected': {
                      backgroundColor: '#1976d2 !important',
                      color: 'white !important',
                      border: '2px solid #1976d2 !important',
                    }
                  }
                }}
              >
                <ToggleButton value="alle">
                  <FilterListIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                  Alle ({allGutscheine.length})
                </ToggleButton>
                <ToggleButton value="offen">
                  <PendingIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                  Offen ({offenCount})
                </ToggleButton>
                <ToggleButton value="eingeloest">
                  <CheckCircleIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                  Eingelöst ({eingeloestCount})
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Sort Button */}
              <ToggleButton
                value="sort"
                selected={false}
                onChange={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                sx={{
                  px: 3,
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '10px !important',
                  border: '2px solid #e0e0e0 !important',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  }
                }}
              >
                <SwapVertIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                {sortOrder === 'desc' ? 'Neueste zuerst' : 'Älteste zuerst'}
              </ToggleButton>
            </Box>
          </Box>
        </Box>
        
        <Divider />

        {verkaufteGutscheine.length ? (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    py: 3,
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    py: 3,
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    Gutschein-Code
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    py: 3,
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    Wert
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    py: 3,
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    Verkauft am
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    py: 3,
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    Eingelöst
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verkaufteGutscheine.map((gutschein: any) => {
                  const verkauftAmDate = new Date(gutschein.kaufdatum);
                  const eingeloesetAmDate = gutschein.eingeloesetAm ? new Date(gutschein.eingeloesetAm) : null;
                  
                  return (
                    <TableRow 
                      key={gutschein.id} 
                      sx={{ 
                        backgroundColor: gutschein.eingeloest ? '#f0f9ff' : 'white',
                        '&:hover': { 
                          backgroundColor: gutschein.eingeloest ? '#e0f2fe' : '#f8fafc',
                          transform: 'scale(1.001)',
                          transition: 'all 0.2s ease'
                        },
                        borderLeft: gutschein.eingeloest ? '4px solid #10b981' : '4px solid transparent',
                      }}
                    >
                      <TableCell sx={{ py: 3 }}>
                        <Chip
                          icon={gutschein.eingeloest ? <CheckCircleIcon /> : <PendingIcon />}
                          label={gutschein.eingeloest ? 'Eingelöst' : 'Offen'}
                          color={gutschein.eingeloest ? 'success' : 'warning'}
                          variant={gutschein.eingeloest ? 'filled' : 'outlined'}
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            px: 2,
                            py: 1.5,
                            height: 'auto',
                            '& .MuiChip-label': { px: 1 },
                            '& .MuiChip-icon': { fontSize: '1.1rem' }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#1f2937',
                        py: 3,
                        letterSpacing: '0.5px'
                      }}>
                        {gutschein.gutscheinCode}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        color: '#059669',
                        py: 3
                      }}>
                        {gutschein.betrag} €
                      </TableCell>
                      <TableCell sx={{ 
                        fontSize: '1rem',
                        color: '#6b7280',
                        py: 3
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#1f2937' }}>
                            {verkauftAmDate.toLocaleDateString('de-DE')}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {verkauftAmDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
                          <Checkbox
                            checked={gutschein.eingeloest || false}
                            onChange={() => toggleEinloesen(gutschein.id, gutschein.eingeloest || false)}
                            color="success"
                            sx={{ 
                              transform: 'scale(1.3)',
                              '& .MuiSvgIcon-root': { fontSize: '1.8rem' }
                            }}
                          />
                          {eingeloesetAmDate && (
                            <Box sx={{ 
                              backgroundColor: '#dcfdf4', 
                              px: 2, 
                              py: 0.5, 
                              borderRadius: '8px',
                              border: '1px solid #a7f3d0'
                            }}>
                              <Typography sx={{ 
                                fontSize: '0.8rem', 
                                color: '#065f46', 
                                fontWeight: 500 
                              }}>
                                {eingeloesetAmDate.toLocaleDateString('de-DE')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
              {filter === 'alle' ? '🎫 Keine Verkäufe gefunden.' : 
               filter === 'eingeloest' ? '✅ Keine eingelösten Gutscheine gefunden.' :
               '⏳ Keine offenen Gutscheine gefunden.'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              {filter === 'alle' ? 'Verkaufe deinen ersten Gutschein!' : 'Wähle einen anderen Filter aus.'}
            </Typography>
          </Box>
        )}
      </Paper>
    </PageContainer>
  );
}

interface StatCardProps { 
  label: string; 
  value: string | number; 
  icon: React.ReactElement; 
  color: string; 
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Paper 
      elevation={2}
      sx={{
        flex: '1 1 280px',
        minWidth: '280px',
        display: 'flex',
        alignItems: 'center',
        p: 3,
        borderRadius: '16px',
        borderLeft: `5px solid ${color}`,
        gap: 3,
        transition: 'box-shadow 0.2s ease, border-left-width 0.2s ease',
        '&:hover': {
          boxShadow: 6,
          borderLeftWidth: '6px'
        }
      }}
    >
      <Box sx={{ 
        backgroundColor: `${color}20`, 
        borderRadius: '12px', 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any, any>, { sx: { fontSize: '2rem', color } })
          : icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ color: '#6b7280', fontSize: '1rem', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '1.8rem' }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
