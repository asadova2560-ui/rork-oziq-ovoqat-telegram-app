import RamazonWidget from "@/components/ramazon/RamazonWidget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
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
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const { products, categories, featuredProducts } = useProducts();

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

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
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

          <View
            style={[
              styles.searchContainer,
              isFocused && styles.searchContainerFocused,
            ]}
          >
            <Search
              size={20}
              color={isFocused ? Colors.primary : Colors.textLight}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Mahsulotlarni qidiring..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              selectionColor={Colors.primary}
              cursorColor={Colors.primary}
              returnKeyType="search"
            />
          </View>
        </View>

        {!keyboardVisible && <RamazonWidget />}

        {/* qolgan qism o‘zgarmagan */}
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#F4F6F8",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 2,
    borderColor: "transparent",
  },
  searchContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 10,
  },
});
