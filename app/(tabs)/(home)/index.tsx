import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, FlatList, Dimensions, Animated,
  NativeSyntheticEvent, NativeScrollEvent, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MapPin, Bell, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RamazonWidget from "@/components/ramazon/RamazonWidget";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";

const { width } = Dimensions.get("window");
const BANNER_W = width - 32;
const SNAP = BANNER_W + 12;

/* ══════════════════════════════════════════════════════════
   BANNERS — Admin panelda o'zgartirish uchun
   Kelajakda: API yoki AsyncStorage orqali yuklanadi
══════════════════════════════════════════════════════════ */
export const BANNERS = [
  {
    id: "1",
    title: "Yangi mahsulotlar keldi!",
    subtitle: "30% gacha chegirmalar",
    btnLabel: "Ko'rish",
    bgColor: "#f0faf4",
    titleColor: "#0e5e30",
    subtitleColor: "#2a9d5c",
    btnBg: "#0e6642",
    btnTextColor: "#ffffff",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
  },
  {
    id: "2",
    title: "Ramazon maxsus taklifi",
    subtitle: "Iftor mahsulotlari 40% arzon",
    btnLabel: "Buyurtma",
    bgColor: "#0e6642",
    titleColor: "#ffffff",
    subtitleColor: "#f7c948",
    btnBg: "#f7c948",
    btnTextColor: "#0e3a1f",
    imageUrl: "https://images.unsplash.com/photo-1604908554025-4e1f6d4d3c58?w=800",
  },
  {
    id: "3",
    title: "Toza sabzavotlar",
    subtitle: "Mahalliy fermerlardan yangi hosillar",
    btnLabel: "Xarid",
    bgColor: "#fffbec",
    titleColor: "#6b3a00",
    subtitleColor: "#b06800",
    btnBg: "#d97c00",
    btnTextColor: "#ffffff",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800",
  },
];

/* ══════════════════════════════════════════════════════════
   PALETTE  —  Ivory × Deep Forest Green × Warm Gold
══════════════════════════════════════════════════════════ */
const C = {
  bg:      "#f7f9f5",
  white:   "#ffffff",
  green:   "#0e6642",
  soft:    "#e8f5ee",
  gold:    "#f7c948",
  text:    "#1a2e20",
  sub:     "#4a6355",
  muted:   "#9ab3a5",
  border:  "#ddeee5",
  red:     "#e8453c",
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNotif, setHasNotif] = useState(false);
  const [focused, setFocused] = useState(false);

  const { products, categories, featuredProducts, saleProducts } = useProducts();

  // Auto-scroll
  useEffect(() => {
    const id = setInterval(() => {
      const next = currentIndex === BANNERS.length - 1 ? 0 : currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }, 4000);
    return () => clearInterval(id);
  }, [currentIndex]);

  // Notifications
  useEffect(() => {
    AsyncStorage.getItem("notifications").then((d) => {
      if (d && JSON.parse(d).length > 0) setHasNotif(true);
    });
  }, []);

  const handleNotif = async () => {
    const d = await AsyncStorage.getItem("notifications");
    if (!d || !JSON.parse(d).length) {
      Alert.alert("Bildirishnomalar", "Hozircha xabar yo'q");
      setHasNotif(false);
      return;
    }
    const n = JSON.parse(d);
    Alert.alert(n[0].title, n[0].message);
    setHasNotif(false);
  };

  // Search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return products.filter(
      (p) =>
        p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  // Section header
  const SecHead = useCallback(
    ({ title, onPress }: { title: string; onPress?: () => void }) => (
      <View style={s.secHead}>
        <Text style={s.secTitle}>{title}</Text>
        {onPress && (
          <TouchableOpacity onPress={onPress} style={s.secBtn}>
            <Text style={s.secBtnText}>Barchasi</Text>
            <ChevronRight size={15} color={C.green} />
          </TouchableOpacity>
        )}
      </View>
    ),
    []
  );

  // Dot indicators
  const Dots = () => (
    <View style={s.dotsRow}>
      {BANNERS.map((_, i) => {
        const w = scrollX.interpolate({
          inputRange: [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP],
          outputRange: [6, 22, 6],
          extrapolate: "clamp",
        });
        const op = scrollX.interpolate({
          inputRange: [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP],
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        return <Animated.View key={i} style={[s.dot, { width: w, opacity: op }]} />;
      })}
    </View>
  );

  // Banner item
  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={() => router.push("/catalog" as never)}
      style={[s.banner, { backgroundColor: item.bgColor, width: BANNER_W }]}
    >
      <View style={s.bannerLeft}>
        <Text style={[s.bannerTitle, { color: item.titleColor }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[s.bannerSub, { color: item.subtitleColor }]} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <View style={[s.bannerBtn, { backgroundColor: item.btnBg }]}>
          <Text style={[s.bannerBtnTxt, { color: item.btnTextColor }]}>
            {item.btnLabel}
          </Text>
        </View>
      </View>
      <Image source={{ uri: item.imageUrl }} style={s.bannerImg} contentFit="cover" />
    </TouchableOpacity>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.hRow}>
          <View style={s.locRow}>
            <View style={s.locIcon}>
              <MapPin size={14} color={C.green} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={s.locLabel}>Yetkazib berish</Text>
              <Text style={s.locCity}>Qashqadaryo, Shahrisabz</Text>
            </View>
          </View>
          <TouchableOpacity style={s.bellBtn} onPress={handleNotif}>
            <Bell size={20} color={C.text} strokeWidth={2} />
            {hasNotif && <View style={s.bellDot} />}
          </TouchableOpacity>
        </View>

        <View style={[s.searchWrap, focused && s.searchFocused]}>
          <Search size={17} color={focused ? C.green : C.muted} strokeWidth={2.2} />
          <TextInput
            style={s.searchInput}
            placeholder="Mahsulotlarni qidiring..."
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search results */}
      {filtered ? (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.searchGrid}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyText}>Hech narsa topilmadi</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}><ProductCard product={item} /></View>
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollBody}>

          {/* Ramazon Widget */}
          <RamazonWidget />

          {/* Banners */}
          <View style={s.bannerWrap}>
            <Animated.FlatList
              ref={flatListRef}
              data={BANNERS}
              horizontal
              snapToInterval={SNAP}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderBanner}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SNAP));
              }}
            />
            <Dots />
          </View>

          {/* Categories */}
          <SecHead title="Kategoriyalar" onPress={() => router.push("/catalog" as never)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList}>
            {categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
          </ScrollView>

          {/* Featured */}
          <SecHead title="Mashhur mahsulotlar" onPress={() => router.push("/catalog" as never)} />
          <FlatList
            data={featuredProducts}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hList}
            renderItem={({ item }) => (
              <View style={{ width: 162 }}><ProductCard product={item} /></View>
            )}
          />

          {/* Sale */}
          {saleProducts?.length > 0 && (
            <>
              <SecHead title="🔥 Chegirmalar" onPress={() => router.push("/catalog" as never)} />
              <FlatList
                data={saleProducts}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hList}
                renderItem={({ item }) => (
                  <View style={{ width: 162 }}><ProductCard product={item} /></View>
                )}
              />
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 6,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  hRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  locRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  locIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.soft, justifyContent: "center", alignItems: "center",
  },
  locLabel: { fontSize: 11, color: C.muted, fontWeight: "500" },
  locCity: { fontSize: 14, fontWeight: "700", color: C.text, marginTop: 1 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.soft, justifyContent: "center", alignItems: "center",
  },
  bellDot: {
    position: "absolute", top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.red, borderWidth: 1.5, borderColor: C.white,
  },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, height: 48,
    borderWidth: 1.5, borderColor: C.border, gap: 8,
  },
  searchFocused: { borderColor: C.green, backgroundColor: C.white },
  searchInput: { flex: 1, fontSize: 15, color: C.text, fontWeight: "500" },
  clearBtn: { color: C.muted, fontSize: 14, fontWeight: "600", paddingHorizontal: 4 },

  // Scroll
  scrollBody: { paddingTop: 14 },
  searchGrid: { padding: 8 },

  // Banners
  bannerWrap: { marginBottom: 6 },
  banner: {
    borderRadius: 20, flexDirection: "row",
    overflow: "hidden", height: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  bannerLeft: { flex: 1, padding: 18, justifyContent: "center", gap: 4 },
  bannerTitle: { fontSize: 16, fontWeight: "800", lineHeight: 21 },
  bannerSub: { fontSize: 12, fontWeight: "500", lineHeight: 17 },
  bannerBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, marginTop: 10,
  },
  bannerBtnTxt: { fontWeight: "700", fontSize: 13 },
  bannerImg: { width: 128, height: "100%" },

  // Dots
  dotsRow: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 5,
    marginTop: 10, marginBottom: 2,
  },
  dot: { height: 6, borderRadius: 3, backgroundColor: C.green },

  // Sections
  secHead: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16,
    marginTop: 22, marginBottom: 12,
  },
  secTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  secBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  secBtnText: { color: C.green, fontWeight: "600", fontSize: 14 },
  hList: { paddingHorizontal: 16, gap: 10 },

  // Empty
  emptyBox: { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: C.muted, fontSize: 15, fontWeight: "500" },
});
