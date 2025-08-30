import React from 'react';
import LanguageScreen from './src/screens/LanguageScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import SigninScreen from './src/screens/SigninScreen';
import HomeScreen from './src/screens/HomeScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTabs from './src/navigation/BottomTabs';

// Define navigation types for my screens
export type RootStackParamList = {
  Language: undefined; // For my LanguageScreen
  Welcome: undefined; // For my WelcomeScreen
  Signin: undefined; // For my SigninScreen
  CreateAccount: undefined; // For my CreateAccountScreen
  Home: undefined;
  Document: undefined;
};

// Create a stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();


const App = () =>{
  return (
    // Navigation container to manage navigation state
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Language">
        <Stack.Screen name = "Language"
          component={LanguageScreen} 
          options = {{ headerShown: false}}
          />
        <Stack.Screen name = "Welcome"
          component={WelcomeScreen} 
          options = {{headerShown: false}}/>

        <Stack.Screen name = "Signin"
          component={SigninScreen} 
          options = {{headerShown: false}}/>

        <Stack.Screen name = "Home"
          component={BottomTabs} 
          options = {{headerShown: false}}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
