import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getDatabase } from '@/database';
import { COLORS, DEFAULT_SETTINGS } from '@/utils/constants';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    setSettings({ ...DEFAULT_SETTINGS, ...map });
  };

  const updateSetting = async (key: string, value: string) => {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) await updateSetting(key, value);
      Alert.alert('Guardado', 'Configuración actualizada');
    } catch { Alert.alert('Error', 'No se pudo guardar la configuración'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Configuración" showBack />
      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Datos del Negocio</Text>

        <Input label="Nombre del negocio" placeholder="Ronin Burgers"
          value={settings.business_name || ''} onChangeText={(v) => setSettings((s) => ({ ...s, business_name: v }))} />
        <Input label="Dirección" placeholder="Dirección del local"
          value={settings.business_address || ''} onChangeText={(v) => setSettings((s) => ({ ...s, business_address: v }))} />
        <Input label="Teléfono" placeholder="Número de contacto"
          value={settings.business_phone || ''} onChangeText={(v) => setSettings((s) => ({ ...s, business_phone: v }))} />

        <Text style={styles.section}>Impuestos</Text>

        <Input label="Tasa de impuesto (%)" placeholder="0"
          value={settings.tax_rate || '0'} onChangeText={(v) => setSettings((s) => ({ ...s, tax_rate: v }))} keyboardType="decimal-pad" />

        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={16} color={COLORS.info} />
          <Text style={styles.infoText}>La tasa de impuesto se incluirá en los tickets de venta (funcionalidad próxima con impresora).</Text>
        </View>

        <Button title="Guardar Configuración" onPress={handleSave} disabled={loading} style={{ marginTop: 24 }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { flex: 1, padding: 20 },
  section: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, marginTop: 8 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EBF8FF', padding: 12, borderRadius: 8, marginTop: 8 },
  infoText: { fontSize: 12, color: COLORS.info, flex: 1 },
});
