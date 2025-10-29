import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, Image } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const RideCompletedModal = ({ visible, onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showRatingSection, setShowRatingSection] = useState(false);

  const handleRating = (value) => setRating(value);
  
  const handleRateRider = () => {
    setShowRatingSection(true);
  };
  
  const handleDone = () => {
    // Here you would typically save the rating and feedback
    console.log('Rating:', rating, 'Feedback:', feedback);
    onClose();
    // Reset state for next time
    setRating(0);
    setFeedback('');
    setShowRatingSection(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Character Illustration */}
          <View style={styles.imageWrapper}>
            {/* <Image
              source={require('../assets/Avatar.png')} // Replace with your actual image path
              style={styles.avatar}
              resize="contain" // Fixed typo: was resizeNode
            /> */}
          </View>

          <Text style={styles.title}>You have successfully completed this ride</Text>

          {/* Conditional rendering based on whether user wants to rate */}
          {!showRatingSection ? (
            // Initial state - Rate Rider button
            <TouchableOpacity style={styles.rateButton} onPress={handleRateRider}>
              <Text style={styles.rateButtonText}>Rate rider</Text>
            </TouchableOpacity>
          ) : (
            // Rating state - Stars and feedback
            <>
              {/* Star Ratings */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => handleRating(star)}
                    style={styles.starButton}
                  >
                    <FontAwesome
                      name={star <= rating ? 'star' : 'star-o'}
                      size={32}
                      color="#FFB800"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Input */}
              <View style={styles.feedbackBox}>
                <MaterialIcons 
                  name="feedback" 
                  size={20} 
                  color="#FFB800" 
                  style={styles.feedbackIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Share your feedback (optional)"
                  placeholderTextColor="#999"
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>

              {/* Character count */}
              <Text style={styles.charCount}>
                {feedback.length}/200
              </Text>
            </>
          )}

          {/* Done Button */}
          <TouchableOpacity 
            style={[
              styles.doneButton, 
              showRatingSection && rating === 0 && styles.doneButtonDisabled
            ]} 
            onPress={handleDone}
            disabled={showRatingSection && rating === 0}
          >
            <Text style={[
              styles.doneButtonText,
              showRatingSection && rating === 0 && styles.doneButtonTextDisabled
            ]}>
              {showRatingSection ? 'Submit Rating' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RideCompletedModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#0F1B2D',
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageWrapper: {
    position: 'absolute',
    top: -50,
    backgroundColor: '#0F1B2D',
    borderRadius: 50,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 40,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  rateButton: {
    backgroundColor: '#FFB800',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rateButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 20,
    justifyContent: 'center',
  },
  starButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFB800',
    borderRadius: 12,
    width: '100%',
    minHeight: 80,
    padding: 12,
    backgroundColor: 'rgba(255, 184, 0, 0.05)',
  },
  feedbackIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 60,
    paddingTop: 0,
  },
  charCount: {
    color: '#999',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  doneButton: {
    backgroundColor: '#FFB800',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    elevation: 0,
  },
  doneButtonText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
  },
  doneButtonTextDisabled: {
    color: '#999',
  },
});