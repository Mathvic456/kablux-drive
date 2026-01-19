import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  PixelRatio,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDriverDashboard } from "../../services/rewards.service";

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing functions
const widthPercentageToDP = (widthPercent) => {
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_WIDTH * elemWidth / 100);
};

const heightPercentageToDP = (heightPercent) => {
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_HEIGHT * elemHeight / 100);
};

// Font scaling
const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export default function Leaderboard() {
  const navigation = useNavigation();
  const { data, isLoading, error } = useDriverDashboard();

  useEffect(() => {
    if (data) {
      console.log("🎯 Driver Dashboard Data:", JSON.stringify(data, null, 2));
    }
    if (error) {
      console.error("❌ Error fetching dashboard:", error);
    }
    if (isLoading) {
      console.log("⏳ Loading dashboard data...");
    }
  }, [data, error, isLoading]);
  
  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;
  const isTablet = width >= 768;
  
  // Dynamic sizing calculations
  const getResponsiveValue = (small, medium, large) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

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

  const TierTable = () => {
  return (
    <View style={styles.wrapper}>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellText}>Green Tire</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>0-999 Points</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>Standard Driver</Text>
        </View>
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellText}>Blue Tire</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>1,000-2,999{"\n"}Points</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>+5% Earning on bonus</Text>
        </View>
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellText}>Purple Tire</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>3,000-4,999{"\n"}Points</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>
            Priority ride request{"\n"}+10% earning boost
          </Text>
        </View>
      </View>

      {/* Row 4 */}
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.cellText}>Gold Tire</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>5,000 Points</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellText}>
            Exclusive rewards{"\n"}
            (fuel voucher, cash out priority etc)
          </Text>
        </View>
      </View>
    </View>
  );
};// Dynamic styles based on screen size
  const dynamicStyles = {
    containerPadding: isSmallScreen ? widthPercentageToDP('3%') : 
                     isTablet ? widthPercentageToDP('5%') : widthPercentageToDP('4%'),
    headerFontSize: isSmallScreen ? scaleFont(24) : scaleFont(30),
    backIconSize: isSmallScreen ? 28 : 32,
    tierCardPadding: isSmallScreen ? widthPercentageToDP('4%') : widthPercentageToDP('4.5%'),
    tierTitleSize: isSmallScreen ? scaleFont(18) : scaleFont(22),
    avatarSize: isSmallScreen ? 38 : 45,
    statBoxWidth: isSmallScreen ? widthPercentageToDP('42%') : 
                  isTablet ? 150 : 130,
    statBoxHeight: isSmallScreen ? 65 : 70,
    modalWidth: isSmallScreen ? '95%' : 
                isTablet ? '85%' : '90%',
    modalMaxHeight: isTablet ? '85%' : '80%',
    modalPadding: isSmallScreen ? widthPercentageToDP('4%') : widthPercentageToDP('5%'),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[styles.container, { padding: dynamicStyles.containerPadding }]}
        contentContainerStyle={{ 
          paddingBottom: getResponsiveValue(40, 50, 60),
          gap: getResponsiveValue(15, 18, 20)
        }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="arrow-back-circle" 
            size={dynamicStyles.backIconSize} 
            color="white" 
          />
        </TouchableOpacity>
        <Text style={[styles.text, { fontSize: dynamicStyles.headerFontSize }]}>
          Leaderboards
        </Text>
        <View style={{ width: dynamicStyles.backIconSize }} />
      </View>

      {/* Tier Card */}
      <View style={[styles.tierCard, { padding: dynamicStyles.tierCardPadding }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tierTitle, { fontSize: dynamicStyles.tierTitleSize }]}>
              Green
            </Text>
            <Text style={[
              styles.tierSubtitle, 
              { fontSize: isSmallScreen ? scaleFont(12) : scaleFont(14) }
            ]}>
              Your tier this week
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              style={[styles.avatar, { 
                width: dynamicStyles.avatarSize, 
                height: dynamicStyles.avatarSize 
              }]}
            />
            <View style={[
              styles.ratingBadge,
              { 
                paddingHorizontal: isSmallScreen ? 4 : 6,
                paddingVertical: isSmallScreen ? 2 : 3
              }
            ]}>
              <FontAwesome5 
                name="star" 
                size={isSmallScreen ? 8 : 10} 
                color="#fff" 
              />
              <Text style={[
                styles.ratingText,
                { fontSize: isSmallScreen ? 8 : 10 }
              ]}>
                3.2
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={[
            styles.progressLabel,
            { fontSize: isSmallScreen ? scaleFont(13) : scaleFont(14) }
          ]}>
            Progress till Blue
          </Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressFill, { width: "40%" }]} />
          </View>
          <Text style={[
            styles.keepText,
            { fontSize: isSmallScreen ? scaleFont(10) : scaleFont(12) }
          ]}>
            Keep 3.50+ rating
          </Text>
        </View>

        <View style={[
          styles.buttonsRow,
          { gap: isSmallScreen ? 8 : 10 }
        ]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { 
                paddingVertical: isSmallScreen ? 8 : 10,
                minHeight: getResponsiveValue(42, 44, 46)
              }
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.primaryButtonText,
              { fontSize: isSmallScreen ? scaleFont(13) : scaleFont(14) }
            ]}>
              See more
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { 
                paddingVertical: isSmallScreen ? 8 : 10,
                minHeight: getResponsiveValue(42, 44, 46)
              }
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.secondaryButtonText,
              { fontSize: isSmallScreen ? scaleFont(13) : scaleFont(14) }
            ]}>
              See all tiers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prize Card */}

      
{/* Trip Stats Card */}
<View style={[styles.prizeCard, { padding: isSmallScreen ? 12 : 14 }]}>
  <Text style={[styles.sectionTitle, { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }]}>
    Trip Statistics
  </Text>
  <View style={[styles.tripStatsGrid, { gap: isSmallScreen ? 8 : 12 }]}>
    <View style={styles.tripStatItem}>
      <MaterialCommunityIcons name="car-clock" size={isSmallScreen ? 20 : 24} color="#FFC107" />
      <Text style={[styles.tripStatValue, { fontSize: isSmallScreen ? scaleFont(18) : scaleFont(22) }]}>
        {data?.trip_stats?.today || 0}
      </Text>
      <Text style={[styles.tripStatLabel, { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }]}>
        Today
      </Text>
    </View>
    <View style={styles.tripStatItem}>
      <MaterialCommunityIcons name="calendar-week" size={isSmallScreen ? 20 : 24} color="#50FF66" />
      <Text style={[styles.tripStatValue, { fontSize: isSmallScreen ? scaleFont(18) : scaleFont(22) }]}>
        {data?.trip_stats?.week || 0}
      </Text>
      <Text style={[styles.tripStatLabel, { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }]}>
        This Week
      </Text>
    </View>
    <View style={styles.tripStatItem}>
      <MaterialCommunityIcons name="calendar-month" size={isSmallScreen ? 20 : 24} color="#2196F3" />
      <Text style={[styles.tripStatValue, { fontSize: isSmallScreen ? scaleFont(18) : scaleFont(22) }]}>
        {data?.trip_stats?.month || 0}
      </Text>
      <Text style={[styles.tripStatLabel, { fontSize: isSmallScreen ? scaleFont(11) : scaleFont(12) }]}>
        This Month
      </Text>
    </View>
  </View>
</View>

{/* Active Bonuses */}
<View style={[styles.prizeCard, { padding: isSmallScreen ? 12 : 14 }]}>
  <Text style={[styles.sectionTitle, { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }]}>
    Active Bonuses ({data?.active_bonuses?.length || 0})
  </Text>
  {data?.active_bonuses?.map((bonusData, index) => {
    const bonus = bonusData.bonus;
    const progress = (bonusData.current_value / bonus.target_value) * 100;
    
    return (
      <View key={index} style={[styles.bonusItem, { marginTop: index === 0 ? 12 : 8 }]}>
        <View style={styles.bonusHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bonusName, { fontSize: isSmallScreen ? scaleFont(13) : scaleFont(14) }]}>
              {bonus.name}
            </Text>
            <Text style={[styles.bonusDescription, { fontSize: isSmallScreen ? scaleFont(10) : scaleFont(11) }]}>
              {bonus.description}
            </Text>
          </View>
          <View style={styles.bonusReward}>
            <Text style={[styles.bonusAmount, { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }]}>
              ₦{parseFloat(bonus.reward_amount).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.bonusProgress}>
          <View style={styles.bonusProgressBar}>
            <View style={[styles.bonusProgressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={[styles.bonusProgressText, { fontSize: isSmallScreen ? scaleFont(10) : scaleFont(11) }]}>
            {bonusData.current_value}/{bonus.target_value}
          </Text>
        </View>
      </View>
    );
  })}
</View>

      {/* Tier Rewards Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            {
              width: dynamicStyles.modalWidth,
              maxWidth: isTablet ? 500 : 400,
              maxHeight: dynamicStyles.modalMaxHeight,
              padding: dynamicStyles.modalPadding
            }
          ]}>
            <Text style={[
              styles.modalTitle,
              { fontSize: isSmallScreen ? scaleFont(16) : scaleFont(18) }
            ]}>
              Driver Rewards Tiers
            </Text>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {tiersData.map((tier, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tierBox,
                    { 
                      padding: isSmallScreen ? 12 : 16,
                      marginBottom: isSmallScreen ? 8 : 12
                    }
                  ]}
                >
                  <View style={styles.tierHeader}>
                    <View style={[
                      styles.tierColorIndicator, 
                      { 
                        backgroundColor: tier.color,
                        width: isSmallScreen ? 10 : 12,
                        height: isSmallScreen ? 10 : 12
                      }
                    ]} />
                    <Text style={[
                      styles.tierName,
                      { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }
                    ]}>
                      {tier.name} Tier
                    </Text>
                    <Text style={[
                      styles.tierPoints,
                      { fontSize: isSmallScreen ? scaleFont(10) : scaleFont(12) }
                    ]}>
                      {tier.points} points
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.benefitsContainer,
                    { gap: isSmallScreen ? 6 : 10 }
                  ]}>
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <View 
                        key={benefitIndex} 
                        style={[
                          styles.benefitItem,
                          { gap: isSmallScreen ? 6 : 10 }
                        ]}
                      >
                        <MaterialCommunityIcons 
                          name={benefit.icon} 
                          size={isSmallScreen ? 16 : 20} 
                          color={tier.color} 
                          style={styles.benefitIcon}
                        />
                        <View style={styles.benefitText}>
                          <Text style={[
                            styles.benefitTitle,
                            { fontSize: isSmallScreen ? scaleFont(12) : scaleFont(14) }
                          ]}>
                            {benefit.title}
                          </Text>
                          <Text style={[
                            styles.benefitSubtitle,
                            { 
                              fontSize: isSmallScreen ? scaleFont(10) : scaleFont(12),
                              lineHeight: isSmallScreen ? 14 : 16
                            }
                          ]}>
                            {benefit.subtitle}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { 
                  paddingVertical: isSmallScreen ? 10 : 12,
                  marginTop: isSmallScreen ? 14 : 18
                }
              ]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.closeButtonText,
                { fontSize: isSmallScreen ? scaleFont(14) : scaleFont(16) }
              ]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierCard: {
    backgroundColor: "#063B5D",
    borderRadius: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierTitle: {
    color: "#50FF66",
    fontWeight: "700",
  },
  tierSubtitle: {
    color: "#fff",
    opacity: 0.7,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: "center",
  },
  avatar: {
    borderRadius: 100,
  },
  ratingBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#50FF66",
    borderRadius: 20,
  },
  ratingText: {
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
    backgroundColor: "#FFC107",
  },
  keepText: {
    color: "#aaa",
    marginTop: 6,
  },
  buttonsRow: {
    marginTop: 14,
    flexDirection: "row",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#FFC107",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: 'center',
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
    alignItems: "center",
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#FFC107",
  },
  prizeCard: {
    backgroundColor: "#062B44",
    borderRadius: 10,
  },
  prizeSubtitle: {
    color: "#fff",
    opacity: 0.7,
    marginBottom: 8,
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  carImage: {
    resizeMode: "contain",
  },
  prizeTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  prizeCount: {
    color: "#aaa",
  },
  statsRow: {
    paddingVertical: 4,
  },
  statBox: {
    backgroundColor: "#062B44",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 10,
    marginRight: 10,
    justifyContent: "center",
  },
  statLabel: {
    color: "#fff",
    opacity: 0.8,
    marginBottom: 4,
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
    borderWidth: 1,
    borderColor: "#FFC107",
  },

  wrapper: {
    borderWidth: 1.5,
    borderColor: "#FACC15",
    backgroundColor: "#001B2E",
  },

  row: {
    flexDirection: "row",
  },

  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FACC15",
    paddingVertical: 14,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  cellText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalTitle: {
    color: "#FFC107",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  tierBox: {
    backgroundColor: "#063B5D",
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tierColorIndicator: {
    borderRadius: 100,
    marginRight: 8,
  },
  tierName: {
    color: "#fff",
    fontWeight: "700",
    flex: 1,
  },
  tierPoints: {
    color: "#FFC107",
    fontWeight: "600",
  },
  benefitsContainer: {
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  benefitIcon: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitSubtitle: {
    color: "#aaa",
  },
  closeButton: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontWeight: "700",
    color: "#000",
  },


  tierGridContainer: {
  marginTop: 14,
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 10,
},

tierGridItem: {
  width: "48%",
  backgroundColor: "#001B2E",
  borderRadius: 10,
  padding: 12,
  borderWidth: 1,
  minHeight: 110,
  justifyContent: "space-between",
},

tierGridTitle: {
  fontWeight: "700",
  fontSize: 13,
  marginBottom: 6,
},

tierGridPoints: {
  color: "#FFC107",
  fontSize: 11,
  fontWeight: "600",
  marginBottom: 6,
},

tierGridBenefit: {
  color: "#fff",
  fontSize: 11,
  lineHeight: 15,
  opacity: 0.9,
},

sectionTitle: {
  color: "#FFC107",
  fontWeight: "700",
  marginBottom: 4,
},
tripStatsGrid: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: 8,
},
tripStatItem: {
  alignItems: "center",
},
tripStatValue: {
  color: "#fff",
  fontWeight: "700",
  marginTop: 8,
},
tripStatLabel: {
  color: "#aaa",
  marginTop: 4,
},
bonusItem: {
  backgroundColor: "#001B2E",
  borderRadius: 8,
  padding: 12,
  borderLeftWidth: 3,
  borderLeftColor: "#50FF66",
},
bonusHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8,
},
bonusName: {
  color: "#fff",
  fontWeight: "700",
},
bonusDescription: {
  color: "#aaa",
  marginTop: 2,
  lineHeight: 14,
},
bonusReward: {
  backgroundColor: "#50FF66",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},
bonusAmount: {
  color: "#000",
  fontWeight: "700",
},
bonusProgress: {
  gap: 6,
},
bonusProgressBar: {
  height: 4,
  backgroundColor: "#001B2E",
  borderRadius: 10,
  overflow: "hidden",
},
bonusProgressFill: {
  height: 4,
  backgroundColor: "#50FF66",
},
bonusProgressText: {
  color: "#aaa",
  fontSize: 10,
},

});