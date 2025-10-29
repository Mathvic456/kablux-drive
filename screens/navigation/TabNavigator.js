// App.js or Navigation.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome6, SimpleLineIcons, Feather } from '@expo/vector-icons'; // Optional: for icons
import Home from '../dashboard/Home';
import Bookings from '../dashboard/Bookings';
import Wallet from '../dashboard/Wallet';
import Leaderboard from '../dashboard/Leaderboard';
import Account from '../settings/Account';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#FEB914',
        tabBarInactiveTintColor: 'white',
        tabBarStyle: {
          backgroundColor: '#181818',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={Bookings}
        options={{
          tabBarLabel: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="clock-rotate-left" size={size} color={color} />          ),
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={Wallet}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={Account}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
export default TabNavigator;