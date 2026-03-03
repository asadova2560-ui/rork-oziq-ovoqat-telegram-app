import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductsProvider } from "@/context/ProductsContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { AddressProvider } from "@/context/AddressContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Orqaga" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="checkout"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="admin"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="addresses"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="favorites"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="payments"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="help"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ProductsProvider>
          <AddressProvider>
            <FavoritesProvider>
              <CartProvider>
                <OrdersProvider>
                  <RootLayoutNav />
                </OrdersProvider>
              </CartProvider>
            </FavoritesProvider>
          </AddressProvider>
        </ProductsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
