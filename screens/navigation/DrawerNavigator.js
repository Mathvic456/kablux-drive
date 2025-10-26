import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// Screens
import Leaderboards from '../settings/Leaderboards';
import Ratings from '../settings/Ratings';
import Settings from '../settings/Settings';
import DrawerStackNavigator from './DrawerStackNavigator';


const Drawer = createDrawerNavigator();

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView 
      {...props} 
      style={styles.drawerContainer}
      contentContainerStyle={styles.drawerContent}
    >
      {/* Drawer Header */}
      <View style={styles.drawerHeader}>
        <Image
          source={require('../../assets/Profileimg.png')} // Adjust path as needed
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Ibrahim Victor</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>4.99 </Text>
            <FontAwesome5 name="star" size={14} color="#FFC107" />
          </View>
          <Text style={styles.driverId}>Driver ID: KBLX28934</Text>
        </View>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Drawer Footer */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            // Handle logout
            console.log('Logout pressed');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFC107" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>KabLux Driver v2.1.4</Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <NavigationContainer> */}
        <Drawer.Navigator 
          initialRouteName="Home"
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              width: 320,
            },
            drawerLabelStyle: {
              fontSize: 16,
              fontWeight: '600',
              marginLeft: -16,
            },
            drawerActiveTintColor: '#FFC107',
            drawerInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
            drawerActiveBackgroundColor: 'rgba(255, 193, 7, 0.15)',
          }}
        >

            <Drawer.Screen 
            name="Home" 
            component={DrawerStackNavigato}
            options={{
              title: 'Settings',
              drawerIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? "settings" : "settings-outline"} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          <Drawer.Screen 
            name="DrawerStack" 
            component={DrawerStackNavigator}
            options={{
              title: 'Settings',
              drawerIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? "settings" : "settings-outline"} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          <Drawer.Screen 
            name="Ratings" 
            component={Ratings}
            options={{
              title: 'My Ratings',
              drawerIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? "star" : "star-outline"} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
          <Drawer.Screen 
            name="Leaderboards" 
            component={Leaderboards}
            options={{
              title: 'Leaderboards',
              drawerIcon: ({ color, size, focused }) => (
                <Ionicons 
                  name={focused ? "trophy" : "trophy-outline"} 
                  size={size} 
                  color={color} 
                />
              ),
            }}
          />
        </Drawer.Navigator>
        <StatusBar style="light" />
      {/* </NavigationContainer> */}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#04223A',
    borderRightWidth: 2,
    borderRightColor: '#FFC107',
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 25,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 193, 7, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  driverId: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  drawerItems: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 193, 7, 0.3)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#FFC107',
    marginBottom: 15,
  },
  logoutText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
  },
});