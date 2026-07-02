import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { createProduct, updateProduct } from '@/hooks/useDatabase';
import { COLORS } from '@/utils/constants';

export default function ProductFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, refreshData } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const isEditing = !!id;
  const product = isEditing ? state.products.find((p: { id: number }) => p.id === Number(id)) : null;

  useEffect(() => {
    if (product) {
      setName(product.name); setPrice(product.price.toString());
      setCategoryId(product.category_id?.toString() || null);
      setIsActive(product.is_active === 1);
    }
  }, [product]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { Alert.alert('Error', 'Ingresa un precio válido'); return; }
    setLoading(true);
    try {
      const catId = categoryId ? parseInt(categoryId) : null;
      if (isEditing && product) await updateProduct(product.id, name.trim(), Number(price), catId, isActive ? 1 : 0);
      else await createProduct(name.trim(), Number(price), catId);
      await refreshData();
      router.back();
    } catch { Alert.alert('Error', 'No se pudo guardar el producto'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={isEditing ? 'Editar Producto' : 'Nuevo Producto'} showBack />
      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Input label="Nombre del producto" placeholder="Ej: Hamburguesa Clásica" value={name} onChangeText={setName} />
        <Input label="Precio de venta" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
          <Button title="Sin categoría" variant={categoryId === null ? 'primary' : 'outline'}
            onPress={() => setCategoryId(null)} style={styles.categoryChip} />
          {state.categories.map((cat: { id: number; name: string }) => (
            <Button key={cat.id} title={cat.name}
              variant={categoryId === cat.id.toString() ? 'primary' : 'outline'}
              onPress={() => setCategoryId(cat.id.toString())} style={styles.categoryChip} />
          ))}
        </ScrollView>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Estado</Text>
          <Button title={isActive ? 'Activo' : 'Inactivo'} variant={isActive ? 'primary' : 'secondary'}
            onPress={() => setIsActive(!isActive)} />
        </View>

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
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  categorySelector: { flexDirection: 'row', marginBottom: 16 },
  categoryChip: { marginRight: 8, minHeight: 36, paddingVertical: 6, paddingHorizontal: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
