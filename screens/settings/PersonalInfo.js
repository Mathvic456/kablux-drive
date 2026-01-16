import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

// Mock navigation and data hook for artifact
const useNavigation = () => ({
  navigate: (route) => console.log(`Navigate to: ${route}`)
});

const useDriverDashboard = () => ({
  data: {
    current_tier: "TIER_ONE",
    total_points: 2663,
    trip_stats: { today: 0, week: 0, month: 0 },
    active_bonuses: [
      {
        bonus: {
          name: "Daily Hustler",
          description: "Complete 20 trips in a day to earn N5,000 extra.",
          target_value: 20,
          reward_amount: "5000.00",
          timeframe: "DAILY",
          type: "TRIP_COUNT"
        },
        current_value: 0,
        is_completed: false,
        expires_at: "2026-01-16T00:59:59.995143+01:00"
      },
      {
        bonus: {
          name: "Weekly Warrior",
          description: "Complete 100 trips in a week to earn N25,000 extra.",
          target_value: 100,
          reward_amount: "25000.00",
          timeframe: "WEEKLY",
          type: "TRIP_COUNT"
        },
        current_value: 100,
        is_completed: false,
        expires_at: "2026-01-18T12:37:46.654157+01:00"
      },
      {
        bonus: {
          name: "Streak Master",
          description: "Complete 5 trips in a row without a cancellation.",
          target_value: 5,
          reward_amount: "1000.00",
          timeframe: "DAILY",
          type: "STREAK"
        },
        current_value: 0,
        is_completed: false,
        expires_at: "2026-01-16T00:59:59.004393+01:00"
      },
      {
        bonus: {
          name: "5-Star Driver",
          description: "Maintain 4.8+ rating over 100 trips.",
          target_value: 100,
          reward_amount: "3000.00",
          timeframe: "MONTHLY",
          type: "RATING"
        },
        current_value: 0,
        is_completed: false,
        expires_at: "2026-02-14T20:06:58.008935+01:00"
      }
    ],
    recent_history: [
      {
        amount: 20,
        reason: "TRIP_COMPLETED",
        created_at: "2026-01-15T12:37:46.652011+01:00",
        metadata: { note: "Seeded trip bonuses" }
      },
      {
        amount: 2643,
        reason: "TRIP_DISTANCE",
        created_at: "2026-01-15T12:37:46.650923+01:00",
        metadata: { note: "Seeded initial points" }
      }
    ]
  },
  isLoading: false,
  error: null
});

export default function PersonalInfo() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const { data, isLoading, error } = useDriverDashboard();

  if (isLoading) return <Text style={styles.loadingText}>Loading...</Text>;
  if (error) return <Text style={styles.errorText}>Something went wrong</Text>;

  const tierNames = {
    TIER_ONE: "Green",
    TIER_TWO: "Blue", 
    TIER_THREE: "Purple",
    TIER_FOUR: "Gold"
  };

  const tierColors = {
    TIER_ONE: "#50FF66",
    TIER_TWO: "#2196F3",
    TIER_THREE: "#9C27B0", 
    TIER_FOUR: "#FFD700"
  };

  const currentTierName = tierNames[data.current_tier] || "Green";
  const currentTierColor = tierColors[data.current_tier] || "#50FF66";
  const nextTier = data.current_tier === "TIER_ONE" ? "Blue" : 
                   data.current_tier === "TIER_TWO" ? "Purple" : 
                   data.current_tier === "TIER_THREE" ? "Gold" : "Max";

  const progressToNextTier = data.current_tier === "TIER_ONE" ? 
    Math.min((data.total_points / 1000) * 100, 100) : 
    data.current_tier === "TIER_TWO" ?
    Math.min(((data.total_points - 1000) / 2000) * 100, 100) :
    data.current_tier === "TIER_THREE" ?
    Math.min(((data.total_points - 3000) / 2000) * 100, 100) : 100;

  const tiersData = [
    {
      name: "Green",
      color: "#50FF66",
      points: "0–999",
      benefits: [
        { icon: <MaterialCommunityIcons name="car" size={24} color="#50FF66" />, title: "Standard Driver", subtitle: "Basic ride access and earnings" },
        { icon: <MaterialIcons name="security" size={24} color="#50FF66" />, title: "Safety Standards", subtitle: "Minimum safety requirements" }
      ]
    },
    {
      name: "Blue",
      color: "#2196F3",
      points: "1,000–2,999",
      benefits: [
        { icon: <MaterialIcons name="trending-up" size={24} color="#50FF66" />, title: "+5% Earnings Boost", subtitle: "Extra 5% on all trip bonuses" },
        { icon: <MaterialIcons name="schedule" size={24} color="#50FF66" />, title: "Faster Payouts", subtitle: "24-hour payment processing" },
        { icon: <MaterialCommunityIcons name="headset" size={24} color="#50FF66" />, title: "Priority Support", subtitle: "Dedicated support line" }
      ]
    },
    {
      name: "Purple",
      color: "#9C27B0",
      points: "3,000–4,999",
      benefits: [
        { icon: <MaterialCommunityIcons name="rocket" size={24} color="#50FF66" />, title: "Priority Ride Requests", subtitle: "Get rides before other drivers" },
        { icon: <MaterialIcons name="bar-chart" size={24} color="#50FF66" />, title: "+10% Earnings Boost", subtitle: "Higher bonus percentage" },
        { icon: <MaterialIcons name="card-giftcard" size={24} color="#50FF66" />, title: "Weekly Bonuses", subtitle: "Extra rewards for consistency" },
        { icon: <MaterialIcons name="location-on" size={24} color="#50FF66" />, title: "Hotspot Access", subtitle: "Exclusive high-demand areas" }
      ]
    },
    {
      name: "Gold",
      color: "#FFD700",
      points: "5,000+",
      benefits: [
        { icon: <MaterialCommunityIcons name="crown" size={24} color="#50FF66" />, title: "Exclusive Rewards", subtitle: "Special perks and bonuses" },
        { icon: <MaterialCommunityIcons name="fuel" size={24} color="#50FF66" />, title: "Fuel Vouchers", subtitle: "Monthly fuel discounts" },
        { icon: <MaterialIcons name="money" size={24} color="#50FF66" />, title: "Cash-Out Priority", subtitle: "Instant withdrawals anytime" },
        { icon: <MaterialIcons name="star" size={24} color="#50FF66" />, title: "VIP Status", subtitle: "Premium driver recognition" },
        { icon: <MaterialIcons name="calendar-month" size={24} color="#50FF66" />, title: "Flexible Scheduling", subtitle: "First choice on preferred hours" }
      ]
    }
  ];

  const formatTimeframe = (timeframe) => {
    return timeframe === "DAILY" ? "Daily" : 
           timeframe === "WEEKLY" ? "Weekly" : 
           timeframe === "MONTHLY" ? "Monthly" : timeframe;
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Tier Card */}
      <View style={[styles.tierCard]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.tierTitle, { color: currentTierColor }]}>
              {currentTierName}
            </Text>
            <Text style={styles.tierSubtitle}>Your tier this week</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              style={styles.avatar}
            />
            <View style={[styles.ratingBadge, { backgroundColor: currentTierColor }]}>
              <MaterialIcons name="star" size={16} color="#000" />
            </View>
          </View>
        </View>

        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsLabel}>Total Points</Text>
          <Text style={[styles.pointsValue, { color: currentTierColor }]}>
            {data.total_points.toLocaleString()}
          </Text>
        </View>

        {nextTier !== "Max" && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress to {nextTier}</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressFill, { width: `${progressToNextTier}%` }]} />
            </View>
            <Text style={styles.keepText}>
              {data.current_tier === "TIER_ONE" 
                ? `${1000 - data.total_points} points to Blue tier`
                : `${Math.ceil(progressToNextTier)}% complete`}
            </Text>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setBonusModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>Active Bonuses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.secondaryButtonText}>See all tiers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{data.trip_stats.today} trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>{data.trip_stats.week} trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{data.trip_stats.month} trips</Text>
        </View>
      </View>

      {/* Active Bonuses Preview */}
      <View style={styles.bonusesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Bonuses</Text>
          <TouchableOpacity onPress={() => setBonusModalVisible(true)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {data.active_bonuses.slice(0, 2).map((bonus, index) => (
          <View key={index} style={styles.bonusCard}>
            <View style={styles.bonusHeader}>
              <Text style={styles.bonusName}>{bonus.bonus.name}</Text>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>
                  {formatTimeframe(bonus.bonus.timeframe)}
                </Text>
              </View>
            </View>
            <Text style={styles.bonusDescription}>{bonus.bonus.description}</Text>
            <View style={styles.bonusProgressBar}>
              <View 
                style={[
                  styles.bonusProgressFill, 
                  { width: `${(bonus.current_value / bonus.bonus.target_value) * 100}%` }
                ]} 
              />
            </View>
            <View style={styles.bonusFooter}>
              <Text style={styles.bonusProgress}>
                {bonus.current_value} / {bonus.bonus.target_value}
              </Text>
              <Text style={styles.bonusReward}>
                ₦{parseFloat(bonus.bonus.reward_amount).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {data.recent_history.map((item, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={styles.activityIconContainer}>
              {item.reason === "TRIP_COMPLETED" ? (
              <MaterialIcons name="check-circle" size={20} color="#50FF66" />
            ) : item.reason === "TRIP_DISTANCE" ? (
              <MaterialIcons name="location-on" size={20} color="#50FF66" />
            ) : (
              <MaterialIcons name="card-giftcard" size={20} color="#50FF66" />
            )}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityReason}>
                {item.reason.replace(/_/g, " ")}
              </Text>
              <Text style={styles.activityDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.activityPoints}>+{item.amount}</Text>
          </View>
        ))}
      </View>

      {/* Tier Modal */}
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
                <View key={index} style={[styles.tierBox]}>
                  <View style={styles.tierHeader}>
                    <View style={[styles.tierColorIndicator, { backgroundColor: tier.color }]} />
                    <Text style={styles.tierName}>{tier.name} Tier</Text>
                    <Text style={styles.tierPoints}>{tier.points} points</Text>
                  </View>
                  
                  <View style={styles.benefitsContainer}>
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <View key={benefitIndex} style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>{benefit.icon}</View>
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

      {/* Bonuses Modal */}
      <Modal
        visible={bonusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBonusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <MaterialIcons name="target" size={24} color="#FFC107" style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>All Active Bonuses</Text>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {data.active_bonuses.map((bonus, index) => (
                <View key={index} style={styles.bonusModalCard}>
                  <View style={styles.bonusModalHeader}>
                    <Text style={styles.bonusModalName}>{bonus.bonus.name}</Text>
                    <View style={styles.bonusModalBadge}>
                      <Text style={styles.bonusModalBadgeText}>
                        {formatTimeframe(bonus.bonus.timeframe)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.bonusModalDescription}>{bonus.bonus.description}</Text>
                  
                  <View style={styles.bonusModalProgressBar}>
                    <View 
                      style={[
                        styles.bonusModalProgressFill, 
                        { width: `${(bonus.current_value / bonus.bonus.target_value) * 100}%` }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.bonusModalFooter}>
                    <View>
                      <Text style={styles.bonusModalProgress}>
                        {bonus.current_value} / {bonus.bonus.target_value} {bonus.bonus.type.toLowerCase()}
                      </Text>
                      <Text style={styles.bonusModalExpiry}>
                        Expires in {getTimeRemaining(bonus.expires_at)}
                      </Text>
                    </View>
                    <Text style={styles.bonusModalReward}>
                      ₦{parseFloat(bonus.bonus.reward_amount).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBonusModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  loadingText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 50,
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginTop: 50,
  },
  tierCard: {
    backgroundColor: "#063B5D",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tierTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  tierSubtitle: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 13,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  ratingBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pointsDisplay: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
  },
  pointsLabel: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: "#FFC107",
  },
  keepText: {
    color: "#aaa",
    marginTop: 6,
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "600",
    color: "#000",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#FFC107",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#062B44",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: "#FFC107",
    fontWeight: "700",
    fontSize: 14,
  },
  bonusesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFC107",
    fontSize: 16,
    fontWeight: "700",
  },
  seeAllText: {
    color: "#2196F3",
    fontSize: 13,
    fontWeight: "600",
  },
  bonusCard: {
    backgroundColor: "#063B5D",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,

  },
  bonusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bonusName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  bonusBadge: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bonusBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "600",
  },
  bonusDescription: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  bonusProgressBar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  bonusProgressFill: {
    height: 6,
    backgroundColor: "#50FF66",
  },
  bonusFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bonusProgress: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },
  bonusReward: {
    color: "#FFC107",
    fontWeight: "700",
    fontSize: 15,
  },
  activitySection: {
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: "#062B44",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#063B5D",
    justifyContent: "center",
    alignItems: "center",
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityReason: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    textTransform: "capitalize",
  },
  activityDate: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },
  activityPoints: {
    color: "#50FF66",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#001B2E",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalTitle: {
    color: "#FFC107",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  tierBox: {
    backgroundColor: "#063B5D",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
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
  bonusModalCard: {
    backgroundColor: "#063B5D",
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  bonusModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bonusModalName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
  },
  bonusModalBadge: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusModalBadgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "600",
  },
  bonusModalDescription: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  bonusModalProgressBar: {
    height: 8,
    backgroundColor: "#222",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  bonusModalProgressFill: {
    height: 8,
    backgroundColor: "#50FF66",
  },
  bonusModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bonusModalProgress: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 4,
  },
  bonusModalExpiry: {
    color: "#aaa",
    fontSize: 11,
  },
  bonusModalReward: {
    color: "#FFC107",
    fontWeight: "700",
    fontSize: 20,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "700",
    color: "#000",
    fontSize: 15,
  },
});