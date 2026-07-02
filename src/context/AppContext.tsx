import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AppState as RNAppState, Platform } from 'react-native';
import { initDatabase, closeDatabase } from '../database';
import { AppState, Category, Product, OrderWithItems, Expense } from '../types';
import { getCategories, getProducts, getOrders, getOrderItems, getExpenses } from '../hooks/useDatabase';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshData: () => Promise<void>;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_ORDERS'; payload: OrderWithItems[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] };

const initialState: AppState = {
  categories: [],
  products: [],
  orders: [],
  expenses: [],
  settings: {},
  isLoading: true,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing data...');

      const categories = await getCategories();
      await sleep(50);

      const products = await getProducts();
      await sleep(50);

      const ordersData = await getOrders();
      await sleep(50);

      const itemsResults = await Promise.allSettled(
        ordersData.map(order => getOrderItems(order.id))
      );

      const ordersWithItems: OrderWithItems[] = ordersData.map((order, i) => {
        const items = itemsResults[i].status === 'fulfilled' ? itemsResults[i].value : [];
        return { ...order, items };
      });

      const expenses = await getExpenses();

      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_ORDERS', payload: ordersWithItems });
      dispatch({ type: 'SET_EXPENSES', payload: expenses });

      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await sleep(500);
        await initDatabase();
        await refreshData();
      } catch (error) {
        console.error('Error initializing app:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    init();

    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        closeDatabase().catch(console.warn);
      }
    });

    return () => {
      subscription.remove();
      if (Platform.OS === 'android') {
        closeDatabase().catch(console.warn);
      }
    };
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
