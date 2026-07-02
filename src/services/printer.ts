import { getDatabase } from '@/database';

const ESC = '\x1b';
const GS = '\x1d';

const CMD = {
  center: `${ESC}\x61\x01`,
  left: `${ESC}\x61\x00`,
  boldOn: `${ESC}\x45\x01`,
  boldOff: `${ESC}\x45\x00`,
  cut: `${GS}\x56\x00`,
  feed: (n: number) => `${ESC}\x64` + String.fromCharCode(n),
  doubleH: `${ESC}\x21\x10`,
  normal: `${ESC}\x21\x00`,
};

let cachedPrinter: { name: string; mac: string } | null = null;
let cachedWidth: { mm: number; chars: number } | null = null;

export type PrinterWidth = '80mm' | '58mm';

const WIDTH_PRESETS: Record<PrinterWidth, { mm: number; chars: number }> = {
  '80mm': { mm: 80, chars: 32 },
  '58mm': { mm: 48, chars: 24 },
};

export async function getSavedPrinter(): Promise<{ name: string; mac: string } | null> {
  if (cachedPrinter) return cachedPrinter;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'printer_mac'"
  );
  if (!row?.value) return null;
  const nameRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'printer_name'"
  );
  cachedPrinter = { mac: row.value, name: nameRow?.value || 'Impresora' };
  return cachedPrinter;
}

export async function getPrinterWidth(): Promise<{ mm: number; chars: number }> {
  if (cachedWidth) return cachedWidth;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'printer_width'"
  );
  const preset = (row?.value as PrinterWidth) || '80mm';
  cachedWidth = WIDTH_PRESETS[preset];
  return cachedWidth;
}

export async function clearPrinterCache() {
  cachedPrinter = null;
  cachedWidth = null;
}

export async function savePrinter(name: string, mac: string) {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['printer_mac', mac]);
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['printer_name', name]);
  cachedPrinter = { name, mac };
}

export async function savePrinterWidth(width: PrinterWidth) {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['printer_width', width]);
  cachedWidth = WIDTH_PRESETS[width];
}

export async function removePrinter() {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM settings WHERE key = 'printer_mac'");
  await db.runAsync("DELETE FROM settings WHERE key = 'printer_name'");
  await db.runAsync("DELETE FROM settings WHERE key = 'printer_width'");
  cachedPrinter = null;
  cachedWidth = null;
}

export async function searchPrinters(): Promise<{ deviceName: string; macAddress: string }[]> {
  try {
    const ThermalPrinter = require('react-native-thermal-printer').default;
    const list = await ThermalPrinter.getBluetoothDeviceList();
    return list || [];
  } catch {
    return [];
  }
}

function line(width: number, char = '='): string {
  return char.repeat(width) + '\n';
}

function centerText(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + '\n';
}

function formatItemLine(qty: number, name: string, price: string, width: number): string {
  const lineText = `${qty}x ${name}`;
  const dots = width - lineText.length - price.length;
  if (dots > 0) {
    return lineText + '.'.repeat(dots) + price + '\n';
  }
  return lineText + ' ' + price + '\n';
}

export function formatKitchenTicket(
  orderId: number,
  items: { productName: string; quantity: number }[],
  businessName: string,
  charWidth = 32,
): string {
  const w = charWidth;
  let payload = CMD.center + line(w, '*') + CMD.boldOn + centerText('COCINA', w) + CMD.boldOff;
  payload += CMD.center + centerText(businessName || 'RONIN BURGERS', w);
  payload += line(w, '-') + CMD.doubleH + CMD.center + centerText(`#${orderId}`, w) + CMD.normal;
  payload += line(w, '-') + CMD.left;
  for (const item of items) {
    payload += `${item.quantity}x ${item.productName}\n`;
  }
  payload += CMD.center + line(w, '-');
  payload += CMD.center + centerText(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), w);
  payload += line(w, '*');
  payload += CMD.feed(3) + CMD.cut;
  return payload;
}

export function formatCustomerTicket(
  orderId: number,
  items: { productName: string; quantity: number; unitPrice: number }[],
  total: number,
  paymentMethod: string,
  businessName: string,
  businessAddress: string,
  businessPhone: string,
  charWidth = 32,
): string {
  const w = charWidth;
  let payload = CMD.center + line(w, '=');
  payload += CMD.boldOn + centerText(businessName || 'RONIN BURGERS', w) + CMD.boldOff;

  if (businessAddress) {
    payload += CMD.center + centerText(businessAddress, w);
  }
  if (businessPhone) {
    payload += CMD.center + centerText(`Tel: ${businessPhone}`, w);
  }

  payload += line(w, '=');
  payload += CMD.doubleH + CMD.center + centerText(`TICKET #${orderId}`, w) + CMD.normal;
  payload += line(w, '-') + CMD.left;

  for (const item of items) {
    const price = `$${(item.unitPrice * item.quantity).toFixed(2)}`;
    payload += formatItemLine(item.quantity, item.productName, price, w);
  }

  payload += line(w, '-');
  payload += CMD.boldOn + formatItemLine(1, 'TOTAL', `$${total.toFixed(2)}`, w) + CMD.boldOff;
  payload += line(w, '-');
  payload += CMD.center + centerText(`Metodo: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}`, w);
  payload += CMD.center + centerText(new Date().toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }), w);
  payload += line(w, '=');
  payload += CMD.boldOn + CMD.center + centerText('Gracias por su visita!', w) + CMD.boldOff;
  payload += CMD.feed(4) + CMD.cut;
  return payload;
}

export async function printPayload(payload: string): Promise<boolean> {
  const printer = await getSavedPrinter();
  if (!printer) return false;
  const width = await getPrinterWidth();
  try {
    const ThermalPrinter = require('react-native-thermal-printer').default;
    await ThermalPrinter.printBluetooth({
      payload,
      macAddress: printer.mac,
      autoCut: true,
      openCashbox: false,
      mmFeedPaper: 0,
      printerDpi: 203,
      printerWidthMM: width.mm,
      printerNbrCharactersPerLine: width.chars,
    });
    return true;
  } catch {
    return false;
  }
}

export async function printKitchenTicket(
  orderId: number,
  items: { productName: string; quantity: number }[],
): Promise<boolean> {
  const db = await getDatabase();
  const nameRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'business_name'"
  );
  const width = await getPrinterWidth();
  const payload = formatKitchenTicket(orderId, items, nameRow?.value || '', width.chars);
  return printPayload(payload);
}

export async function printCustomerTicket(
  orderId: number,
  items: { productName: string; quantity: number; unitPrice: number }[],
  total: number,
  paymentMethod: string,
): Promise<boolean> {
  const db = await getDatabase();
  const nameRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'business_name'");
  const addrRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'business_address'");
  const phoneRow = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'business_phone'");
  const width = await getPrinterWidth();
  const payload = formatCustomerTicket(
    orderId, items, total, paymentMethod,
    nameRow?.value || '', addrRow?.value || '', phoneRow?.value || '',
    width.chars,
  );
  return printPayload(payload);
}
