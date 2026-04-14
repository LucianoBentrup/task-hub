import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

const AppHeader = ({ title, rightIconName, onRightPress }) => {
  const navigation = useNavigation();

  const handleLeftPress = () => {
    if (typeof navigation.openDrawer === 'function') {
      navigation.openDrawer();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleLeftPress} style={styles.menuButton}>
        <Icon name="bars" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerText}>{title}</Text>
      {rightIconName ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
          <Icon name={rightIconName} size={20} color="black" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    backgroundColor: '#f7f7f7',
  },
  menuButton: {
    marginLeft: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  rightButton: {
    marginRight: 10,
  },
});

export default AppHeader;
