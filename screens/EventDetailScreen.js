import React from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AppHeader from '../components/AppHeader';
import { exportEventToGoogleCalendar } from '../database/supabase';

const EventDetailScreen = ({ route }) => {
  const { event } = route.params;

  const handleExport = async () => {
    const { error } = await exportEventToGoogleCalendar(event);

    if (error) {
      Alert.alert('Erro ao exportar', error.message);
      return;
    }

    Alert.alert('Sucesso', 'Evento exportado para o Google Calendar com sucesso');
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Detalhes do Evento" />
      <View style={styles.container}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.detail}>Início: {event.startTime}</Text>
        <Text style={styles.detail}>Término: {event.endTime}</Text>
        <Text style={styles.detail}>Local: {event.location}</Text>
        <Text style={styles.detail}>Organizador: {event.organizer}</Text>
        <Text style={styles.detail}>Descrição: {event.description}</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>Exportar para Google Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 16,
    marginBottom: 10,
  },
  exportButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDetailScreen;
