# Sistema de Gestión Empresarial - Nina's Bakery

Sistema web integral para la administración de un negocio. Permite gestionar gastos, ventas, productos, y generar reportes financieros.

## Características

- **Dashboard Inteligente**: KPIs en tiempo real, gráficos de tendencia, transacciones recientes
- **Control de Gastos**: Registro categorizado, filtros, múltiples métodos de pago
- **Gestión de Ventas**: Registro con múltiples productos, cálculo automático de ganancia
- **Catálogo de Productos**: Precios de costo y venta, cálculo de márgenes
- **Reportes Financieros**: Estado de Resultados (P&L), Flujo de Caja, exportación a PDF
- **Autenticación Segura**: Login/Registro con Supabase Auth

## Stack Tecnológico

- **Frontend**: Next.js 16+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gráficos**: Recharts
- **PDF Export**: jsPDF

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql`
4. Ir a **Settings > API** y copiar:
   - Project URL
   - anon/public key

### 3. Configurar variables de entorno

Editar el archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
sistema-gestion/
├── src/
│   ├── app/                    # Páginas (App Router)
│   │   ├── (auth)/            # Login, Register
│   │   ├── (dashboard)/       # Dashboard, Gastos, Ventas, etc.
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Sidebar, Header, Navigation
│   │   ├── dashboard/         # Componentes del dashboard
│   │   ├── expenses/          # Módulo de gastos
│   │   ├── sales/             # Módulo de ventas
│   │   ├── products/          # Módulo de productos
│   │   └── reports/           # Módulo de reportes
│   ├── lib/
│   │   ├── supabase/          # Clientes Supabase
│   │   └── utils.ts           # Utilidades
│   └── types/
│       └── database.ts        # Tipos TypeScript
├── supabase/
│   └── schema.sql             # Esquema de base de datos
└── .env.local                 # Variables de entorno
```

## Uso

### Registro de Usuario
1. Ir a `/register`
2. Completar el formulario con nombre del negocio, email y contraseña
3. Las categorías predeterminadas se crean automáticamente

### Gestión de Productos
1. Ir a **Productos** en el menú
2. Agregar productos con precio de costo y precio de venta
3. El sistema calcula automáticamente el margen de ganancia

### Registro de Gastos
1. Ir a **Gastos** en el menú
2. Registrar gastos con categoría, proveedor, monto y fecha
3. Filtrar por categoría o buscar por texto

### Registro de Ventas
1. Ir a **Ventas** en el menú
2. Seleccionar productos del catálogo
3. El sistema calcula automáticamente el total, costo y ganancia

### Reportes
1. Ir a **Reportes** en el menú
2. Ver Estado de Resultados, Flujo de Caja, Rendimiento de Productos
3. Exportar a PDF para análisis offline

## Deploy en Vercel

1. Conectar el repositorio a [Vercel](https://vercel.com)
2. Configurar las variables de entorno en Vercel
3. Deploy automático con cada push

## Licencia

MIT
