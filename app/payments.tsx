import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Copy,
  CheckCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const CARD_NUMBER = "9860 1201 3619 1216";
const CARD_OWNER = "Asadov A.";

const PAYMENT_APPS = [
  {
    id: "payme",
    name: "Payme",
    description: "Payme ilovasi orqali to'lash",
    color: "#33CCCC",
    bgColor: "#E6FAFA",
    url: "https://payme.uz/",
  },
  {
    id: "click",
    name: "Click",
    description: "Click ilovasi orqali to'lash",
    color: "#00B4FF",
    bgColor: "#E6F6FF",
    url: "https://my.click.uz/",
  },
  {
    id: "paynet",
    name: "Paynet",
    description: "Paynet ilovasi orqali to'lash",
    color: "#ED1C24",
    bgColor: "#FEE8E8",
    url: "https://paynet.uz/",
  },
];

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyCard = () => {
    Clipboard.setString(CARD_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = (url: string, name: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Xatolik", `${name} ilovasini ochib bo'lmadi`);
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To'lov usullari</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Karta ma'lumoti */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardBankName}>Do'konimiz kartasi</Text>
              <CreditCard size={28} color={Colors.white} />
            </View>
            <Text style={styles.cardNumber}>{CARD_NUMBER}</Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardLabel}>Karta egasi</Text>
                <Text style={styles.cardOwner}>{CARD_OWNER}</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                onPress={handleCopyCard}
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} color={Colors.white} />
                    <Text style={styles.copyBtnText}>Nusxalandi!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color={Colors.white} />
                    <Text style={styles.copyBtnText}>Nusxalash</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* To'lov usullari */}
        <Text style={styles.sectionTitle}>To'lov qilish usullari</Text>

        {/* Naqd pul */}
        <View style={styles.methodCard}>
          <View style={[styles.methodIcon, { backgroundColor: "#E8F5EE" }]}>
            <Banknote size={24} color={Colors.primary} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Naqd pul</Text>
            <Text style={styles.methodDesc}>
              Yetkazib berganda kuryer qo'liga to'lang
            </Text>
          </View>
        </View>

        {/* Karta orqali */}
        <View style={styles.methodCard}>
          <View style={[styles.methodIcon, { backgroundColor: "#EEF2FF" }]}>
            <CreditCard size={24} color="#6366F1" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Karta orqali o'tkazma</Text>
            <Text style={styles.methodDesc}>
              Yuqoridagi karta raqamiga o'tkazma qiling
            </Text>
          </View>
        </View>

        {/* To'lov ilovalari */}
        <Text style={styles.sectionTitle}>To'lov ilovalari</Text>
        <Text style={styles.sectionSubtitle}>
          Qulay ilova orqali karta raqamiga to'lov qiling
        </Text>

        {PAYMENT_APPS.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            onPress={() => handleOpenApp(app.url, app.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.appIcon, { backgroundColor: app.bgColor }]}>
              <Smartphone size={24} color={app.color} />
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: app.color }]}>
                {app.name}
              </Text>
              <Text style={styles.appDesc}>{app.description}</Text>
            </View>
            <View style={[styles.appBtn, { backgroundColor: app.bgColor }]}>
              <ExternalLink size={18} color={app.color} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Eslatma */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📌 Eslatma</Text>
          <Text style={styles.noteText}>
            To'lov qilgandan so'ng buyurtma berishni unutmang. To'lov haqida
            kuryer bilan gaplashishingiz mumkin.
          </Text>
        </View>

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
  cardContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardBankName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  cardOwner: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyBtnSuccess: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: -6,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  methodDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: "700",
  },
  appDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteCard: {
    backgroundColor: "#FFF8E6",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
