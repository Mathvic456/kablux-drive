import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Dimensions,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
  Platform 
} from 'react-native';
import Svg, { G, Path, Text as SvgText, TSpan, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useGetMyBalance } from '../../services/funding.service'; 

const DonutChart = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [showLegendModal, setShowLegendModal] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Enhanced screen size detection
  const isSmallScreen = windowWidth < 375; // iPhone SE, small Android
  const isMediumScreen = windowWidth >= 375 && windowWidth <= 414; // iPhone 12-15, most Android
  const isLargeScreen = windowWidth > 414; // iPhone Plus/Pro Max
  const isTablet = windowWidth > 768;
  const screenHeight = Dimensions.get('window').height;
  const isShortScreen = screenHeight < 700; // Small height devices
  
  // Responsive chart sizing with Math.min to prevent overflow
  const chartSize = Math.min(
    isSmallScreen ? windowWidth * 0.6 : 
    isShortScreen ? windowWidth * 0.65 :
    isTablet ? windowWidth * 0.4 : 
    windowWidth * 0.7,
    350
  );
  
  const strokeWidth = Math.min(
    isSmallScreen ? chartSize * 0.085 : 
    isShortScreen ? chartSize * 0.08 :
    chartSize * 0.09,
    30
  );
  
  const fontSize = Math.min(
    isSmallScreen ? 18 : 
    isShortScreen ? 16 :
    isTablet ? 32 : 28,
    36
  );
  
  const tabFontSize = Math.min(
    isSmallScreen ? 12 : 
    isShortScreen ? 11 :
    isTablet ? 16 : 14,
    18
  );

  // 1. Get the balance
  const { data: balanceData } = useGetMyBalance();

  // 2. Format the balance (default to 0.00 if loading/undefined)
  const formattedBalance = balanceData?.balance 
    ? `₦${balanceData.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : '₦0.00';
  
  const radius = (chartSize - strokeWidth) / 2.2;
  const center = chartSize / 2;

  // Color categories with descriptions
  const colorCategories = [
    { 
      color: '#FF3D3D', 
      name: 'Ride Cancellations', 
      description: 'Cancelled rides affecting your acceptance rate' 
    },
    { 
      color: '#FF7A00', 
      name: 'Fuel & Maintenance', 
      description: 'Vehicle fuel costs and routine maintenance' 
    },
    { 
      color: '#00FF57', 
      name: 'Completed Rides', 
      description: 'Successful rides delivered to passengers' 
    },
    { 
      color: '#007AFF', 
      name: 'In-Progress Rides', 
      description: 'Rides currently being serviced' 
    },
    { 
      color: '#E700FF', 
      name: 'Pending Payouts', 
      description: 'Earnings waiting for weekly withdrawal' 
    },
    { 
      color: '#FFD966', 
      name: 'Bonuses & Incentives', 
      description: 'Extra earnings from promotions and bonuses' 
    },
  ];

  // Data for different time periods
  const segmentData = {
    today: [
      { color: '#FF3D3D', percent: 15 },
      { color: '#FF7A00', percent: 10 },
      { color: '#00FF57', percent: 25 },
      { color: '#007AFF', percent: 20 },
      { color: '#E700FF', percent: 15 },
      { color: '#FFD966', percent: 15 },
    ],
    weekly: [
      { color: '#FF3D3D', percent: 20 },
      { color: '#FF7A00', percent: 15 },
      { color: '#00FF57', percent: 30 },
      { color: '#007AFF', percent: 15 },
      { color: '#E700FF', percent: 10 },
      { color: '#FFD966', percent: 10 },
    ],
    monthly: [
      { color: '#FF3D3D', percent: 10 },
      { color: '#FF7A00', percent: 5 },
      { color: '#00FF57', percent: 40 },
      { color: '#007AFF', percent: 25 },
      { color: '#E700FF', percent: 10 },
      { color: '#FFD966', percent: 10 },
    ]
  };

  // Get segments based on active tab
  const segments = segmentData[activeTab];
  const total = segments.reduce((sum, s) => sum + s.percent, 0);

  // Helper to convert degree to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Create each arc path manually
  const createArc = (startAngle, endAngle) => {
    const startX = center + radius * Math.cos(toRad(startAngle));
    const startY = center + radius * Math.sin(toRad(startAngle));
    const endX = center + radius * Math.cos(toRad(endAngle));
    const endY = center + radius * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M${startX} ${startY} A${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  let startAngle = -90;
  const arcs = [];

  segments.forEach((seg, i) => {
    const angle = (seg.percent / total) * 360;
    const endAngle = startAngle + angle;
    const path = createArc(startAngle, endAngle);
    const midAngle = startAngle + angle / 2;

    // Position for the percentage label
    const labelRadius = radius + (isSmallScreen ? 8 : isShortScreen ? 6 : 10);
    const labelX = center + labelRadius * Math.cos(toRad(midAngle));
    const labelY = center + labelRadius * Math.sin(toRad(midAngle));

    arcs.push(
      <Path
        key={`arc-${i}`}
        d={path}
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    );

    // Add oval background first
    arcs.push(
      <Ellipse
        key={`bg-${i}`}
        cx={labelX}
        cy={labelY}
        rx={isSmallScreen ? 14 : isShortScreen ? 12 : 20}
        ry={isSmallScreen ? 8 : isShortScreen ? 6 : 12}
        fill="rgba(0, 0, 0, 0.8)"
        stroke={seg.color}
        strokeWidth={1}
      />
    );

    // Then add the text on top
    arcs.push(
      <SvgText
        key={`label-${i}`}
        x={labelX}
        y={labelY}
        fill="#fff"
        fontSize={isSmallScreen ? "9" : isShortScreen ? "8" : "12"}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        <TSpan fontWeight="bold">{seg.percent}%</TSpan>
      </SvgText>
    );

    startAngle = endAngle;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'black' }]}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={[
        styles.container,
        isSmallScreen && styles.containerSmall,
        isLargeScreen && styles.containerLarge,
        isTablet && styles.containerTablet,
        isShortScreen && styles.containerShort
      ]}>
        {/* Info Button */}
        <TouchableOpacity 
          style={[
            styles.infoButton,
            isSmallScreen && styles.infoButtonSmall,
            isLargeScreen && styles.infoButtonLarge,
            isTablet && styles.infoButtonTablet,
            isShortScreen && styles.infoButtonShort
          ]}
          onPress={() => setShowLegendModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="information-circle" 
            size={isSmallScreen ? 22 : isShortScreen ? 20 : 28} 
            color="#007AFF" 
          />
        </TouchableOpacity>

        {/* Chart Container */}
        <View style={[
          styles.chartWrapper,
          isShortScreen && styles.chartWrapperShort
        ]}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setShowLegendModal(true)}
            style={styles.chartTouchable}
          >
            <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`} overflow="visible">
              <G>{arcs}</G>
            </Svg>
          </TouchableOpacity>

          {/* Center Text */}
          <View style={[
            styles.centerContent,
            isShortScreen && styles.centerContentShort
          ]}>
            <Text style={[
              styles.balanceText,
              isSmallScreen && styles.balanceTextSmall,
              isLargeScreen && styles.balanceTextLarge,
              isShortScreen && styles.balanceTextShort
            ]}>Total Balance</Text>
            <Text style={[
              styles.amount,
              isSmallScreen && styles.amountSmall,
              isLargeScreen && styles.amountLarge,
              isShortScreen && styles.amountShort
            ]}>{formattedBalance}</Text>
          </View>
        </View>

        {/* Time Period Tabs */}
        <View style={[
          styles.tabsContainer,
          isSmallScreen && styles.tabsContainerSmall,
          isLargeScreen && styles.tabsContainerLarge,
          isTablet && styles.tabsContainerTablet,
          isShortScreen && styles.tabsContainerShort
        ]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              isSmallScreen && styles.tabSmall,
              isLargeScreen && styles.tabLarge,
              isShortScreen && styles.tabShort,
              activeTab === 'today' && styles.activeTab
            ]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[
              styles.tabText,
              isSmallScreen && styles.tabTextSmall,
              isLargeScreen && styles.tabTextLarge,
              isShortScreen && styles.tabTextShort,
              activeTab === 'today' && styles.activeTabText
            ]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tab, 
              isSmallScreen && styles.tabSmall,
              isLargeScreen && styles.tabLarge,
              isShortScreen && styles.tabShort,
              activeTab === 'weekly' && styles.activeTab
            ]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[
              styles.tabText,
              isSmallScreen && styles.tabTextSmall,
              isLargeScreen && styles.tabTextLarge,
              isShortScreen && styles.tabTextShort,
              activeTab === 'weekly' && styles.activeTabText
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tab, 
              isSmallScreen && styles.tabSmall,
              isLargeScreen && styles.tabLarge,
              isShortScreen && styles.tabShort,
              activeTab === 'monthly' && styles.activeTab
            ]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[
              styles.tabText,
              isSmallScreen && styles.tabTextSmall,
              isLargeScreen && styles.tabTextLarge,
              isShortScreen && styles.tabTextShort,
              activeTab === 'monthly' && styles.activeTabText
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Color Legend Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLegendModal}
          onRequestClose={() => setShowLegendModal(false)}
          statusBarTranslucent={true}
        >
          <SafeAreaView style={[
            styles.modalOverlay,
            isTablet && styles.modalOverlayTablet
          ]}>
            <StatusBar 
              backgroundColor="rgba(0, 0, 0, 0.95)" 
              barStyle="light-content" 
              translucent={true}
            />
            <View style={[
              styles.modalContent,
              isSmallScreen && styles.modalContentSmall,
              isLargeScreen && styles.modalContentLarge,
              isTablet && styles.modalContentTablet,
              isShortScreen && styles.modalContentShort
            ]}>
              <View style={[
                styles.modalHeader,
                isSmallScreen && styles.modalHeaderSmall,
                isLargeScreen && styles.modalHeaderLarge,
                isShortScreen && styles.modalHeaderShort
              ]}>
                <Text style={[
                  styles.modalTitle,
                  isSmallScreen && styles.modalTitleSmall,
                  isLargeScreen && styles.modalTitleLarge,
                  isShortScreen && styles.modalTitleShort
                ]}>
                  Chart Color Legend
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowLegendModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="close" 
                    size={isSmallScreen ? 22 : isShortScreen ? 20 : 28} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.legendScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.legendScrollContent,
                  isShortScreen && styles.legendScrollContentShort
                ]}
              >
                <View style={[
                  styles.legendContainer,
                  isShortScreen && styles.legendContainerShort
                ]}>
                  <Text style={[
                    styles.modalSubtitle,
                    isSmallScreen && styles.modalSubtitleSmall,
                    isLargeScreen && styles.modalSubtitleLarge,
                    isShortScreen && styles.modalSubtitleShort
                  ]}>
                    What each color represents in your {activeTab} ride statistics:
                  </Text>
                  
                  {colorCategories.map((category, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.legendItem,
                        isSmallScreen && styles.legendItemSmall,
                        isLargeScreen && styles.legendItemLarge,
                        isShortScreen && styles.legendItemShort
                      ]}
                    >
                      <View style={[
                        styles.colorIndicatorRow,
                        isShortScreen && styles.colorIndicatorRowShort
                      ]}>
                        <View style={[
                          styles.colorDot,
                          { backgroundColor: category.color },
                          isSmallScreen && styles.colorDotSmall,
                          isLargeScreen && styles.colorDotLarge,
                          isShortScreen && styles.colorDotShort
                        ]} />
                        <Text style={[
                          styles.colorName,
                          isSmallScreen && styles.colorNameSmall,
                          isLargeScreen && styles.colorNameLarge,
                          isShortScreen && styles.colorNameShort
                        ]}>
                          {category.name}
                        </Text>
                      </View>
                      <Text style={[
                        styles.colorDescription,
                        isSmallScreen && styles.colorDescriptionSmall,
                        isLargeScreen && styles.colorDescriptionLarge,
                        isShortScreen && styles.colorDescriptionShort
                      ]}>
                        {category.description}
                      </Text>
                      
                      {/* Show current percentage for this color */}
                      <View style={[
                        styles.percentageRow,
                        isSmallScreen && styles.percentageRowSmall,
                        isShortScreen && styles.percentageRowShort
                      ]}>
                        <Text style={[
                          styles.percentageLabel,
                          isSmallScreen && styles.percentageLabelSmall,
                          isShortScreen && styles.percentageLabelShort
                        ]}>Current {activeTab}: </Text>
                        <Text style={[
                          styles.percentageValue,
                          isSmallScreen && styles.percentageValueSmall,
                          isShortScreen && styles.percentageValueShort
                        ]}>
                          {segments.find(s => s.color === category.color)?.percent || 0}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={[
                  styles.closeButton,
                  isSmallScreen && styles.closeButtonSmall,
                  isLargeScreen && styles.closeButtonLarge,
                  isTablet && styles.closeButtonTablet,
                  isShortScreen && styles.closeButtonShort
                ]}
                onPress={() => setShowLegendModal(false)}
              >
                <Text style={[
                  styles.closeButtonText,
                  isSmallScreen && styles.closeButtonTextSmall,
                  isLargeScreen && styles.closeButtonTextLarge,
                  isShortScreen && styles.closeButtonTextShort
                ]}>
                  Close Legend
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default DonutChart;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.min(height * 0.02, 20),
    borderColor: '#333',
    position: 'relative',
    minHeight: Math.min(height * 0.7, 500),
  },
  containerSmall: {
    paddingVertical: Math.min(height * 0.015, 15),
    minHeight: Math.min(height * 0.65, 450),
  },
  containerLarge: {
    paddingVertical: Math.min(height * 0.025, 25),
    minHeight: Math.min(height * 0.75, 550),
  },
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: Math.min(height * 0.03, 30),
  },
  containerShort: {
    paddingVertical: Math.min(height * 0.01, 10),
    minHeight: Math.min(height * 0.6, 400),
  },
  infoButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 30,
    right: Math.min(width * 0.05, 20),
    zIndex: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
    padding: 6,
  },
  infoButtonSmall: {
    top: Platform.OS === 'ios' ? 15 : 25,
    right: Math.min(width * 0.04, 16),
    padding: 5,
    borderRadius: 18,
  },
  infoButtonLarge: {
    top: Platform.OS === 'ios' ? 25 : 35,
    right: Math.min(width * 0.06, 24),
    padding: 8,
    borderRadius: 22,
  },
  infoButtonTablet: {
    top: Platform.OS === 'ios' ? 30 : 40,
    right: Math.min(width * 0.08, 32),
    padding: 10,
    borderRadius: 25,
  },
  infoButtonShort: {
    top: Platform.OS === 'ios' ? 10 : 20,
    right: Math.min(width * 0.035, 14),
    padding: 4,
    borderRadius: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Math.min(height * 0.03, 30),
  },
  chartWrapperShort: {
    marginBottom: Math.min(height * 0.02, 20),
  },
  chartTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  centerContentShort: {
    paddingHorizontal: 20,
  },
  balanceText: {
    color: 'limegreen',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: Math.min(width * 0.04, 18),
    textAlign: 'center',
  },
  balanceTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
    letterSpacing: 0.3,
  },
  balanceTextLarge: {
    fontSize: Math.min(width * 0.042, 22),
    letterSpacing: 0.7,
  },
  balanceTextShort: {
    fontSize: Math.min(width * 0.035, 12),
    letterSpacing: 0.2,
  },
  amount: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: Math.min(height * 0.005, 4),
    fontSize: Math.min(width * 0.08, 32),
    textAlign: 'center',
  },
  amountSmall: {
    fontSize: Math.min(width * 0.07, 22),
    marginTop: Math.min(height * 0.004, 3),
  },
  amountLarge: {
    fontSize: Math.min(width * 0.09, 36),
    marginTop: Math.min(height * 0.006, 6),
  },
  amountShort: {
    fontSize: Math.min(width * 0.065, 18),
    marginTop: Math.min(height * 0.003, 2),
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: Math.min(width * 0.06, 25),
    padding: Math.min(width * 0.01, 4),
    marginHorizontal: Math.min(width * 0.05, 20),
    width: Math.min(width * 0.9, 400),
    alignSelf: 'center',
  },
  tabsContainerSmall: {
    borderRadius: Math.min(width * 0.05, 20),
    padding: Math.min(width * 0.008, 3),
    marginHorizontal: Math.min(width * 0.04, 16),
    width: Math.min(width * 0.92, 350),
  },
  tabsContainerLarge: {
    borderRadius: Math.min(width * 0.07, 30),
    padding: Math.min(width * 0.012, 5),
    marginHorizontal: Math.min(width * 0.06, 24),
    width: Math.min(width * 0.88, 450),
  },
  tabsContainerTablet: {
    width: Math.min(width * 0.8, 500),
    borderRadius: Math.min(width * 0.08, 35),
    padding: Math.min(width * 0.015, 6),
  },
  tabsContainerShort: {
    borderRadius: Math.min(width * 0.045, 18),
    padding: Math.min(width * 0.006, 2),
    marginHorizontal: Math.min(width * 0.035, 14),
    width: Math.min(width * 0.94, 300),
  },
  tab: {
    flex: 1,
    paddingVertical: Math.min(height * 0.012, 10),
    paddingHorizontal: Math.min(width * 0.02, 8),
    borderRadius: Math.min(width * 0.05, 20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Math.min(height * 0.045, 36),
  },
  tabSmall: {
    paddingVertical: Math.min(height * 0.01, 8),
    paddingHorizontal: Math.min(width * 0.015, 6),
    borderRadius: Math.min(width * 0.04, 18),
    minHeight: Math.min(height * 0.04, 32),
  },
  tabLarge: {
    paddingVertical: Math.min(height * 0.014, 12),
    paddingHorizontal: Math.min(width * 0.025, 10),
    borderRadius: Math.min(width * 0.06, 22),
    minHeight: Math.min(height * 0.05, 40),
  },
  tabShort: {
    paddingVertical: Math.min(height * 0.008, 6),
    paddingHorizontal: Math.min(width * 0.012, 5),
    borderRadius: Math.min(width * 0.035, 16),
    minHeight: Math.min(height * 0.035, 28),
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
    fontSize: Math.min(width * 0.037, 14),
  },
  tabTextSmall: {
    fontSize: Math.min(width * 0.035, 12),
  },
  tabTextLarge: {
    fontSize: Math.min(width * 0.039, 16),
  },
  tabTextShort: {
    fontSize: Math.min(width * 0.033, 11),
  },
  activeTabText: {
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  modalOverlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: Math.min(width * 0.06, 25),
    borderTopRightRadius: Math.min(width * 0.06, 25),
    maxHeight: '85%',
    padding: Math.min(width * 0.05, 20),
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalContentSmall: {
    borderTopLeftRadius: Math.min(width * 0.05, 20),
    borderTopRightRadius: Math.min(width * 0.05, 20),
    maxHeight: '90%',
    padding: Math.min(width * 0.04, 16),
  },
  modalContentLarge: {
    borderTopLeftRadius: Math.min(width * 0.07, 30),
    borderTopRightRadius: Math.min(width * 0.07, 30),
    maxHeight: '80%',
    padding: Math.min(width * 0.06, 24),
  },
  modalContentTablet: {
    width: '90%',
    maxWidth: 600,
    height: '85%',
    borderRadius: Math.min(width * 0.06, 25),
    marginTop: 0,
  },
  modalContentShort: {
    borderTopLeftRadius: Math.min(width * 0.04, 18),
    borderTopRightRadius: Math.min(width * 0.04, 18),
    maxHeight: '92%',
    padding: Math.min(width * 0.035, 14),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Math.min(height * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: Math.min(height * 0.015, 12),
  },
  modalHeaderSmall: {
    paddingBottom: Math.min(height * 0.012, 10),
    marginBottom: Math.min(height * 0.012, 10),
  },
  modalHeaderLarge: {
    paddingBottom: Math.min(height * 0.018, 14),
    marginBottom: Math.min(height * 0.018, 14),
  },
  modalHeaderShort: {
    paddingBottom: Math.min(height * 0.01, 8),
    marginBottom: Math.min(height * 0.01, 8),
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    fontSize: Math.min(width * 0.05, 22),
  },
  modalTitleSmall: {
    fontSize: Math.min(width * 0.048, 18),
  },
  modalTitleLarge: {
    fontSize: Math.min(width * 0.052, 24),
  },
  modalTitleShort: {
    fontSize: Math.min(width * 0.045, 16),
  },
  modalSubtitle: {
    color: '#888',
    marginBottom: Math.min(height * 0.02, 16),
    lineHeight: Math.min(width * 0.045, 20),
    fontSize: Math.min(width * 0.04, 16),
  },
  modalSubtitleSmall: {
    fontSize: Math.min(width * 0.038, 14),
    marginBottom: Math.min(height * 0.016, 12),
    lineHeight: Math.min(width * 0.04, 18),
  },
  modalSubtitleLarge: {
    fontSize: Math.min(width * 0.042, 18),
    marginBottom: Math.min(height * 0.024, 20),
    lineHeight: Math.min(width * 0.05, 22),
  },
  modalSubtitleShort: {
    fontSize: Math.min(width * 0.036, 13),
    marginBottom: Math.min(height * 0.014, 10),
    lineHeight: Math.min(width * 0.038, 16),
  },
  legendScroll: {
    flex: 1,
  },
  legendScrollContent: {
    paddingRight: 5,
    paddingBottom: Math.min(height * 0.02, 16),
  },
  legendScrollContentShort: {
    paddingBottom: Math.min(height * 0.015, 12),
  },
  legendContainer: {
    flex: 1,
  },
  legendContainerShort: {
    paddingRight: 3,
  },
  legendItem: {
    marginBottom: Math.min(height * 0.02, 16),
    paddingBottom: Math.min(height * 0.015, 12),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  legendItemSmall: {
    marginBottom: Math.min(height * 0.016, 12),
    paddingBottom: Math.min(height * 0.012, 10),
  },
  legendItemLarge: {
    marginBottom: Math.min(height * 0.024, 20),
    paddingBottom: Math.min(height * 0.018, 14),
  },
  legendItemShort: {
    marginBottom: Math.min(height * 0.014, 10),
    paddingBottom: Math.min(height * 0.01, 8),
  },
  colorIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(height * 0.008, 6),
  },
  colorIndicatorRowShort: {
    marginBottom: Math.min(height * 0.006, 4),
  },
  colorDot: {
    width: Math.min(width * 0.045, 20),
    height: Math.min(width * 0.045, 20),
    borderRadius: Math.min(width * 0.0225, 10),
    marginRight: Math.min(width * 0.025, 12),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorDotSmall: {
    width: Math.min(width * 0.04, 18),
    height: Math.min(width * 0.04, 18),
    borderRadius: Math.min(width * 0.02, 9),
    marginRight: Math.min(width * 0.02, 10),
  },
  colorDotLarge: {
    width: Math.min(width * 0.05, 22),
    height: Math.min(width * 0.05, 22),
    borderRadius: Math.min(width * 0.025, 11),
    marginRight: Math.min(width * 0.03, 14),
  },
  colorDotShort: {
    width: Math.min(width * 0.038, 16),
    height: Math.min(width * 0.038, 16),
    borderRadius: Math.min(width * 0.019, 8),
    marginRight: Math.min(width * 0.018, 8),
  },
  colorName: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    fontSize: Math.min(width * 0.04, 16),
  },
  colorNameSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  colorNameLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  colorNameShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
  colorDescription: {
    color: '#aaa',
    lineHeight: Math.min(width * 0.045, 20),
    marginBottom: Math.min(height * 0.008, 6),
    fontSize: Math.min(width * 0.038, 14),
  },
  colorDescriptionSmall: {
    fontSize: Math.min(width * 0.036, 12),
    lineHeight: Math.min(width * 0.04, 18),
    marginBottom: Math.min(height * 0.006, 4),
  },
  colorDescriptionLarge: {
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: Math.min(width * 0.05, 22),
    marginBottom: Math.min(height * 0.01, 8),
  },
  colorDescriptionShort: {
    fontSize: Math.min(width * 0.034, 11),
    lineHeight: Math.min(width * 0.038, 16),
    marginBottom: Math.min(height * 0.005, 4),
  },
  percentageRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Math.min(width * 0.025, 12),
    paddingVertical: Math.min(height * 0.006, 5),
    borderRadius: Math.min(width * 0.02, 8),
    alignSelf: 'flex-start',
  },
  percentageRowSmall: {
    paddingHorizontal: Math.min(width * 0.02, 10),
    paddingVertical: Math.min(height * 0.005, 4),
    borderRadius: Math.min(width * 0.018, 6),
  },
  percentageRowShort: {
    paddingHorizontal: Math.min(width * 0.018, 8),
    paddingVertical: Math.min(height * 0.004, 3),
    borderRadius: Math.min(width * 0.015, 6),
  },
  percentageLabel: {
    color: '#888',
    fontSize: Math.min(width * 0.035, 12),
  },
  percentageLabelSmall: {
    fontSize: Math.min(width * 0.033, 11),
  },
  percentageLabelShort: {
    fontSize: Math.min(width * 0.031, 10),
  },
  percentageValue: {
    color: '#fff',
    fontSize: Math.min(width * 0.035, 12),
    fontWeight: 'bold',
  },
  percentageValueSmall: {
    fontSize: Math.min(width * 0.033, 11),
  },
  percentageValueShort: {
    fontSize: Math.min(width * 0.031, 10),
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: Math.min(width * 0.03, 12),
    alignItems: 'center',
    marginTop: Math.min(height * 0.015, 12),
    paddingVertical: Math.min(height * 0.016, 14),
    paddingHorizontal: Math.min(width * 0.04, 16),
    minHeight: Math.min(height * 0.06, 48),
    justifyContent: 'center',
  },
  closeButtonSmall: {
    borderRadius: Math.min(width * 0.025, 10),
    marginTop: Math.min(height * 0.012, 10),
    paddingVertical: Math.min(height * 0.014, 12),
    paddingHorizontal: Math.min(width * 0.035, 14),
    minHeight: Math.min(height * 0.055, 44),
  },
  closeButtonLarge: {
    borderRadius: Math.min(width * 0.035, 14),
    marginTop: Math.min(height * 0.018, 14),
    paddingVertical: Math.min(height * 0.018, 16),
    paddingHorizontal: Math.min(width * 0.045, 18),
    minHeight: Math.min(height * 0.065, 52),
  },
  closeButtonTablet: {
    borderRadius: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.02, 16),
    paddingVertical: Math.min(height * 0.02, 18),
    paddingHorizontal: Math.min(width * 0.05, 20),
    minHeight: Math.min(height * 0.07, 56),
  },
  closeButtonShort: {
    borderRadius: Math.min(width * 0.02, 8),
    marginTop: Math.min(height * 0.01, 8),
    paddingVertical: Math.min(height * 0.012, 10),
    paddingHorizontal: Math.min(width * 0.03, 12),
    minHeight: Math.min(height * 0.05, 40),
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(width * 0.04, 16),
  },
  closeButtonTextSmall: {
    fontSize: Math.min(width * 0.038, 14),
  },
  closeButtonTextLarge: {
    fontSize: Math.min(width * 0.042, 18),
  },
  closeButtonTextShort: {
    fontSize: Math.min(width * 0.036, 13),
  },
});