export const PAYMENT_METHODS = [
  { key: 'cash', label: 'Efectivo', icon: 'attach-money' },
  { key: 'card', label: 'Tarjeta', icon: 'credit-card' },
] as const;

export const ORDER_STATUSES = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
} as const;

export const EXPENSE_TYPES = [
  { key: 'supplies', label: 'Insumos' },
  { key: 'operational', label: 'Operativo' },
  { key: 'other', label: 'Otro' },
] as const;

export const DEFAULT_SETTINGS = {
  business_name: 'Ronin Burgers',
  business_address: '',
  business_phone: '',
  tax_rate: '0',
};

export const COLORS = {
  primary: '#FF6B00',
  primaryLight: '#FF8C38',
  secondary: '#4A5568',
  success: '#38A169',
  danger: '#E53E3E',
  warning: '#D69E2E',
  info: '#3182CE',
  background: '#F7FAFC',
  white: '#FFFFFF',
  text: '#2D3748',
  textSecondary: '#718096',
  border: '#E2E8F0',
  card: '#FFFFFF',
};
