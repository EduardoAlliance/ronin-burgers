import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/utils/constants';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['bottom']}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="menu/index" />
          <Stack.Screen name="menu/category-form" />
          <Stack.Screen name="menu/product-form" />
          <Stack.Screen name="orders/index" />
          <Stack.Screen name="orders/new" />
          <Stack.Screen name="orders/[id]" />
          <Stack.Screen name="orders/cancel-form" />
          <Stack.Screen name="finances/index" />
          <Stack.Screen name="finances/expenses" />
          <Stack.Screen name="finances/expense-form" />
          <Stack.Screen name="settings/index" />
        </Stack>
      </SafeAreaView>
    </AppProvider>
  );
}
