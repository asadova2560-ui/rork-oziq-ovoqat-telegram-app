import { TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID } from "@/constants/config";

export async function sendTelegramMessage(text: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await response.json();
    console.log("Telegram message sent:", data.ok);
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export function formatOrderMessage(order: {
  id: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; price: number; unit: string }>;
  total: number;
  note?: string;
}): string {
  const itemsText = order.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name} — ${item.quantity} ${item.unit} x ${item.price.toLocaleString()} = ${(item.quantity * item.price).toLocaleString()} so'm`
    )
    .join("\n");

  const locationLink =
    order.latitude && order.longitude
      ? `\n📍 <a href="https://www.google.com/maps?q=${order.latitude},${order.longitude}">Xaritada ko'rish</a>`
      : "";

  const yandexGoLink =
    order.latitude && order.longitude
      ? `\n🚕 <a href="https://3.redirect.appmetrica.yandex.com/route?end-lat=${order.latitude}&end-lon=${order.longitude}&appmetrica_tracking_id=1178268795219780156">Yandex Go orqali yetkazish</a>`
      : "";

  return `🛒 <b>YANGI BUYURTMA #${order.id}</b>

📞 Telefon: <b>${order.phone}</b>
📍 Manzil: <b>${order.address}</b>${locationLink}${yandexGoLink}

💳 To'lov: <b>${order.paymentMethod}</b>

📦 <b>Mahsulotlar:</b>
${itemsText}

💰 <b>Jami: ${order.total.toLocaleString()} so'm</b>${order.note ? `\n\n📝 Izoh: ${order.note}` : ""}

⏰ Vaqt: ${new Date().toLocaleString("uz-UZ")}`;
}
