# 🧪 Testing Guide - Telegram Bot IoT

## ✅ HASIL TESTING

### 1️⃣ Test Alert (Suhu Tinggi)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": false }
```

✅ Alert diset, ACK masih false

---

### 2️⃣ Test ACK Command

```bash
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "text": "ACK",
      "chat": {
        "id": 123456789
      }
    }
  }'
```

**Response:**

```json
{ "ok": true }
```

**Check State:**

```bash
curl http://localhost:3000/api/sensor
```

**Response:**

```json
{
  "ok":true,
  "threshold":35,
  "alertState":{
    "isAlert":true,
    "isAck":true,    ← ✅ ACK berhasil!
    "temperature":38,
    "lastAlertTime":1770176169081
  }
}
```

---

### 3️⃣ Test Anti-Spam (Kirim Alert Lagi)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 40}'
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": true }
```

✅ Alert TIDAK dikirim karena `isAck: true` (anti-spam bekerja!)

---

### 4️⃣ Test Reset (Suhu Normal)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 30}'
```

**Response:**

```json
{ "ok": true, "status": "NORMAL" }
```

**Check State:**

```bash
curl http://localhost:3000/api/sensor
```

**Response:**

```json
{
  "ok":true,
  "threshold":35,
  "alertState":{
    "isAlert":false,  ← ✅ Reset!
    "isAck":false,    ← ✅ Reset!
    "temperature":30,
    "lastAlertTime":1770176169081
  }
}
```

---

## 🔄 FLOW TESTING LENGKAP

```bash
# 1. Kirim suhu tinggi (trigger alert)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'
# Response: {"ok":true,"alert":true,"ack":false}

# 2. Kirim ACK
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":123456789}}}'
# Response: {"ok":true}

# 3. Kirim suhu tinggi lagi (harus tidak kirim alert)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 39}'
# Response: {"ok":true,"alert":true,"ack":true} ← tidak kirim notif

# 4. Kirim suhu normal (reset state)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28}'
# Response: {"ok":true,"status":"NORMAL"}

# 5. Kirim suhu tinggi lagi (harus kirim alert karena sudah reset)
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'
# Response: {"ok":true,"alert":true,"ack":false} ← kirim notif lagi!
```

---

## 📱 Test dengan Telegram Bot Sungguhan

### Setup Environment

1. Copy `.env.local.example` ke `.env.local`
2. Isi dengan Bot Token & Chat ID:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Setup Webhook (untuk Production/Ngrok)

```bash
# Jika pakai ngrok
ngrok http 3000

# Set webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/api/telegram"}'
```

### Test Real Bot

1. Kirim suhu tinggi dari ESP32 atau curl
2. Bot akan kirim pesan ke Telegram
3. Ketik `ACK` di Telegram
4. Bot akan balas: "✅ ACK diterima..."
5. Kirim suhu tinggi lagi → tidak ada notif (anti-spam bekerja!)

---

## 🐛 Troubleshooting

### Error: "Failed to send Telegram message: 404"

**Penyebab:** `TELEGRAM_BOT_TOKEN` atau `TELEGRAM_CHAT_ID` belum di-set

**Solusi:**

1. Check `.env.local` sudah ada
2. Restart server: `npm run dev`

### Alert terus dikirim padahal sudah ACK

**Penyebab:** State tidak tersimpan (server restart)

**Solusi:**

1. Check state dengan: `curl http://localhost:3000/api/sensor`
2. Kirim ACK lagi
3. Untuk production, simpan state ke database/Redis

### Bot tidak respond di Telegram

**Penyebab:** Webhook belum di-set atau salah

**Solusi:**

```bash
# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# Delete webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"

# Set webhook baru
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://your-url.com/api/telegram"
```

---

## 📊 Status Codes

| Code | Meaning      | Action           |
| ---- | ------------ | ---------------- |
| 200  | OK           | Request berhasil |
| 400  | Bad Request  | Data tidak valid |
| 404  | Not Found    | Bot token salah  |
| 500  | Server Error | Check logs       |

---

## 🎯 Next Steps

1. ✅ Testing manual → **DONE**
2. ⏳ Setup environment variables dengan bot token real
3. ⏳ Setup ngrok untuk development webhook
4. ⏳ Test dengan ESP32 hardware
5. ⏳ Deploy ke production (Vercel/Railway/etc)

---

## 💡 Tips

- Gunakan `STATUS` command untuk check state real-time
- ACK command case-insensitive (ACK/ack/Ack semua sama)
- Interval anti-spam default: 5 menit (bisa diubah di `ALERT_INTERVAL`)
- Threshold suhu default: 35°C (bisa diubah di `TEMP_THRESHOLD`)
