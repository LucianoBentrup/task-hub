import React from 'react';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Alert, View, Text, Switch, StyleSheet } from 'react-native';
import { getCurrentUserProfile, signOutFromSupabase } from '../database/supabase';

const CustomDrawerContent = (props) => {
  const [isNotificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [profile, setProfile] = React.useState(null);

  const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);

  React.useEffect(() => {
    const loadProfile = async () => {
      const { user } = await getCurrentUserProfile();
      setProfile(user);
    };

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOutFromSupabase();

    if (error) {
      Alert.alert('Erro ao sair', error.message);
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ flex: 1 }} onStartShouldSetResponder={() => true} onResponderRelease={() => {}}>
        <View style={styles.profileBox}>
          <Text style={styles.profileTitle}>{profile?.name || 'Task Hub'}</Text>
          <Text style={styles.profileSubtitle}>{profile?.email || 'Entre com sua conta para sincronizar dados.'}</Text>
        </View>

        <DrawerItem
          label="Meus eventos"
          onPress={() => props.navigation.navigate('Home')}
        />
        <DrawerItem
          label="Criar evento"
          onPress={() => props.navigation.navigate('CreateEvent')}
        />
        <DrawerItem
          label="Gerenciar eventos"
          onPress={() => props.navigation.navigate('ManageEvents')}
        />
        <View style={styles.drawerItem}>
          <Text style={styles.drawerItemText}>Notificações</Text>
          <Switch
            value={isNotificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>
        <DrawerItem
          label="Configuração (Em desenvolvimento)"
          onPress={() => props.navigation.navigate('Settings')}
        />
        <DrawerItem
          label="Sair"
          onPress={handleSignOut}
        />

      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  drawerItemText: {
    fontSize: 16,
  },
  profileBox: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
});

export default CustomDrawerContent;
