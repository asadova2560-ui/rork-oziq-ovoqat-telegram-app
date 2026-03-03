import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  Alert,
  Modal,
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
  Edit3,
  Check,
  X,
  ShieldCheck,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { CONTACT_PHONE } from "@/constants/config";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  iconBg?: string;
}

function MenuItem({ icon, label, subtitle, onPress, iconBg }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View
        style={[
          styles.menuIconContainer,
          iconBg ? { backgroundColor: iconBg } : {},
        ]}
      >
        {icon}
      </View>
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
  const [userName, setUserName] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    // Telegram dan ma'lumot olish
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const user = (window as any).Telegram.WebApp.initDataUnsafe?.user;
      if (user) setTgUser(user);
    }
    // Saqlangan ma'lumotlarni olish
    AsyncStorage.getItem("user_profile").then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setUserName(parsed.name || "");
        setUserPhone(parsed.phone || "");
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Xatolik", "Ism kiriting");
      return;
    }
    if (!editPhone.trim() || editPhone.trim().length < 9) {
      Alert.alert("Xatolik", "Telefon raqamni to'g'ri kiriting");
      return;
    }
    await AsyncStorage.setItem(
      "user_profile",
      JSON.stringify({ name: editName.trim(), phone: editPhone.trim() })
    );
    setUserName(editName.trim());
    setUserPhone(editPhone.trim());
    setShowEditModal(false);
  };

  const handleEditPress = () => {
    setEditName(userName || tgUser?.first_name || "");
    setEditPhone(userPhone || "");
    setShowEditModal(true);
  };

  const displayName =
    userName || tgUser?.first_name || "Foydalanuvchi";

  const displayPhone =
    userPhone ||
    (tgUser?.username
      ? `@${tgUser.username}`
      : tgUser?.id
      ? `Telegram ID: ${tgUser.id}`
      : "Telefon kiritilmagan");

  const isProfileComplete = !!(userName && userPhone);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Profil kartasi */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.white} />
            </View>
            {isProfileComplete && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color={Colors.white} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profilePhone}>{displayPhone}</Text>
            {!isProfileComplete && (
              <Text style={styles.profileHint}>
                Ma'lumotlaringizni kiriting ↓
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleEditPress}>
            <Edit3 size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Ma'lumot to'liq emas xabari */}
        {!isProfileComplete && (
          <TouchableOpacity
            style={styles.warningCard}
            onPress={handleEditPress}
            activeOpacity={0.8}
          >
            <Text style={styles.warningText}>
              📝 Ism va telefon raqamingizni kiriting — buyurtma berish osonlashadi!
            </Text>
          </TouchableOpacity>
        )}

        {/* Asosiy menyu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Asosiy</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Clock size={20} color={Colors.primary} />}
              iconBg="#E8F5EE"
              label="Buyurtmalar tarixi"
              subtitle="Oxirgi buyurtmalaringiz"
              onPress={() => router.push("/orders")}
            />
            <MenuItem
              icon={<MapPin size={20} color={Colors.accent} />}
              iconBg="#FFF0EA"
              label="Manzillarim"
              subtitle="Yetkazib berish manzillari"
              onPress={() => router.push("/addresses")}
            />
            <MenuItem
              icon={<CreditCard size={20} color="#6366F1" />}
              iconBg="#EEF2FF"
              label="To'lov usullari"
              subtitle="Karta va naqd pul"
              onPress={() => router.push("/payments")}
            />
            <MenuItem
              icon={<Star size={20} color="#F59E0B" />}
              iconBg="#FFF8E6"
              label="Sevimlilar"
              subtitle="Saqlangan mahsulotlar"
              onPress={() => router.push("/favorites")}
            />
          </View>
        </View>

        {/* Qo'shimcha menyu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Qo'shimcha</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Phone size={20} color={Colors.primary} />}
              iconBg="#E8F5EE"
              label="Aloqa"
              subtitle={CONTACT_PHONE}
              onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}
            />
            <MenuItem
              icon={<MessageCircle size={20} color="#0088cc" />}
              iconBg="#E6F3FF"
              label="Telegram orqali yozish"
              subtitle="Savollaringiz bo'lsa yozing"
              onPress={() => Linking.openURL("https://t.me/cmfrttab")}
            />
            <MenuItem
              icon={<HelpCircle size={20} color="#8B5CF6" />}
              iconBg="#F3F0FF"
              label="Yordam"
              subtitle="Ko'p so'raladigan savollar"
              onPress={() => router.push("/help")}
            />
            <MenuItem
              icon={<Settings size={20} color={Colors.textSecondary} />}
              iconBg={Colors.surfaceSecondary}
              label="Sozlamalar"
              subtitle="Tilni o'zgartirish va boshqalar"
              onPress={() => router.push("/settings")}
            />
            <MenuItem
              icon={<Settings size={20} color="#EF4444" />}
              iconBg="#FEE8E8"
              label="Admin Panel"
              subtitle="Mahsulotlarni boshqarish"
              onPress={() => router.push("/admin-login")}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Ma'lumot tahrirlash modali */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ma'lumotlarni tahrirlash</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalAvatarBox}>
              <View style={styles.modalAvatar}>
                <User size={40} color={Colors.white} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Ism Familiya *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masalan: Alisher Karimov"
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.inputLabel}>Telefon raqam *</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textLight}
            />

            {tgUser && (
              <View style={styles.tgInfoCard}>
                <Text style={styles.tgInfoTitle}>Telegram ma'lumotlari</Text>
                <Text style={styles.tgInfoText}>
                  Ism: {tgUser.first_name} {tgUser.last_name || ""}
                </Text>
                {tgUser.username && (
                  <Text style={styles.tgInfoText}>
                    Username: @{tgUser.username}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
            >
              <Check size={20} color={Colors.white} />
              <Text style={styles.saveBtnText}>Saqlash</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 20,
    gap: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileHint: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 4,
    fontWeight: "600",
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  warningCard: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
    backgroundColor: "#FFF8E6",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  menuSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
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
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  modalContent: {
    padding: 16,
  },
  modalAvatarBox: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  tgInfoCard: {
    backgroundColor: "#E6F3FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  tgInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0088cc",
    marginBottom: 6,
  },
  tgInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
});
