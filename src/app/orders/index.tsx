import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { getOrders, getOrderItems } from '@/hooks/useDatabase';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ORDER_STATUSES, COLORS } from '@/utils/constants';
import { OrderWithItems } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning, preparing: COLORS.info,
  ready: COLORS.primary, delivered: COLORS.success, cancelled: COLORS.danger,
};

type FilterTab = 'today' | 'week' | 'month' | 'all';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filter, setFilter] = useState<FilterTab>('today');

  const loadOrders = useCallback(async () => {
    const data = await getOrders(200);
    const withItems: OrderWithItems[] = await Promise.all(
      data.map(async (o) => ({ ...o, items: await getOrderItems(o.id) }))
    );
    setOrders(withItems);
  }, []);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  const getFilteredOrders = () => {
    const now = Math.floor(Date.now() / 1000);
    const day = 86400;
    switch (filter) {
      case 'today': return orders.filter((o) => o.created_at >= now - (now % day));
      case 'week': return orders.filter((o) => o.created_at >= now - 7 * day);
      case 'month': return orders.filter((o) => o.created_at >= now - 30 * day);
      default: return orders;
    }
  };

  const filtered = getFilteredOrders();
  const filterBtns: FilterTab[] = ['today', 'week', 'month', 'all'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Pedidos" showBack rightAction={{ icon: 'add', onPress: () => router.push('/orders/new') }} />

      <View style={styles.filters}>
        {filterBtns.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay pedidos</Text>
            <TouchableOpacity style={styles.newOrderBtn} onPress={() => router.push('/orders/new')}>
              <Text style={styles.newOrderText}>Nuevo Pedido</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push(`/orders/${order.id}`)}>
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>Pedido #{order.id}</Text>
                  {order.customer_name ? <Text style={styles.orderCustomer}>{order.customer_name}</Text> : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                    {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderItems}>{order.items.length} producto(s)</Text>
                <Text style={styles.orderTime}>{formatDateTime(order.created_at)}</Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                <MaterialIcons name={order.payment_method === 'cash' ? 'payments' : 'credit-card'} size={16} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  list: { flex: 1, paddingHorizontal: 16 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  orderCustomer: { fontSize: 12, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderItems: { fontSize: 13, color: COLORS.textSecondary },
  orderTime: { fontSize: 12, color: COLORS.textSecondary },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  orderTotal: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  newOrderBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  newOrderText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
});
