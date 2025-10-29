import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

const reviews = [
  {
    id: 1,
    name: "James eminado",
    rating: 5,
    comment: "clean and neat\nGood music",
    date: "Oct 30 - 14:50",
    mood: "emoticon-happy-outline",
  },
  {
    id: 2,
    name: "James eminado",
    rating: 2,
    comment: "seat were smelling\ntoo rough",
    date: "Oct 29 - 14:50",
    mood: "emoticon-sad-outline",
  },
  {
    id: 3,
    name: "James eminado",
    rating: 5,
    comment: "clean and neat\nGood music",
    date: "Oct 30 - 14:50",
    mood: "emoticon-happy-outline",
  },
];

export default function TopUp() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Booking</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.mainRating}>3.2</Text>
          <FontAwesome name="star" size={22} color="#FFB800" />
        </View>
        <Text style={styles.subtitle}>Based on the last 25 rides</Text>

        {/* Tab Header */}
        <View style={styles.tabRow}>
          <View style={styles.tabIndicator} />
          <Text style={styles.tabText}>Ride History</Text>
          <View style={styles.tabIndicator} />
        </View>

        {/* Section: Today */}
        <Text style={styles.sectionTitle}>Today</Text>
        <ReviewCard {...reviews[0]} />

        {/* Section: Yesterday */}
        <Text style={styles.sectionTitle}>Yesterday</Text>
        {reviews.slice(1).map((r) => (
          <ReviewCard key={r.id} {...r} />
        ))}
      </ScrollView>
    </View>
  );
}

const ReviewCard = ({ name, rating, comment, date, mood }) => (
  <View style={styles.reviewCard}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
      <MaterialCommunityIcons name={mood} size={28} color="#FFB800" />
      <Text style={styles.reviewerName}>{name}</Text>
    </View>

    {/* Rating Stars */}
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FontAwesome
          key={s}
          name={s <= rating ? "star" : "star-o"}
          size={18}
          color="#FFB800"
          style={{ marginRight: 3 }}
        />
      ))}
    </View>

    <Text style={styles.comment}>{comment}</Text>

    <View style={styles.dateRow}>
      <FontAwesome name="calendar" size={14} color="#FFB800" />
      <Text style={styles.dateText}>{date}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mainRating: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginRight: 6,
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tabIndicator: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FFB800",
    marginHorizontal: 10,
  },
  tabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 10,
  },
  reviewCard: {
    backgroundColor: "#0F1B2D",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFB800",
    marginBottom: 15,
  },
  reviewerName: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  comment: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 6,
  },
});
