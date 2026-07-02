import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp * 1000), 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp * 1000), 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatTime = (timestamp: number): string => {
  return format(new Date(timestamp * 1000), 'HH:mm', { locale: es });
};

export const getDayRange = (): { start: number; end: number } => {
  const now = new Date();
  return {
    start: Math.floor(startOfDay(now).getTime() / 1000),
    end: Math.floor(endOfDay(now).getTime() / 1000),
  };
};

export const getWeekRange = (): { start: number; end: number } => {
  const now = new Date();
  return {
    start: Math.floor(startOfWeek(now, { weekStartsOn: 1 }).getTime() / 1000),
    end: Math.floor(endOfWeek(now, { weekStartsOn: 1 }).getTime() / 1000),
  };
};

export const getMonthRange = (): { start: number; end: number } => {
  const now = new Date();
  return {
    start: Math.floor(startOfMonth(now).getTime() / 1000),
    end: Math.floor(endOfMonth(now).getTime() / 1000),
  };
};
