# Ronin Burgers v1 — Plan de Desarrollo

Aplicación móvil para gestión de hamburguesería. Desarrollada en React Native (Expo) con SQLite local.

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | Expo SDK 57 (React Native) |
| Base de datos | `expo-sqlite` |
| Navegación | Expo Router (file-based) |
| Estado | React Context |
| UI / Estilos | React Native StyleSheet (estilo POS minimalista) |
| Íconos | `@expo/vector-icons` |
| Fechas | `date-fns` |
| Impresora (preparado) | Bluetooth térmica |

---

## Esquema de Base de Datos (SQLite)

```sql
-- Categorías (Hamburguesas, Bebidas, Combos...)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Productos del menú
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category_id INTEGER,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Pedidos
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'preparing', 'ready', 'delivered')),
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Items de cada pedido
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cancelaciones de pedidos
CREATE TABLE cancellations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Gastos (insumos, operativos, etc.)
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date INTEGER DEFAULT (strftime('%s','now'))
);

-- Configuración
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);
```

---

## Estructura de Carpetas

```
ronin-burgers/
├── app/                          # Expo Router
│   ├── index.tsx                 # Dashboard principal
│   ├── menu/
│   │   ├── index.tsx             # Gestión de menú
│   │   ├── category-form.tsx
│   │   └── product-form.tsx
│   ├── orders/
│   │   ├── index.tsx             # Listado de pedidos
│   │   ├── new.tsx               # Crear nuevo pedido
│   │   ├── [id].tsx              # Detalle pedido
│   │   └── cancel-form.tsx       # Cancelar pedido
│   ├── finances/
│   │   ├── index.tsx             # Dashboard financiero
│   │   ├── expenses.tsx          # Listado gastos
│   │   └── expense-form.tsx
│   └── settings/
│       └── index.tsx             # Configuración del negocio
├── src/
│   ├── database/
│   │   ├── index.ts              # Conexión SQLite
│   │   ├── schema.ts             # Definición tablas
│   │   └── migrations.ts         # Migraciones v2
│   ├── context/
│   │   └── AppContext.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts
││   ├── useOrders.ts
│   │   └── useFinances.ts
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Modal...
│   │   └── layout/               # Header, TabBar
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validations.ts
│   └── types/
│       └── index.ts
├── assets/images/
└── package.json
```

---

## Roadmap — 11 Pasos

| # | Paso | Objetivo | Validación |
|---|------|----------|------------|
| 1 | **Setup inicial** | Expo SDK 57, dependencias, estructura | App corre en emulador |
| 2 | **Base de datos** | SQLite, esquema, migraciones v2 | Tablas se crean correctamente |
| 3 | **Contexto global** | React Context, estado inicial | Estado en pantallas |
| 4 | **CRUD Menú** | Categorías y productos | CRUD funciona |
| 5 | **Nuevo Pedido** | Menú interactivo, carrito, confirmar | Flujo completo |
| 6 | **Pedidos + Estados + Cancelaciones** | Histórico, estados, cancelar con motivo | Todo el flujo |
| 7 | **Finanzas** | Gastos (CRUD), cierre de caja | Registro y cierre OK |
| 8 | **Dashboard** | Resumen día, más vendidos, accesos | Datos correctos |
| 9 | **Configuración** | Datos del negocio, métodos de pago | Persisten |
| 10 | **Impresora** | Preparar Bluetooth, tickets cocina y cliente | Funciones listas |
| 11 | **Polishing** | Testing, errores, empty states | Todo funciona |

---

## Notas Clave

- **Sin stock**: Los insumos solo se registran como gastos contables.
- **Migraciones**: Preparadas para v2 (recetas/stock) sin perder datos.
- **Impresora**: Preparada en paso 10, depende de hardware real.
- **Cancelaciones**: Permitidas con motivo obligatorio.
- **Filtros de pedidos**: Por fecha (hoy, semana, mes) y por estado.
- **Métodos de pago**: Efectivo y tarjeta (podría ampliarse en v2).
