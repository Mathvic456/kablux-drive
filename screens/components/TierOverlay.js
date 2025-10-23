import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TierOverlay({ visible, onClose }) {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // PanResponder for swipe down to close
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay background */}
      <View style={styles.overlay}>
        {/* Touchable area to close when tapping outside */}
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        {/* Animated Card that slides from bottom */}
        <Animated.View 
          style={[
            styles.card,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag handle indicator */}
          <View style={styles.dragHandle} />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Tier Title */}
          <View style={styles.titleRow}>
            <Text style={styles.tierText}>Tire 1</Text>
            <View style={styles.Line}></View>
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Currently</Text>
            </View>
            <View style={styles.hexagon}>
              <Ionicons name="medal-outline" size={20} color="#FFD700" />
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Benefits <Text style={styles.subText}>| Exclusive for Tire 2</Text>
            </Text>

            <View style={styles.benefitsRow}>
              <View style={styles.benefitItem}>
                <Ionicons name="speedometer-outline" size={26} color="#FFD700" />
                <Text style={styles.benefitText}>More millage</Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="pricetag-outline" size={26} color="#FFD700" />
                <Text style={styles.benefitText}>Sweet deals</Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="diamond-outline" size={26} color="#FFD700" />
                <Text style={styles.benefitText}>Premium</Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFD700" />
                <Text style={styles.benefitText}>And more</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Verify to upgrade</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
  },
  card: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    width: "100%",
    alignItems: "center",
    // borderWidth: 1,
    borderColor: "#FFD700",
    borderBottomWidth: 0,
    position: "relative",
    maxHeight: "80%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#666",
    borderRadius: 2,
    marginBottom: 10,
    alignSelf: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#2A2A2D",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  tierText: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "800",
    fontWeight: "700",
    marginRight: 8,
  },
  Line:{
    borderWidth:2,
    height:30,
    borderColor:"#FFD700",
  },
  currentBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
    marginLeft: 10,
  },
  currentText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  hexagon: {
    borderWidth: 1,
    borderColor: "#FFD700",
    padding: 8,
    borderRadius: 12,
  },
  section: {
    marginTop: 10,
    width: "100%",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  subText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "500",
  },
  benefitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  benefitItem: {
    alignItems: "center",
    marginBottom: 20,
    width: "40%",
  },
  benefitText: {
    color: "#fff",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});