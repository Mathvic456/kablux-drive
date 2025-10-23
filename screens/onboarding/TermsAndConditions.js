import { FontAwesome, MaterialIcons, Feather, FontAwesome5, SimpleLineIcons } from "@expo/vector-icons";
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/Logo.png";
import { useNavigation } from '@react-navigation/native';

const TermsAndConditions = ({ navigation }) => {

    const nextScreen = () => {
        navigation.navigate('DocumentUploads');
    }
 
  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner} />

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.LogoContainer}>
          <Image source={Logo} style={styles.Logoicon} />
        </View>

         <View style={styles.IconContainer}>
            <Feather name="mail" size={30} color="#fcbf24" />
         </View>

        <Text style={styles.title}>Password Setup</Text>
        <Text style={styles.subtitle}>
            Let’s create a new Password or Pin
        </Text>

         {/*  */}
        <TouchableOpacity
                  style={styles.proceedBtn}
                  textStyle={styles.proceedText}
                  onPress={nextScreen}
                >
                    <Text >Proceed</Text>
        
                </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    height: 200,
    backgroundColor: "#0B2633",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  card: {
    flex: 1,
    marginTop: -40,
    backgroundColor: "#000",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    width: "95%",
    alignSelf: "center",
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fcbf24",
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  Logoicon: {
    width: 130,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
  },
  IDUpload:{
    // borderWidth:1,
    borderColor:"#555",
    borderStyle:"dashed",
    height: '30%',
  },
  proceedBtn: {
    backgroundColor: "#fcbf24",
    borderRadius: 10,
    paddingVertical: 20,
    marginTop: 20,
    alignItems: "center",
    fontStyle:'bold'
  },
   IconContainer: {
    borderColor: '#fcbf24',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FEB91454'
  },
  proceedText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
},
  IconContainer:{
    borderColor: '#fcbf24',
    padding: 20,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FEB91454',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1a1a1a",
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    height: "100%",
  },

});

export default TermsAndConditions;