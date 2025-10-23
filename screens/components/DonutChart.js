import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { G, Path, Text as SvgText, TSpan, Ellipse } from 'react-native-svg';

const DonutChart = () => {
  const [activeTab, setActiveTab] = useState('today');
  
  const size = 230;
  const strokeWidth = 23;
  const radius = (size - strokeWidth) / 2.2;
  const center = size / 2;

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
    const labelRadius = radius + 10;
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
        rx={20} // Horizontal radius
        ry={12} // Vertical radius
        fill="rgba(0, 0, 0, 0.7)" // Semi-transparent black background
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
        fontSize="12"
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
      {/* Chart */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        <G>{arcs}</G>
      </Svg>

      {/* Center Text */}
      <View style={styles.centerContent}>
        <Text style={styles.balanceText}>total balance</Text>
        <Text style={styles.amount}>₦0.00</Text>
      </View>

      {/* Time Period Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'today' && styles.activeTab
          ]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[
            styles.tabText,
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
            activeTab === 'monthly' && styles.activeTabText
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DonutChart;

const styles = StyleSheet.create({
  container: {
    height: 'auto',
    width: 300,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderColor: '#333',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  balanceText: {
    color: 'limegreen',
    fontSize: 18,
    fontWeight: '600',
  },
  amount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});