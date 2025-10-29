import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { FontAwesome, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

const reviews = [
  {
    id: 1,
    name: "James eminado",
    rating: 5,
    comment: "clean and neat\nGood music",
    date: "Oct 30 - 14:50",
    mood: "emoticon-happy-outline",
    rideDetails: {
      from: "Lekki Phase 1",
      to: "Victoria Island",
      duration: "25 mins",
      fare: "₦2,500",
      driver: "Tunde Adewale",
      vehicle: "Toyota Camry - XYZ123XYZ"
    }
  },
  {
    id: 2,
    name: "James eminado",
    rating: 2,
    comment: "seat were smelling\ntoo rough",
    date: "Oct 29 - 14:50",
    mood: "emoticon-sad-outline",
    rideDetails: {
      from: "Ikeja City Mall",
      to: "Maryland",
      duration: "15 mins",
      fare: "₦1,800",
      driver: "Chinedu Okoro",
      vehicle: "Honda Accord - ABC123DEF"
    }
  },
  {
    id: 3,
    name: "James eminado",
    rating: 5,
    comment: "clean and neat\nGood music",
    date: "Oct 30 - 14:50",
    mood: "emoticon-happy-outline",
    rideDetails: {
      from: "Yaba",
      to: "Surulere",
      duration: "20 mins",
      fare: "₦2,000",
      driver: "Femi Balogun",
      vehicle: "Nissan Altima - GHI456JKL"
    }
  },
];

export default function Ratings() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const goBack = () => {
    navigation.goBack();
  };

  const handleCardPress = (review) => {
    setSelectedReview(review);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReview(null);
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((s) => (
      <FontAwesome
        key={s}
        name={s <= rating ? "star" : "star-o"}
        size={18}
        color="#FFB800"
        style={{ marginRight: 3 }}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{flexDirection:'row', gap:20}}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back-circle" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Ratings</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.mainRating}>3.2</Text>
          <FontAwesome name="star" size={22} color="#FFB800" />
        </View>
        <Text style={styles.subtitle}>Based on the last 25 rides</Text>

        {/* Tab Header */}
        <View style={styles.tabRow}>
          <View style={styles.tabIndicator} />
          <Text style={styles.tabText}>Ride History</Text>
          <View style={styles.tabIndicator} />
        </View>

        {/* Section: Today */}
        <Text style={styles.sectionTitle}>Today</Text>
        <TouchableOpacity onPress={() => handleCardPress(reviews[0])}>
          <ReviewCard {...reviews[0]} />
        </TouchableOpacity>

        {/* Section: Yesterday */}
        <Text style={styles.sectionTitle}>Yesterday</Text>
        {reviews.slice(1).map((r) => (
          <TouchableOpacity key={r.id} onPress={() => handleCardPress(r)}>
            <ReviewCard {...r} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rating Receipt Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedReview && (
                  <>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Rating Receipt</Text>
                      <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Rating Section */}
                    <View style={styles.ratingSection}>
                      <View style={styles.ratingCircle}>
                        <Text style={styles.ratingNumber}>{selectedReview.rating}.0</Text>
                        <View style={styles.starsContainer}>
                          {renderStars(selectedReview.rating)}
                        </View>
                      </View>
                      <MaterialCommunityIcons 
                        name={selectedReview.mood} 
                        size={40} 
                        color="#FFB800" 
                        style={styles.moodIcon}
                      />
                    </View>

                    {/* Ride Details */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsTitle}>Ride Details</Text>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>From</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.from}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="navigate-outline" size={20} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>To</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.to}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>Duration</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.duration}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <FontAwesome name="money" size={18} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>Fare</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.fare}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={20} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>Driver</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.driver}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="car-outline" size={20} color="#FFB800" />
                        <View style={styles.detailText}>
                          <Text style={styles.detailLabel}>Vehicle</Text>
                          <Text style={styles.detailValue}>{selectedReview.rideDetails.vehicle}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Comment Section */}
                    <View style={styles.commentSection}>
                      <Text style={styles.commentTitle}>Your Comment</Text>
                      <Text style={styles.commentText}>{selectedReview.comment}</Text>
                    </View>

                    {/* Date */}
                    <View style={styles.dateSection}>
                      <FontAwesome name="calendar" size={16} color="#FFB800" />
                      <Text style={styles.dateText}>{selectedReview.date}</Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const ReviewCard = ({ name, rating, comment, date, mood }) => (
  <View style={styles.reviewCard}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
      <MaterialCommunityIcons name={mood} size={28} color="#FFB800" />
      <Text style={styles.reviewerName}>{name}</Text>
    </View>

    {/* Rating Stars */}
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FontAwesome
          key={s}
          name={s <= rating ? "star" : "star-o"}
          size={18}
          color="#FFB800"
          style={{ marginRight: 3 }}
        />
      ))}
    </View>

    <Text style={styles.comment}>{comment}</Text>

    <View style={styles.dateRow}>
      <FontAwesome name="calendar" size={14} color="#FFB800" />
      <Text style={styles.dateText}>{date}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 10,
    alignSelf: 'center',
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mainRating: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginRight: 6,
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tabIndicator: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FFB800",
    marginHorizontal: 10,
  },
  tabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 10,
  },
  reviewCard: {
    backgroundColor: "#0F1B2D",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFB800",
    marginBottom: 15,
  },
  reviewerName: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  comment: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F1B2D',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D3D',
  },
  ratingCircle: {
    alignItems: 'center',
  },
  ratingNumber: {
    color: '#FFB800',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  moodIcon: {
    marginRight: 10,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  commentSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D3D',
  },
  commentTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});