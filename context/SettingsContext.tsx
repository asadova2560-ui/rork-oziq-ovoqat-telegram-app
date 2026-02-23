import React, { createContext, useContext, useState } from "react";

interface SettingsContextType {
  phone: string;
  address: string;
  setPhone: (phone: string) => void;
  setAddress: (address: string) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState("+998 ");
  const [address, setAddress] = useState("");

  const resetSettings = () => {
    setPhone("+998 ");
    setAddress("");
  };

  return (
    <SettingsContext.Provider
      value={{
        phone,
        address,
        setPhone,
        setAddress,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
