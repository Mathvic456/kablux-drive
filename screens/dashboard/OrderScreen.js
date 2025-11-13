import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSendOffer } from '../../services/sendOffer.service';

export default function OrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const offer = useSendOffer(item.ride_id);

  const [counterAmount, setCounterAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>No ride data available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmitCounter = async () => {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      alert('Please enter a valid counter offer amount');
      return;
    }

    setIsSubmitting(true);
    

    try {
      console.log('Submitting counter offer:', {
        ride_id: item.ride_id,
        original_amount: item.offer_amount,
        counter_amount: parseFloat(counterAmount),
      });
      
      const res = await offer.mutateAsync({counter_offer: counterAmount, ride_request: item.ride_id } )
      console.log("Offer sent", res);
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting counter offer:', error);
      alert('Failed to submit counter offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Counter Offer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Rider Info Card */}
        <View style={styles.riderCard}>
          <View style={styles.riderHeader}>
            <Ionicons name="person-circle" size={50} color="#facc15" />
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{item.rider_name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#facc15" />
                <Text style={styles.ratingText}>{item.rider_rating}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Ride Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ride ID:</Text>
            <Text style={styles.detailValue}>{item.ride_id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time to Pickup:</Text>
            <Text style={styles.detailValue}>
              {Math.round(parseFloat(item.time_to_pickup) / 60)} minutes
            </Text>
          </View>

          {item.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{item.address}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.offerAmountContainer}>
            <Text style={styles.offerLabel}>Original Offer:</Text>
            <Text style={styles.offerAmount}>
              ₦{item.offer_amount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Counter Offer Input Card */}
        <View style={styles.counterCard}>
          <Text style={styles.cardTitle}>Your Counter Offer</Text>
          <Text style={styles.counterSubtitle}>
            Enter the amount you'd like to propose for this ride
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.input}
              value={counterAmount}
              onChangeText={setCounterAmount}
              placeholder="Enter amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
              editable={!isSubmitting}
            />
          </View>

          {counterAmount && parseFloat(counterAmount) > 0 && (
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Difference:</Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    parseFloat(counterAmount) > item.offer_amount
                      ? styles.positiveChange
                      : styles.negativeChange,
                  ]}
                >
                  {parseFloat(counterAmount) > item.offer_amount ? '+' : ''}
                  ₦{Math.abs(parseFloat(counterAmount) - item.offer_amount).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!counterAmount || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitCounter}
          disabled={!counterAmount || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Counter Offer</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  riderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderDetails: {
    marginLeft: 16,
    flex: 1,
  },
  riderName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#facc15',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    color: '#999',
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    color: 'white',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  offerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLabel: {
    color: '#999',
    fontSize: 14,
  },
  offerAmount: {
    color: '#facc15',
    fontSize: 22,
    fontWeight: 'bold',
  },
  counterCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  counterSubtitle: {
    color: '#999',
    fontSize: 13,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  currencySymbol: {
    color: '#facc15',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    paddingVertical: 14,
    fontWeight: '600',
  },
  comparisonContainer: {
    marginTop: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    color: '#999',
    fontSize: 14,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#f44336',
  },
  submitButton: {
    backgroundColor: '#facc15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#facc15',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
});