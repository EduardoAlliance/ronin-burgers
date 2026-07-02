import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { getOrdersByDate, getExpensesByDate } from '@/hooks/useDatabase';
import { formatCurrency, getDayRange, getWeekRange, getMonthRange } from '@/utils/formatters';
import { COLORS } from '@/utils/constants';

type Period = 'day' | 'week' | 'month';

export default function FinancesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('day');
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const loadData = useCallback(async () => {
    const range = period === 'day' ? getDayRange() : period === 'week' ? getWeekRange() : getMonthRange();
    const orders = await getOrdersByDate(range.start, range.end);
    const delivered = orders.filter(o => o.status === 'delivered' || o.status === 'ready');
    const expensesData = await getExpensesByDate(range.start, range.end);
    setSales(delivered.reduce((s, o) => s + o.total, 0));
    setOrderCount(delivered.length);
    setExpenses(expensesData.reduce((s, e) => s + e.amount, 0));
  }, [period]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const periods = [
    { key: 'day', label: 'Hoy' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Finanzas" showBack rightAction={{ icon: 'add', onPress: () => router.push('/finances/expense-form') }} />

      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity key={p.key} style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key as Period)}>
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <MaterialIcons name="trending-up" size={24} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={styles.summaryValue}>{formatCurrency(sales)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <MaterialIcons name="trending-down" size={24} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={styles.summaryValue}>{formatCurrency(expenses)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <MaterialIcons name="account-balance" size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Balance Neto</Text>
              <Text style={[styles.summaryValue, { color: sales - expenses >= 0 ? COLORS.success : COLORS.danger }]}>
                {formatCurrency(sales - expenses)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <MaterialIcons name="receipt" size={24} color={COLORS.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Pedidos</Text>
              <Text style={styles.summaryValue}>{orderCount}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/finances/expenses')}>
          <MaterialIcons name="list-alt" size={24} color={COLORS.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Ver Gastos</Text>
            <Text style={styles.menuSubtitle}>Lista completa de gastos registrados</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 16 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 10, padding: 16, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  menuSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
