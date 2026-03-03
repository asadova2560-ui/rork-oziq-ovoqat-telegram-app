import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Address {
  id: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface AddressContextType {
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => void;
  deleteAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider = ({ children }: any) => {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("addresses").then((data) => {
      if (data) setAddresses(JSON.parse(data));
    });
  }, []);

  const save = (list: Address[]) => {
    setAddresses(list);
    AsyncStorage.setItem("addresses", JSON.stringify(list));
  };

  const addAddress = (item: Omit<Address, "id">) => {
    save([...addresses, { ...item, id: Date.now().toString() }]);
  };

  const deleteAddress = (id: string) => {
    save(addresses.filter((a) => a.id !== id));
  };

  return (
    <AddressContext.Provider value={{ addresses, addAddress, deleteAddress }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddresses must be used inside AddressProvider");
  return ctx;
};
