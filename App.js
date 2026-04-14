import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/navigationService';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Telas do fluxo principal.
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import ManageEventsScreen from './screens/ManageEventsScreen';
import EditEventScreen from './screens/EditEventScreen';
import CustomDrawerContent from './screens/CustomDrawerContent';
import { supabase, syncUserProfileFromSession } from './database/supabase';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const MainDrawer = () => (
  <Drawer.Navigator drawerContent={props => <CustomDrawerContent {...props} />} screenOptions={{ headerShown: false }}>
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="CreateEvent" component={CreateEventScreen} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
    <Drawer.Screen name="ManageEvents" component={ManageEventsScreen} />
  </Drawer.Navigator>
);

const App = () => {
  const [session, setSession] = React.useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);

  // Mantém o fallback local pronto para testes e compatibilidade com fluxos antigos.
  React.useEffect(() => {
    (async () => {
      try {
        const { initDatabase } = await import('./database/database');
        initDatabase();
      } catch (e) {
        console.error('Erro ao iniciar o armazenamento local: ', e);
      }
    })();
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setSession(initialSession);

        if (initialSession) {
          await syncUserProfileFromSession(initialSession);
        }
      } catch (e) {
        console.error('Erro ao carregar a sessão: ', e);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoadingAuth(false);

      if (nextSession) {
        setTimeout(() => {
          syncUserProfileFromSession(nextSession);
        }, 0);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoadingAuth) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, fontSize: 16, color: '#334155' }}>Preparando seu acesso...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Main" component={MainDrawer} />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} />
              <Stack.Screen name="EditEvent" component={EditEventScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
