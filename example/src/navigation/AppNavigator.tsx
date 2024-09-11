import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnimalListScreen from '../components/AnimalListScreen';
import AnimalDetailsScreen from '../components/AnimalDetailsScreen';
import AnimalFormScreen from '../components/AnimalFormScreen';

const Stack = createNativeStackNavigator();

/** 
 * Control para el Navegador de escenas. 
 */
function AppNavigator(): JSX.Element {

  const navigationRef = useRef(null)

  return(
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="AnimalListScreen"
      >
        <Stack.Screen
          name="AnimalListScreen"
          component={AnimalListScreen}
        />
        <Stack.Screen
          name='AnimalDetailsScreen'
          component={AnimalDetailsScreen}
        />
        <Stack.Screen
          name='AnimalFormScreen'
          component={AnimalFormScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
