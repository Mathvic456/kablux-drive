import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import { Feather, Entypo, FontAwesome, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';


export default function SafetyActions() {

    const navigation = useNavigation();
    const goBack = () => {
        navigation.goBack();
    }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.text}>Safety Actions</Text>
                <View style={{width:24}}></View>
            </View>    


            {/* Message Support */}
                  <TouchableOpacity style={styles.row}>
                    <FontAwesome5 name="user-friends" size={20} color="#FFC107" />
                    <Text style={styles.rowText}>Message KabLux support</Text>
                  </TouchableOpacity>
            
                  {/* Report Issue */}
                  <TouchableOpacity style={styles.row}>
                    <Entypo name="warning" size={22} color="#FFC107" />
                    <Text style={styles.rowText}>Report issue with customer</Text>
                  </TouchableOpacity>
            
                  {/* Call the Police */}
                  <TouchableOpacity style={styles.row}>
                    <MaterialIcons name="local-police" size={22} color="#FF4B4B" />
                    <Text style={[styles.rowText, { color: "#FF4B4B" }]}>Call the Police</Text>
                  </TouchableOpacity>
            
                  {/* Share Location */}
                  <TouchableOpacity style={styles.row}>
                    <Feather name="share-2" size={20} color="#FFC107" />
                    <Text style={styles.rowText}>Share Location</Text>
                  </TouchableOpacity>
            
                  {/* Record Audio */}
                  <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]}>
                    <Feather name="mic-off" size={20} color="#FFC107" />
                    <Text style={styles.rowText}>Record audio</Text>
                  </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:20,
    paddingTop:50,
    backgroundColor: 'black',
    gap:30,
  },
  text: {
    fontSize: 30,
    color:'white',
    alignSelf:'center',
    justifyContent:'center',
  },
  header:{
    flexDirection:'row',
    justifyContent:'space-between',
    borderWidth:1,
  },
  
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.7,
    borderBottomColor: "rgba(255, 193, 7, 0.4)",
    paddingVertical: 18,
  },
  rowText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
  },
  noteText: {
    color: "#ccc",
    fontSize: 13,
    marginTop: 40,
    lineHeight: 18,
  },
});