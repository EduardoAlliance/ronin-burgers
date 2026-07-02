import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { getOrderById, getOrderItems, updateOrderStatus } from '@/hooks/useDatabase';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ORDER_STATUSES, COLORS } from '@/utils/constants';
import { Order, OrderItem } from '@/types';
import { useApp } from '@/context/AppContext';
import { getSavedPrinter, printKitchenTicket, printCustomerTicket } from '@/services/printer';

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'] as const;
const STATUS_ACTIONS: Record<string, string> = {
  pending: 'Iniciar Preparación', preparing: 'Marcar como Listo', ready: 'Entregar',
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, refreshData } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<(OrderItem & { productName?: string })[]>([]);

  useEffect(() => { if (id) loadOrder(); }, [id]);

  const loadOrder = async () => {
    const orderData = await getOrderById(Number(id));
    if (!orderData) return router.back();
    setOrder(orderData);
    const orderItems = await getOrderItems(Number(id));
    setItems(orderItems.map((item) => {
      const product = state.products.find((p: { id: number }) => p.id === item.product_id);
      return { ...item, productName: product?.name || 'Producto eliminado' };
    }));
  };

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const currentIndex = STATUS_FLOW.indexOf(order.status as any);
    if (currentIndex < STATUS_FLOW.length - 1) {
      await updateOrderStatus(order.id, STATUS_FLOW[currentIndex + 1]);
      await refreshData();
      loadOrder();
    }
  };

  const handleCancel = () => router.push(`/orders/cancel-form?id=${id}`);

  if (!order) return null;

  const currentIndex = STATUS_FLOW.indexOf(order.status as any);
  const nextAction = STATUS_ACTIONS[order.status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title={`Pedido #${order.id}`} showBack />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <View style={styles.statusTimeline}>
            {STATUS_FLOW.map((s, i) => (
              <View key={s} style={styles.statusStep}>
                <View style={[styles.statusDot, i <= currentIndex && styles.statusDotActive, order.status === 'cancelled' && i === 0 && styles.statusDotCancelled]} />
                {i < STATUS_FLOW.length - 1 && <View style={[styles.statusLine, i < currentIndex && styles.statusLineActive]} />}
              </View>
            ))}
          </View>
          <View style={styles.statusLabels}>
            {STATUS_FLOW.map((s, i) => (
              <Text key={s} style={[styles.statusLabel, i === currentIndex && styles.statusLabelActive,
                order.status === 'cancelled' && s === 'pending' && { color: COLORS.danger }]}>
                {ORDER_STATUSES[s as keyof typeof ORDER_STATUSES]}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{formatDateTime(order.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Método de pago</Text>
            <Text style={styles.infoValue}>{order.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</Text>
          </View>
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.unit_price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {order.status === 'cancelled' && (
          <View style={styles.cancelledCard}>
            <MaterialIcons name="cancel" size={20} color={COLORS.danger} />
            <Text style={styles.cancelledText}>Pedido cancelado</Text>
          </View>
        )}
      </ScrollView>

      {(order.status !== 'cancelled' && order.status !== 'delivered') || items.length > 0 ? (
        <View style={styles.actions}>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <>
              {nextAction && <Button title={nextAction} onPress={handleAdvanceStatus} style={{ flex: 1 }} />}
              <Button title="Cancelar Pedido" variant="danger" onPress={handleCancel} style={{ flex: 1 }} />
            </>
          )}
          <Button
            title="Reimprimir"
            variant={order.status === 'delivered' ? 'primary' : 'secondary'}
            onPress={async () => {
              const printer = await getSavedPrinter();
              if (!printer) {
                Alert.alert('Sin impresora', 'Configura una impresora en Ajustes');
                return;
              }
              Alert.alert('Reimprimir', '¿Qué ticket deseas imprimir?', [
                {
                  text: 'Cocina',
                  onPress: () => printKitchenTicket(order.id, items.map((i) => ({ productName: i.productName || '', quantity: i.quantity }))),
                },
                {
                  text: 'Cliente',
                  onPress: () => printCustomerTicket(order.id, items.map((i) => ({ productName: i.productName || '', quantity: i.quantity, unitPrice: i.unit_price })), order.total, order.payment_method),
                },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }}
            style={order.status === 'delivered' ? { flex: 1 } : {}}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 16 },
  statusSection: { backgroundColor: COLORS.white, borderRadius: 10, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statusTimeline: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  statusStep: { flex: 1, alignItems: 'center', flexDirection: 'row' },
  statusDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.border, zIndex: 1 },
  statusDotActive: { backgroundColor: COLORS.primary },
  statusDotCancelled: { backgroundColor: COLORS.danger },
  statusLine: { flex: 1, height: 3, backgroundColor: COLORS.border, marginTop: 5 },
  statusLineActive: { backgroundColor: COLORS.primary },
  statusLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', flex: 1 },
  statusLabelActive: { color: COLORS.primary, fontWeight: '700' },
  infoCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemsCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  itemQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cancelledCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF5F5', padding: 16, borderRadius: 10 },
  cancelledText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
});
