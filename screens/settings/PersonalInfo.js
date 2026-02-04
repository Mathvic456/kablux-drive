import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { useProfile } from "../../services/profile.service";
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 768;

export default function PersonalInfo() {

  const { data: user } = useProfile()

  const navigation = useNavigation();
  const goBack = () => { navigation.goBack(); }
  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };



  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'column', gap: 25 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack}><Ionicons name="arrow-back-circle" size={isSmallScreen ? 28 : 32} color="white" /></TouchableOpacity>
          <Text style={styles.text}>Personal Info</Text>
          <View style={{ width: isSmallScreen ? 20 : 24 }}></View>
        </View>

        {/* section 1 */}
        <View
          style={{
            backgroundColor: "#04223A",
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: "#f7b731",
            marginBottom: 20,
            flexDirection: "column",
            gap: 20
            // width: '100%',
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name="mail"
                size={scaleSize(22)}
                color="#f7b731"
              />
              <Text style={styles.text2}>{user?.email || 'N/A'}</Text>
            </View>

            <TouchableOpacity>
              <Ionicons
                name="pencil"
                size={scaleSize(22)}
                color="#f7b731"
              />
            </TouchableOpacity>

          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name="call"
                size={scaleSize(22)}
                color="#f7b731"
              />
              <Text style={styles.text2}>{user?.phone_number || 'N/A'}</Text>
            </View>

            <TouchableOpacity>
              <Ionicons
                name="pencil"
                size={scaleSize(22)}
                color="#f7b731"
              />
            </TouchableOpacity>

          </View>

        </View>

        {/* section 2 */}
        <View style={{ flex: 1, flexDirection: 'column', gap: 15, alignItems: 'center' }}>
          <Text style={styles.text2}>Other Info</Text>

          <View
            style={{
              backgroundColor: "#04223A",
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: "#f7b731",
              marginBottom: 20,
              flexDirection: "column",
              gap: 20,
              width: '100%',
            }}
          >
            <Image
              source={require('../../assets/images/car-red.png')}
            />

            

          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 15,
  },
  text: {
    fontSize: isSmallScreen ? 24 : isLargeScreen ? 36 : 30,
    color: 'white', alignSelf: 'center',
    justifyContent: 'center'
  },
  text2: {
    fontFamily: 'Manrope',
    fontWeight: 600,
    fontSize: 16,
    leading: 24,
    tracking: '0%',
    color: '#FFFFFF',
  }

});
