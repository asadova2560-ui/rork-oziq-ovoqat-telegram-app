import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { CartItem, Product } from "@/types/product";
import * as Haptics from "expo-haptics";

const CART_STORAGE_KEY = "cart_items";

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      return cartItems;
    },
  });

  useEffect(() => {
    if (cartQuery.data) {
      setItems(cartQuery.data);
    }
  }, [cartQuery.data]);

  const addToCart = useCallback(
    (product: Product, weightGrams?: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = [...items];
      const cartKey = weightGrams ? `${product.id}_${weightGrams}` : product.id;
      const existingIndex = updated.findIndex(
        (item) => {
          const itemKey = item.weightGrams ? `${item.product.id}_${item.weightGrams}` : item.product.id;
          return itemKey === cartKey;
        }
      );
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
      } else {
        updated.push({ product, quantity: 1, weightGrams });
      }
      setItems(updated);
      syncMutation.mutate(updated);
    },
    [items, syncMutation]
  );

  const getCartKey = useCallback((item: CartItem): string => {
    return item.weightGrams ? `${item.product.id}_${item.weightGrams}` : item.product.id;
  }, []);

  const removeFromCart = useCallback(
    (cartKey: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = items.filter((item) => getCartKey(item) !== cartKey);
      setItems(updated);
      syncMutation.mutate(updated);
    },
    [items, syncMutation, getCartKey]
  );

  const updateQuantity = useCallback(
    (cartKey: string, quantity: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (quantity <= 0) {
        removeFromCart(cartKey);
        return;
      }
      const updated = items.map((item) =>
        getCartKey(item) === cartKey ? { ...item, quantity } : item
      );
      setItems(updated);
      syncMutation.mutate(updated);
    },
    [items, syncMutation, removeFromCart, getCartKey]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    syncMutation.mutate([]);
  }, [syncMutation]);

  const getItemQuantity = useCallback(
    (productId: string, weightGrams?: number): number => {
      const cartKey = weightGrams ? `${productId}_${weightGrams}` : productId;
      const item = items.find((i) => {
        const itemKey = i.weightGrams ? `${i.product.id}_${i.weightGrams}` : i.product.id;
        return itemKey === cartKey;
      });
      return item?.quantity ?? 0;
    },
    [items]
  );

  const getItemPrice = useCallback(
    (item: CartItem): number => {
      if (item.weightGrams && item.product.unit === "kg") {
        return Math.round(item.product.price * item.weightGrams / 1000) * item.quantity;
      }
      return item.product.price * item.quantity;
    },
    []
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => {
          if (item.weightGrams && item.product.unit === "kg") {
            return sum + (item.product.price * item.weightGrams / 1000) * item.quantity;
          }
          return sum + item.product.price * item.quantity;
        },
        0
      ),
    [items]
  );

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getItemPrice,
    totalItems,
    totalPrice,
    isLoading: cartQuery.isLoading,
  };
});
