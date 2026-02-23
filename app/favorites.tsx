import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useFavorites } from "@/context/FavoritesContext";
import Colors from "@/constants/colors";

export default function FavoritesScreen() {
  const { favorites, removeFromFavorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Sevimli mahsulotlar yo‘q</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={favorites}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.name}</Text>
          <Text>{item.price} so'm</Text>
          <TouchableOpacity onPress={() => removeFromFavorites(item.id)}>
            <Text style={{ color: "red", marginTop: 6 }}>O‘chirish</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 18, fontWeight: "600", color: "gray" },
  card: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "700" },
});
