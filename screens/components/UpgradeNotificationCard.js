import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const UpgradeNotificationCard = () => {
  return (
    <View style={styles.container}>
      {/* Left section - Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          You're a tier 1 user — upgrade to tier 2 for more coverage
        </Text>
        <Text style={styles.subtitle}>
          Finish registration today to enjoy more benefits from Kablux
        </Text>
        {/* <Image
          source={require("../../assets/Profileimg.png")}
          style={styles.avatar}
        /> */}
      </View>

      {/* Right section - Illustration */}
      <Image
        source={require("../../assets/Reg.png")}
        style={styles.illustration}
      />
    </View>
  );
};

export default UpgradeNotificationCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#7B0000",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: "white",
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "white",
    fontSize: 14,
    opacity: 0.9,
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    marginTop: 10,
  },
  illustration: {
    width: 70,
    height: 100,
    resizeMode: "cover",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
