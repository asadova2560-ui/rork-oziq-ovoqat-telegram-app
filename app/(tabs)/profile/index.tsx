import React, { useEffect, useState } from "react";
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
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
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

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const user = (window as any).Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
      }
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

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

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Buyurtmalar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Manzillar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Baho</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Asosiy</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Clock size={20} color={Colors.primary} />}
              label="Buyurtmalar tarixi"
              subtitle="Oxirgi buyurtmalaringiz"
            />
            <MenuItem
              icon={<MapPin size={20} color={Colors.accent} />}
              label="Manzillarim"
              subtitle="Yetkazib berish manzillari"
            />
            <MenuItem
              icon={<CreditCard size={20} color="#6366F1" />}
              label="To'lov usullari"
              subtitle="Karta va naqd pul"
            />
            <MenuItem
              icon={<Star size={20} color="#F59E0B" />}
              label="Sevimlilar"
              subtitle="Saqlangan mahsulotlar"
            />
          </View>
        </View>

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
            />
            <MenuItem
              icon={<Settings size={20} color={Colors.textSecondary} />}
              label="Sozlamalar"
              subtitle="Tilni o'zgartirish va boshqalar"
            />

            <MenuItem
              icon={<Settings size={20} color="red" />}
              label="Admin Panel"
              subtitle="Mahsulotlarni boshqarish"
              onPress={() => {
                const pin = prompt("Admin PIN kiriting");
                if (pin === ADMIN_PIN) {
                  router.push("/admin");
                } else {
                  alert("Noto‘g‘ri PIN");
                }
              }}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
    marginHorizontal: 16,
    marginTop: 16,
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
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  menuSection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
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
  bottomSpacer: {
    height: 40,
  },
});
