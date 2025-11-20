import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const HomeHeader = ({ profile, notificationCount, onMenuPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person-circle" size={40} color="#facc15" />
        </View>
        <Text style={styles.greeting}>
          Hello {profile?.first_name || "Driver"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.notificationContainer}
        onPress={onMenuPress}
      >
        <MaterialCommunityIcons name="menu" size={24} color="white" />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  notificationContainer: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#f44336",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default HomeHeader;



