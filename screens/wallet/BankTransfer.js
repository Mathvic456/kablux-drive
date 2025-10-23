import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome, Entypo, MaterialIcons, Feather, Ionicons   } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BankTransferComponents from '../components/BankTransferComponents';


export default function BankTransfer() {
    const navigation = useNavigation();
    const goBack = () => {
        navigation.goBack();
    }
  return (
    <View style={styles.container}>
        <View style={styles.headerMain}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.text}>Bank Transfer</Text>
                <View style={{width:24}}></View>
        </View>
        <BankTransferComponents />
    </View>
  )}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 40,
    gap:40,
  },
  text: {
    fontSize: 30,
    color:'white',
    alignSelf:'center',
    justifyContent:'center',
  },
  headerMain:{
    flexDirection:'row',
    justifyContent:'space-between',
  },
  header: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  activeText: {
    color: '#FFC107',
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 16,
  },
  activeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  activeSub: {
    color: '#aaa',
    fontSize: 13,
  },
  otherMethodsButton: {
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  otherMethodsText: {
    color: 'white',
    fontSize: 13,
  },
  methodsCard: {
    backgroundColor: '#04223A',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  methodText: {
    color: 'white',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
  },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  addText: {
    color: '#FFC107',
    fontSize: 15,
  },
});
