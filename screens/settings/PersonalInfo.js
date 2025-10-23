import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ScreenHeaders from '../components/ScreenHeaders'; 
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';



export default function PersonalInfo() {

    const navigation = useNavigation();
    const goBack = () => {
        navigation.goBack();
    }

  return (
    <View style={styles.container}>
      <ScreenHeaders screenname={"Personal Info"} />
      {/* Security Options Box */}
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
          <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <View style={styles.divider} />

        {/* Link Google */}
        <TouchableOpacity style={styles.row}>
          <FontAwesome name="google" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Link Google</Text>
          <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
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
    gap:30,
    justifyContent:'center',
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
  }
});