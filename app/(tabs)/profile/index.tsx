import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  MapPin,
  CreditCard,
  Clock,
  HelpCircle,
  Settings,
  ChevronRight,
  Phone,
  Star,
  MessageCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CONTACT_PHONE } from "@/constants/config";

const ADMIN_PIN = "25012004";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
}

function MenuItem({ icon, label, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuIconContainer}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tgUser, setTgUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const user = (window as any).Telegram.WebApp.initDataUnsafe?.user;
      if (user) setTgUser(user);
    }
  }, []);

  const checkPin = () => {
    if (pin === ADMIN_PIN) {
      setModalVisible(false);
      setPin("");
      router.push("/admin");
    } else {
      Alert.alert("Xato", "Noto‘g‘ri PIN");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* USER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color={Colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {tgUser?.first_name || "Foydalanuvchi"}
            </Text>
            <Text style={styles.profilePhone}>
              {tgUser?.username
                ? `@${tgUser.username}`
                : tgUser?.id
                ? `ID: ${tgUser.id}`
                : CONTACT_PHONE}
            </Text>
          </View>
        </View>

        {/* ASOSIY */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Asosiy</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Clock size={20} color={Colors.primary} />}
              label="Buyurtmalar tarixi"
              subtitle="Oxirgi buyurtmalaringiz"
              onPress={() => router.push("/orders")}
            />
            <MenuItem
              icon={<MapPin size={20} color={Colors.accent} />}
              label="Manzillarim"
              subtitle="Yetkazib berish manzillari"
              onPress={() => router.push("/addresses")}
            />
            <MenuItem
              icon={<CreditCard size={20} color="#6366F1" />}
              label="To'lov usullari"
              subtitle="Karta va naqd pul"
              onPress={() => router.push("/payments")}
            />
            <MenuItem
              icon={<Star size={20} color="#F59E0B" />}
              label="Sevimlilar"
              subtitle="Saqlangan mahsulotlar"
              onPress={() => router.push("/favorites")}
            />
          </View>
        </View>

        {/* QO‘SHIMCHA */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Qo'shimcha</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Phone size={20} color={Colors.primary} />}
              label="Aloqa"
              subtitle={CONTACT_PHONE}
              onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}
            />
            <MenuItem
              icon={<MessageCircle size={20} color="#0088cc" />}
              label="Telegram orqali yozish"
              subtitle="Savollaringiz bo'lsa yozing"
              onPress={() => Linking.openURL("https://t.me/+998200012560")}
            />
            <MenuItem
              icon={<HelpCircle size={20} color="#8B5CF6" />}
              label="Yordam"
              subtitle="Ko'p so'raladigan savollar"
              onPress={() => Alert.alert("Yordam", "Tez orada qo‘shiladi")}
            />
            <MenuItem
              icon={<Settings size={20} color={Colors.textSecondary} />}
              label="Sozlamalar"
              subtitle="Tilni o'zgartirish va boshqalar"
              onPress={() => Alert.alert("Sozlamalar", "Tez orada qo‘shiladi")}
            />
            <MenuItem
              icon={<Settings size={20} color="red" />}
              label="Admin Panel"
              subtitle="Mahsulotlarni boshqarish"
              onPress={() => setModalVisible(true)}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PIN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Admin PIN</Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              placeholder="PIN kiriting"
              keyboardType="numeric"
              secureTextEntry
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={checkPin}>
              <Text style={styles.buttonText}>Kirish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: "gray" }}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 20,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700", color: Colors.text },
  profilePhone: { fontSize: 14, color: Colors.textSecondary },
  menuSection: { marginTop: 22, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginBottom: 8 },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: Colors.text },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 280,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontWeight: "700" },
});
