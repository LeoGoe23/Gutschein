import PageContainer from '../../components/profil/PageContainer';
import { Box, Button, CircularProgress, TextField, Typography, Switch, FormControlLabel, IconButton, Divider } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../auth/firebase';
import Alert from '@mui/material/Alert';
import useProfileViewContext from '../../auth/useProfileViewContext';

interface GutscheinArt {
  typ: 'betrag' | 'dienstleistung' | 'frei';
  name: string;
  wert?: number;
  preis?: number;
  beschreibung?: string;
  varianten?: Variante[];
  aktiv: boolean;
}

interface Variante {
  name: string;
  preis: number;
  beschreibung?: string;
}

interface FormData {
  Gutscheine: { [key: string]: GutscheinArt };
  freieBetragAktiv: boolean;
}

export default function GutscheinePage() {
  const { effectiveUserId, loading: previewLoading, isReadonlyView } = useProfileViewContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    Gutscheine: {},
    freieBetragAktiv: false
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }
      const userRef = doc(db, 'users', effectiveUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Richtiges Feld: Checkout.Gutscheinarten
        const gutscheine = userData?.Checkout?.Gutscheinarten || {};

        // Prüfe ob freier Betrag aktiv ist
        const freieBetragAktiv = Object.values(gutscheine).some((g: any) => g.typ === 'frei');

        setData(userData);
        setFormData({
          Gutscheine: gutscheine,
          freieBetragAktiv
        });
      }
      setLoading(false);
    };

    fetchData();
  }, [effectiveUserId]);

  const handleChange = (field: string, value: string | boolean | number, key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    updatedGutscheine[key] = { ...updatedGutscheine[key], [field]: value };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const addVariante = (key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    const current = updatedGutscheine[key];
    const currentVarianten = Array.isArray(current.varianten) ? current.varianten : [];
    updatedGutscheine[key] = {
      ...current,
      varianten: [...currentVarianten, { name: '', preis: 0, beschreibung: '' }],
    };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const updateVariante = (
    key: string,
    index: number,
    field: keyof Variante,
    value: string | number
  ) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    const current = updatedGutscheine[key];
    const currentVarianten = Array.isArray(current.varianten) ? [...current.varianten] : [];
    if (!currentVarianten[index]) return;

    currentVarianten[index] = {
      ...currentVarianten[index],
      [field]: value,
    };

    updatedGutscheine[key] = {
      ...current,
      varianten: currentVarianten,
    };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const removeVariante = (key: string, index: number) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    const current = updatedGutscheine[key];
    const currentVarianten = Array.isArray(current.varianten) ? [...current.varianten] : [];
    updatedGutscheine[key] = {
      ...current,
      varianten: currentVarianten.filter((_, i) => i !== index),
    };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const toggleFreiBetrag = (enabled: boolean) => {
    const updatedGutscheine = { ...formData.Gutscheine };

    if (enabled) {
      // Freien Betrag hinzufügen
      updatedGutscheine['frei_wert'] = {
        typ: 'frei',
        name: 'Freie Wertangabe',
        aktiv: true
      };
    } else {
      // Freien Betrag entfernen
      delete updatedGutscheine['frei_wert'];
    }

    setFormData({
      ...formData,
      Gutscheine: updatedGutscheine,
      freieBetragAktiv: enabled
    });
  };

  const addDienstleistung = () => {
    const newKey = `service_${Date.now()}`;
    const newEntry: GutscheinArt = {
      typ: 'dienstleistung',
      name: '',
      beschreibung: '',
      preis: 0,
      aktiv: true,
    };
    const updatedGutscheine = { ...formData.Gutscheine, [newKey]: newEntry };
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const deleteEntry = (key: string) => {
    const updatedGutscheine = { ...formData.Gutscheine };
    delete updatedGutscheine[key];
    setFormData({ ...formData, Gutscheine: updatedGutscheine });
  };

  const saveChanges = async () => {
    if (!effectiveUserId || isReadonlyView) return;
    const userRef = doc(db, 'users', effectiveUserId);

    const updatedData = {
      ...data,
      Checkout: {
        ...data.Checkout,
        Gutscheinarten: formData.Gutscheine,
        Freibetrag: formData.freieBetragAktiv,
        Dienstleistung: Object.values(formData.Gutscheine).some(g => g.typ === 'dienstleistung')
      }
    };

    await updateDoc(userRef, updatedData);
    setData(updatedData);
    setEdit(false);
  };

  const cancelEdit = () => {
    const gutscheine = data?.Checkout?.Gutscheinarten || {};
    const freieBetragAktiv = Object.values(gutscheine).some((g: any) => g.typ === 'frei');

    setFormData({
      Gutscheine: gutscheine,
      freieBetragAktiv
    });
    setEdit(false);
  };

  if (loading || previewLoading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  // Gruppiere Gutscheine nach Typ
  const dienstleistungen = Object.entries(formData.Gutscheine).filter(([_, g]) => g.typ === 'dienstleistung');

  return (
    <PageContainer title="Gutscheine">
      {isReadonlyView && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Dev-Preview: Bearbeiten ist deaktiviert.
        </Alert>
      )}
      <Typography variant="h6" sx={{ mb: 2 }}>Gutschein-Konfiguration</Typography>

      {/* Freier Betrag Toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.freieBetragAktiv}
              disabled={!edit || isReadonlyView}
              onChange={(e) => toggleFreiBetrag(e.target.checked)}
            />
          }
          label="Freie Wertangabe erlauben"
        />
        {formData.freieBetragAktiv && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Kunden können einen beliebigen Betrag eingeben
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Dienstleistungen */}
      <Typography variant="h6" sx={{ mb: 2 }}>Dienstleistungen</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {dienstleistungen.map(([key, service], index) => {
          const varianten = Array.isArray(service.varianten) ? service.varianten : [];

          return (
            <Box
              key={key}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: 2.5,
                backgroundColor: '#fff',
                p: { xs: 1.25, md: 1.75 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                  Gutschein {index + 1}
                </Typography>
                {edit && (
                  <IconButton onClick={() => deleteEntry(key)} color="error" disabled={isReadonlyView}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <TextField
                label="Gutschein-Name"
                value={service.name || ''}
                disabled={!edit || isReadonlyView}
                placeholder="z.B. Schulter- & Nackenmassage"
                onChange={(e) => handleChange('name', e.target.value, key)}
                fullWidth
                sx={{ mb: 1.5 }}
              />

              {varianten.length === 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <TextField
                    label="Preis (€)"
                    type="number"
                    value={service.preis || 0}
                    disabled={!edit || isReadonlyView}
                    onChange={(e) => handleChange('preis', parseFloat(e.target.value) || 0, key)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              )}

              {varianten.length > 0 && (
                <Box sx={{ p: 1.25, border: '1px dashed #dbeafe', borderRadius: 2, backgroundColor: '#fbfdff' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Varianten ({varianten.length})
                  </Typography>

                  {varianten.map((variante, vIndex) => (
                    <Box
                      key={`${key}-variante-${vIndex}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: edit ? '1.5fr 1fr auto' : '1.5fr 1fr' },
                        gap: 1,
                        mb: 1,
                        p: 1,
                        border: '1px solid #e5e7eb',
                        borderRadius: 1.5,
                        backgroundColor: '#fff',
                      }}
                    >
                      <TextField
                        label="Name"
                        size="small"
                        value={variante.name || ''}
                        disabled={!edit || isReadonlyView}
                        onChange={(e) => updateVariante(key, vIndex, 'name', e.target.value)}
                      />
                      <TextField
                        label="Preis (€)"
                        size="small"
                        type="number"
                        value={variante.preis || 0}
                        disabled={!edit || isReadonlyView}
                        onChange={(e) => updateVariante(key, vIndex, 'preis', parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      {edit && (
                        <IconButton
                          onClick={() => removeVariante(key, vIndex)}
                          color="error"
                          disabled={isReadonlyView}
                          sx={{ justifySelf: { xs: 'start', md: 'center' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  {edit && !isReadonlyView && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addVariante(key)}
                      sx={{ textTransform: 'none' }}
                    >
                      Variante hinzufügen
                    </Button>
                  )}
                </Box>
              )}

              {varianten.length === 0 && edit && !isReadonlyView && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addVariante(key)}
                  sx={{ textTransform: 'none' }}
                >
                  Varianten hinzufügen
                </Button>
              )}
            </Box>
          );
        })}

        {dienstleistungen.length === 0 && (
          <Box sx={{ p: 2, border: '1px dashed #d1d5db', borderRadius: 2, color: '#6b7280' }}>
            Keine Dienstleistungen konfiguriert.
          </Box>
        )}
      </Box>

      {edit && !isReadonlyView && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addDienstleistung}
          sx={{ mb: 3 }}
        >
          Gutschein hinzufügen
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        {!edit ? (
          <Button variant="contained" onClick={() => setEdit(true)} disabled={isReadonlyView}>Bearbeiten</Button>
        ) : (
          <>
            <Button variant="contained" color="success" onClick={saveChanges}>
              Speichern
            </Button>
            <Button variant="outlined" color="inherit" onClick={cancelEdit}>
              Abbrechen
            </Button>
          </>
        )}
      </Box>
    </PageContainer>
  );
}
