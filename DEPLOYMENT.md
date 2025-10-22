# Panduan Deploy POS App ke Vercel dengan PostgreSQL

## Masalah yang Diperbaiki
Aplikasi sebelumnya menggunakan SQLite (database file lokal) yang tidak compatible dengan Vercel. Sekarang sudah diupdate untuk menggunakan PostgreSQL yang cloud-based dan compatible dengan Vercel.

## Langkah-langkah Deploy ke Vercel

### 1. Setup Vercel Postgres Database

1. Buka dashboard Vercel: https://vercel.com/dashboard
2. Pilih project POS App Anda
3. Klik tab **Storage**
4. Klik **Create Database**
5. Pilih **Postgres**
6. Beri nama database (misalnya: `pos-database`)
7. Pilih region yang paling dekat dengan target user Anda
8. Klik **Create**

### 2. Connect Database ke Project

Setelah database dibuat, Vercel akan otomatis menambahkan environment variables berikut ke project Anda:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

**PENTING:** Pastikan environment variable `DATABASE_URL` juga ditambahkan:

1. Di dashboard Vercel, buka tab **Settings** > **Environment Variables**
2. Tambahkan variable baru:
   - **Name:** `DATABASE_URL`
   - **Value:** Salin value dari `POSTGRES_PRISMA_URL` (yang sudah auto-generated oleh Vercel)
   - **Environment:** Production, Preview, Development (centang semua)
3. Klik **Save**

### 3. Push Perubahan Code ke Repository

Jalankan command berikut di terminal:

```bash
# Add semua perubahan
git add .

# Commit dengan pesan yang jelas
git commit -m "feat: migrate from SQLite to PostgreSQL for Vercel deployment"

# Push ke repository
git push
```

Vercel akan otomatis trigger deployment baru.

### 4. Initialize Database di Vercel

Setelah deployment selesai, Anda perlu setup database untuk pertama kali:

**Opsi A: Via Vercel CLI (Recommended)**

1. Install Vercel CLI jika belum:
   ```bash
   npm i -g vercel
   ```

2. Login ke Vercel:
   ```bash
   vercel login
   ```

3. Link project Anda:
   ```bash
   vercel link
   ```

4. Pull environment variables:
   ```bash
   vercel env pull .env.production
   ```

5. Setup database (push schema + seed data):
   ```bash
   DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" pnpm db:setup
   ```

**Opsi B: Via Vercel Dashboard (Manual)**

1. Buka tab **Storage** di Vercel dashboard
2. Klik database yang baru dibuat
3. Buka tab **Data** > **Query**
4. Jalankan SQL untuk create tables (lihat bagian SQL Script di bawah)
5. Setelah tables dibuat, gunakan Vercel CLI untuk seed:
   ```bash
   vercel env pull .env.production
   DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" pnpm db:seed
   ```

### 5. Verifikasi Deployment

1. Buka aplikasi di Vercel URL (misal: `https://pos-app-xxx.vercel.app`)
2. Coba login dengan credentials default:
   - **Username:** `admin`
   - **Password:** `admin123`

Alternatif users yang bisa digunakan:
- Username: `superadmin`, Password: `admin123`
- Username: `produksi`, Password: `admin123`
- Username: `kasir`, Password: `admin123`

### 6. Troubleshooting

#### Error: "Internal Server Error" saat login
- Pastikan environment variable `DATABASE_URL` sudah diset di Vercel
- Pastikan database sudah di-initialize (step 4)
- Check logs di Vercel dashboard: **Deployments** > pilih deployment terbaru > **Logs**

#### Error: "Prisma Client not generated"
- Ini sudah ditangani oleh script `postinstall` di package.json
- Jika masih error, check build logs di Vercel

#### Database tidak punya data
- Jalankan seed script seperti di step 4

## Development Lokal dengan PostgreSQL

Jika Anda ingin development lokal juga menggunakan PostgreSQL (tidak wajib, masih bisa pakai SQLite):

1. Install PostgreSQL di komputer Anda
2. Create database baru:
   ```bash
   createdb pos_dev
   ```

3. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/pos_dev?schema=public"
   ```

4. Setup database:
   ```bash
   pnpm db:setup
   ```

## Commands Yang Tersedia

```bash
# Generate Prisma Client
pnpm prisma generate

# Push schema ke database (tanpa migrations)
pnpm db:push

# Seed database dengan data awal
pnpm db:seed

# Setup database lengkap (push + seed)
pnpm db:setup

# Reset database (hapus semua data dan re-seed)
pnpm prisma db push --force-reset && pnpm db:seed
```

## Perubahan yang Dilakukan

1. **prisma/schema.prisma**
   - Changed: `provider = "sqlite"` → `provider = "postgresql"`

2. **package.json**
   - Added: `db:setup` script untuk initialize database

3. **.gitignore**
   - Added: `!.env.example` agar env example bisa di-commit

4. **New files:**
   - `.env.example` - Template untuk environment variables
   - `DEPLOYMENT.md` - Panduan deployment ini

## Data Default

Setelah seeding, database akan berisi:

**Users:**
- superadmin / admin123
- admin / admin123
- produksi / admin123
- kasir / admin123

**Materials:**
- Teh (1000g)
- Gula (2000g)
- Air (10000ml)
- Kopi (500g)
- Susu (3000ml)

**Menu:**
- Es Teh Manis (Rp 5.000)
- Es Kopi Susu (Rp 8.000)

## Security Notes

**PENTING - Untuk Production:**

1. **Ganti password default** segera setelah deploy pertama kali
2. **Jangan share** environment variables atau connection strings
3. **Enable SSL** untuk database connections (sudah enabled by default di Vercel Postgres)
4. Pertimbangkan untuk menambahkan **rate limiting** di login endpoint

## Support

Jika ada masalah:
1. Check Vercel deployment logs
2. Check Vercel Postgres logs di Storage > Query tab
3. Pastikan semua environment variables sudah diset dengan benar
