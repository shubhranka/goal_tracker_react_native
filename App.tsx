import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Target, BarChart2 } from 'lucide-react-native';
import HomeScreen from './src/screens/HomeScreen';
import VisualizationScreen from './src/screens/VisualizationScreen';
import { Colors } from './src/constants/Colors';
import 'react-native-get-random-values';

const queryClient = new QueryClient();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar hidden />
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: Colors.primary,
              tabBarInactiveTintColor: Colors.textSecondary,
              headerShown: false,
              tabBarStyle: {
                borderTopWidth: 1,
                borderTopColor: Colors.border,
                paddingBottom: 5,
                paddingTop: 5,
              }
            }}
          >
            <Tab.Screen 
              name="Goals" 
              component={HomeScreen} 
              options={{
                tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
              }}
            />
            <Tab.Screen 
              name="Stats" 
              component={VisualizationScreen} 
              options={{
                tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
