import React, { createContext, useContext, useState } from "react";

const OrdersContext = createContext<any>(null);

export const OrdersProvider = ({ children }: any) => {
  const [orders, setOrders] = useState<any[]>([]);

  const addOrder = (order: any) => {
    setOrders((prev) => [order, ...prev]);
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  return useContext(OrdersContext);
};
