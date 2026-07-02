import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cancelOrder } from '@/hooks/useDatabase';
import { COLORS } from '@/utils/constants';
import { useApp } from '@/context/AppContext';

export default function CancelOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { refreshData } = useApp();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) { Alert.alert('Error', 'Debes ingresar un motivo de cancelación'); return; }
    setLoading(true);
    try {
      await cancelOrder(Number(id), reason.trim());
      await refreshData();
      Alert.alert('Pedido cancelado', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch { Alert.alert('Error', 'No se pudo cancelar el pedido'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Cancelar Pedido" showBack />
      <View style={styles.content}>
        <Text style={styles.description}>¿Estás seguro de cancelar el pedido #{id}? Esta acción no se puede deshacer.</Text>
        <Input label="Motivo de cancelación" placeholder="Ej: Cliente canceló el pedido" value={reason} onChangeText={setReason} multiline numberOfLines={3} />
        <View style={styles.buttons}>
          <Button title="Volver" variant="outline" onPress={() => router.back()} style={{ flex: 1 }} />
          <Button title="Cancelar Pedido" variant="danger" onPress={handleCancel} disabled={loading} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  description: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
