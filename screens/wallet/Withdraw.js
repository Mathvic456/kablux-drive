import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TransferForm from '../components/TransferForm';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function Withdraw() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get balance passed from BalanceCard - ensure proper parameter name
    const { userBalance } = route.params || { userBalance: 0 };

    const goBack = () => {
        navigation.goBack();
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack}>
                    <Ionicons name="arrow-back-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.text}>Withdraw</Text>
                <View style={{ width: 24 }}></View>
            </View>
            {/* Pass balance to TransferForm */}
            <TransferForm userBalance={userBalance} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'black',
        gap: 30,
        justifyContent: 'center',
    },
    text: {
        fontSize: 30,
        color: 'white',
        alignSelf: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});