import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OrderCard({ name, rating, price, info, id }) {
  return (
    <View style={styles.card}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.leftTop}>
          <Image
            source={require("../../assets/Profileimg.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{name || "Azeez"}</Text>
        </View>

        <View style={styles.rightTop}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{rating || "4.2"}</Text>
        </View>
      </View>

      {/* Price Section */}
      <Text style={styles.price}>{price || "NGN 8,000"}</Text>

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.info}>
          {info || "11 min   Thomas Estate Abraham Adesanya   3.7 KM"}
        </Text>
        <Text style={styles.id}>{id || "EZ213456"}</Text>
      </View>
    </View>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  rightTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  price: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  info: {
    color: "#b0b0b0",
    fontSize: 13,
    flexShrink: 1,
  },
  id: {
    color: "#b0b0b0",
    fontSize: 13,
    fontWeight: "600",
  },
});
