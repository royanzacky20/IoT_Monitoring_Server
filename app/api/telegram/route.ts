import { NextResponse } from "next/server";
import { alertState } from "@/lib/alertState";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Telegram Webhook Handler
 * Endpoint untuk menerima update dari Telegram Bot
 */
export async function POST(req: Request) {
  console.log('[Webhook] Received Telegram webhook');
  
  const body = await req.json();
  console.log('[Webhook] Body:', JSON.stringify(body, null, 2));
  
  const message = body.message?.text;
  const chatId = body.message?.chat?.id;

  console.log(`[Webhook] Message: "${message}", ChatID: ${chatId}`);

  if (!message || !chatId) {
    console.log('[Webhook] No message or chatId, returning ok');
    return NextResponse.json({ ok: true });
  }

  // === ACK COMMAND ===
  if (message.toUpperCase() === "ACK") {
    console.log('[Webhook] ACK command received!');
    alertState.isAck = true;
    console.log('[Webhook] alertState.isAck set to true');

    await sendTelegramMessage(
      chatId,
      "✅ ACK diterima\nNotifikasi suhu dihentikan\nMonitoring tetap berjalan",
    );
    
    console.log('[Webhook] ACK response sent');
  }

  // === STATUS COMMAND (opsional tapi bagus) ===
  if (message.toUpperCase() === "STATUS") {
    console.log('[Webhook] STATUS command received!');
    
    await sendTelegramMessage(
      chatId,
      `📊 STATUS SISTEM\nSuhu terakhir: ${alertState.temperature}°C\nAlert aktif: ${alertState.isAlert}\nACK: ${alertState.isAck}`,
    );
    
    console.log('[Webhook] STATUS response sent');
  }

  return NextResponse.json({ ok: true });
}
