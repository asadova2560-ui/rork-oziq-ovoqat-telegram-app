import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft, TrendingUp, ShoppingBag, Users, DollarSign,
  Award, BarChart2, Package, ChevronRight, Calendar,
  ArrowUpRight, ArrowDownRight, Star, Crown, Zap,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/utils/formatPrice";

const { width: SW } = Dimensions.get("window");

// ─── Types ─────────────────────────────────────────────────────────────────
type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
};

type Period = "today" | "week" | "month" | "all";

type CustomerABC = {
  name: string;
  phone: string;
  total: number;
  orderCount: number;
  class: "A" | "B" | "C";
};

type TopProduct = {
  name: string;
  qty: number;
  revenue: number;
};

type DailyData = {
  label: string;
  revenue: number;
  orders: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const startOf = (period: Period): Date => {
  const d = new Date();
  if (period === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (period === "week") { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if (period === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
  return new Date(0);
};

const dayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][d.getDay()];
};

const shortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()}-${d.getMonth() + 1}`;
};

// ─── Mini Bar Chart ─────────────────────────────────────────────────────────
function MiniBarChart({ data, color = Colors.primary }: { data: DailyData[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <View style={ch.wrap}>
      {data.map((d, i) => (
        <View key={i} style={ch.col}>
          <View style={ch.barWrap}>
            <View style={[ch.bar, { height: `${Math.max((d.revenue / max) * 100, 4)}%`, backgroundColor: color }]} />
          </View>
          <Text style={ch.lbl}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const ch = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4, paddingTop: 8 },
  col: { flex: 1, alignItems: "center", gap: 4 },
  barWrap: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4, minHeight: 4 },
  lbl: { fontSize: 9, color: Colors.textLight, fontWeight: "600" },
});

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; trend?: number;
}) {
  return (
    <View style={[kpi.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={[kpi.icon, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={kpi.val}>{value}</Text>
      <Text style={kpi.lbl}>{label}</Text>
      {sub !== undefined && (
        <View style={kpi.trendRow}>
          {trend !== undefined && trend >= 0
            ? <ArrowUpRight size={11} color="#22c55e" />
            : <ArrowDownRight size={11} color={Colors.danger} />}
          <Text style={[kpi.sub, { color: trend !== undefined && trend >= 0 ? "#22c55e" : Colors.danger }]}>{sub}</Text>
        </View>
      )}
    </View>
  );
}

const kpi = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, minWidth: (SW - 52) / 2 },
  icon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  val: { fontSize: 18, fontWeight: "800", color: Colors.text },
  lbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600", marginTop: 2 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  sub: { fontSize: 11, fontWeight: "600" },
});

// ─── ABC Badge ──────────────────────────────────────────────────────────────
const ABC_COLOR = { A: "#f59e0b", B: Colors.primary, C: Colors.textSecondary };
const ABC_BG = { A: "#fef3c7", B: Colors.primaryLight, C: "#f1f5f9" };
const ABC_ICON = { A: Crown, B: Star, C: Zap };

// ═══════════════════════════════════════════════════════════════════════════
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [activeSection, setActiveSection] = useState<"overview" | "customers" | "products" | "orders">("overview");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
  }, []);

  useEffect(() => { fetchOrders().finally(() => setLoading(false)); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // ── Filter by period ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const from = startOf(period);
    return orders.filter((o) => new Date(o.created_at) >= from);
  }, [orders, period]);

  const delivered = useMemo(() => filtered.filter((o) => o.status === "delivered"), [filtered]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => delivered.reduce((s, o) => s + o.total, 0), [delivered]);
  const totalOrders = filtered.length;
  const avgOrder = delivered.length ? totalRevenue / delivered.length : 0;
  const uniqueCustomers = new Set(filtered.map((o) => o.customer_phone)).size;
  const cancelRate = filtered.length ? Math.round((filtered.filter((o) => o.status === "cancelled").length / filtered.length) * 100) : 0;
  const pendingCount = filtered.filter((o) => o.status === "pending").length;

  // ── Previous period for trend ─────────────────────────────────────────────
  const prevRevenue = useMemo(() => {
    const from = startOf(period);
    const diff = Date.now() - from.getTime();
    const prevFrom = new Date(from.getTime() - diff);
    const prevDelivered = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= prevFrom.getTime() && t < from.getTime() && o.status === "delivered";
    });
    return prevDelivered.reduce((s, o) => s + o.total, 0);
  }, [orders, period]);

  const revTrend = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  // ── Daily chart data ──────────────────────────────────────────────────────
  const chartData = useMemo((): DailyData[] => {
    if (period === "today") {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours
        .filter((h) => {
          const d = new Date(); d.setHours(h);
          return d <= new Date();
        })
        .slice(-8)
        .map((h) => {
          const rev = delivered
            .filter((o) => new Date(o.created_at).getHours() === h)
            .reduce((s, o) => s + o.total, 0);
          return { label: `${h}:00`, revenue: rev, orders: 0 };
        });
    }
    if (period === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toDateString();
        const rev = delivered
          .filter((o) => new Date(o.created_at).toDateString() === dateStr)
          .reduce((s, o) => s + o.total, 0);
        return { label: dayLabel(d.toISOString()), revenue: rev, orders: 0 };
      });
    }
    // month / all — last 10 days with data
    const byDay: Record<string, number> = {};
    delivered.forEach((o) => {
      const k = shortDate(o.created_at);
      byDay[k] = (byDay[k] || 0) + o.total;
    });
    return Object.entries(byDay).slice(-10).map(([label, revenue]) => ({ label, revenue, orders: 0 }));
  }, [delivered, period]);

  // ── Top Products ──────────────────────────────────────────────────────────
  const topProducts = useMemo((): TopProduct[] => {
    const map: Record<string, TopProduct> = {};
    delivered.forEach((o) => {
      o.items.forEach((item) => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty += item.qty;
        map[item.name].revenue += item.price * item.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [delivered]);

  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  // ── ABC Customers ─────────────────────────────────────────────────────────
  const abcCustomers = useMemo((): CustomerABC[] => {
    const map: Record<string, CustomerABC> = {};
    orders.forEach((o) => {
      if (o.status !== "delivered") return;
      const k = o.customer_phone;
      if (!map[k]) map[k] = { name: o.customer_name, phone: k, total: 0, orderCount: 0, class: "C" };
      map[k].total += o.total;
      map[k].orderCount += 1;
    });
    const list = Object.values(map).sort((a, b) => b.total - a.total);
    const grandTotal = list.reduce((s, c) => s + c.total, 0);
    let cum = 0;
    return list.map((c) => {
      cum += c.total;
      const pct = grandTotal > 0 ? (cum / grandTotal) * 100 : 100;
      return { ...c, class: pct <= 70 ? "A" : pct <= 90 ? "B" : "C" };
    });
  }, [orders]);

  const aCount = abcCustomers.filter((c) => c.class === "A").length;
  const bCount = abcCustomers.filter((c) => c.class === "B").length;
  const cCount = abcCustomers.filter((c) => c.class === "C").length;

  // ── Status colors ─────────────────────────────────────────────────────────
  const statusColor: Record<string, string> = {
    pending: "#f59e0b", confirmed: Colors.primary,
    delivering: "#3b82f6", delivered: "#22c55e", cancelled: Colors.danger,
  };
  const statusLabel: Record<string, string> = {
    pending: "Kutilmoqda", confirmed: "Tasdiqlangan",
    delivering: "Yetkazilmoqda", delivered: "Yetkazildi", cancelled: "Bekor",
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: "Bugun" },
    { key: "week", label: "Hafta" },
    { key: "month", label: "Oy" },
    { key: "all", label: "Hammasi" },
  ];

  const SECTIONS = [
    { key: "overview", label: "Umumiy", icon: BarChart2 },
    { key: "customers", label: "Mijozlar", icon: Users },
    { key: "products", label: "Mahsulot", icon: Package },
    { key: "orders", label: "Buyurtma", icon: ShoppingBag },
  ] as const;

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingTxt}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Analitika</Text>
        <View style={s.backBtn} />
      </View>

      {/* Period selector */}
      <View style={s.periodBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[s.periodBtn, period === p.key && s.periodBtnOn]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[s.periodTxt, period === p.key && s.periodTxtOn]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section tabs */}
      <View style={s.sectionBar}>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <TouchableOpacity
              key={sec.key}
              style={[s.secBtn, activeSection === sec.key && s.secBtnOn]}
              onPress={() => setActiveSection(sec.key as typeof activeSection)}
            >
              <Icon size={14} color={activeSection === sec.key ? Colors.primary : Colors.textLight} />
              <Text style={[s.secTxt, activeSection === sec.key && s.secTxtOn]}>{sec.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >

        {/* ── OVERVIEW ── */}
        {activeSection === "overview" && (
          <>
            {/* KPI grid */}
            <View style={s.kpiGrid}>
              <KpiCard icon={<DollarSign size={18} color="#22c55e" />} label="Daromad" value={formatPrice(totalRevenue)} sub={`${revTrend > 0 ? "+" : ""}${revTrend}% o'tgan davrga`} trend={revTrend} color="#22c55e" />
              <KpiCard icon={<ShoppingBag size={18} color={Colors.primary} />} label="Buyurtmalar" value={`${totalOrders} ta`} sub={`${pendingCount} ta kutmoqda`} trend={0} color={Colors.primary} />
            </View>
            <View style={s.kpiGrid}>
              <KpiCard icon={<TrendingUp size={18} color="#8b5cf6" />} label="O'rtacha chek" value={formatPrice(avgOrder)} color="#8b5cf6" />
              <KpiCard icon={<Users size={18} color="#f59e0b" />} label="Mijozlar" value={`${uniqueCustomers} ta`} sub={`Bekor: ${cancelRate}%`} trend={cancelRate > 20 ? -1 : 1} color="#f59e0b" />
            </View>

            {/* Status summary */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Buyurtma holatlari</Text>
              {(["pending", "confirmed", "delivering", "delivered", "cancelled"] as string[]).map((st) => {
                const cnt = filtered.filter((o) => o.status === st).length;
                const pct = filtered.length ? (cnt / filtered.length) * 100 : 0;
                return (
                  <View key={st} style={s.statusRow}>
                    <View style={[s.statusDot, { backgroundColor: statusColor[st] }]} />
                    <Text style={s.statusLbl}>{statusLabel[st]}</Text>
                    <View style={s.statusBar}>
                      <View style={[s.statusFill, { width: `${pct}%`, backgroundColor: statusColor[st] }]} />
                    </View>
                    <Text style={s.statusCnt}>{cnt}</Text>
                  </View>
                );
              })}
            </View>

            {/* Chart */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Daromad dinamikasi</Text>
              {chartData.length > 0
                ? <MiniBarChart data={chartData} color={Colors.primary} />
                : <Text style={s.empty}>Ma'lumot yo'q</Text>}
              <Text style={s.chartNote}>Jami: {formatPrice(totalRevenue)}</Text>
            </View>

            {/* Payment methods */}
            <View style={s.card}>
              <Text style={s.cardTitle}>To'lov usullari</Text>
              <View style={s.payRow}>
                {(["cash", "card", "online"] as string[]).map((pm) => {
                  const cnt = filtered.filter((o) => o.payment_method === pm).length;
                  const pct = filtered.length ? Math.round((cnt / filtered.length) * 100) : 0;
                  const labels: Record<string, string> = { cash: "💵 Naqd", card: "💳 Karta", online: "📱 Online" };
                  const colors: Record<string, string> = { cash: "#22c55e", card: Colors.primary, online: "#8b5cf6" };
                  return (
                    <View key={pm} style={s.payCard}>
                      <Text style={[s.payPct, { color: colors[pm] }]}>{pct}%</Text>
                      <Text style={s.payLbl}>{labels[pm]}</Text>
                      <Text style={s.payCnt}>{cnt} ta</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── CUSTOMERS (ABC) ── */}
        {activeSection === "customers" && (
          <>
            {/* ABC summary */}
            <View style={s.card}>
              <Text style={s.cardTitle}>ABC Tahlil</Text>
              <Text style={s.cardSub}>Pareto prinsipi: A mijozlar 70% daromad keltiradi</Text>
              <View style={s.abcSummary}>
                {(["A", "B", "C"] as const).map((cls) => {
                  const cnt = { A: aCount, B: bCount, C: cCount }[cls];
                  const Icon = ABC_ICON[cls];
                  return (
                    <View key={cls} style={[s.abcBox, { backgroundColor: ABC_BG[cls] }]}>
                      <Icon size={20} color={ABC_COLOR[cls]} />
                      <Text style={[s.abcClass, { color: ABC_COLOR[cls] }]}>{cls}</Text>
                      <Text style={s.abcCnt}>{cnt} ta</Text>
                      <Text style={s.abcDesc}>{cls === "A" ? "VIP" : cls === "B" ? "Doimiy" : "Yangi"}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Customer list */}
            {abcCustomers.length === 0
              ? <Text style={s.empty}>Mijozlar yo'q</Text>
              : abcCustomers.map((c, i) => {
                const Icon = ABC_ICON[c.class];
                return (
                  <View key={c.phone} style={s.custRow}>
                    <View style={s.custRank}><Text style={s.custRankTxt}>#{i + 1}</Text></View>
                    <View style={[s.abcBadge, { backgroundColor: ABC_BG[c.class] }]}>
                      <Icon size={14} color={ABC_COLOR[c.class]} />
                      <Text style={[s.abcBadgeTxt, { color: ABC_COLOR[c.class] }]}>{c.class}</Text>
                    </View>
                    <View style={s.custInfo}>
                      <Text style={s.custName}>{c.name}</Text>
                      <Text style={s.custPhone}>{c.phone} · {c.orderCount} buyurtma</Text>
                    </View>
                    <Text style={s.custTotal}>{formatPrice(c.total)}</Text>
                  </View>
                );
              })}
          </>
        )}

        {/* ── PRODUCTS ── */}
        {activeSection === "products" && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Eng ko'p sotilgan mahsulotlar</Text>
              <Text style={s.cardSub}>Yetkazilgan buyurtmalar asosida</Text>
            </View>
            {topProducts.length === 0
              ? <Text style={s.empty}>Ma'lumot yo'q</Text>
              : topProducts.map((p, i) => (
                <View key={p.name} style={s.productRow}>
                  <View style={[s.prodRank, i < 3 && s.prodRankTop]}>
                    <Text style={[s.prodRankTxt, i < 3 && s.prodRankTxtTop]}>#{i + 1}</Text>
                  </View>
                  <View style={s.prodInfo}>
                    <Text style={s.prodName}>{p.name}</Text>
                    <View style={s.prodBarWrap}>
                      <View style={[s.prodBar, { width: `${(p.revenue / maxProductRevenue) * 100}%` }]} />
                    </View>
                    <Text style={s.prodQty}>{p.qty} dona sotildi</Text>
                  </View>
                  <Text style={s.prodRev}>{formatPrice(p.revenue)}</Text>
                </View>
              ))}
          </>
        )}

        {/* ── ORDERS ── */}
        {activeSection === "orders" && (
          <>
            <View style={s.orderSummary}>
              <Text style={s.cardTitle}>So'nggi buyurtmalar</Text>
              <Text style={s.cardSub}>{filtered.length} ta buyurtma</Text>
            </View>
            {filtered.length === 0
              ? <Text style={s.empty}>Buyurtmalar yo'q</Text>
              : filtered.slice(0, 50).map((o) => (
                <View key={o.id} style={s.orderRow}>
                  <View style={[s.orderDot, { backgroundColor: statusColor[o.status] }]} />
                  <View style={s.orderInfo}>
                    <Text style={s.orderName}>{o.customer_name}</Text>
                    <Text style={s.orderPhone}>{o.customer_phone}</Text>
                    <Text style={s.orderItems} numberOfLines={1}>
                      {o.items.map((it) => `${it.name} ×${it.qty}`).join(", ")}
                    </Text>
                    <Text style={s.orderDate}>{new Date(o.created_at).toLocaleDateString("uz-UZ")}</Text>
                  </View>
                  <View style={s.orderRight}>
                    <Text style={s.orderTotal}>{formatPrice(o.total)}</Text>
                    <View style={[s.orderStatus, { backgroundColor: statusColor[o.status] + "20" }]}>
                      <Text style={[s.orderStatusTxt, { color: statusColor[o.status] }]}>
                        {statusLabel[o.status]}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingTxt: { fontSize: 14, color: Colors.textSecondary },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },

  periodBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surfaceSecondary },
  periodBtnOn: { backgroundColor: Colors.primary },
  periodTxt: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  periodTxtOn: { color: "#fff" },

  sectionBar: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  secBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  secBtnOn: { borderBottomColor: Colors.primary },
  secTxt: { fontSize: 11, fontWeight: "600", color: Colors.textLight },
  secTxtOn: { color: Colors.primary },

  scroll: { padding: 16, gap: 12 },

  kpiGrid: { flexDirection: "row", gap: 12 },

  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  chartNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, textAlign: "right", fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textLight, fontSize: 14, paddingVertical: 32 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLbl: { width: 110, fontSize: 13, color: Colors.text, fontWeight: "500" },
  statusBar: { flex: 1, height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: "hidden" },
  statusFill: { height: "100%", borderRadius: 3 },
  statusCnt: { width: 28, fontSize: 13, fontWeight: "700", color: Colors.text, textAlign: "right" },

  payRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  payCard: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
  payPct: { fontSize: 20, fontWeight: "800" },
  payLbl: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  payCnt: { fontSize: 11, color: Colors.textLight },

  abcSummary: { flexDirection: "row", gap: 10 },
  abcBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  abcClass: { fontSize: 22, fontWeight: "900" },
  abcCnt: { fontSize: 14, fontWeight: "700", color: Colors.text },
  abcDesc: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },

  custRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 10, marginBottom: 0 },
  custRank: { width: 28, alignItems: "center" },
  custRankTxt: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  abcBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  abcBadgeTxt: { fontSize: 12, fontWeight: "800" },
  custInfo: { flex: 1 },
  custName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  custPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  custTotal: { fontSize: 14, fontWeight: "700", color: Colors.primary },

  productRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 10, marginBottom: 0 },
  prodRank: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.borderLight, justifyContent: "center", alignItems: "center" },
  prodRankTop: { backgroundColor: "#fef3c7" },
  prodRankTxt: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  prodRankTxtTop: { color: "#f59e0b" },
  prodInfo: { flex: 1 },
  prodName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  prodBarWrap: { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, marginVertical: 5, overflow: "hidden" },
  prodBar: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },
  prodQty: { fontSize: 11, color: Colors.textSecondary },
  prodRev: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  orderSummary: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderRow: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 10, alignItems: "flex-start", marginBottom: 0 },
  orderDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  orderInfo: { flex: 1 },
  orderName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  orderPhone: { fontSize: 12, color: Colors.textSecondary },
  orderItems: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  orderDate: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  orderRight: { alignItems: "flex-end", gap: 4 },
  orderTotal: { fontSize: 14, fontWeight: "700", color: Colors.text },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  orderStatusTxt: { fontSize: 11, fontWeight: "700" },
});
