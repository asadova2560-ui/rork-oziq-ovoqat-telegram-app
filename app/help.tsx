import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";

const faqs = [
  { q: "Buyurtma qancha vaqtda yetkaziladi?", a: "Buyurtmalar odatda 1-2 soat ichida yetkaziladi. Ish vaqti: 09:00 - 21:00." },
  { q: "Minimal buyurtma miqdori bormi?", a: "Minimal buyurtma miqdori 30,000 so'm." },
  { q: "Yetkazib berish pullikmi?", a: "50,000 so'mdan yuqori buyurtmalarda yetkazib berish bepul. Undan past bo'lsa 10,000 so'm." },
  { q: "Buyurtmani bekor qilish mumkinmi?", a: "Ha, buyurtma tayyorlanishidan oldin bekor qilish mumkin. Aloqa orqali murojaat qiling." },
  { q: "To'lov qanday amalga oshiriladi?", a: "Naqd pul yoki karta orqali to'lash mumkin." },
  { q: "Mahsulot sifati yoqmasa nima qilaman?", a: "Bizga xabar bering, mahsulotni almashtirамиз yoki pulni qaytaramiz." },
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Ko'p so'raladigan savollar</Text>
        {faqs.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => setOpenIndex(openIndex === index ? null : index)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.question}>{item.q}</Text>
              {openIndex === index
                ? <ChevronUp size={20} color={Colors.primary} />
                : <ChevronDown size={20} color={Colors.textLight} />}
            </View>
            {openIndex === index && (
              <Text style={styles.answer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  content: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  question: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  answer: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, lineHeight: 20 },
});
