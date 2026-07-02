import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { createOrder } from '@/hooks/useDatabase';
import { formatCurrency } from '@/utils/formatters';
import { COLORS, PAYMENT_METHODS } from '@/utils/constants';
import { getSavedPrinter, printKitchenTicket, printCustomerTicket } from '@/services/printer';

interface CartItem {
  productId: number; productName: string; quantity: number; unitPrice: number;
}

export default function NewOrderScreen() {
  const { state, refreshData } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = selectedCategory
    ? state.products.filter((p: { category_id: number | null; is_active: number }) => p.category_id === selectedCategory && p.is_active === 1)
    : state.products.filter((p: { is_active: number }) => p.is_active === 1);

  const addToCart = (productId: number, productName: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) return prev.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId, productName, quantity: 1, unitPrice: price }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => item.productId === productId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      ).filter((item) => item.quantity > 0)
    );
  };

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleConfirm = async () => {
    if (cart.length === 0) { Alert.alert('Carrito vacío', 'Agrega productos al pedido'); return; }
    try {
      const orderId = await createOrder(total, paymentMethod, cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })));
      await refreshData();

      const printer = await getSavedPrinter();
      if (printer) {
        const items = cart.map((i) => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice }));

        Alert.alert('Pedido creado', `Total: ${formatCurrency(total)}\n\n¿Imprimir tickets?`, [
          {
            text: 'Solo cocina',
            onPress: async () => {
              await printKitchenTicket(orderId, items);
              router.back();
            },
          },
          {
            text: 'Ambos',
            onPress: async () => {
              await printKitchenTicket(orderId, items);
              await printCustomerTicket(orderId, items, total, paymentMethod);
              router.back();
            },
          },
          { text: 'No', style: 'cancel', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Pedido creado', `Total: ${formatCurrency(total)}`, [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo crear el pedido');
    }
  };

  const getQty = (productId: number) => {
    const item = cart.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Nuevo Pedido" showBack />

      <View style={styles.categoryTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.categoryTab, selectedCategory === null && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(null)}>
            <Text style={[styles.categoryTabText, selectedCategory === null && styles.categoryTabTextActive]}>Todos</Text>
          </TouchableOpacity>
          {state.categories.map((cat: { id: number; name: string }) => (
            <TouchableOpacity key={cat.id} style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat.id)}>
              <Text style={[styles.categoryTabText, selectedCategory === cat.id && styles.categoryTabTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        <ScrollView style={styles.productList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {filteredProducts.map((product: { id: number; name: string; price: number }) => {
            const qty = getQty(product.id);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                </View>
                {qty > 0 ? (
                  <View style={styles.inlineQty}>
                    <TouchableOpacity onPress={() => updateQuantity(product.id, -1)} style={styles.qtyBtn}>
                      <MaterialIcons name="remove-circle" size={28} color={COLORS.danger} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(product.id, 1)} style={styles.qtyBtn}>
                      <MaterialIcons name="add-circle" size={28} color={COLORS.success} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(product.id, product.name, product.price)}>
                    <MaterialIcons name="add" size={18} color={COLORS.white} />
                    <Text style={styles.addBtnText}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        {showCart && (
          <View style={styles.cartCard}>
            <TouchableOpacity onPress={() => setShowCart(false)} activeOpacity={0.7} style={styles.cartHandleArea}>
              <View style={styles.cartHandle} />
            </TouchableOpacity>
            <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
              {cart.map((item) => (
                <View key={item.productId} style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                    <Text style={styles.cartItemPrice}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity onPress={() => updateQuantity(item.productId, -1)}>
                      <MaterialIcons name="remove-circle" size={26} color={COLORS.danger} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.productId, 1)}>
                      <MaterialIcons name="add-circle" size={26} color={COLORS.success} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.cartFooter}>
              <View style={styles.paymentRow}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity key={method.key}
                    style={[styles.paymentBtn, paymentMethod === method.key && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod(method.key as 'cash' | 'card')}>
                    <MaterialIcons name={(method.icon + '') as any} size={16}
                      color={paymentMethod === method.key ? COLORS.white : COLORS.textSecondary} />
                    <Text style={[styles.paymentText, paymentMethod === method.key && styles.paymentTextActive]}>{method.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>

              <Button title="Confirmar Pedido" onPress={handleConfirm} />
            </View>
          </View>
        )}
      </View>

      {itemCount > 0 && (
        <TouchableOpacity style={styles.bottomBar} onPress={() => setShowCart(!showCart)} activeOpacity={0.8}>
          <View style={styles.bottomBarLeft}>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.bottomBarLabel}>{showCart ? 'Seguir agregando' : 'Ver pedido'}</Text>
          </View>
          <View style={styles.bottomBarRight}>
            <Text style={styles.bottomBarTotal}>{formatCurrency(total)}</Text>
            <MaterialIcons name={showCart ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} size={24} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      )}

      {itemCount === 0 && (
        <View style={[styles.emptyHint, { paddingBottom: insets.bottom + 16 }]}>
          <MaterialIcons name="touch-app" size={24} color={COLORS.textSecondary} />
          <Text style={styles.emptyHintText}>Toca "Agregar" para añadir productos</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  categoryTabs: { paddingVertical: 8, paddingLeft: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryTab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: COLORS.background },
  categoryTabActive: { backgroundColor: COLORS.primary },
  categoryTabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  categoryTabTextActive: { color: COLORS.white },

  mainContent: { flex: 1, position: 'relative' },

  productList: { flex: 1, padding: 12 },
  productCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, padding: 14, borderRadius: 10, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  productPrice: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 3 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },

  inlineQty: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { padding: 2 },
  qtyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.text, paddingHorizontal: 20, paddingVertical: 14,
  },
  bottomBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCountBadge: {
    backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 24, height: 24,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  itemCountText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  bottomBarLabel: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  bottomBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomBarTotal: { color: COLORS.white, fontSize: 17, fontWeight: '800' },

  cartCard: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 10,
  },
  cartHandleArea: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 40 },
  cartHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border,
  },
  cartItems: { flex: 1 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cartItemName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  cartItemPrice: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 },

  cartFooter: { paddingTop: 4, paddingBottom: 8 },

  paymentRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  paymentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, flex: 1, justifyContent: 'center',
  },
  paymentBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  paymentTextActive: { color: COLORS.white },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingTop: 6, borderTopWidth: 2, borderTopColor: COLORS.text },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

  emptyHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  emptyHintText: { fontSize: 14, color: COLORS.textSecondary },
});
