import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { getExpenses, deleteExpense } from '@/hooks/useDatabase';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { COLORS, EXPENSE_TYPES } from '@/utils/constants';
import { Expense } from '@/types';

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadExpenses = useCallback(async () => { setExpenses(await getExpenses(200)); }, []);

  useFocusEffect(useCallback(() => { loadExpenses(); }, [loadExpenses]));

  const handleDelete = (expense: Expense) => {
    Alert.alert('Eliminar gasto', `¿Eliminar "${expense.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteExpense(expense.id); loadExpenses(); } },
    ]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) { case 'supplies': return 'inventory'; case 'operational': return 'build'; default: return 'receipt'; }
  };

  const getTypeLabel = (type: string) => EXPENSE_TYPES.find((t) => t.key === type)?.label || type;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Gastos" showBack rightAction={{ icon: 'add', onPress: () => router.push('/finances/expense-form') }} />
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <TouchableOpacity key={expense.id} style={styles.card} onLongPress={() => handleDelete(expense)}>
              <View style={styles.cardLeft}>
                <MaterialIcons name={getTypeIcon(expense.type) as any} size={20} color={COLORS.danger} />
              </View>
              <View style={styles.cardCenter}>
                <Text style={styles.description}>{expense.description}</Text>
                <Text style={styles.meta}>{getTypeLabel(expense.type)} · {formatDate(expense.date)}</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
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
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardLeft: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardCenter: { flex: 1 },
  description: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
});
