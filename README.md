# 🙏 PrayWith.me — Anonymous Prayer Wall

PrayWith.me is a peaceful, quiet, spiritually warm, and emotionally safe anonymous prayer-sharing web application. The platform provides a digital candle wall experience where guests can post prayer requests, read others' open requests, and stand in quiet solidarity by lighting a candle of prayer.

The application utilizes a **Dual Back-end Architecture**, meaning it is fully operational immediately out-of-the-box using an active local file database fallback, and switches dynamically to connection-grade **Supabase** once the corresponding keys are provided in the environment secrets.

---

## 🎨 Design System & Colors
The visual atmosphere matches a quiet spiritual sanctuary, centering on deep spacing, responsive bento grid structure, and deliberate, readable typography.

- **Warm White (`#FAF8F5`)**: General page canvas background
- **Soft Beige (`#F0EBE1`)**: Card layers, secondary inputs
- **Warm Tan (`#C4A882`)**: Elegant divider lines and highlights
- **Soft Rose (`#D4537E`)**: Pulse action hearts, interactive state highlights
- **Gentle Gold (`#B8976A`)**: Category select capsules and highlights
- **Warm Charcoal (`#3D3530`)**: Humanized readable text

### ✍️ Typography Pairings
- **Cormorant Garamond (Italic, High display weights)**: Set on the focal prayer cards for an elegant, meditative feeling.
- **Nunito (Sans-Serif)**: Clean, balanced, modern UI text for actions, indicators, and details.

---

## 🗄️ Database Table Schema (Supabase)

To connect Supabase, execute the setup script in `/supabase-migration.sql` in the **Supabase SQL Editor** panel. It creates the tables, indices, and public storage buckets:

### `prayers`
- `id` (`uuid` primary key default `gen_random_uuid()`)
- `text` (`text` not null, max 280 characters)
- `category` (`text` check restrictions to: `Healing | Family | Peace | Gratitude | Protection | Other`)
- `image_url` (`text` nullable, storage path fallback)
- `heart_count` (`integer` default `0`)
- `status` (`text` default `'visible'`, restricted to: `visible | hidden | pending`)
- `ip_hash` (`text` unidirectional SHA-256 IP token for protection)
- `created_at` (`timestamptz` default `now()`)

### `hearts`
- `id` (`uuid` primary key)
- `prayer_id` (`uuid` references `prayers.id` cascade)
- `ip_hash` (`text`)
- `created_at` (`timestamptz`)
- **Constraint**: `UNIQUE(prayer_id, ip_hash)` ensures guests can only stand in solidarity once per request.

### `comments`
- `id` (`uuid` primary key)
- `prayer_id` (`uuid` references `prayers.id` cascade)
- `text` (`text` not null, max 200 characters)
- `ip_hash` (`text`)
- `created_at` (`timestamptz`)

### `reports`
- `id` (`uuid` primary key)
- `prayer_id` (`uuid` references `prayers.id` cascade)
- `reason` (`text` reason selection)
- `created_at` (`timestamptz`)

### 📦 Supabase Storage Bucket
- **Bucket ID**: `prayer-images` (public, max 3MB, `JPG`/`PNG`/`WebP` restrictions).

---

## 🛡️ Anti-Spam & Privacy Moderation
- **Strict IP Anonymization**: All incoming connections are salted and hashed using **unidirectional SHA-256** checks before verification. Raw IPs are never written to any disc or database.
- **Rate Limiting**: Users are strictly limited to submitting up to **3 prayer requests per hour** based on their IP hash.
- **Administrative Moderation**: Admin boards in `/admin` are protected by a password portal where admins can filter flagged items (with 3+ reports) and run Hide or Delete moderators on the spot.

---

## ⚙️ Environment Variables Setup

Configure the following secrets in the Secrets/Settings panel or your `.env` file:

```env
# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# Sanctuary Admin Password
ADMIN_PASSWORD="peace"
```

---

## 🚀 Execution & Command Reference

### 1. Install Workspace Libraries
```bash
npm install
```

### 2. Enter Development Server (Port 3000)
```bash
npm run dev
```

### 3. Run Linter check
```bash
npm run lint
```

### 4. Execute Programmatic Test Suite
This executes standard edge case testing on relative dates, IP hashes, and rate regulators.
```bash
npm run test
```

### 5. Build for Production Server Injection
```bash
npm run build
```
This command compiles both standard Vite SPA client assets and esbuilds the custom backend into `/dist/server.cjs` for high performance.
