import { RamazonWidget } from "@/components/ramazon/RamazonWidget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MapPin, Bell, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { totalItems } = useCart();
  const { products, categories, featuredProducts, saleProducts } = useProducts();
  const [hasNotification, setHasNotification] = useState(false);
  useEffect(() => {
  const checkNotifications = async () => {
    const data = await AsyncStorage.getItem("notifications");

    if (data) {
      const notifications = JSON.parse(data);

      if (notifications.length > 0) {
        setHasNotification(true);
      }
    }
  };

  checkNotifications();
}, []);
  const handleNotifications = async () => {
  const data = await AsyncStorage.getItem("notifications");

  if (!data) {
    Alert.alert("Bildirishnomalar", "Hozircha xabar yo‘q");
    setHasNotification(false);
    return;
  }

  const notifications = JSON.parse(data);

  if (notifications.length === 0) {
    Alert.alert("Bildirishnomalar", "Hozircha xabar yo‘q");
    setHasNotification(false);
    return;
  }

  Alert.alert(
    notifications[0].title,
    notifications[0].message
  );

  // 🔥 dot o‘chadi
  setHasNotification(false);
};
  
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return null;

    return products.filter(
      (p) =>
        p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const renderSectionHeader = useCallback(
    (title: string, onSeeAll?: () => void) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Barchasi</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    ),
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <MapPin size={18} color={Colors.primary} />
            <View style={styles.locationText}>
              <Text style={styles.deliverTo}>Yetkazib berish</Text>
              <Text style={styles.address}>Qashqadaryo viloyati,Shahrisabz shahri </Text>
            </View>
          </View>
          <TouchableOpacity
  style={styles.notificationButton}
  onPress={handleNotifications}
>
            <Bell size={22} color={Colors.text} />
            {hasNotification && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Mahsulotlarni qidiring..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>
      </View>

      {filteredProducts ? (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.searchResults}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Hech narsa topilmadi</Text>
              <Text style={styles.emptySubtext}>
                Boshqa so'z bilan qidirib ko'ring
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Yangi mahsulotlar</Text>
              <Text style={styles.bannerSubtitle}>
                30% gacha chegirmalar!
              </Text>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => router.push("/catalog" as never)}
              >
                <Text style={styles.bannerBtnText}>Xarid qilish</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop",
              }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          </View>

          {renderSectionHeader("Kategoriyalar", () =>
            router.push("/catalog" as never)
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </ScrollView>

          {renderSectionHeader("Mashhur mahsulotlar", () =>
            router.push("/catalog" as never)
          )}
          <FlatList
            data={featuredProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <View style={styles.featuredItem}>
                <ProductCard product={item} />
              </View>
            )}
          />

          {saleProducts.length > 0 && (
            <>
              {renderSectionHeader("🔥 Chegirmalar")}
              <FlatList
                data={saleProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <View style={styles.featuredItem}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {},
  deliverTo: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  address: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  scrollContent: {
    paddingTop: 16,
  },
  banner: {
    marginHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    height: 140,
  },
  bannerContent: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  bannerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  bannerBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  bannerImage: {
    width: 140,
    height: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  categoriesRow: {
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  featuredItem: {
    width: 165,
    marginHorizontal: 4,
  },
  searchResults: {
    padding: 12,
  },
  gridItem: {
    flex: 1,
    maxWidth: "50%",
  },
  emptySearch: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 30,
  },
});
