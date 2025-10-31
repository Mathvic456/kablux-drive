import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome5, Feather, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Modal } from 'react-native';
import { useLogoutEndPoint } from '../../services/auth.service';
import { useProfile } from '../../services/profile.service';



export default function Account() {
    const [modalVisible, setModalVisible] = useState('false');
    const navigation = useNavigation();
     const { data: profile, isPending, isError } = useProfile();

    const LoginAndSecurity = () => {
        navigation.navigate('LoginAndSecurity');
    }

    const PersonalInfo = () => {
        navigation.navigate('PersonalInfo');
    }

    const Settings = () => {
        navigation.navigate('Settings');
    }

    const Safety = () => {
        navigation.navigate('SafetyActions');
    }

    const City = () => {
        navigation.navigate('City');
    }

    const ReferAndEarn = () => {
        navigation.navigate('ReferAndEarn');
    }

    const HelpAndSupport = () => {
        navigation.navigate('HelpAndSupport');
    }

    const Legal = () => {
        navigation.navigate('Legal');
    }

  

  const logoutEndpoint = useLogoutEndPoint();
    const handleLogout = async() => {
     try {
      await logoutEndpoint.mutateAsync(); 
    setModalVisible(false);
    console.log("User logged out");
     navigation.navigate("Login")
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

    if (isPending) return <ActivityIndicator size="large" color="#facc15" />;

  if (isError) return <Text>Error loading profile</Text>;

  return (
    <>
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Account</Text>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={require('../../assets/Profileimg.png')}
          style={styles.profileImage}
        />
        <View style={{ alignItems: 'left' }}>
          <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>4.99 </Text>
            <FontAwesome5 name="star" size={14} color="#FFC107" />
          </View>
        </View>
      </View>

      {/* First Box: Personal Info / Security */}
      <View style={styles.box}>
        <TouchableOpacity style={styles.row} onPress={PersonalInfo}>
          <MaterialIcons name="person-outline" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Personal info</Text>
          <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={LoginAndSecurity}>
          <Feather name="lock" size={20} color="#FFC107" />
          <Text style={styles.rowText}>Login & security</Text>
          <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Second Box: Settings, Safety, etc. */}
      <View style={styles.box}>
        <MenuItem onPress={Settings} icon={<Feather name="settings" size={20} color="#FFC107" />} label="Settings" />
        <Divider />
        <MenuItem onPress={Safety} icon={<Feather name="shield" size={20} color="#FFC107" />} label="Safety" />
        <Divider />
        <MenuItem onPress={City} icon={<Entypo name="location-pin" size={20} color="#FFC107" />} label="City" />
        <Divider />
        <MenuItem onPress={ReferAndEarn} icon={<Feather name="gift" size={20} color="#FFC107" />} label="Refer & Earn" />
        <Divider />
        <MenuItem onPress={HelpAndSupport} icon={<Feather name="help-circle" size={20} color="#FFC107" />} label="Help & Support" />
        <Divider />
        <MenuItem onPress={Legal} icon={<Feather name="file-text" size={20} color="#FFC107" />} label="Legal" />
        <Divider />
        <MenuItem onPress={() => setModalVisible(true)} icon={<Feather name="log-out" size={20} color="#FFC107" />} label="Log Out" />
      </View>
    </ScrollView>

   <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Do you want to log out?</Text>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={handleLogout}>
                <Text style={styles.textStyle}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
    </>
  );
}

/* --- Small Components --- */
const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    {icon}
    <Text style={styles.rowText}>{label}</Text>
    <Entypo name="chevron-right" size={18} color="#FFC107" style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingLeft:30,
  },
  header: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  profileSection: {
    // alignItems: 'center',
    marginBottom: 30,
    
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '500',
  },
  box: {
    backgroundColor: '#04223A',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 16,
    marginBottom: 25,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    color: 'white',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFC107',
    opacity: 0.5,
    marginHorizontal: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#FFC107',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
