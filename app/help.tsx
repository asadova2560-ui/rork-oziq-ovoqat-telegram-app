import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageCircle,
  Clock,
  Truck,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CONTACT_PHONE } from "@/constants/config";

const faqs = [
  {
    q: "Buyurtma qancha vaqtda yetkaziladi?",
    a: "Yetkazib berish vaqti Yandex Go tomonidan belgilanadi. Buyurtma berilgandan so'ng kuryer tez orada yo'lga chiqadi. Aniq vaqtni kuryer bilan bog'lanib bilib olishingiz mumkin.",
  },
  {
    q: "Do'kon ish vaqti qanday?",
    a: "Biz har kuni 07:00 dan 23:00 gacha ishlaymiz. Shu vaqt oralig'ida buyurtma berishingiz va yetkazib berish xizmatidan foydalanishingiz mumkin.",
  },
  {
    q: "Minimal buyurtma miqdori bormi?",
    a: "Minimal buyurtma miqdori 30,000 so'm.",
  },
  {
    q: "Yetkazib berish pullikmi?",
    a: "Yetkazib berish narxi Yandex Go tomonidan avtomatik hisoblanadi va buyurtma miqdoriga qarab farq qilishi mumkin.",
  },
  {
    q: "Buyurtmani bekor qilish mumkinmi?",
    a: "Ha, buyurtma tayyorlanishidan oldin bekor qilish mumkin. Iltimos, tezroq aloqa bo'limiga murojaat qiling.",
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: "Naqd pul, karta orqali o'tkazma (Payme, Click, Paynet) yoki yetkazib berganda to'lash mumkin.",
  },
  {
    q: "Mahsulot sifati yoqmasa nima qilaman?",
    a: "Bizga tezda xabar bering — mahsulotni almashtirамиз yoki pulni qaytaramiz. Sifat bizning ustuvorligimiz!",
  },
  {
    q: "Buyurtmani kuzatib borish mumkinmi?",
    a: "Ha, kuryer yo'lga chiqqandan so'ng u siz bilan bog'lanadi. Shuningdek, telefon orqali ham so'rab bilishingiz mumkin.",
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yordam</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Ish vaqti va yetkazish */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: "#E8F5EE" }]}>
              <Clock size={22} color={Colors.primary} />
            </View>
            <Text style={styles.infoLabel}>Ish vaqti</Text>
            <Text style={styles.infoValue}>07:00 — 23:00</Text>
            <Text style={styles.infoSub}>Har kuni</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: "#FFF0EA" }]}>
              <Truck size={22} color={Colors.accent} />
            </View>
            <Text style={styles.infoLabel}>Yetkazib berish</Text>
            <Text style={styles.infoValue}>Yandex Go</Text>
            <Text style={styles.infoSub}>Tez va ishonchli</Text>
          </View>
        </View>

        {/* Aloqa */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Bizga murojaat qiling</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#E8F5EE" }]}>
              <Phone size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.contactBtnTitle}>Telefon</Text>
              <Text style={styles.contactBtnSub}>{CONTACT_PHONE}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.contactDivider} />
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("https://t.me/cmfrttab")}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#E6F3FF" }]}>
              <MessageCircle size={20} color="#0088cc" />
            </View>
            <View>
              <Text style={styles.contactBtnTitle}>Telegram</Text>
              <Text style={styles.contactBtnSub}>@cmfrttab</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.faqTitle}>Ko'p so'raladigan savollar</Text>

        {faqs.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqCard, openIndex === index && styles.faqCardOpen]}
            onPress={() => setOpenIndex(openIndex === index ? null : index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.question}>{item.q}</Text>
              {openIndex === index ? (
                <ChevronUp size={20} color={Colors.primary} />
              ) : (
                <ChevronDown size={20} color={Colors.textLight} />
              )}
            </View>
            {openIndex === index && (
              <Text style={styles.answer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

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
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  contactBtnTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  contactBtnSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  faqTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  faqCardOpen: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  answer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 22,
  },
});
