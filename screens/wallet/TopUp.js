import { View, Text, StyleSheet, Touchable, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function TopUp() {

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
        <Text style={styles.text}>Bank Transfer</Text>
        <View style={{width:24}}></View>
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
    justifyContent:'center',
  },
  text: {
    fontSize: 30,
    color:'white',
    alignSelf:'center',
    justifyContent:'center',
  },
  header:{
    // borderWidth:1,
    // borderColor:'white',
    flexDirection:'row',
    justifyContent:'space-between',
  }
});