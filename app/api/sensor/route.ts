import { NextResponse } from "next/server";
import { alertState } from "@/lib/alertState";
import { sendTelegramMessage } from "@/lib/telegram";

const TEMP_THRESHOLD = 35;
const ALERT_INTERVAL = 5 * 60 * 1000; // 5 menit

/**
 * Sensor Data Handler
 * Endpoint untuk menerima data dari ESP32
 */
export async function POST(req: Request) {
  const data = await req.json();
  const { temperature } = data;

  alertState.temperature = temperature;

  // kondisi normal → reset
  if (temperature < TEMP_THRESHOLD) {
    alertState.isAlert = false;
    alertState.isAck = false;
    return NextResponse.json({ ok: true, status: "NORMAL" });
  }

  // kondisi alert
  alertState.isAlert = true;

  const now = Date.now();

  // 🔥 ANTI-SPAM: hanya kirim jika belum ACK dan sudah > 5 menit
  if (!alertState.isAck && now - alertState.lastAlertTime > ALERT_INTERVAL) {
    await sendTelegramMessage(
      process.env.TELEGRAM_CHAT_ID!,
      `🚨 ALERT SUHU\nSuhu: ${temperature}°C\nKetik: ACK`,
    );
    alertState.lastAlertTime = now;
  }

  return NextResponse.json({
    ok: true,
    alert: true,
    ack: alertState.isAck,
  });
}

/**
 * Get current sensor status
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    threshold: TEMP_THRESHOLD,
    alertState: {
      isAlert: alertState.isAlert,
      isAck: alertState.isAck,
      temperature: alertState.temperature,
      lastAlertTime: alertState.lastAlertTime,
    },
    timestamp: new Date().toISOString(),
  });
}
