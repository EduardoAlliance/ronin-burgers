import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createExpense } from '@/hooks/useDatabase';
import { COLORS, EXPENSE_TYPES } from '@/utils/constants';
import { useApp } from '@/context/AppContext';

export default function ExpenseFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshData } = useApp();
  const [type, setType] = useState('supplies');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) { Alert.alert('Error', 'La descripción es obligatoria'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
    setLoading(true);
    try {
      await createExpense(type, description.trim(), Number(amount), Math.floor(Date.now() / 1000));
      await refreshData();
      router.back();
    } catch { Alert.alert('Error', 'No se pudo guardar el gasto'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Nuevo Gasto" showBack />
      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tipo de gasto</Text>
        <View style={styles.typeRow}>
          {EXPENSE_TYPES.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
              onPress={() => setType(t.key)}>
              <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Descripción" placeholder="Ej: Compra de carne, Luz, etc." value={description} onChangeText={setDescription} />
        <Input label="Monto" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

        <View style={styles.buttons}>
          <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Guardar" onPress={handleSave} disabled={loading} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.white },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
