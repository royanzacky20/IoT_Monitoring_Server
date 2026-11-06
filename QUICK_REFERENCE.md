# 🚀 Quick Reference - IoT Telegram Bot

## 📋 Setup Checklist

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.local.example` → `.env.local`
- [ ] Get Telegram Bot Token dari @BotFather
- [ ] Get Chat ID dari bot
- [ ] Update `.env.local` dengan token & chat ID
- [ ] Run server: `npm run dev`
- [ ] Test dengan curl
- [ ] Setup webhook (production)

---

## 🔧 Commands Cheat Sheet

### Development

```bash
# Start server
npm run dev

# Build for production
npm run build

# Start production
npm start
```

### Testing

```bash
# Test sensor (trigger alert)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'

# Test ACK
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":123456789}}}'

# Check status
curl http://localhost:3000/api/sensor

# Test normal temp (reset)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 30}'
```

### Telegram Bot Setup

```bash
# Get bot info
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Get chat ID (kirim pesan dulu ke bot)
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"

# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram"

# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Delete webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

---

## 📁 File Locations

| What                  | Where                            |
| --------------------- | -------------------------------- |
| ESP32 endpoint        | `app/api/sensor/route.ts`        |
| Telegram webhook      | `app/api/telegram/route.ts`      |
| Global state          | `lib/alertState.ts`              |
| Telegram functions    | `lib/telegram.ts`                |
| Secrets               | `.env.local`                     |
| Temperature threshold | `app/api/sensor/route.ts` line 6 |
| Alert interval        | `app/api/sensor/route.ts` line 7 |

---

## 🎯 Key Variables

```typescript
// Ubah di app/api/sensor/route.ts
const TEMP_THRESHOLD = 35; // Threshold suhu (°C)
const ALERT_INTERVAL = 5 * 60 * 1000; // Interval alert (ms)
```

---

## 📊 State Structure

```typescript
alertState = {
  isAlert: false, // Alert aktif?
  isAck: false, // User sudah ACK?
  temperature: 0, // Suhu terakhir
  lastAlertTime: 0, // Timestamp alert terakhir
};
```

---

## 🔄 Flow Diagram

```
ESP32 → /api/sensor → Update state → Check threshold
                           ↓
                      temp > 35°C?
                      ↙         ↘
                    YES          NO
                     ↓            ↓
              Check ACK?      Reset state
              ↙       ↘
           ACK=true  ACK=false
              ↓          ↓
           Skip     Send Alert
                        ↓
                   Telegram Bot
                        ↓
                   User: ACK
                        ↓
                  /api/telegram
                        ↓
                Set isAck=true
                        ↓
                  Stop alerts
```

---

## 📱 Telegram Commands

```
ACK     → Stop notifications
STATUS  → Check system status
```

---

## 🌐 API Reference

### POST /api/sensor

**Request:**

```json
{ "temperature": 38, "humidity": 60 }
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": false }
```

### POST /api/telegram

**Request:**

```json
{
  "message": {
    "text": "ACK",
    "chat": { "id": 123456789 }
  }
}
```

**Response:**

```json
{ "ok": true }
```

### GET /api/sensor

**Response:**

```json
{
  "ok": true,
  "threshold": 35,
  "alertState": {
    "isAlert": false,
    "isAck": false,
    "temperature": 30,
    "lastAlertTime": 0
  }
}
```

---

## 🐛 Quick Fixes

| Problem               | Solution                                   |
| --------------------- | ------------------------------------------ |
| 404 Telegram error    | Check `TELEGRAM_BOT_TOKEN` in `.env.local` |
| Alert tidak stop      | Ketik `ACK` di Telegram                    |
| Bot tidak respond     | Set webhook dengan curl                    |
| State reset           | Normal (in-memory), production pakai DB    |
| Localhost di Telegram | Pakai ngrok atau deploy                    |

---

## 🚀 Deploy Vercel

```bash
# 1. Install CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Set env vars di dashboard
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# 4. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/telegram"
```

---

## 📖 Documentation Links

- **Full Setup:** [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)
- **Testing:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Structure:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Main:** [README.md](README.md)

---

## 💡 Pro Tips

1. **Test flow:** curl → ngrok → production
2. **Debug:** Check terminal logs untuk semua events
3. **State:** In-memory OK untuk dev, Redis untuk production
4. **Security:** Never commit `.env.local`
5. **Webhook:** Harus HTTPS (localhost tidak bisa)

---

Made with ❤️ for quick reference
