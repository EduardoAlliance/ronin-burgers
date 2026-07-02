import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getDatabase } from '@/database';
import { COLORS, DEFAULT_SETTINGS } from '@/utils/constants';
import { getSavedPrinter, savePrinter, removePrinter, searchPrinters, clearPrinterCache, getPrinterWidth, savePrinterWidth, PrinterWidth } from '@/services/printer';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [printer, setPrinter] = useState<{ name: string; mac: string } | null>(null);
  const [printerWidth, setPrinterWidth] = useState<PrinterWidth>('80mm');
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<{ deviceName: string; macAddress: string }[]>([]);

  useEffect(() => { loadSettings(); loadPrinter(); }, []);

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

  const loadPrinter = async () => {
    const p = await getSavedPrinter();
    setPrinter(p);
    const w = await getPrinterWidth();
    setPrinterWidth(w.mm === 48 ? '58mm' : '80mm');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith('printer_')) continue;
        await updateSetting(key, value);
      }
      Alert.alert('Guardado', 'Configuración actualizada');
    } catch { Alert.alert('Error', 'No se pudo guardar la configuración'); }
    finally { setLoading(false); }
  };

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const list = await searchPrinters();
      setDevices(list);
      if (list.length === 0) Alert.alert('Sin resultados', 'No se encontraron impresoras Bluetooth cercanas');
    } catch {
      Alert.alert('Error', 'No se pudo escanear. Asegúrate de tener el Bluetooth activado.');
    }
    finally { setScanning(false); }
  };

  const handleConnect = async (name: string, mac: string) => {
    await savePrinter(name, mac);
    setPrinter({ name, mac });
    setDevices([]);
    Alert.alert('Conectada', `Impresora "${name}" configurada`);
  };

  const handleDisconnect = async () => {
    await removePrinter();
    setPrinter(null);
    clearPrinterCache();
    Alert.alert('Desconectada', 'Impresora removida de la configuración');
  };

  const handleWidthChange = async (width: PrinterWidth) => {
    await savePrinterWidth(width);
    setPrinterWidth(width);
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

        <Text style={styles.section}>Impresora Bluetooth</Text>

        {printer ? (
          <>
            <View style={styles.printerConnected}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.printerName}>{printer.name}</Text>
                <Text style={styles.printerMac}>{printer.mac}</Text>
              </View>
              <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
                <MaterialIcons name="bluetooth-disabled" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <Text style={styles.widthLabel}>Ancho del papel</Text>
            <View style={styles.widthRow}>
              <TouchableOpacity style={[styles.widthOption, printerWidth === '80mm' && styles.widthOptionActive]}
                onPress={() => handleWidthChange('80mm')}>
                <Text style={[styles.widthOptionText, printerWidth === '80mm' && styles.widthOptionTextActive]}>80 mm</Text>
                <Text style={[styles.widthOptionSub, printerWidth === '80mm' && styles.widthOptionSubActive]}>32 caracteres</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.widthOption, printerWidth === '58mm' && styles.widthOptionActive]}
                onPress={() => handleWidthChange('58mm')}>
                <Text style={[styles.widthOptionText, printerWidth === '58mm' && styles.widthOptionTextActive]}>58 mm</Text>
                <Text style={[styles.widthOptionSub, printerWidth === '58mm' && styles.widthOptionSubActive]}>24 caracteres</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.printerEmpty}>
            <MaterialIcons name="bluetooth" size={24} color={COLORS.textSecondary} />
            <Text style={styles.printerEmptyText}>Ninguna impresora configurada</Text>
          </View>
        )}

        <Button
          title={scanning ? 'Buscando...' : 'Buscar impresoras Bluetooth'}
          onPress={handleScan}
          disabled={scanning}
          variant="secondary"
          style={{ marginTop: 12 }}
        />

        {scanning && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />}

        {devices.length > 0 && (
          <View style={styles.deviceList}>
            <Text style={styles.deviceListTitle}>Impresoras encontradas:</Text>
            {devices.map((d, i) => (
              <TouchableOpacity key={i} style={styles.deviceItem}
                onPress={() => handleConnect(d.deviceName, d.macAddress)}>
                <MaterialIcons name="bluetooth-connected" size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{d.deviceName}</Text>
                  <Text style={styles.deviceMac}>{d.macAddress}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={16} color={COLORS.info} />
          <Text style={styles.infoText}>Activa el Bluetooth de tu dispositivo antes de buscar impresoras. Al confirmar un pedido, se imprimirá el ticket de cocina y el ticket para el cliente automáticamente.</Text>
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
  section: {
    fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, marginTop: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8,
  },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EBF8FF', padding: 12, borderRadius: 8, marginTop: 16 },
  infoText: { fontSize: 12, color: COLORS.info, flex: 1 },

  printerConnected: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, padding: 14, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  printerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  printerMac: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  disconnectBtn: { padding: 8 },

  printerEmpty: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.white, padding: 20, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  printerEmptyText: { fontSize: 14, color: COLORS.textSecondary },

  deviceList: { marginTop: 12 },
  deviceListTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  deviceItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, padding: 12, borderRadius: 8, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  deviceName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  deviceMac: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  widthLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 14, marginBottom: 8 },
  widthRow: { flexDirection: 'row', gap: 10 },
  widthOption: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', backgroundColor: COLORS.white,
  },
  widthOptionActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7F0' },
  widthOptionText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  widthOptionTextActive: { color: COLORS.primary },
  widthOptionSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  widthOptionSubActive: { color: COLORS.primary },
});
