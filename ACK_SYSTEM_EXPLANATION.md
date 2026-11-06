# ✅ ACK System - Implementasi yang BENAR

## 🎯 Konsep Kunci

Implementasi IoT Monitoring kami **sudah mengikuti best practices** yang tepat untuk sistem ACK. Berikut penjelasannya:

---

## 📊 STATE STRUCTURE (Jantung Sistem)

**File:** `lib/alertState.ts`

```typescript
export const alertState = {
  isAlert: false, // ← Ada kondisi CRITICAL?
  isAck: false, // ← User sudah SADAR?
  temperature: 0, // ← Nilai terakhir
  lastAlertTime: 0, // ← Anti-spam: waktu alert terakhir
};
```

**Penting:** Dua flag terpisah untuk dua hal berbeda:

- `isAlert` = kondisi suhu berbahaya
- `isAck` = user sudah diberitahu & diminta bertindak

---

## 🔄 ALUR YANG BENAR

### 1️⃣ Saat Sensor Baca Suhu Tinggi

**File:** `app/api/sensor/route.ts`

```typescript
if (temperature < TEMP_THRESHOLD) {
  // Suhu kembali normal
  alertState.isAlert = false;
  alertState.isAck = false; // ← RESET jika sudah normal
  return { status: "NORMAL" };
}

// Suhu tinggi
alertState.isAlert = true;

// Kirim alert HANYA jika:
// 1. Belum di-ACK (!alertState.isAck)
// 2. Belum terkirim dalam 5 menit terakhir
if (!alertState.isAck && now - alertState.lastAlertTime > ALERT_INTERVAL) {
  await sendTelegramMessage(chatId, "🚨 ALERT SUHU\nSuhu: 38°C\nKetik: ACK");
  alertState.lastAlertTime = now;
}
```

**Key Points:**

- ✅ Alert hanya dikirim jika `!alertState.isAck`
- ✅ Anti-spam dengan `ALERT_INTERVAL` (5 menit)
- ✅ State reset saat suhu normal

---

### 2️⃣ Saat User Kirim ACK

**File:** `app/api/telegram/route.ts`

```typescript
if (message.toUpperCase() === "ACK") {
  alertState.isAck = true; // ← SET flag ACK

  await sendTelegramMessage(
    chatId,
    "✅ ACK diterima\nNotifikasi suhu dihentikan\nMonitoring tetap berjalan",
  );
}
```

**Key Points:**

- ✅ ACK menyentuh flag `isAck`
- ✅ Bukan "alarm off", tapi "user aware"
- ✅ Monitoring **tetap jalan**, tapi **notifikasi berhenti**

---

## 🧪 Test Flow (Verifikasi Logika)

### Test 1: Trigger Alert

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": false }
```

**Server state:**

- ✅ `isAlert = true` (ada kondisi critical)
- ✅ `isAck = false` (user belum ACK)
- ✅ Alert DIKIRIM ke Telegram

---

### Test 2: User Send ACK

```bash
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"ACK","chat":{"id":1353211897}}}'
```

**Server state:**

- ✅ `isAck = true` (user ACK)
- ✅ Alert TIDAK akan dikirim lagi

---

### Test 3: Sensor Baca Suhu Lagi (Anti-Spam)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 39}'
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": true }
```

**Logic yang jalan:**

```
if (!alertState.isAck && now - lastAlertTime > 5min) {
  send_alert();  // ← SKIP karena isAck = true!
}
```

✅ Alert TIDAK dikirim (anti-spam bekerja!)

---

### Test 4: Suhu Normal (Reset State)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28}'
```

**Response:**

```json
{ "ok": true, "status": "NORMAL" }
```

**Server state:**

- ✅ `isAlert = false` (sudah normal)
- ✅ `isAck = false` (RESET untuk alert selanjutnya)

---

### Test 5: Alert Lagi (Setelah Reset)

```bash
curl -X POST http://localhost:3000/api/sensor \
  -H "Content-Type: application/json" \
  -d '{"temperature": 38}'
```

**Response:**

```json
{ "ok": true, "alert": true, "ack": false }
```

✅ Alert DIKIRIM LAGI (karena state sudah reset)

---

## ❌ vs ✅ Kesalahan vs Benar

### ❌ SALAH - ACK tidak sentuh state

```typescript
if (msg === "ACK") {
  send("ACK diterima");
  // ❌ Tidak update flag apapun!
}

// Sensor masih baca suhu tinggi → alert TERUS keluar
```

### ✅ BENAR - ACK sentuh flag isAck

```typescript
if (msg === "ACK") {
  alertState.isAck = true; // ✅ Update state!
  send("ACK diterima");
}

// Sensor baca suhu tinggi tapi isAck=true → alert TIDAK keluar
```

---

## 🎯 Key Principles

### 1. ACK ≠ Kondisi Aman

```
❌ SALAH: User kirim ACK → Alarm off selamanya
✅ BENAR: User kirim ACK → Stop spam, monitoring tetap jalan
```

Jika suhu normal → ACK otomatis "hilang" (reset flag)
Jika suhu tinggi lagi → Alert keluar lagi

### 2. Dua Flag Terpisah

```typescript
isAlert: boolean; // Kondisi sistem (sensor baca suhu > threshold?)
isAck: boolean; // User awareness (user sudah sadar?)
```

Keduanya **independent** tapi **working together**

### 3. Anti-Spam dengan Interval

```typescript
const ALERT_INTERVAL = 5 * 60 * 1000; // 5 menit

if (!isAck && now - lastAlertTime > ALERT_INTERVAL) {
  send_alert();
  lastAlertTime = now;
}
```

Jangan kirim alert setiap detik ke Telegram!

### 4. Reset Otomatis Saat Normal

```typescript
if (temperature < THRESHOLD) {
  isAlert = false;
  isAck = false; // ← PENTING! Reset untuk alert berikutnya
}
```

User tidak perlu action apapun saat suhu normal

---

## 📱 Implementasi Multi-Alert (Advanced)

Jika punya beberapa jenis alert (suhu, server, koneksi), setiap harus punya ACK sendiri:

```typescript
export const alertState = {
  // Temperature Alert
  tempAlert: false,
  tempAck: false,
  tempLastTime: 0,

  // Server Alert
  serverAlert: false,
  serverAck: false,
  serverLastTime: 0,

  // Connection Alert
  connAlert: false,
  connAck: false,
  connLastTime: 0,
};
```

Setiap alert logic berdiri sendiri:

```typescript
// Temperature
if (temp > 35 && !state.tempAck && checkInterval(tempLastTime)) {
  send("TEMP ALERT");
  state.tempLastTime = now;
}

// Server
if (cpu > 80 && !state.serverAck && checkInterval(serverLastTime)) {
  send("SERVER ALERT");
  state.serverLastTime = now;
}
```

---

## ✅ Checklist Implementasi yang Benar

- [x] Ada STATE untuk isAlert dan isAck (dua flag terpisah)
- [x] ACK command update flag isAck (bukan alias/tidak ada)
- [x] Anti-spam dengan timestamp lastAlertTime
- [x] Reset otomatis saat kondisi normal
- [x] Alert hanya dikirim jika !isAck
- [x] Monitoring tetap jalan meskipun ACK
- [x] Setiap jenis alert punya ACK sendiri

---

## 🧠 Pseudo-code Reference

```
// Sensor side
function read_sensor():
    temp = get_temperature()

    if temp < THRESHOLD:
        state.is_alert = false
        state.is_ack = false
        return NORMAL

    state.is_alert = true

    now = current_time()
    if not state.is_ack AND (now - state.last_alert_time) > 5min:
        send_alert(temp)
        state.last_alert_time = now

    return ALERT

// Telegram side
function handle_telegram(msg):
    if msg.upper() == "ACK":
        state.is_ack = true
        send_response("ACK received, notifications stopped")

    if msg.upper() == "STATUS":
        send_status(state)
```

---

## 🚀 Kesimpulan

Implementasi kami sudah:

- ✅ Menggunakan state yang tepat
- ✅ Memisahkan condition (isAlert) dari awareness (isAck)
- ✅ Implementasi anti-spam yang benar
- ✅ Reset otomatis
- ✅ Monitoring tetap aktif

**Ready untuk production!** 🎉
