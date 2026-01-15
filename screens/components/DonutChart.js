import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Dimensions,
  useWindowDimensions 
} from 'react-native';
import Svg, { G, Path, Text as SvgText, TSpan, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useGetMyBalance } from '../../services/funding.service'; 

const DonutChart = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [showLegendModal, setShowLegendModal] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Responsive sizing based on screen width
  const isSmallScreen = windowWidth < 375;
  const isLargeScreen = windowWidth > 768;
  
  const chartSize = isSmallScreen ? 200 : isLargeScreen ? 280 : 230;
  const strokeWidth = isSmallScreen ? 18 : 23;
  const fontSize = isSmallScreen ? 20 : 28;
  const tabFontSize = isSmallScreen ? 12 : 14;

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
    const labelRadius = radius + (isSmallScreen ? 8 : 10);
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
        rx={isSmallScreen ? 16 : 20} // Responsive horizontal radius
        ry={isSmallScreen ? 10 : 12} // Responsive vertical radius
        fill="rgba(0, 0, 0, 0.7)"
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
        fontSize={isSmallScreen ? "10" : "12"}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        <TSpan fontWeight="bold">{seg.percent}%</TSpan>
      </SvgText>
    );

    startAngle = endAngle;
  });

  return (
    <View style={styles.container}>
      {/* Info Button */}
      <TouchableOpacity 
        style={[
          styles.infoButton,
          { top: isSmallScreen ? 10 : 20, right: isSmallScreen ? 10 : 20 }
        ]}
        onPress={() => setShowLegendModal(true)}
      >
        <Ionicons name="information-circle" size={isSmallScreen ? 24 : 28} color="#007AFF" />
      </TouchableOpacity>

      {/* Chart */}
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
      <View style={styles.centerContent}>
        <Text style={[styles.balanceText, { fontSize: isSmallScreen ? 14 : 18 }]}>Total Balance</Text>
        <Text style={[styles.amount, { fontSize: isSmallScreen ? 22 : fontSize }]}>{formattedBalance}</Text>
      </View>

      {/* Time Period Tabs */}
      <View style={[styles.tabsContainer, { marginTop: isSmallScreen ? 20 : 30 }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'today' && styles.activeTab
          ]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[
            styles.tabText,
            { fontSize: tabFontSize },
            activeTab === 'today' && styles.activeTabText
          ]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'weekly' && styles.activeTab
          ]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[
            styles.tabText,
            { fontSize: tabFontSize },
            activeTab === 'weekly' && styles.activeTabText
          ]}>
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'monthly' && styles.activeTab
          ]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[
            styles.tabText,
            { fontSize: tabFontSize },
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
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { 
              width: windowWidth * 0.9,
              maxHeight: windowHeight * 0.8,
              padding: isSmallScreen ? 15 : 20
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: isSmallScreen ? 20 : 24 }]}>
                Chart Color Legend
              </Text>
              <TouchableOpacity onPress={() => setShowLegendModal(false)}>
                <Ionicons name="close" size={isSmallScreen ? 24 : 28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.legendScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.legendContainer}>
                <Text style={[styles.modalSubtitle, { fontSize: isSmallScreen ? 14 : 16 }]}>
                  What each color represents in your {activeTab} ride statistics:
                </Text>
                
                {colorCategories.map((category, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={styles.colorIndicatorRow}>
                      <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                      <Text style={[styles.colorName, { fontSize: isSmallScreen ? 14 : 16 }]}>
                        {category.name}
                      </Text>
                    </View>
                    <Text style={[styles.colorDescription, { fontSize: isSmallScreen ? 12 : 14 }]}>
                      {category.description}
                    </Text>
                    
                    {/* Show current percentage for this color */}
                    <View style={styles.percentageRow}>
                      <Text style={styles.percentageLabel}>Current {activeTab}: </Text>
                      <Text style={styles.percentageValue}>
                        {segments.find(s => s.color === category.color)?.percent || 0}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.closeButton, { padding: isSmallScreen ? 12 : 16 }]}
              onPress={() => setShowLegendModal(false)}
            >
              <Text style={[styles.closeButtonText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                Close Legend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DonutChart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderColor: '#333',
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    zIndex: 10,
  },
  chartTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  balanceText: {
    color: 'limegreen',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 15,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  modalSubtitle: {
    color: '#888',
    marginBottom: 20,
    lineHeight: 22,
  },
  legendScroll: {
    maxHeight: 400,
  },
  legendContainer: {
    paddingRight: 5,
  },
  legendItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  colorIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorName: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  colorDescription: {
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 8,
  },
  percentageRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  percentageLabel: {
    color: '#888',
    fontSize: 12,
  },
  percentageValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});