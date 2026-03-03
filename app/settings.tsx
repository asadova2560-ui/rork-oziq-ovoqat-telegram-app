import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Globe,
  Moon,
  Shield,
  Info,
  Star,
  MessageCircle,
  ChevronRight,
} from "lucide-react-native";
import Colors from "@/constants/colors";

type Language = "uz" | "ru" | "en";

const LANGUAGES: Array<{ id: Language; label: string; flag: string }> = [
  { id: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { id: "ru", label: "Русский", flag: "🇷🇺" },
  { id: "en", label: "English", flag: "🇬🇧" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>("uz");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.id === selectedLang);

  const handleSelectLang = (lang: Language) => {
    setSelectedLang(lang);
    setShowLangPicker(false);
    Alert.alert(
      "Til o'zgartirildi",
      `${LANGUAGES.find((l) => l.id === lang)?.label} tili tanlandi`,
      [{ text: "OK" }]
    );
  };

  const handleDarkMode = (value: boolean) => {
    setDarkMode(value);
    Alert.alert(
      "Tungi rejim",
      value
        ? "Tungi rejim yoqildi (tez orada qo'shiladi)"
        : "Tungi rejim o'chirildi",
      [{ text: "OK" }]
    );
  };

  const handleRate = () => {
    Linking.openURL("https://t.me/cmfrttab").catch(() => {
      Alert.alert("Xatolik", "Ochib bo'lmadi");
    });
  };

  const handleFeedback = () => {
    Linking.openURL("https://t.me/cmfrttab").catch(() => {
      Alert.alert("Xatolik", "Ochib bo'lmadi");
    });
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Maxfiylik siyosati",
      "Biz sizning ma'lumotlaringizni uchinchi shaxslarga bermаymiz. Barcha ma'lumotlar faqat buyurtma jarayoni uchun ishlatiladi.",
      [{ text: "Tushunarli" }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Ilova haqida",
      "Green Market | Grocery\nVersiya: 1.0.0\n\nToza va sifatli mahsulotlar yetkazib berish xizmati.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sozlamalar</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Bildirishnomalar */}
        <Text style={styles.sectionTitle}>Bildirishnomalar</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5EE" }]}>
                <Bell size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Bildirishnomalar</Text>
                <Text style={styles.rowSubtitle}>Barcha xabarlar</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                if (!value) setOrderNotifications(false);
              }}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#FFF0EA" }]}>
                <Bell size={20} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Buyurtma holati</Text>
                <Text style={styles.rowSubtitle}>Yangilanishlar haqida</Text>
              </View>
            </View>
            <Switch
              value={orderNotifications && notifications}
              onValueChange={(value) => {
                if (!notifications) {
                  Alert.alert(
                    "Diqqat",
                    "Avval umumiy bildirishnomalarni yoqing"
                  );
                  return;
                }
                setOrderNotifications(value);
              }}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Ko'rinish */}
        <Text style={styles.sectionTitle}>Ko'rinish</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
                <Moon size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Tungi rejim</Text>
                <Text style={styles.rowSubtitle}>Qorong'u tema</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkMode}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Til */}
        <Text style={styles.sectionTitle}>Til</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#E6F3FF" }]}>
                <Globe size={20} color="#0088cc" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Til</Text>
                <Text style={styles.rowSubtitle}>
                  {currentLang?.flag} {currentLang?.label}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>

          {showLangPicker && (
            <>
              <View style={styles.divider} />
              {LANGUAGES.map((lang, index) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.langOption,
                    selectedLang === lang.id && styles.langOptionActive,
                    index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
                  ]}
                  onPress={() => handleSelectLang(lang.id)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      selectedLang === lang.id && styles.langLabelActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {selectedLang === lang.id && (
                    <View style={styles.langCheck}>
                      <Text style={styles.langCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Ilova */}
        <Text style={styles.sectionTitle}>Ilova</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleRate}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#FFF8E6" }]}>
                <Star size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Baholash</Text>
                <Text style={styles.rowSubtitle}>Fikringizni bildiring</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleFeedback}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#E6F3FF" }]}>
                <MessageCircle size={20} color="#0088cc" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Fikr-mulohaza</Text>
                <Text style={styles.rowSubtitle}>Telegram orqali yozing</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handlePrivacy}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5EE" }]}>
                <Shield size={20} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Maxfiylik siyosati</Text>
                <Text style={styles.rowSubtitle}>Ma'lumotlar xavfsizligi</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleAbout}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: Colors.surfaceSecondary }]}>
                <Info size={20} color={Colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Ilova haqida</Text>
                <Text style={styles.rowSubtitle}>Versiya 1.0.0</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Green Market © 2025 • Versiya 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  langOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  langLabelActive: {
    fontWeight: "700",
    color: Colors.primary,
  },
  langCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  langCheckText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  version: {
    textAlign: "center",
    color: Colors.textLight,
    fontSize: 13,
    marginTop: 24,
  },
});
