import React, { createContext, useContext, useState } from "react";

export interface OrderItem {
  id: string;
  date: string;
  total: number;
  items: any[];
}

interface OrdersContextType {
  orders: OrderItem[];
  addOrder: (order: OrderItem) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderItem[]>([]);

  const addOrder = (order: OrderItem) => {
    setOrders((prev) => [order, ...prev]);
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used inside OrdersProvider");
  }
  return context;
}
