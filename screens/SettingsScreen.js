import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';

const SettingsScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Configurações" />
      <View style={isDarkMode ? styles.containerDark : styles.containerLight}>
        <Text style={isDarkMode ? styles.titleDark : styles.titleLight}>Configurações</Text>
        <View style={styles.settingItem}>
          <Text style={isDarkMode ? styles.settingTextDark : styles.settingTextLight}>Modo Escuro</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>

        <View style={isDarkMode ? styles.infoCardDark : styles.infoCardLight}>
          <Text style={isDarkMode ? styles.infoTitleDark : styles.infoTitleLight}>Conta conectada</Text>
          <Text style={isDarkMode ? styles.statusTextDark : styles.statusTextLight}>
            Seus eventos continuam sincronizados com o Supabase e podem ser exportados para o Google Calendar pela tela de gerenciamento.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerLight: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  containerDark: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#333',
  },
  titleLight: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  titleDark: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoCardLight: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  infoCardDark: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  infoTitleLight: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  infoTitleDark: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  settingTextLight: {
    fontSize: 18,
    color: '#000',
  },
  settingTextDark: {
    fontSize: 18,
    color: '#fff',
  },
  statusTextLight: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    textAlign: 'left',
  },
  statusTextDark: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e8f0',
    textAlign: 'left',
  },
});

export default SettingsScreen;
