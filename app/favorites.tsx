import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";
import { formatPrice } from "@/utils/formatPrice";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, removeFromFavorites } = useFavorites();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sevimlilar</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {favorites.length === 0 ? (
          <View style={styles.empty}>
            <Star size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Sevimlilar yo'q</Text>
            <Text style={styles.emptySubtext}>Mahsulotlarni yulduzcha bosib saqlang</Text>
          </View>
        ) : (
          favorites.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.nameUz}</Text>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromFavorites(item.id)}>
                <Trash2 size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  content: { padding: 16, gap: 12 },
  empty: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12 },
  cardImage: { width: 56, height: 56, borderRadius: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  cardPrice: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
});
