import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="category-form" />
      <Stack.Screen name="product-form" />
    </Stack>
  );
}
