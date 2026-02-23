import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Category } from "@/types/product";
import { CategoryIcon } from "@/components/CategoryIcon";
import Colors from "@/constants/colors";

interface CategoryCardProps {
  category: Category;
  size?: "small" | "large";
}

function CategoryCardComponent({ category, size = "small" }: CategoryCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push({ pathname: '/catalog' as any, params: { category: category.id } });
  }, [category.id, router]);

  if (size === "large") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.largeCard, { backgroundColor: category.color + "20" }]}
        testID={`category-${category.id}`}
      >
        <CategoryIcon name={category.icon} size={28} color={category.color} />
        <Text style={styles.largeName}>{category.nameUz}</Text>
        <Text style={styles.largeCount}>{category.productCount} mahsulot</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.smallCard}
      testID={`category-${category.id}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color + "20" }]}>
        <CategoryIcon name={category.icon} size={26} color={category.color} />
      </View>
      <Text style={styles.smallName} numberOfLines={1}>
        {category.nameUz}
      </Text>
    </TouchableOpacity>
  );
}

export const CategoryCard = React.memo(CategoryCardComponent);

const styles = StyleSheet.create({
  smallCard: {
    alignItems: "center" as const,
    width: 76,
    marginRight: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  smallName: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.text,
    textAlign: "center" as const,
  },
  largeCard: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: "center" as const,
  },
  largeName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
  },
  largeCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
