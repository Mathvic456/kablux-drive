import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  FlatList,
} from "react-native";
import {
  Ionicons,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { useNavigation } from "@react-navigation/native";
import { useProfile, useEditProfile } from "../../services/profile.service";

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 768;

const CARD_PADDING = 20;
const CAROUSEL_WIDTH = width - (CARD_PADDING * 2) - 40; // account for container padding + card padding

export default function PersonalInfo() {
  const { data: user } = useProfile();
  const navigation = useNavigation();
  const editProfile = useEditProfile();
  const goBack = () => { navigation.goBack(); };

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const carouselRef = useRef(null);

  const scaleSize = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.2));
  };

  const handleEdit = useCallback((field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || "");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = useCallback((field) => {
    const trimmed = editValue.trim();
    const original = user?.[field] || "";

    setEditingField(null);

    if (trimmed === original || trimmed === "") return;

    editProfile.mutate(
      { id: user.id, [field]: trimmed },
      {
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.detail ||
            "Failed to update. Please try again.";
          Alert.alert("Update Failed", message);
        },
      }
    );
  }, [editValue, user, editProfile]);

  const copyReferral = (code) => {
    if (!code) return;
    Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Referral code copied to clipboard");
  };

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    setActiveIndex(index);
  };

  const InfoRow = ({ icon, field, value, editable, keyboardType = "default" }) => {
    const isEditing = editingField === field;

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Ionicons name={icon} size={scaleSize(22)} color="#f7b731" />
          {isEditing ? (
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={() => handleSubmit(field)}
              autoFocus
              returnKeyType="done"
              keyboardType={keyboardType}
              autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
              autoCorrect={keyboardType !== "email-address"}
              onSubmitEditing={() => handleSubmit(field)}
            />
          ) : (
            <Text style={styles.text2}>
              {value || 'N/A'}
            </Text>
          )}
        </View>
        {editable && !isEditing && (
          <TouchableOpacity style={styles.pencilBtn} onPress={() => handleEdit(field, value)}>
            <Ionicons name="pencil" size={scaleSize(22)} color="#f7b731" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const VehicleSpecRow = ({ label, value }) => (
    <View style={styles.comp}>
      <Text style={styles.textSmall}>{label}</Text>
      <Text style={styles.textSmall}>{value || 'N/A'}</Text>
    </View>
  );

  const vehicleImages = user?.vehicle?.images || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'column', gap: 25 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back-circle" size={isSmallScreen ? 28 : 32} color="white" />
          </TouchableOpacity>
          <Text style={styles.text}>Personal Info</Text>
          <View style={{ width: isSmallScreen ? 20 : 24 }} />
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <InfoRow icon="person" field="first_name" value={user?.first_name} editable />
          <InfoRow icon="person" field="last_name" value={user?.last_name} editable />
          <InfoRow icon="mail" field="email" value={user?.email} editable keyboardType="email-address" />
          <InfoRow icon="call" field="phone_number" value={user?.phone_number} editable keyboardType="phone-pad" />
          <InfoRow icon="location" field="address" value={user?.address} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="gift" size={scaleSize(22)} color="#f7b731" />
              <Text style={styles.text2}>
                {user?.referral_code || "N/A"}
              </Text>
            </View>
            {user?.referral_code && (
              <TouchableOpacity
                style={styles.pencilBtn}
                onPress={() => copyReferral(user?.referral_code)}
              >
                <Ionicons name="copy-outline" size={scaleSize(22)} color="#f7b731" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 2 - Vehicle Info */}
        <View style={{ flex: 1, flexDirection: 'column', gap: 15, alignItems: 'center' }}>
          <Text style={styles.text2}>Other Info</Text>

          <View style={[styles.card, { width: '100%' }]}>

            {/* Image Carousel */}
            {vehicleImages.length > 0 ? (
              <View>
                <FlatList
                  ref={carouselRef}
                  data={vehicleImages}
                  horizontal
                  pagingEnabled
                  snapToInterval={CAROUSEL_WIDTH}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={{ width: CAROUSEL_WIDTH }}>
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageTypeBadge}>
                        <Text style={styles.imageTypeText}>{item.image_type}</Text>
                      </View>
                    </View>
                  )}
                />

                {/* Dot indicators */}
                <View style={styles.dotsContainer}>
                  {vehicleImages.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === activeIndex ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <Image
                source={require('../../assets/images/car-red.png')}
                style={{ width: '100%', resizeMode: 'contain' }}
              />
            )}

            {/* Vehicle Specs */}
            <View>
              <Text style={styles.textHeader}>Specifications</Text>
              <View style={{ flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <VehicleSpecRow label="Model" value={user?.vehicle?.model} />
                <VehicleSpecRow label="Color" value={user?.vehicle?.color} />
                <VehicleSpecRow label="Plate Number" value={user?.vehicle?.plate_number} />
                <VehicleSpecRow label="Year" value={user?.vehicle?.year} />
              </View>
            </View>

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
    color: 'white',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  text2: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  textInput: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
    flexShrink: 1,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f7b731',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: "#0B2633",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f7b731",
    marginBottom: 20,
    flexDirection: "column",
    gap: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  pencilBtn: {
    flexShrink: 0,
  },
  carouselImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageTypeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f7b731',
  },
  imageTypeText: {
    color: '#f7b731',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#f7b731',
    width: 20,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: '#555',
  },
  comp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: "#000",
    borderRadius: 8,
    borderColor: "#1F212A",
    borderWidth: 1,
    padding: 15,
  },
  textSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  textHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});