import 'react-native-gesture-handler';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useLogoutEndPoint } from '../../services/auth.service';
import { useContext } from 'react';
import { SocketContext } from '../../context/WebSocketProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import Leaderboard from '../dashboard/Leaderboard';
import Ratings from '../settings/Ratings';
import Settings from '../settings/Settings';
import TabNavigator from './TabNavigator';
import DriverIncomeDashboard from '../settings/DriverIncomeDashboard';
import DocumentUploads from '../kyc/DocumentUploads';
import OrderScreen from '../dashboard/OrderScreen';
import DriverMapScreen from '../dashboard/DriverMapScreen';
import DriverChatScreen from '../dashboard/DriverChatScreen';
import Withdraw from '../wallet/Withdraw';
import BankTransfer from '../wallet/BankTransfer';
import TopUp from '../wallet/TopUp';
import Account from '../settings/Account';
import Legal from '../settings/Legal';
import City from '../settings/City';
import HelpAndSupport from '../settings/HelpAndSupport';
import LoginAndSecurity from '../settings/LoginAndSecurity';
import ReferAndEarn from '../settings/ReferAndEarn';
import SafetyActions from '../settings/SafetyActions';
import PersonalInfo from '../settings/PersonalInfo';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const logoutEndpoint = useLogoutEndPoint();
  const { socket } = useContext(SocketContext);

  const handleLogout = async () => {
    try {
      console.log("🚪 Starting logout process...");

      if (socket) {
        console.log("🔌 Closing WebSocket connection...");
        socket.close(1000, "User logged out");
      }

      console.log("🗑️ Clearing auth tokens...");
      await AsyncStorage.multiRemove(['token', 'refreshToken', 'pendingEmail']);

      await logoutEndpoint.mutateAsync();

      console.log("✅ User logged out successfully");

      props.navigation.navigate("Login");
    } catch (error) {
      console.error("❌ Logout failed:", error);

      try {
        if (socket) socket.close();
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'pendingEmail']);
        props.navigation.navigate("Login");
      } catch (cleanupError) {
        console.error("❌ Cleanup failed:", cleanupError);
      }
    }
  };

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        {/* Profile header stuff */}
      </View>

      <View style={styles.drawerItems}>
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('MainTabs');
            props.navigation.closeDrawer();
          }}
        >
          <Ionicons name="home-outline" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('Leaderboard');
            props.navigation.closeDrawer();
          }}
        >
          <Ionicons name="trophy-outline" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>Leaderboards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('DriverIncomeDashboard');
            props.navigation.closeDrawer();
          }}
        >
          <Entypo name="wallet" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('SettingsScreen');
            props.navigation.closeDrawer();
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.drawerButton, styles.logoutButton]}
          onPress={handleLogout}
          disabled={logoutEndpoint.isPending}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff4444" />
          <Text style={[styles.drawerLabel, styles.logoutLabel]}>
            {logoutEndpoint.isPending ? "Logging out..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer.Navigator
        initialRouteName="MainTabs"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerPosition: 'right',
          headerShown: false,
          drawerStyle: { width: 200 },
          swipeEnabled: true,
        }}
      >
        {/* Main Tabs */}
        <Drawer.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ drawerLabel: () => null }}
        />

        {/* Drawer Menu Screens */}
        <Drawer.Screen name="Leaderboard" component={Leaderboard} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="Ratings" component={Ratings} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="SettingsScreen" component={Settings} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="DriverIncomeDashboard" component={DriverIncomeDashboard} options={{ drawerLabel: () => null }} />

        {/* All other app screens */}
        <Drawer.Screen name="DocumentUploads" component={DocumentUploads} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="OrderScreen" component={OrderScreen} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="DriverMapScreen" component={DriverMapScreen} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="DriverChat" component={DriverChatScreen} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="Withdraw" component={Withdraw} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="BankTransfer" component={BankTransfer} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="TopUp" component={TopUp} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="Settings" component={Account} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="Legal" component={Legal} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="City" component={City} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="HelpAndSupport" component={HelpAndSupport} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="LoginAndSecurity" component={LoginAndSecurity} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="ReferAndEarn" component={ReferAndEarn} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="SafetyActions" component={SafetyActions} options={{ drawerLabel: () => null }} />
        <Drawer.Screen name="PersonalInfo" component={PersonalInfo} options={{ drawerLabel: () => null }} />
      </Drawer.Navigator>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: 'black',
    borderLeftWidth: 2,
    borderRightColor: '#FFC107',
  },
  drawerHeader: {
    padding: 25,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 193, 7, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  drawerItems: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  drawerLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  logoutButton: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.2)',
    paddingTop: 25,
  },
  logoutLabel: {
    color: '#ff4444',
  },
});