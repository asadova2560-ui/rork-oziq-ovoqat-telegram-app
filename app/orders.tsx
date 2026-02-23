import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useOrders } from "@/context/OrdersContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/formatPrice";

export default function OrdersScreen() {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Hozircha buyurtmalar yo‘q</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.orderId}>Buyurtma #{item.id}</Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleString()}
          </Text>
          <Text style={styles.address}>Manzil: {item.address}</Text>
          <Text style={styles.total}>
            Jami: {formatPrice(item.total)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    fontSize: 16,
    color: "#777",
  },
  card: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  address: {
    marginTop: 8,
  },
  total: {
    marginTop: 6,
    fontWeight: "700",
    color: Colors.primary,
  },
});
