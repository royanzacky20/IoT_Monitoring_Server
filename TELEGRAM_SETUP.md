# IoT Monitoring Server - Telegram Bot Integration

## 📋 Setup Guide

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Buat Bot Telegram

1. Buka Telegram dan cari **@BotFather**
2. Ketik `/newbot`
3. Ikuti instruksi dan simpan **Bot Token**
4. Ketik `/mybots` → pilih bot → Bot Settings → Allow Groups (jika perlu)

### 3️⃣ Dapatkan Chat ID

1. Kirim pesan ke bot kamu
2. Buka browser: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Cari `"chat":{"id":123456789}` dan simpan ID-nya

### 4️⃣ Environment Variables

Buat file `.env.local` di root folder:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Firebase Configuration (sudah ada)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_db_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5️⃣ Setup Webhook (Production)

Setelah deploy ke server/hosting:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram"}'
```

**Untuk Development (Local):**
Gunakan ngrok atau webhook.site untuk testing.

---

## 🚀 Cara Kerja

### 📊 Flow Sistem

```
ESP32 → Send Data → /api/sensor
                          ↓
                    Check Temperature
                          ↓
                    > Threshold?
                    ↙         ↘
                 YES          NO
                  ↓            ↓
            Send Alert    Reset State
                  ↓
            Telegram Bot
                  ↓
            User receives alert
                  ↓
            User ketik: ACK
                  ↓
            /api/telegram
                  ↓
            Stop notifications
```

### 🎯 API Endpoints

#### 1. `/api/sensor` (POST)

**Untuk ESP32 kirim data sensor**

Request:

```json
{
  "temperature": 37.5,
  "humidity": 65,
  "timestamp": "2026-02-04T10:30:00Z"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "temperature": 37.5,
    "humidity": 65,
    "timestamp": "2026-02-04T10:30:00Z",
    "alertSent": true
  }
}
```

#### 2. `/api/telegram` (POST)

**Webhook untuk Telegram Bot**

Otomatis dipanggil oleh Telegram saat user kirim pesan.

#### 3. `/api/sensor` (GET)

**Cek status sistem**

Response:

```json
{
  "ok": true,
  "threshold": 35,
  "alertState": {
    "isAlert": true,
    "isAck": false,
    "temperature": 37.5,
    "lastAlertTime": 1738664400000
  }
}
```

---

## 💬 Perintah Telegram

| Perintah | Deskripsi                         |
| -------- | --------------------------------- |
| `ACK`    | Hentikan notifikasi alert suhu    |
| `STATUS` | Cek status sistem & suhu terakhir |

---

## 🔧 Testing

### Test Sensor Endpoint

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38, "humidity": 60}'
```

### Test Telegram Webhook

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

---

## 📱 Kode ESP32

### Arduino/C++ Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-server.com/api/sensor";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  float temp = readTemperature(); // Your sensor reading function
  float hum = readHumidity();

  sendToServer(temp, hum);
  delay(10000); // Send every 10 seconds
}

void sendToServer(float temperature, float humidity) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;

    String jsonData;
    serializeJson(doc, jsonData);

    // Send POST request
    int httpCode = http.POST(jsonData);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    }

    http.end();
  }
}
```

---

## 🛡️ Fitur Anti-Spam

1. **ACK System**: Alert berhenti setelah user ketik ACK
2. **Time Limit**: Alert tidak dikirim jika baru dikirim < 5 menit
3. **Auto Reset**: State reset saat suhu kembali normal

---

## ⚙️ Konfigurasi

### Ubah Threshold Suhu

Edit [app/api/sensor/route.ts](app/api/sensor/route.ts):

```typescript
const TEMP_THRESHOLD = 35; // Ubah sesuai kebutuhan
```

### Ubah Interval Anti-Spam

Edit [lib/telegram.ts](lib/telegram.ts):

```typescript
if (now - alertState.lastAlertTime < 5 * 60 * 1000) {
  // 5 menit = 5 * 60 * 1000
  // Ubah angka 5 untuk mengubah interval
}
```

---

## 🐛 Troubleshooting

### Bot tidak kirim pesan

1. Cek `TELEGRAM_BOT_TOKEN` di `.env.local`
2. Cek `TELEGRAM_CHAT_ID` sudah benar
3. Pastikan webhook sudah di-set (production)
4. Cek logs di terminal: `npm run dev`

### ESP32 tidak konek

1. Pastikan ESP32 dan server di network yang sama (development)
2. Cek URL endpoint sudah benar
3. Cek WiFi credentials di ESP32
4. Monitor Serial output di Arduino IDE

### Alert terus dikirim

1. Ketik `ACK` di Telegram
2. Cek threshold suhu, mungkin terlalu rendah
3. Restart server: `npm run dev`

---

## 📝 Logs

Server akan print logs untuk tracking:

```
[Sensor] Received data - Temp: 37.5°C, Humidity: 65%
[Alert] Temperature 37.5°C exceeds threshold 35°C
[Telegram] Alert sent - Temperature: 37.5°C
[Telegram] Received message from 123456789: ACK
[Telegram] ACK received from chat 123456789
[Telegram] Alert state reset
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Jangan lupa set environment variables di Vercel dashboard.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Support

Jika ada masalah, cek:

- Console logs (`npm run dev`)
- Firebase console (untuk data storage)
- Telegram Bot API logs
- Network inspector (browser DevTools)
