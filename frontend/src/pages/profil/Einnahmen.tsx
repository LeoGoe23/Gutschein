import PageContainer from '../../components/profil/PageContainer';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

export default function EinnahmenPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verkaufteGutscheine, setVerkaufteGutscheine] = useState<any[]>([]);

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
    // ShopID ist der slug aus den Userdaten!
    const SHOP_ID = data?.slug;
    if (!SHOP_ID) return;

    const fetchGutscheine = async () => {
      const gutscheineRef = collection(db, 'shops', SHOP_ID, 'verkaufte_gutscheine');
      const q = query(gutscheineRef, orderBy('kaufdatum', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const gutscheine = querySnapshot.docs.map(doc => doc.data());
      setVerkaufteGutscheine(gutscheine);
    };

    fetchGutscheine();
  }, [data]);

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

  return (
    <PageContainer title="Einnahmen">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
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

      <Box sx={{ mt: 4, backgroundColor: '#fff', borderRadius: '12px', boxShadow: 1, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Umsatzentwicklung</Typography>
        <ResponsiveContainer width="100%" height={300}>
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
            <Line yAxisId="left" type="monotone" dataKey="umsatz" stroke="#3b82f6" strokeWidth={2} name="Umsatz (€)" />
            <Line yAxisId="right" type="monotone" dataKey="anzahl" stroke="#10b981" strokeWidth={2} name="Verkaufte Gutscheine" />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 4, backgroundColor: '#fff', borderRadius: '12px', boxShadow: 1, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Letzte verkaufte Gutscheine</Typography>
        {verkaufteGutscheine.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Wert (€)</TableCell>
                  <TableCell>Verkauft am</TableCell>
                  <TableCell>Empfänger</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verkaufteGutscheine.map((gutschein: any, index: number) => {
                  const verkauftAmDate = new Date(gutschein.kaufdatum);
                  return (
                    <TableRow key={index}>
                      <TableCell>{gutschein.gutscheinCode}</TableCell>
                      <TableCell>{gutschein.betrag}</TableCell>
                      <TableCell>{verkauftAmDate.toLocaleString()}</TableCell>
                      <TableCell>{gutschein.empfaengerEmail}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" sx={{ color: '#777' }}>Keine Verkäufe gefunden.</Typography>
        )}
      </Box>
    </PageContainer>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string; }) {
  return (
    <Box sx={{
      flex: '1 1 220px',
      minWidth: '220px',
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
