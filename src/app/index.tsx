import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { getOrdersByDate, getExpensesByDate, updateOrderStatus } from '@/hooks/useDatabase';
import { getDayRange, formatCurrency, formatTime } from '@/utils/formatters';
import { COLORS, ORDER_STATUSES } from '@/utils/constants';
import { OrderWithItems } from '@/types';

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'] as const;
const STATUS_ACTIONS: Record<string, { label: string; next: string }> = {
  pending: { label: 'Iniciar Preparación', next: 'preparing' },
  preparing: { label: 'Marcar como Listo', next: 'ready' },
  ready: { label: 'Entregar', next: 'delivered' },
};

export default function Dashboard() {
  const { state, refreshData } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);

  const loadTodayData = useCallback(async () => {
    const { start, end } = getDayRange();
    const orders = await getOrdersByDate(start, end);
    const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'ready');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const expenses = await getExpensesByDate(start, end);

    setTodaySales(deliveredOrders.reduce((sum, o) => sum + o.total, 0));
    setTodayOrders(orders.length - cancelledOrders.length);
    setTodayExpenses(expenses.reduce((sum, e) => sum + e.amount, 0));
  }, []);

  useEffect(() => {
    loadTodayData();
  }, [state.orders]);

  const pendingOrders = state.orders.filter(
    o => o.status === 'pending' || o.status === 'preparing'
  );

  const handleAdvanceStatus = async (order: OrderWithItems) => {
    const action = STATUS_ACTIONS[order.status];
    if (!action) return;
    try {
      await updateOrderStatus(order.id, action.next as any);
      await refreshData();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleCancel = (orderId: number) => {
    router.push(`/orders/cancel-form?id=${orderId}`);
  };

  const quickActions = [
    { label: 'Nuevo Pedido', icon: 'add-shopping-cart', route: '/orders/new', color: COLORS.primary },
    { label: 'Gestión Menú', icon: 'restaurant-menu', route: '/menu', color: COLORS.info },
    { label: 'Historial', icon: 'receipt-long', route: '/orders', color: COLORS.secondary },
    { label: 'Finanzas', icon: 'account-balance', route: '/finances', color: COLORS.success },
  ];

  const stats = [
    { label: 'Ventas hoy', value: formatCurrency(todaySales), color: COLORS.primary },
    { label: 'Pedidos hoy', value: String(todayOrders), color: COLORS.info },
    { label: 'Gastos hoy', value: formatCurrency(todayExpenses), color: COLORS.danger },
    { label: 'Ganancia neta', value: formatCurrency(todaySales - todayExpenses), color: COLORS.success },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ronin Burgers</Text>
          <Text style={styles.subtitle}>Panel de control</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <MaterialIcons name="settings" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Pedidos en Curso ({pendingOrders.length})
        </Text>

        {pendingOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
          </View>
        ) : (
          pendingOrders.map(order => {
            const action = STATUS_ACTIONS[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${order.id}`)}
                activeOpacity={0.7}
              >

                <View>
                      {order.customer_name ? (
                  <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                ) : null}
                </View>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Pedido #{order.id}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: order.status === 'pending' ? COLORS.warning + '20' : COLORS.info + '20' }]}>
                    <Text style={[styles.statusText, { color: order.status === 'pending' ? COLORS.warning : COLORS.info }]}>
                      {ORDER_STATUSES[order.status]}
                    </Text>
                  </View>
                </View>

              
                <View style={styles.orderBody}>
                  <View style={styles.orderDetail}>
                    <MaterialIcons name="payments" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.orderDetailText}>{formatCurrency(order.total)}</Text>
                  </View>
                  <View style={styles.orderDetail}>
                    <MaterialIcons name={order.payment_method === 'cash' ? 'attach-money' : 'credit-card'} size={16} color={COLORS.textSecondary} />
                    <Text style={styles.orderDetailText}>{order.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {action && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                      onPress={() => handleAdvanceStatus(order)}
                    >
                      <MaterialIcons name="play-arrow" size={18} color={COLORS.white} />
                      <Text style={styles.actionBtnText}>{action.label}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnCancel]}
                    onPress={() => handleCancel(order.id)}
                  >
                    <MaterialIcons name="cancel" size={18} color={COLORS.danger} />
                    <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: action.color + '15' }]}
              onPress={() => router.push(action.route as any)}
            >
              <MaterialIcons name={action.icon as any} size={32} color={action.color} />
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  settingsBtn: { padding: 8 },
  scroll: { flex: 1 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 8,
  },
  statCard: {
    width: '48%', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 10, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 12, paddingHorizontal: 20,
  },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },

  orderCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 10, borderRadius: 12,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 10},
  orderId: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  orderTime: { fontSize: 13, color: COLORS.textSecondary },
  orderCustomer: { fontSize: 18, color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderBody: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  orderDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDetailText: { fontSize: 13, color: COLORS.textSecondary },
  orderActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8, flex: 1, justifyContent: 'center',
  },
  actionBtnCancel: { backgroundColor: COLORS.danger + '10', borderWidth: 1, borderColor: COLORS.danger + '30' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.white },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  actionCard: {
    width: '48%', padding: 20, borderRadius: 12, alignItems: 'center', gap: 10,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
