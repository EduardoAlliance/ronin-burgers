# 🍔 Ronin Burgers — Gestión de Pedidos

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat&logo=expo)](https://expo.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Expo-003B57?style=flat&logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

Aplicación móvil nativa en React Native (Expo) para la gestión de pedidos de una hamburguesería real. En uso actualmente en un local, corriendo en un solo dispositivo Android/iOS sin necesidad de internet.

---

## 📱 Descripción

App offline-first con SQLite local. Sin login, sin cloud, sin inventario. Enfocada en lo esencial:

- **Menú** — CRUD de productos y categorías
- **Pedidos** — Crear, cancelar (con motivo), historial, detalle por ID
- **Finanzas** — Dashboard de ventas, registro de gastos, balance
- **Configuración** — Datos del negocio (nombre, dirección, teléfono)

Diseñada para ser usada por empleados en una tablet o teléfono compartido.

---

## 🚀 Stack

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.81.5 |
| Plataforma | Expo SDK 54 |
| Navegación | expo-router v6 (file-based) |
| Base de datos | expo-sqlite v16 (SQLite local) |
| Estado global | React Context + useReducer |
| Tipado | TypeScript 5.9 |
| Íconos | @expo/vector-icons (MaterialIcons) |
| Fechas | date-fns |
| Animaciones | react-native-reanimated |
| Gestos | react-native-gesture-handler |

---

## 🏗️ Arquitectura

```
src/
├── app/            # Expo Router — rutas basadas en archivos
│   ├── _layout.tsx
│   ├── index.tsx   # Dashboard
│   ├── finances/   # Finanzas, gastos
│   ├── menu/       # CRUD productos y categorías
│   ├── orders/     # Pedidos (nuevo, detalle, cancelar, historial)
│   └── settings/   # Datos del negocio
├── components/     # UI reutilizable (Button, Card, Input, Modal, Header)
├── context/        # AppContext — estado global + refreshData()
├── database/       # Schema SQLite + migraciones preparadas para v2
├── hooks/          # useDatabase.ts — CRUD completo con retry/reconnect
├── services/       # printer.ts — impresión Bluetooth (ESC/POS)
├── types/          # Interfaces TypeScript compartidas
└── utils/          # Constantes (colores, estados) y formateadores
```

### Decisiones técnicas

- **Sin login ni cloud** — base de datos local, cero dependencia de red
- **SQLite con WAL** — modo WAL + `synchronous = NORMAL` para mejor performance en Android
- **Retry automático** — wrapper `withRetry` que reconecta y reintenta hasta 3 veces ante fallos del native driver
- **Sin inventario ni recetas** — funcionalidad prevista para v2, migraciones ya preparadas
- **Impresora Bluetooth** — integración con react-native-thermal-printer, escaneo y conexión desde Ajustes, impresión de tickets de cocina y cliente al confirmar pedido, reimpresión desde detalle de pedido

---

## 🖨️ Impresión Bluetooth

Integración con `react-native-thermal-printer` para impresión térmica ESC/POS por Bluetooth.

- **Configuración** — Escaneo y conexión de impresoras desde la pantalla de Ajustes
- **Ticket de cocina** — Se imprime automáticamente al confirmar un pedido (nombre del producto + cantidad)
- **Ticket de cliente** — Se imprime con detalle de productos, cantidades, precios, total y método de pago
- **Reimpresión** — Botón "Reimprimir" en la pantalla de detalle del pedido

---

## ✨ Features

- Dashboard con resumen de ventas del día + pedidos pendientes
- Creación de pedidos con carrito expandible (bottom card overlay)
- Dos métodos de pago: efectivo y tarjeta
- Cancelación de pedidos con motivo obligatorio
- Avance de estado: pendiente → preparando → listo → entregado
- CRUD completo de productos y categorías
- Registro de gastos operativos
- Balance financiero: ventas - gastos
- Migraciones de base de datos preparadas para v2

---

## 🧠 Desarrollo asistido por IA

Parte del código fue desarrollado con asistencia de IA (OpenCode), enfocada en:

- Mejoras de rendimiento en consultas SQLite
- Patrones de componentes reutilizables
- Buenas prácticas de TypeScript (tipado estricto, cero errores en `tsc --noEmit`)
- Arquitectura limpia y escalable
- Manejo robusto de errores en base de datos nativa

---

## 📦 Instalación

```bash
git clone git@github.com:EduardoAlliance/ronin-burgers.git
cd ronin-burgers
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o la app de Expo (iOS).

---

## 📄 Licencia

MIT
