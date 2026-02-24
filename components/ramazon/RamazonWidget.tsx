import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

/* Qarshi jadvali */
const ramazonData = [
  { date: 19, saharlik: "06:07", iftorlik: "18:22" },
  { date: 20, saharlik: "06:06", iftorlik: "18:23" },
  { date: 21, saharlik: "06:05", iftorlik: "18:25" },
  { date: 22, saharlik: "06:04", iftorlik: "18:26" },
  { date: 23, saharlik: "06:02", iftorlik: "18:27" },
  { date: 24, saharlik: "06:01", iftorlik: "18:28" },
  { date: 25, saharlik: "06:00", iftorlik: "18:29" },
  { date: 26, saharlik: "05:59", iftorlik: "18:30" },
  { date: 27, saharlik: "05:57", iftorlik: "18:31" },
  { date: 28, saharlik: "05:56", iftorlik: "18:32" },
  { date: 1, saharlik: "05:54", iftorlik: "18:33" },
  { date: 2, saharlik: "05:53", iftorlik: "18:34" },
  { date: 3, saharlik: "05:52", iftorlik: "18:35" },
  { date: 4, saharlik: "05:50", iftorlik: "18:36" },
  { date: 5, saharlik: "05:49", iftorlik: "18:37" },
  { date: 6, saharlik: "05:47", iftorlik: "18:38" },
  { date: 7, saharlik: "05:46", iftorlik: "18:39" },
  { date: 8, saharlik: "05:44", iftorlik: "18:40" },
  { date: 9, saharlik: "05:43", iftorlik: "18:41" },
  { date: 10, saharlik: "05:41", iftorlik: "18:42" },
  { date: 11, saharlik: "05:40", iftorlik: "18:43" },
  { date: 12, saharlik: "05:38", iftorlik: "18:44" },
  { date: 13, saharlik: "05:36", iftorlik: "18:45" },
  { date: 14, saharlik: "05:35", iftorlik: "18:46" },
  { date: 15, saharlik: "05:33", iftorlik: "18:47" },
  { date: 16, saharlik: "05:32", iftorlik: "18:48" },
  { date: 17, saharlik: "05:30", iftorlik: "18:49" },
  { date: 18, saharlik: "05:28", iftorlik: "18:50" },
  { date: 19, saharlik: "05:27", iftorlik: "18:51" },
  { date: 20, saharlik: "05:25", iftorlik: "18:52" },
];

/* -4 va -3 minut hisoblash */
function adjustTime(time: string, minus: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute - minus;

  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function RamazonWidget() {
  const todayDate = new Date().getDate();

  const todayData = ramazonData.find(
    (item) => item.date === todayDate
  );

  const saharlik = todayData
    ? adjustTime(todayData.saharlik, 4) // -4 minut
    : "--:--";

  const iftorlik = todayData
    ? adjustTime(todayData.iftorlik, 3) // -3 minut
    : "--:--";

  const todayText = new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌙 Ramazon</Text>
      <Text style={styles.date}>{todayText}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Saharlik</Text>
        <Text style={styles.time}>{saharlik}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Iftorlik</Text>
        <Text style={styles.time}>{iftorlik}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 18,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  date: {
    color: "#fff",
    opacity: 0.9,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: {
    color: "#fff",
    fontSize: 16,
  },
  time: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
