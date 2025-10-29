import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import OrderCard from "./OrderCard";
import { useNavigation } from "@react-navigation/native";

const RideOrders = () => {
  const navigation = useNavigation();
  const goToPriceDetails = () => {
    navigation.navigate("Map");
  }
  const [hasOrders, setHasOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    
    setTimeout(() => {
      setHasOrders(!hasOrders);
      setRefreshing(false);
    }, 1000);
  };

  const mockOrders = [
    {
      id: "EZ213456",
      name: "Azeez",
      rating: 4.2,
      price: "NGN 8,000",
      info: "11 min   Thomas Estate Abraham Adesanya   3.7 KM"
    },
    {
      id: "EZ213457",
      name: "Chinedu",
      rating: 4.5,
      price: "NGN 6,500",
      info: "8 min   Lekki Phase 1   Ikoyi   2.5 KM"
    },
    {
      id: "EZ213458",
      name: "Amara",
      rating: 4.8,
      price: "NGN 10,200",
      info: "15 min   Victoria Island   Ajah   5.2 KM"
    },
    {
      id: "EZ213459",
      name: "Tunde",
      rating: 4.0,
      price: "NGN 7,500",
      info: "13 min   Surulere   Yaba   4.1 KM"
    },
    {
      id: "EZ213460",
      name: "Bola",
      rating: 4.7,
      price: "NGN 9,800",
      info: "18 min   Ikeja   Maryland   6.3 KM"
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header with Refresh Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Ride Orders</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, refreshing && styles.refreshing]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#888" : "#FFD700"} 
          />
        </TouchableOpacity>
      </View>

      {hasOrders ? (
        // Orders List - No need for nested ScrollView since parent is scrollable
        <View style={styles.ordersContainer}>
          {mockOrders.map((order) => (
            <OrderCard 
              key={order.id}
              name={order.name}
              rating={order.rating}
              price={order.price}
              info={order.info}
              id={order.id}
            />
          ))}
        </View>
      ) : (
        // Empty State
        <View style={styles.emptyContainer}>
          <View style={styles.content}>
            <Image
              source={require("../../assets/Box.png")}
              style={styles.image}
            />
            <Text style={styles.message}>No ride orders yet</Text>
            <Text style={styles.subMessage}>
              Pull down to refresh or tap the refresh button above
            </Text>
          </View>
        </View>
      )}

      {/* Refresh Indicator */}
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <Ionicons name="refresh" size={18} color="#FFD700" />
          <Text style={styles.refreshText}>Loading orders...</Text>
        </View>
      )}
    </View>
  );
};

export default RideOrders;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: "transparent",
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
  },
  refreshing: {
    opacity: 0.5,
  },
  // Orders List Styles
  ordersContainer: {
    backgroundColor: "transparent",
    gap: 12,
  },
  // Empty State Styles
  emptyContainer: {
    backgroundColor: "transparent",
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 15,
    opacity: 0.7,
  },
  message: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.8,
  },
  subMessage: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  refreshIndicator: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 30, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  refreshText: {
    color: "#FFD700",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});