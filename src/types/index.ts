export interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category_id: number | null;
  image: string | null;
  is_active: number;
  created_at: number;
}

export interface Order {
  id: number;
  total: number;
  payment_method: 'cash' | 'card';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { product_name?: string })[];
}

export interface Cancellation {
  id: number;
  order_id: number;
  reason: string;
  created_at: number;
}

export interface Expense {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: number;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
}

export interface AppState {
  categories: Category[];
  products: Product[];
  orders: OrderWithItems[];
  expenses: Expense[];
  settings: Record<string, string>;
  isLoading: boolean;
}
