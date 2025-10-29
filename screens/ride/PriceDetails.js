import React, { useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import ttt from '../../assets/map.png';


export default function PriceDetailsScreen() {

  const navigation = useNavigation();
  const RideDetails = () => {
    navigation.navigate('RideDetails')
  }

    const goBack = () => {
        navigation.goBack();
    }


  const [selectedPrice, setSelectedPrice] = useState("₦8,000");

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <ImageBackground
        source={require("../../assets/map.png")} // replace with your map image
        style={styles.mapBackground}
        resizeMode="cover"
      />

      {/* Overlay Bottom Sheet */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Price Details</Text>
          </View>

          {/* Pickup and Dropoff */}
          <View style={styles.locationBox}>
            <View style={styles.locationItem}>
              <Ionicons name="location" size={18} color="#FFC107" />
              <View style={styles.textBox}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.value}>Abraham Adesanya Estate</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <MaterialIcons name="location-pin" size={18} color="#FFC107" />
              <View style={styles.textBox}>
                <Text style={styles.label}>Dropoff</Text>
                <Text style={styles.value}>Sunview Estate Ajah Lagos</Text>
              </View>
            </View>
          </View>

          {/* Based Offer */}
          <View style={styles.offerBox}>
            <Text style={styles.offerLabel}>Based Offer</Text>
            <Text style={styles.offerPrice}>NGN 8,000</Text>
          </View>

          {/* Price Suggestions */}
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionLabel}>Price Suggestion</Text>
            <View style={styles.priceRow}>
              {["₦8,500", "₦8,000", "₦9,500"].map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[
                    styles.priceOption,
                    selectedPrice === price && styles.selectedPrice,
                  ]}
                  onPress={() => setSelectedPrice(price)}
                >
                  <Text
                    style={[
                      styles.priceText,
                      selectedPrice === price && styles.selectedPriceText,
                    ]}
                  >
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Accept and Close Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.acceptBtn} onPress={RideDetails}>
              <Text style={styles.acceptText}>Accept for {selectedPrice}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mapBackground: {
    width: "100%",
    height: "50%",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "60%",
    backgroundColor: "#0D0D0D",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 50,
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  locationBox: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  textBox: {
    marginLeft: 10,
  },
  label: {
    color: "#888",
    fontSize: 12,
  },
  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  offerBox: {
    marginBottom: 20,
  },
  offerLabel: {
    color: "#888",
    fontSize: 12,
  },
  offerPrice: {
    color: "#FFC107",
    fontSize: 22,
    fontWeight: "bold",
  },
  suggestionBox: {
    marginBottom: 25,
  },
  suggestionLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedPrice: {
    backgroundColor: "#FFC107",
    borderColor: "#FFC107",
  },
  priceText: {
    color: "#fff",
    fontWeight: "600",
  },
  selectedPriceText: {
    color: "#000",
  },
  buttonGroup: {
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptText: {
    color: "#000",
    fontWeight: "700",
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
  },
});
