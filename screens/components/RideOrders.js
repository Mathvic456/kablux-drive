import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import OrderCard from "./OrderCard"; // Make sure to import OrderCard

const RideOrders = () => {
  const [hasOrders, setHasOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setHasOrders(!hasOrders); // Toggle between empty and having orders
      setRefreshing(false);
    }, 1000);
  };

  // Mock data for multiple orders (you can replace with actual data)
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
      {/* Header with Refresh Button - Fixed at top */}
      <View style={styles.header}>
        <Text style={styles.title}>Ride Order</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, refreshing && styles.refreshing]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={22} 
            color={refreshing ? "#888" : "#FFD700"} 
          />
        </TouchableOpacity>
      </View>

      {hasOrders ? (
        // Scrollable Orders List with Pull-to-Refresh
        <ScrollView 
          style={styles.ordersContainer}
          contentContainerStyle={styles.ordersContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD700"
              colors={["#FFD700"]}
            />
          }
        >
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
          
          {/* Add some bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        // Scrollable Empty State (in case of tall screens)
        <ScrollView 
          style={styles.emptyContainer}
          contentContainerStyle={styles.emptyContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD700"
              colors={["#FFD700"]}
            />
          }
        >
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
        </ScrollView>
      )}

      {/* Refresh Indicator */}
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <Ionicons name="refresh" size={20} color="#FFD700" />
          <Text style={styles.refreshText}>Loading orders...</Text>
        </View>
      )}
    </View>
  );
};

export default RideOrders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    borderWidth: 1,
    // borderColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "black",
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
    flex: 1,
    backgroundColor: "black",
  },
  ordersContentContainer: {
    paddingHorizontal: 25,
    paddingTop: 0,
    paddingBottom: 30, // Extra padding at bottom for better scroll
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  image: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    marginBottom: 10,
  },
  message: {
    color: "white",
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  subMessage: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 20,
  },
  refreshIndicator: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 30, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  refreshText: {
    color: "#FFD700",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});