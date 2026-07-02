import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
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
    </AppProvider>
  );
}
