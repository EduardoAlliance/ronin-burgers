import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/context/AppContext';
import { deleteCategory, deleteProduct } from '@/hooks/useDatabase';
import { formatCurrency } from '@/utils/formatters';
import { COLORS } from '@/utils/constants';
import { Category, Product } from '@/types';

export default function MenuScreen() {
  const { state, refreshData } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${category.name}"? Los productos quedarán sin categoría.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(category.id);
            await refreshData();
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            await refreshData();
          },
        },
      ]
    );
  };

  const toggleCategory = (id: number) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Gestión de Menú"
        showBack
        rightAction={{
          icon: 'add',
          onPress: () => router.push('/menu/product-form'),
        }}
      />

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.addCategoryBtn}
          onPress={() => router.push('/menu/category-form')}
        >
          <MaterialIcons name="add" size={40} color={COLORS.white} />
          <Text style={styles.addCategoryText}>Nueva Categoría</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => setExpandedCategory(expandedCategory === 0 ? null : 0)}
        >
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <MaterialIcons name="all-inclusive" size={20} color={COLORS.primary} />
              <Text style={styles.categoryName}>Todos los productos</Text>
            </View>
            <MaterialIcons
              name={expandedCategory === 0 ? 'expand-less' : 'expand-more'}
              size={20}
              color={COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {expandedCategory === 0 && (
          <View style={styles.productList}>
            {state.products.length === 0 ? (
              <Text style={styles.emptyText}>No hay productos. Agrega uno nuevo.</Text>
            ) : (
              state.products.map((product: Product) => (
                <View key={product.id} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: product.is_active ? COLORS.success : COLORS.textSecondary },
                      ]}
                    />
                    <View>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      onPress={() => router.push(`/menu/product-form?id=${product.id}`)}
                      style={styles.editBtn}
                    >
                      <MaterialIcons name="edit" size={18} color={COLORS.info} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product)}
                      style={styles.deleteBtn}
                    >
                      <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {state.categories.map((category: Category) => (
          <View key={category.id}>
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <MaterialIcons name="category" size={20} color={COLORS.info} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <View style={styles.categoryActionsRow}>
                  <TouchableOpacity
                    onPress={() => router.push(`/menu/category-form?id=${category.id}`)}
                    style={styles.editBtn}
                  >
                    <MaterialIcons name="edit" size={18} color={COLORS.info} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category)}
                    style={styles.deleteBtn}
                  >
                    <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                  <MaterialIcons
                    name={expandedCategory === category.id ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {expandedCategory === category.id && (
              <View style={styles.productList}>
                {state.products.filter((p: { category_id: number | null }) => p.category_id === category.id).length === 0 ? (
                  <Text style={styles.emptyText}>No hay productos en esta categoría.</Text>
                ) : (
                  state.products
                    .filter((p: { category_id: number | null }) => p.category_id === category.id)
                    .map((product: Product) => (
                      <View key={product.id} style={styles.productItem}>
                        <View style={styles.productInfo}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: product.is_active ? COLORS.success : COLORS.textSecondary },
                            ]}
                          />
                          <View>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                          </View>
                        </View>
                        <View style={styles.productActions}>
                          <TouchableOpacity
                            onPress={() => router.push(`/menu/product-form?id=${product.id}`)}
                            style={styles.editBtn}
                          >
                            <MaterialIcons name="edit" size={18} color={COLORS.info} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteProduct(product)}
                            style={styles.deleteBtn}
                          >
                            <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                )}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  categoryActions: { paddingHorizontal: 16, paddingVertical: 8 },
  addCategoryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: COLORS.info, paddingVertical: 8, borderRadius: 8,
  },
  addCategoryText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  categoryCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 14,
    marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  categoryActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productList: { paddingLeft: 16, marginBottom: 8 },
  productItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 8, padding: 12, marginBottom: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  productInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  productName: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  productPrice: { fontSize: 13, color: COLORS.textSecondary },
  productActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, paddingVertical: 12, paddingLeft: 8 },
});
