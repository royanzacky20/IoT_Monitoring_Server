/**
 * Telegram Helper Functions
 * Fungsi untuk kirim pesan ke Telegram
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

/**
 * Kirim pesan ke Telegram
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
): Promise<void> {
  console.log(`[Telegram] Sending message to chat ${chatId}`);
  console.log(`[Telegram] Message: ${text}`);
  console.log(`[Telegram] Bot Token exists: ${!!TOKEN}`);
  console.log(`[Telegram] API URL: ${API}`);

  if (!TOKEN || TOKEN === "undefined") {
    console.error("[Telegram] ERROR: TELEGRAM_BOT_TOKEN not configured!");
    return;
  }

  try {
    const payload = {
      chat_id: chatId,
      text,
    };

    console.log("[Telegram] Payload:", JSON.stringify(payload));

    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Telegram] Failed to send message:", responseData);
      console.error("[Telegram] HTTP Status:", response.status);
    } else {
      console.log("[Telegram] ✓ Message sent successfully!", responseData);
    }
  } catch (error) {
    console.error("[Telegram] Exception while sending message:", error);
  }
}
