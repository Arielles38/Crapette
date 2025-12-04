/**
 * Crapette Mobile Game - Main App
 * React Native root component
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import AILobbyScreen from './src/screens/AILobbyScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Initialize i18n
import './src/i18n/i18n';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#2c3e50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ title: 'Crapette' }}
        />
        <Stack.Screen
          name="AIGame"
          component={GameScreen}
          options={{ title: 'Game vs AI' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
