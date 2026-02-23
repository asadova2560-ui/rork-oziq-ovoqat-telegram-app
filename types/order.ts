export interface Order {
  id: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  paymentMethod: "cash" | "card_transfer" | "on_delivery";
  items: OrderItem[];
  total: number;
  note?: string;
  status: "pending" | "confirmed" | "delivering" | "delivered";
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}
