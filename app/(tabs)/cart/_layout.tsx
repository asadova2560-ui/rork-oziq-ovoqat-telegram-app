import { Stack } from "expo-router";
import React from "react";

export default function CartLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
