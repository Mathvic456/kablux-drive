import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Leaderboard() {

  const navigation = useNavigation();

  const goBack = () => {
    navigation.goBack();
  }

  const handleEarningsPress = () => {
    navigation.navigate("DriverIncomeDashboard");
  }
  const [modalVisible, setModalVisible] = useState(false);

  const tiersData = [
    {
      name: "Green",
      color: "#50FF66",
      points: "0–999",
      benefits: [
        {
          icon: "car",
          title: "Standard Driver",
          subtitle: "Basic ride access and earnings"
        },
        {
          icon: "shield-check",
          title: "Safety Standards",
          subtitle: "Minimum safety requirements"
        }
      ]
    },
    {
      name: "Blue",
      color: "#2196F3",
      points: "1,000–2,999",
      benefits: [
        {
          icon: "trending-up",
          title: "+5% Earnings Boost",
          subtitle: "Extra 5% on all trip bonuses"
        },
        {
          icon: "clock",
          title: "Faster Payouts",
          subtitle: "24-hour payment processing"
        },
        {
          icon: "headset",
          title: "Priority Support",
          subtitle: "Dedicated support line"
        }
      ]
    },
    {
      name: "Purple",
      color: "#9C27B0",
      points: "3,000–4,999",
      benefits: [
        {
          icon: "rocket",
          title: "Priority Ride Requests",
          subtitle: "Get rides before other drivers"
        },
        {
          icon: "trending-up",
          title: "+10% Earnings Boost",
          subtitle: "Higher bonus percentage"
        },
        {
          icon: "gift",
          title: "Weekly Bonuses",
          subtitle: "Extra rewards for consistency"
        },
        {
          icon: "map-marker",
          title: "Hotspot Access",
          subtitle: "Exclusive high-demand areas"
        }
      ]
    },
    {
      name: "Gold",
      color: "#FFD700",
      points: "5,000+",
      benefits: [
        {
          icon: "crown",
          title: "Exclusive Rewards",
          subtitle: "Special perks and bonuses"
        },
        {
          icon: "fuel",
          title: "Fuel Vouchers",
          subtitle: "Monthly fuel discounts"
        },
        {
          icon: "cash",
          title: "Cash-Out Priority",
          subtitle: "Instant withdrawals anytime"
        },
        {
          icon: "star",
          title: "VIP Status",
          subtitle: "Premium driver recognition"
        },
        {
          icon: "calendar",
          title: "Flexible Scheduling",
          subtitle: "First choice on preferred hours"
        }
      ]
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >


      <View style={styles.header}>
                      <TouchableOpacity onPress={goBack}>
                          <Ionicons name="arrow-back-circle" size={32} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.text}>Leaderboards</Text>
                      <View style={{width:24}}></View>
                  </View>


      {/* Tier Card */}
      <View style={styles.tierCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.tierTitle}>Green</Text>
            <Text style={styles.tierSubtitle}>Your tier this week</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              style={styles.avatar}
            />
            <View style={styles.ratingBadge}>
              <FontAwesome5 name="star" size={10} color="#fff" />
              <Text style={styles.ratingText}>3.2</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Progress till Blue</Text>
          <View style={styles.progressBarBackground}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.keepText}>Keep 3.50+ rating</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>See more</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.secondaryButtonText}>See all tiers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prize Card */}
      <View style={styles.prizeCard}>
        <Text style={styles.prizeSubtitle}>Get to Blue tier to win prize</Text>
        <View style={styles.prizeRow}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/743/743007.png",
            }}
            style={styles.carImage}
          />
          <View>
            <Text style={styles.prizeTitle}>Car wash voucher</Text>
            <Text style={styles.prizeCount}>1 prize</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <TouchableOpacity style={styles.statBox} onPress={handleEarningsPress}>
          <Text style={styles.statLabel}>Today's earnings</Text>
          <View style={styles.statValueRow}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.statValue}>NGN 0</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Acceptance rate</Text>
          <View style={styles.statValueRow}>
            <MaterialCommunityIcons name="chart-bar" size={16} color="#fff" />
            <Text style={styles.statValue}>27%</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Trip bonus</Text>
          <View style={styles.statValueRow}>
            <Ionicons name="gift-outline" size={16} color="#fff" />
            <Text style={styles.statValue}>NGN 0</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Weekly trips</Text>
          <View style={styles.statValueRow}>
            <MaterialCommunityIcons name="car" size={16} color="#fff" />
            <Text style={styles.statValue}>12</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Customer rating</Text>
          <View style={styles.statValueRow}>
            <FontAwesome5 name="star" size={14} color="#fff" />
            <Text style={styles.statValue}>4.8</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tier Rewards Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Driver Rewards Tiers</Text>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {tiersData.map((tier, index) => (
                <View key={index} style={styles.tierBox}>
                  <View style={styles.tierHeader}>
                    <View style={[styles.tierColorIndicator, { backgroundColor: tier.color }]} />
                    <Text style={styles.tierName}>{tier.name} Tier</Text>
                    <Text style={styles.tierPoints}>{tier.points} points</Text>
                  </View>
                  
                  <View style={styles.benefitsContainer}>
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <View key={benefitIndex} style={styles.benefitItem}>
                        <MaterialCommunityIcons 
                          name={benefit.icon} 
                          size={20} 
                          color={tier.color} 
                          style={styles.benefitIcon}
                        />
                        <View style={styles.benefitText}>
                          <Text style={styles.benefitTitle}>{benefit.title}</Text>
                          <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
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
        alignItems: 'center',
    },
  tierCard: {
    backgroundColor: "#063B5D",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    marginTop: 15,
    
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierTitle: {
    color: "#50FF66",
    fontSize: 22,
    fontWeight: "700",
  },
  tierSubtitle: {
    color: "#fff",
    opacity: 0.7,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
  },
  ratingBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#50FF66",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    color: "#000",
    fontWeight: "700",
    marginLeft: 3,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    width: "40%",
    backgroundColor: "#FFC107",
  },
  keepText: {
    color: "#aaa",
    marginTop: 6,
    fontSize: 12,
  },
  buttonsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "600",
    color: "#000",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#FFC107",
  },
  prizeCard: {
    backgroundColor: "#062B44",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  prizeSubtitle: {
    color: "#fff",
    opacity: 0.7,
    marginBottom: 8,
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  carImage: {
    width: 50,
    height: 25,
    resizeMode: "contain",
  },
  prizeTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  prizeCount: {
    color: "#aaa",
    fontSize: 12,
  },
  statsRow: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  statBox: {
    backgroundColor: "#062B44",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    width: 130,
    height: 70,
    justifyContent: "center",
  },
  statLabel: {
    color: "#fff",
    opacity: 0.8,
    fontSize: 12,
    marginBottom: 6,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    color: "#fff",
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#001B2E",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalTitle: {
    color: "#FFC107",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  tierBox: {
    backgroundColor: "#063B5D",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tierColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tierName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  tierPoints: {
    color: "#FFC107",
    fontSize: 12,
    fontWeight: "600",
  },
  benefitsContainer: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  benefitIcon: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitSubtitle: {
    color: "#aaa",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "700",
    color: "#000",
  },
});