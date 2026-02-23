import React, { createContext, useContext, useState } from "react";

interface FavoritesContextType {
  favorites: any[];
  addToFavorites: (product: any) => void;
  removeFromFavorites: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: any) => {
  const [favorites, setFavorites] = useState<any[]>([]);

  const addToFavorites = (product: any) => {
    setFavorites((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
};
