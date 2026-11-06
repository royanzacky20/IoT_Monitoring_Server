# 🤖 Setup Telegram Bot - Panduan Lengkap

## ❗ MASALAH: Bot Tidak Kirim Pesan

Jika kamu ketik `ACK` di Telegram tapi tidak dapat balasan, itu karena:

```
[Telegram] Bot Token exists: false
[Telegram] ERROR: TELEGRAM_BOT_TOKEN not configured!
```

**Solusi:** Setup environment variables dengan benar.

---

## 📋 Langkah-langkah Setup

### 1️⃣ Buat Bot Telegram

1. Buka Telegram di HP/Desktop
2. Cari dan chat: **@BotFather**
3. Ketik: `/newbot`
4. BotFather akan tanya nama bot, contoh: `IoT Monitor Bot`
5. BotFather akan tanya username, contoh: `iot_monitor_royan_bot` (harus unik & berakhir dengan `bot`)
6. **SIMPAN TOKEN** yang diberikan BotFather, contoh:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-123456
   ```

### 2️⃣ Dapatkan Chat ID

1. Kirim pesan **random** ke bot yang baru dibuat (cari @iot_monitor_royan_bot di Telegram)
2. Buka browser dan masuk ke URL ini (ganti `<BOT_TOKEN>` dengan token tadi):

   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```

   Contoh:

   ```
   https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-123456/getUpdates
   ```

3. Cari bagian `"chat"` di response JSON, akan ada seperti ini:

   ```json
   {
     "message": {
       "chat": {
         "id": 987654321,
         "first_name": "Royan"
       }
     }
   }
   ```

4. **SIMPAN CHAT ID** (contoh: `987654321`)

### 3️⃣ Update .env.local

File `.env.local` sudah dibuat. Sekarang edit file tersebut:

```bash
# Buka dengan editor
code .env.local
# atau
nano .env.local
```

Ganti nilai-nilai ini:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-123456
TELEGRAM_CHAT_ID=987654321
```

**PENTING:** Ganti dengan token & chat ID kamu yang sebenarnya!

### 4️⃣ Restart Server

Setelah edit `.env.local`, **WAJIB restart server**:

```bash
# Stop server (Ctrl+C di terminal yang jalan)
# Atau kill process
pkill -f "next dev"

# Start ulang
npm run dev
```

### 5️⃣ Test Telegram Bot

Sekarang test lagi:

```bash
# Test dengan curl
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "text": "ACK",
      "chat": {
        "id": 987654321
      }
    }
  }'
```

**Ganti `987654321` dengan Chat ID kamu!**

Sekarang cek terminal, harusnya muncul:

```
[Telegram] Bot Token exists: true  ← HARUS TRUE!
[Telegram] ✓ Message sent successfully!
```

---

## ✅ Verifikasi Setup Berhasil

### Check 1: Environment Variables Loaded

Jalankan ini di terminal project:

```bash
node -e "console.log('Token:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...')"
```

Harusnya muncul token (10 karakter pertama), bukan `undefined`.

### Check 2: Test dengan curl

```bash
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"STATUS","chat":{"id":YOUR_CHAT_ID}}}'
```

Lihat terminal server, harusnya ada log:

```
[Telegram] ✓ Message sent successfully!
```

### Check 3: Test Langsung dari Telegram

1. Buka Telegram
2. Cari bot kamu (@iot_monitor_royan_bot)
3. Ketik: `STATUS`
4. Harusnya bot **langsung balas**!

❌ Jika tidak balas → webhook belum di-set (normal untuk localhost)
✅ Untuk localhost, testing pakai curl saja dulu

---

## 🚀 Setup Webhook (untuk Production)

**SKIP ini jika masih development di localhost!**

Webhook hanya bisa dipakai jika server kamu bisa diakses dari internet (deploy ke Vercel/Railway/dll).

### Menggunakan Ngrok (untuk Testing Lokal)

1. Install ngrok: https://ngrok.com/download

2. Jalankan ngrok:

   ```bash
   ngrok http 3000
   ```

3. Copy URL yang diberikan, contoh: `https://abcd-1234.ngrok.io`

4. Set webhook:

   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://abcd-1234.ngrok.io/api/telegram"}'
   ```

5. Sekarang ketik `ACK` atau `STATUS` di Telegram → bot akan balas!

### Production (Vercel/Railway)

Setelah deploy:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram"}'
```

---

## 🐛 Troubleshooting

### Bot tidak balas di Telegram

**Kemungkinan 1: Webhook belum di-set**

- Localhost tidak bisa pakai webhook
- Test pakai curl dulu
- Atau pakai ngrok

**Kemungkinan 2: Token salah**

- Check `.env.local`
- Restart server
- Test dengan curl

**Kemungkinan 3: Chat ID salah**

- Pastikan Chat ID di webhook request = Chat ID di `.env.local`
- Cek ulang dengan `/getUpdates`

### Error: "404 Not Found"

Berarti token salah atau bot tidak ada.

**Solusi:**

1. Test token dengan:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```
2. Harusnya return info bot
3. Jika 404 → token salah, minta token baru dari @BotFather

### Error: "Chat not found"

Berarti Chat ID salah.

**Solusi:**

1. Pastikan sudah kirim pesan ke bot
2. Cek ulang dengan `/getUpdates`
3. Update Chat ID di `.env.local`
4. Restart server

---

## 📝 Checklist Setup

- [ ] Chat @BotFather dan buat bot baru
- [ ] Simpan Bot Token
- [ ] Kirim pesan ke bot
- [ ] Dapatkan Chat ID dari `/getUpdates`
- [ ] Edit `.env.local` dengan token & chat ID
- [ ] Restart server: `npm run dev`
- [ ] Test dengan curl
- [ ] Lihat log di terminal: `[Telegram] ✓ Message sent successfully!`
- [ ] (Optional) Setup webhook dengan ngrok
- [ ] (Optional) Test langsung di Telegram

---

## 💡 Tips

1. **Jangan commit `.env.local`**
   - Sudah ada di `.gitignore`
   - File ini berisi credentials rahasia

2. **Development vs Production**
   - Development: test pakai curl atau ngrok
   - Production: set webhook ke domain production

3. **Multiple Developers**
   - Setiap developer buat bot sendiri
   - Atau share bot token via secure channel (tidak di Git!)

4. **Debugging**
   - Cek terminal logs untuk detail error
   - Telegram API docs: https://core.telegram.org/bots/api

---

Setelah setup selesai, test dengan:

```bash
# 1. Status check
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"STATUS","chat":{"id":YOUR_CHAT_ID}}}'

# 2. ACK command
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":YOUR_CHAT_ID}}}'
```

Harusnya di terminal muncul:

```
[Telegram] ✓ Message sent successfully!
```

🎉 **Bot siap dipakai!**
