import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import { Feather, Entypo, FontAwesome } from '@expo/vector-icons';


export default function LoginAndSecurity() {

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
                <Text style={styles.text}>Login & Security</Text>
                <View style={{width:24}}></View>
            </View>
        <View style={styles.box}>
              {/* Change Password */}
              <TouchableOpacity style={styles.row}>
                <Feather name="lock" size={20} color="#FFC107" />
                <Text style={styles.rowText}>Change Password</Text>
              </TouchableOpacity>
      
              <View style={styles.divider} />
      
              {/* Set up Passkeys */}
              <TouchableOpacity style={styles.row}>
                <Feather name="key" size={20} color="#FFC107" />
                <Text style={styles.rowText}>Set up Passkeys</Text>
                <Entypo
                  name="chevron-right"
                  size={18}
                  color="#FFC107"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
      
              <View style={styles.divider} />
      
              {/* Link Google */}
              <TouchableOpacity style={styles.row}>
                <FontAwesome name="google" size={20} color="#FFC107" />
                <Text style={styles.rowText}>Link Google</Text>
                <Entypo
                  name="chevron-right"
                  size={18}
                  color="#FFC107"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            </View>
      
            {/* Info Text */}
            <Text style={styles.infoText}>
              Linking a social account allows you to sign in to KabLUX with ease. We will not use your
              social account for anything else without your permission.
            </Text>
      
            {/* Invite Friends Button */}
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteText}>Invite Friends</Text>
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
    gap:20,
    // justifyContent:'center',
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
    // borderColor:'blue',
  },
  
  content: {
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
    // marginTop: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    color: 'white',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: 16,
  },
  infoText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 40,
  },
  inviteButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    marginTop:'auto'
  },
  inviteText: {
    color: '#04223A',
    fontSize: 16,
    fontWeight: '600',
  },
});