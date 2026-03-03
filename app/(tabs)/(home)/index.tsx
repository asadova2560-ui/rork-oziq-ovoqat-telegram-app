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
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MapPin, Bell, ChevronRight, Moon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";

const { width } = Dimensions.get("window");
const BANNER_W = width - 32;

// ─── Ramazon vaqtlari (Shahrisabz) ───────────────────────────────────────────
const RAMAZON_DAYS: Record<
  string,
  { sahar: string; iftor: string; kun: number }
> = {
  "2025-03-01": { sahar: "05:52", iftor: "18:28", kun: 1 },
  "2025-03-02": { sahar: "05:51", iftor: "18:29", kun: 2 },
  "2025-03-03": { sahar: "05:50", iftor: "18:30", kun: 3 },
  "2025-03-04": { sahar: "05:46", iftor: "18:33", kun: 4 },
  "2025-03-05": { sahar: "05:45", iftor: "18:34", kun: 5 },
  "2025-03-06": { sahar: "05:43", iftor: "18:35", kun: 6 },
  "2025-03-07": { sahar: "05:42", iftor: "18:36", kun: 7 },
  "2025-03-08": { sahar: "05:40", iftor: "18:37", kun: 8 },
  "2025-03-09": { sahar: "05:39", iftor: "18:38", kun: 9 },
  "2025-03-10": { sahar: "05:37", iftor: "18:39", kun: 10 },
  "2025-03-11": { sahar: "05:36", iftor: "18:40", kun: 11 },
  "2025-03-12": { sahar: "05:34", iftor: "18:41", kun: 12 },
  "2025-03-13": { sahar: "05:33", iftor: "18:42", kun: 13 },
  "2025-03-14": { sahar: "05:31", iftor: "18:43", kun: 14 },
  "2025-03-15": { sahar: "05:29", iftor: "18:44", kun: 15 },
  "2025-03-16": { sahar: "05:28", iftor: "18:45", kun: 16 },
  "2025-03-17": { sahar: "05:26", iftor: "18:46", kun: 17 },
  "2025-03-18": { sahar: "05:24", iftor: "18:47", kun: 18 },
  "2025-03-19": { sahar: "05:23", iftor: "18:48", kun: 19 },
  "2025-03-20": { sahar: "05:21", iftor: "18:49", kun: 20 },
  "2025-03-21": { sahar: "05:19", iftor: "18:50", kun: 21 },
  "2025-03-22": { sahar: "05:18", iftor: "18:51", kun: 22 },
  "2025-03-23": { sahar: "05:16", iftor: "18:52", kun: 23 },
  "2025-03-24": { sahar: "05:14", iftor: "18:53", kun: 24 },
  "2025-03-25": { sahar: "05:12", iftor: "18:54", kun: 25 },
  "2025-03-26": { sahar: "05:11", iftor: "18:55", kun: 26 },
  "2025-03-27": { sahar: "05:09", iftor: "18:56", kun: 27 },
  "2025-03-28": { sahar: "05:07", iftor: "18:57", kun: 28 },
  "2025-03-29": { sahar: "05:05", iftor: "18:58", kun: 29 },
  "2025-03-30": { sahar: "05:04", iftor: "18:59", kun: 30 },
};

const HAFTA = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];
const OYLAR = [
  "", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Compact Ramazon Widget ───────────────────────────────────────────────────
function CompactRamazonWidget() {
  const todayKey = getTodayKey();
  const info = RAMAZON_DAYS[todayKey];
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!info) return;
    const tick = () => {
      const now = new Date();
      const [ih, im] = info.iftor.split(":").map(Number);
      const iftor = new Date();
      iftor.setHours(ih, im, 0, 0);
      const diff = iftor.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Vaqt bo'ldi! 🌙");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [info]);

  if (!info) return null;

  const [, m, d] = todayKey.split("-");
  const dateLabel = `${parseInt(d)}-${OYLAR[parseInt(m)]}`;
  const haftaKun = HAFTA[new Date().getDay()];

  return (
    <View style={rw.card}>
      {/* Moon badge + date */}
      <View style={rw.left}>
        <View style={rw.moonRow}>
          <Moon size={13} color="#ffd060" fill="#ffd060" />
          <Text style={rw.kunText}>{info.kun}-kun</Text>
        </View>
        <Text style={rw.dateText}>
          {haftaKun}, {dateLabel}
        </Text>
      </View>

      <View style={rw.sep} />

      {/* Saharlik */}
      <View style={rw.block}>
        <Text style={rw.blockLabel}>🌅 Saharlik</Text>
        <Text style={rw.blockTime}>{info.sahar}</Text>
      </View>

      <View style={rw.sep} />

      {/* Iftorlik + countdown */}
      <View style={rw.block}>
        <Text style={rw.blockLabel}>🌙 Iftorlik</Text>
        <Text style={[rw.blockTime, { color: "#ffd060" }]}>{info.iftor}</Text>
        {countdown ? (
          <Text style={rw.countdown}>{countdown}</Text>
        ) : null}
      </View>
    </View>
  );
}

const rw = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#16763a",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: "#1a9e4e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  left: { flex: 1.3, gap: 4 },
  moonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,208,96,0.18)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  kunText: { color: "#ffd060", fontWeight: "700", fontSize: 12 },
  dateText: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "500" },
  sep: { width: 1, height: 38, backgroundColor: "rgba(255,255,255,0.18)" },
  block: { flex: 1, alignItems: "center", gap: 1 },
  blockLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "500" },
  blockTime: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  countdown: { color: "rgba(255,208,96,0.9)", fontSize: 10, fontWeight: "600", letterSpacing: 0.4 },
});

// ─── Banners ──────────────────────────────────────────────────────────────────
const BANNERS = [
  {
    id: "1",
    title: "Yangi mahsulotlar",
    subtitle: "30% gacha chegirmalar!",
    btnLabel: "Xarid qilish",
    bg: "#e8f7ee",
    titleColor: "#1a7a3c",
    subtitleColor: "#2da05a",
    btnBg: "#1a9e4e",
    btnTextColor: "#fff",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
  },
  {
    id: "2",
    title: "Ramazon aksiyasi 🌙",
    subtitle: "Iftor mahsulotlari\n40% arzon!",
    btnLabel: "Ko'rish",
    bg: "#1a7a3c",
    titleColor: "#ffffff",
    subtitleColor: "#ffd060",
    btnBg: "#ffd060",
    btnTextColor: "#1a3a00",
    image: "https://images.unsplash.com/photo-1604908554025-4e1f6d4d3c58?w=800",
  },
  {
    id: "3",
    title: "Toza sabzavotlar 🥦",
    subtitle: "Mahalliy fermerlardan\neng yangi hosillar",
    btnLabel: "Buyurtma",
    bg: "#fff8e8",
    titleColor: "#7a4a00",
    subtitleColor: "#b36b00",
    btnBg: "#e67e00",
    btnTextColor: "#fff",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800",
  },
];

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNotification, setHasNotification] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { products, categories, featuredProducts, saleProducts } =
    useProducts();

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      const next =
        currentIndex === BANNERS.length - 1 ? 0 : currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Notifications
  useEffect(() => {
    AsyncStorage.getItem("notifications").then((data) => {
      if (data && JSON.parse(data).length > 0) setHasNotification(true);
    });
  }, []);

  const handleNotifications = async () => {
    const data = await AsyncStorage.getItem("notifications");
    if (!data || JSON.parse(data).length === 0) {
      Alert.alert("Bildirishnomalar", "Hozircha xabar yo'q");
      setHasNotification(false);
      return;
    }
    const notifs = JSON.parse(data);
    Alert.alert(notifs[0].title, notifs[0].message);
    setHasNotification(false);
  };

  // Search filter
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return products.filter(
      (p) =>
        p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  // Section header
  const renderSectionHeader = useCallback(
    (title: string, onSeeAll?: () => void) => (
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn}>
            <Text style={s.seeAllText}>Barchasi</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    ),
    []
  );

  // Dot indicators
  const renderDots = () => (
    <View style={s.dotsRow}>
      {BANNERS.map((_, i) => {
        const opacity = scrollX.interpolate({
          inputRange: [
            (i - 1) * (BANNER_W + 12),
            i * (BANNER_W + 12),
            (i + 1) * (BANNER_W + 12),
          ],
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        const scaleX = scrollX.interpolate({
          inputRange: [
            (i - 1) * (BANNER_W + 12),
            i * (BANNER_W + 12),
            (i + 1) * (BANNER_W + 12),
          ],
          outputRange: [1, 2.8, 1],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={i}
            style={[s.dot, { opacity, transform: [{ scaleX }] }]}
          />
        );
      })}
    </View>
  );

  // Banner item
  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <TouchableOpacity
      activeOpacity={0.93}
      style={[s.banner, { backgroundColor: item.bg, width: BANNER_W }]}
      onPress={() => router.push("/catalog" as never)}
    >
      <View style={s.bannerContent}>
        <Text style={[s.bannerTitle, { color: item.titleColor }]}>
          {item.title}
        </Text>
        <Text style={[s.bannerSubtitle, { color: item.subtitleColor }]}>
          {item.subtitle}
        </Text>
        <View style={[s.bannerBtn, { backgroundColor: item.btnBg }]}>
          <Text style={[s.bannerBtnText, { color: item.btnTextColor }]}>
            {item.btnLabel}
          </Text>
        </View>
      </View>
      <Image
        source={{ uri: item.image }}
        style={s.bannerImage}
        contentFit="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.locationRow}>
            <View style={s.locationIcon}>
              <MapPin size={15} color={Colors.primary} />
            </View>
            <View>
              <Text style={s.deliverTo}>Yetkazib berish</Text>
              <Text style={s.address}>Qashqadaryo, Shahrisabz</Text>
            </View>
          </View>

          <TouchableOpacity style={s.notifBtn} onPress={handleNotifications}>
            <Bell size={21} color={Colors.text} />
            {hasNotification && <View style={s.notifDot} />}
          </TouchableOpacity>
        </View>

        <View style={[s.searchBox, isFocused && s.searchBoxFocused]}>
          <Search size={18} color={isFocused ? Colors.primary : Colors.textLight} />
          <TextInput
            style={s.searchInput}
            placeholder="Mahsulotlarni qidiring..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </View>

      {/* ─── Search Results ─── */}
      {filteredProducts ? (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Compact Ramazon Widget */}
          <CompactRamazonWidget />

          {/* Banners with dots */}
          <View style={s.bannerSection}>
            <Animated.FlatList
              ref={flatListRef}
              data={BANNERS}
              horizontal
              pagingEnabled={false}
              snapToInterval={BANNER_W + 12}
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
              onMomentumScrollEnd={(
                e: NativeSyntheticEvent<NativeScrollEvent>
              ) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / (BANNER_W + 12)
                );
                setCurrentIndex(idx);
              }}
            />
            {renderDots()}
          </View>

          {/* Categories */}
          {renderSectionHeader("Kategoriyalar", () =>
            router.push("/catalog" as never)
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </ScrollView>

          {/* Featured */}
          {renderSectionHeader("Mashhur mahsulotlar", () =>
            router.push("/catalog" as never)
          )}
          <FlatList
            data={featuredProducts}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <View style={{ width: 160 }}>
                <ProductCard product={item} />
              </View>
            )}
          />

          {/* Sale */}
          {saleProducts?.length > 0 && (
            <>
              {renderSectionHeader("🔥 Aksiyalar", () =>
                router.push("/catalog" as never)
              )}
              <FlatList
                data={saleProducts}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <View style={{ width: 160 }}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            </>
          )}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#e8f7ee",
    justifyContent: "center",
    alignItems: "center",
  },
  deliverTo: { fontSize: 11, color: Colors.textSecondary, fontWeight: "500" },
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
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  searchBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    marginLeft: 8,
  },

  scroll: { paddingTop: 14 },

  // Banners
  bannerSection: { marginBottom: 4 },
  banner: {
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    height: 148,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerContent: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  bannerTitle: { fontSize: 17, fontWeight: "800", lineHeight: 22 },
  bannerSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 4, lineHeight: 17 },
  bannerBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 12,
  },
  bannerBtnText: { fontWeight: "700", fontSize: 13 },
  bannerImage: { width: 130, height: "100%" },

  // Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { color: Colors.primary, fontWeight: "600", fontSize: 14 },
});
