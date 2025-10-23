import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar } from "react-native";

export default function WhatDoYouDriveScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Logo Section */}
      <View style={styles.logoContainer}>
       <Image
        source={require("./../../assets/Logo.png")}
        style={styles.logoImage}
        resizeMode="contain"
      />
      </View>

      {/* Car Image */}
      <View>
      <Image
        source={require("./../../assets/sportscar.png")}
        style={styles.carImage}
        resizeMode="contain"
      />
      </View>

      {/* Text Section */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>What do you drive?</Text>
        <Text style={styles.subtitle}>
          Year and factor can greatly influence rides offered and invites to
          represent us with Vvips
        </Text>

        <View style={styles.dots}>
          <View style={styles.dotActive} />
          <View style={styles.dotInactive} />
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    borderWidth:1,
    borderColor:'white',
    justifyContent:'space-evenly',
    width:'100%'
    // height:'100%'
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 50,
    borderWidth:1,
    borderColor:'white',
  },
  logoLine: {
    width: 100,
    height: 2,
    backgroundColor: "#FFD600",
    borderRadius: 2,
  },
  carImage: {
    width: "80%",
    height: 220,
    marginTop: 50,
    borderWidth:1,
    borderColor:'white',
    paddingRight:200
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 25,
    marginTop: 40,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 30,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD600",
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#555",
  },
  skipButton: {
    width: "90%",
    height: 48,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoImage: {
    width: 200,
    height: 50,
  },
});
