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

const PaymentInformation = ({ navigation }) => {

    const nextScreen = () => {
        navigation.navigate('SetPaymentInfo');
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

        <Text style={styles.title}>Payment Information</Text>
        <Text style={styles.subtitle}>
            Add your bank info and payment pin
        </Text>

        {/* Image */}
        <View style={styles.IDUpload}>
            <Image source={require('../../assets/password.png')} style={{width:'100%', height:'100%', resizeMode:'contain'}} />
        </View>


        {/* Texts */}
        <View style={styles.Texts}>
            <MaterialIcons name="security" size={30} color="white" />
            <Text style={{color:'white',fontSize:27, fontStyle:'normal', fontWeight:'bold'}}>Secure and Easy Sign In</Text>
        </View>
        <Text style={{color:'white',fontSize:17, fontStyle:'normal', fontWeight:'bold',marginLeft:50}}>Use your fingerprint or face ID to quickly and securely sign in to your account.</Text>


        <View style={styles.Texts}>
            <Octicons name="arrow-switch" size={30} color="white" />
            <Text style={{color:'white',fontSize:27, fontStyle:'normal', fontWeight:'bold'}}>Cheaper Transactions</Text>
        </View>
        <Text style={{color:'white',fontSize:17, fontStyle:'normal', fontWeight:'bold',marginLeft:50}}>Use your fingerprint or face ID to quickly and securely sign in to your account.</Text>


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
    marginTop: 30,
    alignItems: "center",
    fontStyle:'bold'
  },
  proceedText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  Texts:{
    marginTop:20,
    // borderWidth:1,
    borderColor:"#555",
    borderStyle:"solid",
    flexDirection:"row",
    gap:10,
  },

});

export default PaymentInformation;