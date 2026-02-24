import RamazonWidget from "@/components/ramazon/RamazonWidget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
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

const { width } = Dimensions.get("window");

const banners = [
  {
    id: "1",
    title: "Yangi mahsulotlar",
    subtitle: "30% gacha chegirmalar!",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
  },
  {
    id: "2",
    title: "Ramazon aksiyasi",
    subtitle: "Maxsus narxlar!",
    image:
      "https://images.unsplash.com/photo-1604908554025-4e1f6d4d3c58?w=800",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNotification, setHasNotification] = useState(false);

  const { products, categories, featuredProducts, saleProducts } =
    useProducts();

  // 🔁 AUTO SLIDER
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        currentIndex === banners.length - 1 ? 0 : currentIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // 🔔 NOTIFICATIONS
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

    Alert.alert(notifications[0].title, notifications[0].message);
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
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <MapPin size={18} color={Colors.primary} />
            <View>
              <Text style={styles.deliverTo}>Yetkazib berish</Text>
              <Text style={styles.address}>
                Qashqadaryo viloyati, Shahrisabz shahri
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
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
          />
        </View>
      </View>

      <RamazonWidget />

      {filteredProducts ? (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 🔥 SLIDER */}
          <FlatList
            ref={flatListRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.banner, { width }]}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>
                    {item.subtitle}
                  </Text>

                  <TouchableOpacity
                    style={styles.bannerBtn}
                    onPress={() =>
                      router.push("/catalog" as never)
                    }
                  >
                    <Text style={styles.bannerBtnText}>
                      Xarid qilish
                    </Text>
                  </TouchableOpacity>
                </View>

                <Image
                  source={{ uri: item.image }}
                  style={styles.bannerImage}
                  contentFit="cover"
                />
              </View>
            )}
          />

          {renderSectionHeader("Kategoriyalar", () =>
            router.push("/catalog" as never)
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 165 }}>
                <ProductCard product={item} />
              </View>
            )}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  locationRow: { flexDirection: "row", gap: 8 },

  deliverTo: { fontSize: 11, color: Colors.textSecondary },

  address: { fontSize: 14, fontWeight: "700", color: Colors.text },

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
    top: 8,
    right: 8,
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
  },

  searchInput: { flex: 1, marginLeft: 10 },

  banner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    height: 140,
  },

  bannerContent: { flex: 1, padding: 18 },

  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryDark,
  },

  bannerSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
  },

  bannerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },

  bannerBtnText: { color: Colors.white, fontWeight: "700" },

  bannerImage: { width: 140, height: "100%" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },

  sectionTitle: { fontSize: 18, fontWeight: "800" },

  seeAllBtn: { flexDirection: "row", alignItems: "center" },

  seeAllText: { color: Colors.primary, fontWeight: "600" },
});
