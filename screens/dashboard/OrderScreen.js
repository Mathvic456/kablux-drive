import React, { useState, useContext } from 'react'; // Added useContext
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SocketContext } from '../../context/WebSocketProvider'; // Import Context

export default function OrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 1. Grab socket from Context, NOT params
  const { socket } = useContext(SocketContext);
  
  // 2. Only grab data and callbacks from params
  const { item, onCounterSubmitted } = route.params || {};

  const [counterAmount, setCounterAmount] = useState(item?.offer_amount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ Guard Clause
  if (!item || !item.ride_request_id) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>Invalid Ride Data</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleIncrease = () => setCounterAmount(prev => prev + 100);
  const handleDecrease = () => setCounterAmount(prev => Math.max(0, prev - 100));

  const handleSubmitCounter = async () => {
    if (counterAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid counter offer amount');
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      Alert.alert('Connection Error', 'WebSocket is not connected');
      return;
    }

    setIsSubmitting(true);

    try {
      const message = {
        type: "create_driver_offer",
        data: {
          ride_request_id: item.ride_request_id,
          counter_offer: counterAmount,
        },
      };

      console.log("📤 Sending Counter Offer:", JSON.stringify(message));
      socket.send(JSON.stringify(message));

      Alert.alert('Success', 'Your offer has been sent', [
        {
          text: 'OK',
          onPress: () => {
            if (onCounterSubmitted) onCounterSubmitted();
            navigation.goBack();
          },
        },
      ]);

    } catch (error) {
      console.error('Error submitting counter:', error);
      Alert.alert('Error', 'Failed to submit counter offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const difference = counterAmount - (item.offer_amount || 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Counter Offer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Info Cards */}
        <View style={styles.riderCard}>
          <View style={styles.riderHeader}>
            <Ionicons name="person-circle" size={50} color="#facc15" />
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{item.rider_name || "Unknown Rider"}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#facc15" />
                <Text style={styles.ratingText}>{item.rider_rating || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Ride Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ride ID:</Text>
            <Text style={styles.detailValue}>{item.ride_request_id.slice(0, 8)}...</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.address}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.offerAmountContainer}>
            <Text style={styles.offerLabel}>Original Offer:</Text>
            <Text style={styles.offerAmount}>₦{(item.offer_amount || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Counter Controls */}
        <View style={styles.counterCard}>
          <Text style={styles.cardTitle}>Your Counter Offer</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>₦</Text>
            <Text style={styles.amountText}>{counterAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={[styles.controlButton, styles.decreaseButton]} onPress={handleDecrease}>
              <Ionicons name="remove" size={32} color="white" />
              <Text style={styles.controlButtonText}>-100</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.increaseButton]} onPress={handleIncrease}>
              <Ionicons name="add" size={32} color="black" />
              <Text style={[styles.controlButtonText, styles.increaseButtonText]}>+100</Text>
            </TouchableOpacity>
          </View>

          {difference !== 0 && (
            <View style={styles.comparisonContainer}>
               <Text style={styles.comparisonLabel}>Difference: </Text>
               <Text style={[styles.comparisonValue, difference > 0 ? styles.positiveChange : styles.negativeChange]}>
                 {difference > 0 ? '+' : ''}₦{Math.abs(difference).toLocaleString()}
               </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (counterAmount <= 0 || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitCounter}
          disabled={counterAmount <= 0 || isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="black" /> : <Text style={styles.submitButtonText}>Submit Offer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ... Use your existing styles (no changes needed there) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  errorContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'white', fontSize: 18, marginTop: 10, marginBottom: 20 },
  backButton: { backgroundColor: '#facc15', padding: 10, borderRadius: 8 },
  backButtonText: { color: 'black', fontWeight: 'bold' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backIcon: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 32 },
  riderCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  riderHeader: { flexDirection: 'row', alignItems: 'center' },
  riderDetails: { marginLeft: 16, flex: 1 },
  riderName: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#facc15', fontSize: 16, marginLeft: 6, fontWeight: '600' },
  detailsCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#999', fontSize: 14 },
  detailValue: { color: 'white', fontSize: 14, maxWidth: '70%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  offerAmountContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
  offerAmount: { color: '#f44336', fontSize: 20, fontWeight: 'bold' },
  counterCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  amountDisplay: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 25 },
  currencySymbol: { color: '#facc15', fontSize: 30, fontWeight: 'bold', marginRight: 5 },
  amountText: { color: 'white', fontSize: 50, fontWeight: 'bold' },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  controlButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '45%' },
  decreaseButton: { backgroundColor: '#f44336' },
  increaseButton: { backgroundColor: '#facc15' },
  controlButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
  increaseButtonText: { color: 'black' },
  comparisonContainer: { width: '100%', padding: 10, backgroundColor: '#333', borderRadius: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  comparisonLabel: { color: '#ccc', fontSize: 14 },
  comparisonValue: { fontSize: 16, fontWeight: 'bold' },
  positiveChange: { color: '#4CAF50' },
  negativeChange: { color: '#f44336' },
  submitButton: { backgroundColor: '#facc15', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  submitButtonText: { color: 'black', fontWeight: 'bold', fontSize: 18 },
  submitButtonDisabled: { opacity: 0.5 },
});