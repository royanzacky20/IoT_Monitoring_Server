# 📚 Project Structure - IoT Telegram Bot

## 📂 File Structure

```
iot-dashboard/
├── app/
│   ├── api/
│   │   ├── sensor/
│   │   │   └── route.ts          ← 🌡️ ESP32 kirim data KESINI
│   │   └── telegram/
│   │       └── route.ts          ← 💬 Telegram ACK masuk KESINI
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   ├── alertState.ts             ← 🧠 STATE GLOBAL (jantung sistem)
│   ├── telegram.ts               ← 📨 Fungsi kirim pesan Telegram
│   └── firebase.ts               ← 🔥 Firebase config
│
├── .env.local                    ← 🔐 Bot Token & Chat ID (RAHASIA!)
└── package.json
```

---

## 🎯 CARA KERJA (SIMPLE!)

### 1️⃣ ESP32 → Server

```
ESP32 kirim: POST /api/sensor
{
  "temperature": 38
}
```

### 2️⃣ Server → Telegram

```
Server cek: temp > 35°C?
Jika YA → kirim alert ke Telegram
```

### 3️⃣ User → Telegram → Server

```
User ketik: ACK
Telegram kirim ke: POST /api/telegram
Server set: alertState.isAck = true
```

### 4️⃣ Anti-Spam Aktif

```
ESP32 kirim temp 38°C lagi
Server cek: isAck === true?
Jika YA → SKIP kirim alert ✅
```

---

## 🧠 Global State (lib/alertState.ts)

```typescript
export const alertState = {
  isAlert: false, // Ada alert aktif?
  isAck: false, // User sudah ACK?
  temperature: 0, // Suhu terakhir
  lastAlertTime: 0, // Waktu alert terakhir dikirim
};
```

**Shared by:**

- ✅ Sensor API (update temperature, trigger alert)
- ✅ Telegram API (set ACK status)
- ✅ Web Dashboard (tampilkan status)

---

## 📨 Telegram Functions (lib/telegram.ts)

```typescript
// Kirim pesan ke Telegram
sendTelegramMessage(chatId, text);
```

**Usage:**

```typescript
await sendTelegramMessage(123456789, "🚨 ALERT SUHU\nSuhu: 38°C");
```

---

## 🌡️ Sensor API (app/api/sensor/route.ts)

### POST /api/sensor

**Request:**

```json
{
  "temperature": 38
}
```

**Logic:**

1. Update `alertState.temperature`
2. Jika temp < 35°C → reset state
3. Jika temp ≥ 35°C:
   - Set `alertState.isAlert = true`
   - Jika `!isAck` dan `> 5 menit` → kirim alert
   - Update `lastAlertTime`

**Response:**

```json
{
  "ok": true,
  "alert": true,
  "ack": false
}
```

### GET /api/sensor

**Response:**

```json
{
  "ok": true,
  "threshold": 35,
  "alertState": {
    "isAlert": true,
    "isAck": false,
    "temperature": 38,
    "lastAlertTime": 1770176169081
  },
  "timestamp": "2026-02-04T03:36:26.413Z"
}
```

---

## 💬 Telegram API (app/api/telegram/route.ts)

### POST /api/telegram

**Request (dari Telegram):**

```json
{
  "message": {
    "text": "ACK",
    "chat": {
      "id": 123456789
    }
  }
}
```

**Logic:**

#### ACK Command

```typescript
if (message === "ACK") {
  alertState.isAck = true;
  // Kirim konfirmasi
}
```

#### STATUS Command

```typescript
if (message === "STATUS") {
  // Kirim info sistem
}
```

**Response:**

```json
{
  "ok": true
}
```

---

## 🔐 Environment Variables (.env.local)

```env
# Required untuk production
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Optional (jika pakai Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
```

**Cara dapat:**

1. **BOT_TOKEN**: Chat @BotFather di Telegram → `/newbot`
2. **CHAT_ID**: Kirim pesan ke bot → buka:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   Cari `"chat":{"id":123456789}`

---

## 🚀 Development Workflow

### 1. Start Server

```bash
npm run dev
```

### 2. Test dengan curl

```bash
# Test sensor
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'

# Test ACK
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":123456789}}}'

# Check status
curl http://localhost:3000/api/sensor
```

### 3. Debug

Check terminal logs untuk:

- Request masuk
- State changes
- Telegram messages sent/failed

---

## 📱 Production Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables di Vercel dashboard
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/telegram"
```

---

## 🔧 Konfigurasi

### Ubah Threshold Suhu

File: `app/api/sensor/route.ts`

```typescript
const TEMP_THRESHOLD = 35; // Ubah angka ini
```

### Ubah Interval Anti-Spam

File: `app/api/sensor/route.ts`

```typescript
const ALERT_INTERVAL = 5 * 60 * 1000; // 5 menit
// Contoh: 10 menit = 10 * 60 * 1000
```

---

## 🐛 Common Issues

### "Failed to send Telegram message: 404"

- ❌ Token salah atau belum di-set
- ✅ Check `.env.local` dan restart server

### Alert tidak berhenti

- ❌ State tidak persistent (in-memory)
- ✅ Normal untuk development, production pakai Redis/DB

### Webhook tidak bekerja

- ❌ URL webhook salah atau localhost (tidak bisa diakses Telegram)
- ✅ Pakai ngrok untuk dev atau deploy ke production

---

## 💡 Best Practices

1. **Never commit `.env.local`**
   - Add to `.gitignore`
   - Use `.env.local.example` as template

2. **Testing flow:**
   - Manual curl → Ngrok → Production
   - Test ACK sebelum test ESP32
   - Check logs setiap test

3. **State management:**
   - In-memory OK untuk development
   - Production: Redis, Firebase, atau Supabase

4. **Security:**
   - Validate chat ID di webhook
   - Rate limiting untuk API
   - HTTPS only untuk production

---

## 📖 Read More

- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) - Setup guide lengkap
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing scenarios
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
