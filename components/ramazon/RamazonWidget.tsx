import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";

type Props = {
  onPress?: () => void;
};

function adjustTime(time: string, diff: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + diff;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const RamazonWidget: React.FC<Props> = ({ onPress }) => {
  // Qarshi vaqti (example — o‘zing jadvaldan qo‘yasan)
  const qarshiSaharlik = "05:47";
  const qarshiIftor = "18:38";

  // Shahrisabz farqi
  const saharlik = adjustTime(qarshiSaharlik, -4);
  const iftor = adjustTime(qarshiIftor, -3);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.title}>🌙 Ramazon</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Saharlik</Text>
        <Text style={styles.time}>{saharlik}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Iftorlik</Text>
        <Text style={styles.time}>{iftor}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0F5132",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#D1E7DD",
    fontSize: 14,
  },
  time: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
