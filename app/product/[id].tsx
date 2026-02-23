import React, { useMemo, useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Weight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";
import { formatPrice } from "@/utils/formatPrice";
import { CategoryIcon } from "@/components/CategoryIcon";

const WEIGHT_OPTIONS = [100, 200, 300, 500, 700, 1000, 1500, 2000];

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const { getProductById, categories } = useProducts();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const product = useMemo(
    () => getProductById(id ?? ""),
    [id, getProductById]
  );

  const category = useMemo(
    () => categories.find((c) => c.id === product?.categoryId),
    [product?.categoryId, categories]
  );

  const isWeightBased = product?.unit === "kg";
  const [selectedWeight, setSelectedWeight] = useState<number>(1000);

  const quantity = product ? getItemQuantity(product.id, isWeightBased ? selectedWeight : undefined) : 0;

  const weightPrice = useMemo(() => {
    if (!product || !isWeightBased) return product?.price ?? 0;
    return Math.round(product.price * selectedWeight / 1000);
  }, [product, isWeightBased, selectedWeight]);

  const handleSelectWeight = useCallback((grams: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeight(grams);
  }, []);

  const formatWeight = useCallback((grams: number): string => {
    if (grams >= 1000) return `${grams / 1000} kg`;
    return `${grams} g`;
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(product, isWeightBased ? selectedWeight : undefined);
  }, [product, addToCart, scaleAnim, isWeightBased, selectedWeight]);

  const handleUpdateQuantity = useCallback((newQty: number) => {
    if (!product) return;
    const cartKey = isWeightBased ? `${product.id}_${selectedWeight}` : product.id;
    updateQuantity(cartKey, newQty);
  }, [product, updateQuantity, isWeightBased, selectedWeight]);

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mahsulot topilmadi</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Orqaga</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            contentFit="cover"
          />
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.topBtn}
            >
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtn}>
              <Heart size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {product.isOnSale && discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {category && (
            <View style={[styles.categoryTag, { backgroundColor: category.color + "20" }]}>
              <CategoryIcon name={category.icon} size={14} color={category.color} />
              <Text style={[styles.categoryName, { color: category.color }]}>
                {category.nameUz}
              </Text>
            </View>
          )}

          <Text style={styles.productName}>{product.nameUz}</Text>

          <View style={styles.ratingRow}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{product.rating}</Text>
            <Text style={styles.ratingCount}>(128 baho)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {isWeightBased ? formatPrice(weightPrice) : formatPrice(product.price)}
            </Text>
            {product.oldPrice && !isWeightBased && (
              <Text style={styles.oldPrice}>
                {formatPrice(product.oldPrice)}
              </Text>
            )}
            <Text style={styles.unit}>
              / {isWeightBased ? formatWeight(selectedWeight) : product.unit}
            </Text>
          </View>

          {isWeightBased && (
            <>
              <View style={styles.divider} />
              <View style={styles.weightSection}>
                <View style={styles.weightHeader}>
                  <Weight size={18} color={Colors.primary} />
                  <Text style={styles.weightTitle}>Og'irlikni tanlang</Text>
                </View>
                <Text style={styles.weightHint}>
                  Narx: {formatPrice(product.price)} / kg
                </Text>
                <View style={styles.weightGrid}>
                  {WEIGHT_OPTIONS.map((grams) => {
                    const isSelected = selectedWeight === grams;
                    const itemPrice = Math.round(product.price * grams / 1000);
                    return (
                      <TouchableOpacity
                        key={grams}
                        style={[
                          styles.weightChip,
                          isSelected && styles.weightChipSelected,
                        ]}
                        onPress={() => handleSelectWeight(grams)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.weightChipLabel,
                            isSelected && styles.weightChipLabelSelected,
                          ]}
                        >
                          {formatWeight(grams)}
                        </Text>
                        <Text
                          style={[
                            styles.weightChipPrice,
                            isSelected && styles.weightChipPriceSelected,
                          ]}
                        >
                          {formatPrice(itemPrice)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Tavsif</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Holati</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: product.inStock ? Colors.success : Colors.danger },
                ]}
              >
                {product.inStock ? "Mavjud" : "Tugagan"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Birlik</Text>
              <Text style={styles.infoValue}>1 {product.unit}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kategoriya</Text>
              <Text style={styles.infoValue}>{category?.nameUz ?? ""}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Yetkazish</Text>
              <Text style={styles.infoValue}>30-60 daqiqa</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {quantity > 0 ? (
          <View style={styles.footerWithQuantity}>
            <View style={styles.footerQuantity}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(quantity - 1)}
                style={styles.footerQtyBtn}
              >
                <Minus size={18} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.footerQtyText}>{quantity}</Text>
              <TouchableOpacity
                onPress={handleAddToCart}
                style={styles.footerQtyBtn}
              >
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.footerTotal}>
              {formatPrice((isWeightBased ? weightPrice : product.price) * quantity)}
            </Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
            <TouchableOpacity
              onPress={handleAddToCart}
              style={styles.addToCartBtn}
              activeOpacity={0.8}
            >
              <ShoppingCart size={20} color={Colors.white} />
              <Text style={styles.addToCartText}>Savatga qo'shish</Text>
              <Text style={styles.addToCartPrice}>
                {formatPrice(isWeightBased ? weightPrice : product.price)}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 320,
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  discountBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.white,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
  },
  productName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    lineHeight: 30,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  ratingCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 14,
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.primary,
  },
  oldPrice: {
    fontSize: 17,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  unit: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 20,
  },
  weightSection: {
    marginBottom: 0,
  },
  weightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  weightTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  weightHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  weightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weightChip: {
    width: "23%" as any,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  weightChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weightChipLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  weightChipLabelSelected: {
    color: Colors.white,
  },
  weightChipPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weightChipPriceSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 10,
  },
  infoItem: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  addToCartBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  addToCartText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  addToCartPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  footerWithQuantity: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerQuantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerQtyBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  footerQtyText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primary,
  },
});
