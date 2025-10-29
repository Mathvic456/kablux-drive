import Reac, {useState} from "react";
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import mapImage from "../../assets/map.png"; // rename your file if needed
import { useNavigation } from '@react-navigation/native';
import RideCompletedModal from '../../components/RideCompletedModal'

export default function RideDetails() {

  
    const [showModal, setShowModal] = useState(false);

  const navigation=useNavigation();

  const goBack = () => {
        navigation.goBack();
    }

  return (
    <View style={styles.container}>
      {/* Background Map Image */}
      <ImageBackground source={mapImage} style={styles.map} resizeMode="cover" />

      {/* Overlay Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={{flexDirection:'row',gap:20,alignItems: 'center',}}>
          <TouchableOpacity onPress={goBack}>
                              <Ionicons name="arrow-back-circle" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Ride Details</Text>
        </View>
        <Text style={styles.subtitle}>You are 30 minutes to destination</Text>

        <View style={styles.row}>
          <Ionicons name="time-outline" size={20} color="#fff" />
          <Text style={styles.timeText}>30 mins</Text>
        </View>

        {/* Rider Info */}
        <View style={styles.riderInfo}>
          <Image
            source={require("../../assets/Driver.png")}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.riderName}>Azeez</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.2</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="phone" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Contact Rider</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Entypo name="share" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={styles.sosButton} onPress={() => setShowModal(true)}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

              <RideCompletedModal visible={showModal} onClose={() => setShowModal(false)} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#FFD700",
  },
  title: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#bbb",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  timeText: {
    color: "#fff",
    marginLeft: 5,
  },
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 50,
    marginRight: 15,
    // borderWidth:1,
    // borderColor:'blue'
  },
  riderName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    color: "#fff",
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
  },
  sosButton: {
    backgroundColor: "red",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  sosText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
