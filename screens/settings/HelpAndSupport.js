import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import { Feather, Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';


export default function HelpAndSupport() {

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
                <Text style={styles.text}>Help & Support</Text>
                <View style={{width:24}}></View>
            </View>
        {/* Help Card */}
              <View style={styles.card}>
                {/* Chat with us */}
                <TouchableOpacity style={styles.row}>
                  <Feather name="message-circle" size={22} color="#FFC107" />
                  <View style={styles.textBox}>
                    <Text style={styles.title}>Chat with us</Text>
                    <Text style={styles.desc}>
                      Get help with rides or accounts related issues, available 24/7
                    </Text>
                  </View>
                </TouchableOpacity>
        
                {/* Call us */}
                <TouchableOpacity style={styles.row}>
                  <Feather name="phone" size={22} color="#FFC107" />
                  <View style={styles.textBox}>
                    <Text style={styles.title}>Call us</Text>
                    <Text style={styles.desc}>Get help with rides or account related issues, available</Text>
                    <Text style={styles.desc}>Monday - Friday, 8am - 9pm</Text>
                  </View>
                </TouchableOpacity>
        
                {/* Send us an email */}
                <TouchableOpacity style={styles.row}>
                  <MaterialIcons name="email" size={22} color="#FFC107" />
                  <View style={styles.textBox}>
                    <Text style={styles.title}>Send us an email</Text>
                    <Text style={styles.desc}>
                      Get help with rides or account related issues, available 24/7
                    </Text>
                  </View>
                </TouchableOpacity>
        
                {/* FAQ */}
                <TouchableOpacity style={styles.row}>
                  <Entypo name="help" size={22} color="#FFC107" />
                  <View style={styles.textBox}>
                    <Text style={styles.title}>FAQ</Text>
                    <Text style={styles.desc}>
                      Get quick help from our frequently asked questions
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>    
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
   card: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(255, 193, 7, 0.3)',
  },
  textBox: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});