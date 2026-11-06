# 🌡️ IoT Monitoring Dashboard with Telegram Bot

Real-time IoT monitoring system dengan Telegram bot integration untuk alert suhu. Sistem ini menerima data dari ESP32, menampilkan dashboard web, dan mengirim alert ke Telegram dengan fitur ACK anti-spam.

## ✨ Features

- 🌡️ **Real-time Monitoring** - Dashboard web dengan Chart.js
- 📱 **Telegram Alerts** - Auto-alert saat suhu tinggi
- ✅ **ACK System** - Stop notifikasi dengan command ACK
- 🔥 **Anti-Spam** - Max 1 alert per 5 menit
- 🔄 **Auto-Reset** - State reset saat suhu normal
- 📊 **Status Command** - Check sistem via Telegram
- 🔐 **Firebase Integration** - Data persistence

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.local.example` ke `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan Bot Token & Chat ID:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Test API

```bash
# Test sensor endpoint
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'

# Test ACK command
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":123456789}}}'
```

## 📚 Documentation

- **[TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)** - Cara setup Telegram bot dari awal
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing scenarios lengkap dengan hasil
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Penjelasan struktur project & cara kerja

## 🏗️ Project Structure

```
iot-dashboard/
├── app/
│   ├── api/
│   │   ├── sensor/route.ts      ← ESP32 kirim data kesini
│   │   └── telegram/route.ts    ← Telegram webhook
│   ├── layout.tsx
│   └── page.tsx                 ← Dashboard web
├── lib/
│   ├── alertState.ts            ← Global state (jantung sistem)
│   ├── telegram.ts              ← Fungsi kirim Telegram
│   └── firebase.ts              ← Firebase config
└── .env.local                   ← Bot credentials (secret!)
```

## 🔧 Configuration

### Temperature Threshold

Edit `app/api/sensor/route.ts`:

```typescript
const TEMP_THRESHOLD = 35; // Default: 35°C
```

### Alert Interval (Anti-Spam)

Edit `app/api/sensor/route.ts`:

```typescript
const ALERT_INTERVAL = 5 * 60 * 1000; // Default: 5 menit
```

## 📱 Telegram Commands

| Command  | Description                       |
| -------- | --------------------------------- |
| `ACK`    | Stop alert notifications          |
| `STATUS` | Check system status & temperature |

## 🌐 API Endpoints

### POST `/api/sensor`

Receive sensor data from ESP32

**Request:**

```json
{
  "temperature": 38,
  "humidity": 60
}
```

**Response:**

```json
{
  "ok": true,
  "alert": true,
  "ack": false
}
```

### POST `/api/telegram`

Telegram webhook for bot commands

**Request:**

```json
{
  "message": {
    "text": "ACK",
    "chat": { "id": 123456789 }
  }
}
```

### GET `/api/sensor`

Get current system status

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
  }
}
```

## 🔄 How It Works

```
┌─────────┐      POST /api/sensor      ┌─────────┐
│  ESP32  │ ────────────────────────────> │ Server  │
└─────────┘     {"temperature": 38}      └─────────┘
                                              │
                                              │ temp > 35°C?
                                              ▼
                                         ┌─────────┐
                                         │Telegram │
                                         │  Alert  │
                                         └─────────┘
                                              │
                                              │ User ketik: ACK
                                              ▼
                                         ┌─────────┐
                                         │ Server  │
                                         │ set ACK │
                                         └─────────┘
                                              │
                                              │ Stop alerts
                                              ▼
                                         (Anti-Spam Active)
```

## 🧪 Testing

Lihat [TESTING_GUIDE.md](TESTING_GUIDE.md) untuk test scenarios lengkap.

**Quick Test:**

```bash
# 1. Trigger alert
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'

# 2. Send ACK
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":123456789}}}'

# 3. Check status
curl http://localhost:3000/api/sensor
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Set Environment Variables di Vercel Dashboard:**

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- Firebase credentials (jika pakai)

**Set Telegram Webhook:**

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/telegram"
```

## 🔐 Security

- ✅ Never commit `.env.local`
- ✅ Validate chat ID di webhook
- ✅ Use HTTPS untuk production
- ✅ Rate limiting (coming soon)

## 🐛 Troubleshooting

### Error: "Failed to send Telegram message: 404"

- Check `TELEGRAM_BOT_TOKEN` di `.env.local`
- Restart server: `npm run dev`

### Alert terus dikirim

- State in-memory (reset saat server restart)
- Ketik `ACK` di Telegram
- Production: gunakan Redis/Firebase

### Bot tidak respond

- Check webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Set webhook ulang (lihat Deployment section)

## 📖 Tech Stack

- **[Next.js 16](https://nextjs.org)** - React framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Chart.js](https://www.chartjs.org/)** - Data visualization
- **[Firebase](https://firebase.google.com/)** - Database
- **[Telegram Bot API](https://core.telegram.org/bots/api)** - Bot integration

## 🤝 Contributing

Contributions welcome! Please read docs dulu:

1. Fork the project
2. Create feature branch
3. Test thoroughly
4. Submit PR

## 📄 License

MIT License - feel free to use for your projects!

## 💬 Support

Baca dokumentasi lengkap di:

- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

Made with ❤️ for IoT monitoring
