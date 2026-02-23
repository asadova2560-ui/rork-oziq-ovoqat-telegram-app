import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  phone: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: OrderItem[];
  status: string;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
}

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  addOrder: () => {},
});

export const OrdersProvider = ({ children }: any) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await AsyncStorage.getItem("orders");
    if (data) {
      setOrders(JSON.parse(data));
    }
  };

  const addOrder = async (order: Order) => {
    const updated = [order, ...orders];
    setOrders(updated);
    await AsyncStorage.setItem("orders", JSON.stringify(updated));
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);
