import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Package } from "lucide-react-native";
import Colors from "@/constants/colors";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useProducts } from "@/context/ProductsContext";
import { Product } from "@/types/product";

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const { products, categories } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category ?? "all"
  );

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [selectedCategory, products]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.gridItem}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Katalog</Text>
        <Text style={styles.subtitle}>
          {filteredProducts.length} ta mahsulot
        </Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity
            onPress={() => handleCategoryPress("all")}
            style={[
              styles.filterChip,
              selectedCategory === "all" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === "all" && styles.filterChipTextActive,
              ]}
            >
              Barchasi
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              style={[
                styles.filterChip,
                selectedCategory === cat.id && styles.filterChipActive,
              ]}
            >
              <CategoryIcon
                name={cat.icon}
                size={16}
                color={selectedCategory === cat.id ? Colors.white : cat.color}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.nameUz}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filtersContainer: {
    paddingVertical: 12,
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  productList: {
    padding: 12,
    paddingBottom: 40,
  },
  gridItem: {
    flex: 1,
    maxWidth: "50%",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
