import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Plus, Minus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/formatPrice";
import Colors from "@/constants/colors";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "horizontal";
}

function ProductCardComponent({ product, variant = "grid" }: ProductCardProps) {
  const router = useRouter();
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const quantity = getItemQuantity(product.id);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    router.push({ pathname: '/product/[id]' as any, params: { id: product.id } });
  }, [product.id, router, scaleAnim]);

  const handleAdd = useCallback(() => {
    addToCart(product);
  }, [addToCart, product]);

  const handleRemove = useCallback(() => {
    updateQuantity(product.id, quantity - 1);
  }, [updateQuantity, product.id, quantity]);

  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.horizontalCard}
        testID={`product-card-${product.id}`}
      >
        <Image
          source={{ uri: product.image }}
          style={styles.horizontalImage}
          contentFit="cover"
        />
        <View style={styles.horizontalContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.nameUz}
          </Text>
          <Text style={styles.productUnit}>1 {product.unit}</Text>
          <View style={styles.horizontalBottom}>
            <View>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.oldPrice && (
                <Text style={styles.oldPrice}>
                  {formatPrice(product.oldPrice)}
                </Text>
              )}
            </View>
            {quantity > 0 ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  onPress={handleRemove}
                  style={styles.qtyBtn}
                >
                  <Minus size={14} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={handleAdd} style={styles.qtyBtn}>
                  <Plus size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.gridCard}
        testID={`product-card-${product.id}`}
      >
        {product.isOnSale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>Chegirma</Text>
          </View>
        )}
        <Image
          source={{ uri: product.image }}
          style={styles.gridImage}
          contentFit="cover"
        />
        <View style={styles.gridContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.nameUz}
          </Text>
          <Text style={styles.productUnit}>1 {product.unit}</Text>
          <View style={styles.gridBottom}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.oldPrice && (
                <Text style={styles.oldPrice}>
                  {formatPrice(product.oldPrice)}
                </Text>
              )}
            </View>
            {quantity > 0 ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  onPress={handleRemove}
                  style={styles.qtyBtn}
                >
                  <Minus size={14} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={handleAdd} style={styles.qtyBtn}>
                  <Plus size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const ProductCard = React.memo(ProductCardComponent);

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden" as const,
    flex: 1,
    margin: 4,
  },
  gridImage: {
    width: "100%",
    height: 130,
  },
  gridContent: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    lineHeight: 18,
    minHeight: 36,
  },
  productUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gridBottom: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-end" as const,
    marginTop: 8,
  },
  priceContainer: {},
  price: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  oldPrice: {
    fontSize: 12,
    color: Colors.textLight,
    textDecorationLine: "line-through" as const,
    marginTop: 1,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  quantityControl: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    minWidth: 18,
    textAlign: "center" as const,
  },
  saleBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  saleBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  horizontalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: "row" as const,
    overflow: "hidden" as const,
    marginBottom: 10,
  },
  horizontalImage: {
    width: 100,
    height: 100,
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between" as const,
  },
  horizontalBottom: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
});
