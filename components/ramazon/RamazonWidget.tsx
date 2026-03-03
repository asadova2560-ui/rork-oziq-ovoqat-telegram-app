import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

/* ─── Jadval (Qarshi / Shahrisabz) ─────────────────────────────── */
const ramazonData = [
  { date: 19, month: 2, saharlik: "06:07", iftorlik: "18:22" },
  { date: 20, month: 2, saharlik: "06:06", iftorlik: "18:23" },
  { date: 21, month: 2, saharlik: "06:05", iftorlik: "18:25" },
  { date: 22, month: 2, saharlik: "06:04", iftorlik: "18:26" },
  { date: 23, month: 2, saharlik: "06:02", iftorlik: "18:27" },
  { date: 24, month: 2, saharlik: "06:01", iftorlik: "18:28" },
  { date: 25, month: 2, saharlik: "06:00", iftorlik: "18:29" },
  { date: 26, month: 2, saharlik: "05:59", iftorlik: "18:30" },
  { date: 27, month: 2, saharlik: "05:57", iftorlik: "18:31" },
  { date: 28, month: 2, saharlik: "05:56", iftorlik: "18:32" },
  { date: 1,  month: 3, saharlik: "05:54", iftorlik: "18:33" },
  { date: 2,  month: 3, saharlik: "05:53", iftorlik: "18:34" },
  { date: 3,  month: 3, saharlik: "05:52", iftorlik: "18:35" },
  { date: 4,  month: 3, saharlik: "05:50", iftorlik: "18:36" },
  { date: 5,  month: 3, saharlik: "05:49", iftorlik: "18:37" },
  { date: 6,  month: 3, saharlik: "05:47", iftorlik: "18:38" },
  { date: 7,  month: 3, saharlik: "05:46", iftorlik: "18:39" },
  { date: 8,  month: 3, saharlik: "05:44", iftorlik: "18:40" },
  { date: 9,  month: 3, saharlik: "05:43", iftorlik: "18:41" },
  { date: 10, month: 3, saharlik: "05:41", iftorlik: "18:42" },
  { date: 11, month: 3, saharlik: "05:40", iftorlik: "18:43" },
  { date: 12, month: 3, saharlik: "05:38", iftorlik: "18:44" },
  { date: 13, month: 3, saharlik: "05:36", iftorlik: "18:45" },
  { date: 14, month: 3, saharlik: "05:35", iftorlik: "18:46" },
  { date: 15, month: 3, saharlik: "05:33", iftorlik: "18:47" },
  { date: 16, month: 3, saharlik: "05:32", iftorlik: "18:48" },
  { date: 17, month: 3, saharlik: "05:30", iftorlik: "18:49" },
  { date: 18, month: 3, saharlik: "05:28", iftorlik: "18:50" },
  { date: 19, month: 3, saharlik: "05:27", iftorlik: "18:51" },
  { date: 20, month: 3, saharlik: "05:25", iftorlik: "18:52" },
];

function adj(time: string, minus: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m - minus;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function find(d: Date) {
  return ramazonData.find(
    (x) => x.date === d.getDate() && x.month === d.getMonth() + 1
  ) ?? null;
}

const DAYS_UZ = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
const MON_SHORT = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];

/* ─── Countdown hook ────────────────────────────────────────────── */
function useCountdown(iftorTime: string) {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const [th, tm] = iftorTime.split(":").map(Number);
      const target = new Date();
      target.setHours(th, tm, 0, 0);
      let diff = target.getTime() - now.getTime();
      if (diff < 0) diff += 86400000;
      const hh = Math.floor(diff / 3600000);
      const mm = Math.floor((diff % 3600000) / 60000);
      const ss = Math.floor((diff % 60000) / 1000);
      setLabel(
        `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iftorTime]);
  return label;
}

/* ─── Widget ─────────────────────────────────────────────────────── */
export default function RamazonWidget() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (today > new Date(2026, 2, 20)) return null;

  const todayE = find(today);
  if (!todayE) return null;
  const tomE = find(tomorrow);

  const sahar0 = adj(todayE.saharlik, 4);
  const iftor0 = adj(todayE.iftorlik, 3);
  const sahar1 = tomE ? adj(tomE.saharlik, 4) : "–";
  const iftor1 = tomE ? adj(tomE.iftorlik, 3) : "–";

  const countdown = useCountdown(iftor0);

  const ramazonStart = new Date(2026, 1, 19);
  const dayNum = Math.max(1, Math.floor((today.getTime() - ramazonStart.getTime()) / 86400000) + 1);

  return (
    <View style={s.wrap}>
      {/* ── Header bar ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.moonGlyph}>☽</Text>
          <View>
            <Text style={s.titleText}>Ramazon 2026</Text>
            <Text style={s.subText}>Shahrisabz · {dayNum}/30 kun</Text>
          </View>
        </View>
        <View style={s.cdBox}>
          <Text style={s.cdLabel}>Iftorgacha</Text>
          <Text style={s.cdTime}>{countdown}</Text>
        </View>
      </View>

      {/* ── Two-day grid ── */}
      <View style={s.grid}>
        {/* TODAY */}
        <View style={s.dayCard}>
          <View style={s.dayTag}>
            <Text style={s.dayTagText}>Bugun</Text>
          </View>
          <Text style={s.dayName}>{DAYS_UZ[today.getDay()]}</Text>
          <Text style={s.dayDate}>{today.getDate()} {MON_SHORT[today.getMonth()]}</Text>
          <View style={s.spacer} />
          <View style={s.timeItem}>
            <Text style={s.timeEmoji}>🌅</Text>
            <View>
              <Text style={s.itemLabel}>Saharlik</Text>
              <Text style={s.itemTime}>{sahar0}</Text>
            </View>
          </View>
          <View style={s.timeItem}>
            <Text style={s.timeEmoji}>🌇</Text>
            <View>
              <Text style={s.itemLabel}>Iftorlik</Text>
              <Text style={[s.itemTime, s.gold]}>{iftor0}</Text>
            </View>
          </View>
        </View>

        {/* TOMORROW */}
        <View style={[s.dayCard, s.dayCardDim]}>
          <View style={[s.dayTag, s.dayTagDim]}>
            <Text style={[s.dayTagText, s.dayTagTextDim]}>Ertaga</Text>
          </View>
          <Text style={[s.dayName, s.dimText]}>{DAYS_UZ[tomorrow.getDay()]}</Text>
          <Text style={[s.dayDate, s.dimText]}>{tomorrow.getDate()} {MON_SHORT[tomorrow.getMonth()]}</Text>
          <View style={s.spacer} />
          <View style={s.timeItem}>
            <Text style={s.timeEmoji}>🌅</Text>
            <View>
              <Text style={[s.itemLabel, s.dimLabel]}>Saharlik</Text>
              <Text style={[s.itemTime, s.dimText]}>{sahar1}</Text>
            </View>
          </View>
          <View style={s.timeItem}>
            <Text style={s.timeEmoji}>🌇</Text>
            <View>
              <Text style={[s.itemLabel, s.dimLabel]}>Iftorlik</Text>
              <Text style={[s.itemTime, s.goldDim]}>{iftor1}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── Palette ─────────────────────────────────────────────────────
   Deep forest green + warm gold. Premium, calm, readable.
──────────────────────────────────────────────────────────────────── */
const BG       = "#0e6642";
const BG_CARD  = "rgba(255,255,255,0.10)";
const BG_DIM   = "rgba(255,255,255,0.05)";
const WHITE    = "#ffffff";
const GOLD     = "#f7c948";
const GOLD_DIM = "rgba(247,201,72,0.55)";
const MUTED    = "rgba(255,255,255,0.55)";
const TAG_BG   = "rgba(247,201,72,0.20)";
const TAG_BORDER = "rgba(247,201,72,0.45)";

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: BG,
    overflow: "hidden",
    shadowColor: BG,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  moonGlyph: { fontSize: 26, color: GOLD },
  titleText: { color: WHITE, fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
  subText: { color: MUTED, fontSize: 11, fontWeight: "500", marginTop: 1 },

  /* Countdown */
  cdBox: { alignItems: "flex-end" },
  cdLabel: { color: MUTED, fontSize: 10, fontWeight: "500", marginBottom: 2 },
  cdTime: {
    color: GOLD,
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 1.5,
    fontVariant: ["tabular-nums"] as any,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
  },

  /* Day card */
  dayCard: {
    flex: 1,
    backgroundColor: BG_CARD,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  dayCardDim: {
    backgroundColor: BG_DIM,
  },

  /* Tag */
  dayTag: {
    alignSelf: "flex-start",
    backgroundColor: TAG_BG,
    borderWidth: 1,
    borderColor: TAG_BORDER,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  dayTagDim: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  dayTagText: { color: GOLD, fontWeight: "700", fontSize: 11 },
  dayTagTextDim: { color: MUTED },

  dayName: { color: WHITE, fontWeight: "700", fontSize: 14 },
  dayDate: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "500" },
  dimText: { color: "rgba(255,255,255,0.45)" },
  dimLabel: { color: "rgba(255,255,255,0.35)" },

  spacer: { height: 8 },

  /* Time rows */
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  timeEmoji: { fontSize: 14 },
  itemLabel: { color: MUTED, fontSize: 10, fontWeight: "500" },
  itemTime: { color: WHITE, fontWeight: "700", fontSize: 15 },
  gold: { color: GOLD },
  goldDim: { color: GOLD_DIM },
});
