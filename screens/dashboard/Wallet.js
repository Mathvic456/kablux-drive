// screens/HomeScreen.js
import { View, Text, StyleSheet } from 'react-native';
import BalanceCard from '../components/BalanceCard';
import ActionButtons from '../components/ActionButtons';
import TransactionHistory from '../components/TransactionHistory';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';



export default function Wallet() {
  const navigation = useNavigation();

  const goToBankTransfer = () => {
    navigation.navigate('BankTransfer');
  }

  const goToTopUp = () => {
    navigation.navigate('TopUp');
  }

  return (
    <View style={styles.container}>
      <BalanceCard />

      <View style={{marginTop:30, gap:15}}>
       <ActionButtons
        label="Bank Transfer"
        icon={<MaterialIcons name="credit-card" size={18} color="#FFC107" />}
        onPress={goToBankTransfer}
      />
      <ActionButtons
        label="Top up"
        icon={<Entypo name="plus" size={20} color="#FFC107" />}
        onPress={goToTopUp}

      />
      </View>

      <TransactionHistory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:20,
    paddingTop:50,
    backgroundColor: '#000000',
    gap:30,
  },
  text: {
    fontSize: 20,
  },
});