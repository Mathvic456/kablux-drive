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
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import { useProfile, useEditProfile } from "../../services/profile.service";

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isLargeScreen = width > 768;

export default function PersonalInfo() {
  const { data: user } = useProfile();
  const navigation = useNavigation();
  const editProfile = useEditProfile();
  const goBack = () => { navigation.goBack(); };

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  const scaleFont = (size) => {
    const scaleFactor = width / 375;
    return Math.round(size * Math.min(scaleFactor, 1.3));
  };

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
      { [field]: trimmed },
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

  const InfoRow = ({ icon, field, value, editable }) => {
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
          <InfoRow icon="mail" field="email" value={user?.email} />
          <InfoRow icon="call" field="phone_number" value={user?.phone_number} />
          <InfoRow icon="location" field="address" value={user?.address} />
        </View>

        {/* Section 2 */}
        <View style={{ flex: 1, flexDirection: 'column', gap: 15, alignItems: 'center' }}>
          <Text style={styles.text2}>Other Info</Text>
          <View style={[styles.card, { width: '100%' }]}>
            <Image source={require('../../assets/images/car-red.png')} style={{ width: '100%', resizeMode: 'contain' }} />
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
    backgroundColor: "#04223A",
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
});
