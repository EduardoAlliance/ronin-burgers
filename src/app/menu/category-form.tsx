import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { createCategory, updateCategory } from '@/hooks/useDatabase';
import { COLORS } from '@/utils/constants';

export default function CategoryFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, refreshData } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(false);

  const isEditing = !!id;
  const category = isEditing ? state.categories.find((c: { id: number }) => c.id === Number(id)) : null;

  useEffect(() => {
    if (category) { setName(category.name); setSortOrder(category.sort_order.toString()); }
  }, [category]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (isEditing && category) await updateCategory(category.id, name.trim(), parseInt(sortOrder) || 0);
      else await createCategory(name.trim(), parseInt(sortOrder) || 0);
      await refreshData();
      router.back();
    } catch { Alert.alert('Error', 'No se pudo guardar la categoría'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'} showBack />
      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Input label="Nombre" placeholder="Ej: Hamburguesas, Bebidas..." value={name} onChangeText={setName} />
        <Input label="Orden" placeholder="0" value={sortOrder} onChangeText={setSortOrder} keyboardType="number-pad" />
        <View style={styles.buttons}>
          <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title={isEditing ? 'Actualizar' : 'Crear'} onPress={handleSave} disabled={loading} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { flex: 1, padding: 20 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
