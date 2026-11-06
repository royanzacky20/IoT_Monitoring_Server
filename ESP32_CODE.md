# 🔌 ESP32 Code Example

## 📋 Arduino Libraries Required

```
- WiFi.h (built-in)
- HTTPClient.h (built-in)
- ArduinoJson (install via Library Manager)
- DHT sensor library (optional, untuk sensor DHT22)
```

---

## 💻 Complete ESP32 Code

### 1️⃣ Basic Version (Hardcoded Temperature)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL (ganti dengan URL server kamu)
const char* serverUrl = "http://192.168.1.100:3000/api/sensor";
// Untuk production: "https://your-app.vercel.app/api/sensor"

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Simulate temperature reading
  float temperature = random(25, 40); // Random 25-40°C

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println("°C");

  // Send to server
  sendToServer(temperature, 0);

  // Wait 10 seconds
  delay(10000);
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
    Serial.println("Sending data to server...");
    Serial.println(jsonData);

    int httpCode = http.POST(jsonData);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.print("Response code: ");
      Serial.println(httpCode);
      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Error: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("WiFi not connected!");
  }
}
```

---

### 2️⃣ With DHT22 Sensor

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL
const char* serverUrl = "http://192.168.1.100:3000/api/sensor";

// DHT Sensor
#define DHTPIN 4          // Pin DHT22 (GPIO4)
#define DHTTYPE DHT22     // DHT22 (AM2302)
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);

  // Initialize DHT sensor
  dht.begin();

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Read sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Check if reading failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C | Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  // Send to server
  sendToServer(temperature, humidity);

  // Wait 10 seconds
  delay(10000);
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
    doc["timestamp"] = millis();

    String jsonData;
    serializeJson(doc, jsonData);

    // Send POST request
    Serial.println("Sending: " + jsonData);

    int httpCode = http.POST(jsonData);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("✓ Response: " + response);

      // Parse response (optional)
      StaticJsonDocument<200> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error) {
        bool alert = responseDoc["alert"];
        bool ack = responseDoc["ack"];

        if (alert && !ack) {
          Serial.println("⚠️ ALERT sent to Telegram!");
        } else if (alert && ack) {
          Serial.println("✓ Alert acknowledged");
        } else {
          Serial.println("✓ Normal temperature");
        }
      }
    } else {
      Serial.println("✗ HTTP Error: " + String(httpCode));
    }

    http.end();
  } else {
    Serial.println("✗ WiFi not connected!");
    // Try to reconnect
    WiFi.begin(ssid, password);
  }
}
```

---

### 3️⃣ Production Version (with Error Handling & Retry)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-app.vercel.app/api/sensor";

// DHT Sensor
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Settings
const int SEND_INTERVAL = 10000;    // 10 seconds
const int MAX_RETRIES = 3;
const int WIFI_TIMEOUT = 20000;     // 20 seconds

// State
unsigned long lastSendTime = 0;
int failedAttempts = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n🌡️ IoT Temperature Monitor");
  Serial.println("==========================");

  // Initialize sensor
  dht.begin();

  // Connect to WiFi
  connectWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }

  // Send data at interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();

    // Read sensor
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // Validate readings
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("✗ Sensor read failed!");
      return;
    }

    // Send to server
    bool success = sendToServer(temperature, humidity);

    if (success) {
      failedAttempts = 0;
    } else {
      failedAttempts++;

      if (failedAttempts >= MAX_RETRIES) {
        Serial.println("⚠️ Max retries reached! Restarting...");
        ESP.restart();
      }
    }
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_TIMEOUT) {
      Serial.println("\n✗ WiFi timeout! Restarting...");
      ESP.restart();
    }

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("✓ WiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("RSSI: ");
  Serial.println(WiFi.RSSI());
}

bool sendToServer(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected!");
    return false;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout

  // Create JSON
  StaticJsonDocument<256> doc;
  doc["temperature"] = round(temperature * 100) / 100.0; // 2 decimal
  doc["humidity"] = round(humidity * 100) / 100.0;
  doc["timestamp"] = millis();
  doc["deviceId"] = WiFi.macAddress();

  String jsonData;
  serializeJson(doc, jsonData);

  // Send
  Serial.println("\n📤 Sending: " + jsonData);

  int httpCode = http.POST(jsonData);

  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✓ Success: " + response);

    // Parse response
    StaticJsonDocument<256> resDoc;
    if (deserializeJson(resDoc, response) == DeserializationError::Ok) {
      if (resDoc["alert"] == true && resDoc["ack"] == false) {
        Serial.println("🚨 TELEGRAM ALERT SENT!");
      }
    }

    http.end();
    return true;
  } else {
    Serial.print("✗ HTTP Error: ");
    Serial.println(httpCode);
    http.end();
    return false;
  }
}
```

---

## 🔌 Wiring Diagram

### DHT22 Sensor

```
DHT22          ESP32
-----          -----
VCC   ───────  3.3V
DATA  ───────  GPIO4
GND   ───────  GND

Note: Tambahkan resistor 10kΩ antara VCC dan DATA (pull-up)
```

---

## 📝 Upload Instructions

1. **Install Arduino IDE**
   - Download dari: https://www.arduino.cc/en/software

2. **Install ESP32 Board**
   - File → Preferences → Additional Board URLs:

   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. **Install Libraries**
   - Sketch → Include Library → Manage Libraries
   - Install: ArduinoJson, DHT sensor library

4. **Configure**
   - Tools → Board → ESP32 Dev Module
   - Tools → Port → Select COM port
   - Edit WiFi credentials & server URL di code

5. **Upload**
   - Click Upload button
   - Monitor: Tools → Serial Monitor (115200 baud)

---

## 🧪 Testing

### Test dengan Server Lokal

1. Cari IP komputer kamu:

   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Update ESP32 code:

   ```cpp
   const char* serverUrl = "http://192.168.1.100:3000/api/sensor";
   ```

3. Pastikan ESP32 dan komputer di WiFi yang sama

### Test tanpa Sensor

Ganti `dht.readTemperature()` dengan:

```cpp
float temperature = random(25, 40);  // Random 25-40°C
float humidity = random(40, 80);     // Random 40-80%
```

---

## 🐛 Troubleshooting

### WiFi tidak connect

- Check SSID & password
- ESP32 dan router di 2.4GHz (bukan 5GHz)
- Jarak terlalu jauh dari router

### Sensor error

- Check wiring
- Tambah pull-up resistor 10kΩ
- Ganti sensor jika rusak

### HTTP Error -1

- Server URL salah
- Server tidak running
- Firewall blocking

### HTTP Error 404

- Endpoint salah (harus `/api/sensor`)
- Server belum deploy route

---

## 📊 Serial Monitor Output Example

```
🌡️ IoT Temperature Monitor
==========================
Connecting to WiFi.........
✓ WiFi Connected!
IP: 192.168.1.150
RSSI: -45

📤 Sending: {"temperature":28.50,"humidity":65.30,"timestamp":10234,"deviceId":"AA:BB:CC:DD:EE:FF"}
✓ Success: {"ok":true,"status":"NORMAL"}

📤 Sending: {"temperature":38.20,"humidity":58.10,"timestamp":20468,"deviceId":"AA:BB:CC:DD:EE:FF"}
✓ Success: {"ok":true,"alert":true,"ack":false}
🚨 TELEGRAM ALERT SENT!
```

---

## 🚀 Next Steps

1. ✅ Upload code ke ESP32
2. ✅ Monitor serial output
3. ✅ Trigger alert dengan suhu tinggi
4. ✅ Test ACK command di Telegram
5. ✅ Deploy ke production

---

Made with ❤️ for ESP32 IoT
