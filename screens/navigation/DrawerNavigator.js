import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';

// Import screens
import Leaderboard from '../dashboard/Leaderboard';
import Ratings from '../settings/Ratings';
import Settings from '../settings/Settings';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        {/* Profile header stuff */}
      </View>

      <View style={styles.drawerItems}>
        {/* Home - Navigate back to tabs */}
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

        {/* Leaderboard */}
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

        {/* Ratings */}
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('Ratings');
            props.navigation.closeDrawer();
          }}
        >
          <Ionicons name="star-outline" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>My Ratings</Text>
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

        {/* Settings */}
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => {
            props.navigation.navigate('Settings');
            props.navigation.closeDrawer();
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#FFC107" />
          <Text style={styles.drawerLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}  

export default function DrawerNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer.Navigator
      id="DrawerNavigator"
        initialRouteName="MainTabs"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerPosition: 'right',
          headerShown: false,
          drawerStyle: { width: 200 },
          drawerActiveTintColor: '#FFC107',
          drawerInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
          drawerActiveBackgroundColor: 'rgba(255, 193, 7, 0.15)',
        }}
      >
        {/* Main Tabs - Primary screen */}
        <Drawer.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ drawerLabel: () => null }} // Hide from drawer menu
        />

        {/* Drawer-only screens */}
        <Drawer.Screen
          name="Leaderboard"
          component={Leaderboard}
          options={{ drawerLabel: () => null }}
        />
        <Drawer.Screen
          name="Ratings"
          component={Ratings}
          options={{ drawerLabel: () => null }}
        />
        <Drawer.Screen
          name="Settings"
          component={Settings}
          options={{ drawerLabel: () => null }}
        />
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
});