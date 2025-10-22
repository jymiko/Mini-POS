# POS System - Point of Sale Application

Aplikasi Point of Sale (POS) fullstack menggunakan Next.js 15 dengan TDD approach, mengelola menu penjualan, material/bahan baku, dan sistem kasir dengan tracking ketersediaan material.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: SQLite + Prisma ORM
- **Authentication**: Cookie-based sessions
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Turbopack
- **TypeScript**: Full type safety

## Fitur Utama

### 1. Authentication System
- Login dengan username dan password
- Session management dengan cookies
- Protected routes untuk dashboard

### 2. Master Material (CRUD)
- Kelola bahan baku (teh, gula, kopi, dll)
- Track stock dan minimum stock
- Alert untuk material dengan stock rendah
- Validasi sebelum delete (tidak bisa hapus jika digunakan di menu)

### 3. Master Menu (CRUD)
- Kelola menu penjualan
- Assign material ke menu dengan quantity
- Automatic availability check berdasarkan stock material
- Menu dengan material habis akan ditandai sebagai "Tidak Tersedia"
- Soft delete untuk preserve order history

### 4. Kasir
- Tampilan menu dengan status ketersediaan
- Menu yang material-nya habis akan di-disable
- Shopping cart system
- Process order dengan automatic material deduction
- Real-time stock update

### 5. Self-Order (Tanpa Login)
- Customer bisa order sendiri tanpa login
- Hanya tampilkan menu yang tersedia
- Input nama customer
- Generate order number
- Order langsung masuk ke sistem kasir

## Getting Started

### Prerequisites
- Node.js 18+ atau yang lebih baru
- npm/yarn/pnpm

### Installation

1. Clone repository atau navigate ke project folder:
```bash
cd pos-app
```

2. Install dependencies:
```bash
npm install
```

3. Setup database:
```bash
# Push schema ke database
npm run db:push

# Seed database dengan data awal
npm run db:seed
```

4. Run development server:
```bash
npm run dev
```

5. Buka browser di [http://localhost:3000](http://localhost:3000)

## Default Credentials

- **Username**: admin
- **Password**: admin123

## Database Schema

### User
- Authentication dan role management (admin/cashier)

### Material
- Bahan baku dengan stock tracking
- Unit measurement (gram, ml, pcs, dll)
- Minimum stock threshold

### Menu
- Menu penjualan dengan harga
- Status active/inactive
- Dynamic availability berdasarkan material

### MenuMaterial
- Relasi many-to-many antara Menu dan Material
- Quantity requirement per menu

### Order & OrderItem
- Order history dengan status
- Track type (cashier/self-order)
- Customer name untuk self-order

## Material Availability Logic

Sistem otomatis mengecek ketersediaan menu berdasarkan:
1. Menu harus dalam status active
2. Semua material yang dibutuhkan harus tersedia
3. Stock material harus >= quantity yang dibutuhkan
4. Saat order diproses, stock material otomatis berkurang

**Contoh:**
- Menu "Es Teh Manis" butuh: Teh (10g), Gula (20g), Air (250ml)
- Jika Gula hanya tersisa 15g, menu akan disabled
- Kasir tidak bisa menjual menu tersebut
- Customer di self-order tidak akan melihat menu ini

## Routes

### Public Routes
- `/` - Redirect ke login
- `/login` - Login page
- `/order` - Self-order page (tanpa login)

### Protected Routes (Require Login)
- `/dashboard` - Dashboard utama
- `/dashboard/materials` - Master Material CRUD
- `/dashboard/menus` - Master Menu CRUD
- `/dashboard/cashier` - Kasir untuk proses penjualan

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Materials
- `GET /api/materials` - List all materials
- `POST /api/materials` - Create material
- `GET /api/materials/[id]` - Get material detail
- `PUT /api/materials/[id]` - Update material
- `DELETE /api/materials/[id]` - Delete material

### Menus
- `GET /api/menus` - List all menus with availability
- `POST /api/menus` - Create menu with materials
- `GET /api/menus/[id]` - Get menu detail
- `PUT /api/menus/[id]` - Update menu
- `DELETE /api/menus/[id]` - Soft delete menu

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order (auto deduct materials)

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Development Scripts

```bash
# Development server dengan Turbopack
npm run dev

# Build untuk production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database push (apply schema)
npm run db:push

# Database seed
npm run db:seed
```

## Project Structure

```
pos-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── materials/    # Material CRUD
│   │   ├── menus/        # Menu CRUD
│   │   └── orders/       # Order processing
│   ├── dashboard/        # Protected dashboard pages
│   │   ├── materials/
│   │   ├── menus/
│   │   └── cashier/
│   ├── login/            # Login page
│   ├── order/            # Self-order page
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth/             # Auth utilities
│   └── menu-availability.ts  # Availability logic
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeder
├── __tests__/            # Test files
└── middleware.ts         # Route protection

```

## TDD Approach

Aplikasi ini dibangun dengan Test-Driven Development:
1. Write tests first untuk setiap fitur
2. Implement fitur untuk pass tests
3. Refactor dengan confidence

Test coverage meliputi:
- Authentication flow
- Material CRUD operations
- Menu CRUD with material relationship
- Menu availability logic
- Order processing

## Future Enhancements

- [ ] Report & analytics
- [ ] Multiple payment methods
- [ ] Print receipt
- [ ] Material purchase tracking
- [ ] User role management (cashier vs admin)
- [ ] Order status management (pending, completed, cancelled)
- [ ] Multi-language support

## License

MIT
