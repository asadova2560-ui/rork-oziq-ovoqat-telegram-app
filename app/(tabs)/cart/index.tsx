import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/formatPrice";
import { CartItem } from "@/types/product";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, getItemPrice } =
    useCart();

  const handleClear = useCallback(() => {
    Alert.alert(
      "Savatni tozalash",
      "Barcha mahsulotlarni o'chirmoqchimisiz?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: () => clearCart(),
        },
      ]
    );
  }, [clearCart]);

  const handleOrder = useCallback(() => {
    if (items.length === 0) {
      Alert.alert("Savatcha bo'sh", "Avval mahsulot qo'shing");
      return;
    }
    router.push("/checkout" as never);
  }, [items, router]);

  const getCartKey = useCallback((item: CartItem): string => {
    return item.weightGrams ? `${item.product.id}_${item.weightGrams}` : item.product.id;
  }, []);

  const formatWeight = useCallback((grams: number): string => {
    if (grams >= 1000) return `${grams / 1000} kg`;
    return `${grams} g`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      const cartKey = getCartKey(item);
      const itemTotal = getItemPrice(item);
      return (
        <View style={styles.cartItem}>
          <Image
            source={{ uri: item.product.image }}
            style={styles.itemImage}
            contentFit="cover"
          />
          <View style={styles.itemContent}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.nameUz}
            </Text>
            <Text style={styles.itemUnit}>
              {item.weightGrams
                ? formatWeight(item.weightGrams)
                : `1 ${item.product.unit}`}
            </Text>
            <View style={styles.itemBottom}>
              <Text style={styles.itemPrice}>
                {formatPrice(itemTotal)}
              </Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  onPress={() => updateQuantity(cartKey, item.quantity - 1)}
                  style={styles.qtyBtn}
                >
                  <Minus size={14} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(cartKey, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Plus size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => removeFromCart(cartKey)}
            style={styles.deleteBtn}
          >
            <Trash2 size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      );
    },
    [updateQuantity, removeFromCart, getCartKey, getItemPrice, formatWeight]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Savatcha</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Tozalash</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <ShoppingBag size={64} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Savatcha bo'sh</Text>
          <Text style={styles.emptySubtext}>
            Mahsulotlarni qo'shish uchun bosh sahifaga o'ting
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => getCartKey(item)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Jami:</Text>
              <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            </View>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={handleOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.orderBtnText}>Buyurtma berish</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.danger,
  },
  list: {
    padding: 16,
    paddingBottom: 200,
  },
  cartItem: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    flexDirection: "row",
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  itemUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  orderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  orderBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
});
