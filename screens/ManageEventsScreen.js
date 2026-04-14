import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {
  deleteEventFromSupabase,
  exportEventToGoogleCalendar,
  exportEventsToGoogleCalendar,
  getEventsFromSupabase,
} from '../database/supabase';

const ManageEventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if (isFocused) {
      fetchEvents();
    }
  }, [isFocused]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await getEventsFromSupabase();
      if (error) {
        Alert.alert('Erro ao carregar', error.message);
        return;
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erro ao carregar eventos: ', e);
    }
  };

  const handleEditEvent = (event) => {
    navigation.navigate('EditEvent', { event });
  };

  const handleDeleteEvent = async (event) => {
    try {
      setIsDeleting(true);
      const { error } = await deleteEventFromSupabase(event.id);

      if (error) {
        Alert.alert('Erro ao excluir', error.message);
        return;
      }

      setEvents((currentEvents) => currentEvents.filter((currentEvent) => currentEvent.id !== event.id));
      Alert.alert('Sucesso', 'Evento excluído com sucesso');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportEvent = async (event) => {
    try {
      const { error } = await exportEventToGoogleCalendar(event);

      if (error) {
        Alert.alert('Erro ao exportar', error.message);
        return;
      }

      Alert.alert('Sucesso', 'Evento exportado para o Google Calendar com sucesso');
    } catch (e) {
      Alert.alert('Erro ao exportar', 'Nao foi possível concluir a exportação deste evento.');
    }
  };

  const handleExportAllEvents = async () => {
    if (events.length === 0) {
      Alert.alert('Sem eventos', 'Cadastre pelo menos um evento para exportar.');
      return;
    }

    try {
      setIsExportingAll(true);
      const result = await exportEventsToGoogleCalendar(events);

      if (result.error) {
        Alert.alert('Erro ao exportar', result.error.message);
        return;
      }

      if (result.failedCount > 0) {
        Alert.alert(
          'Exportação concluída com ressalvas',
          `${result.successCount} evento(s) enviados e ${result.failedCount} falharam.`,
        );
        return;
      }

      Alert.alert('Sucesso', `${result.successCount} evento(s) exportados para o Google Calendar.`);
    } catch (e) {
      Alert.alert('Erro ao exportar', 'Nao foi possível concluir a exportação em lote.');
    } finally {
      setIsExportingAll(false);
    }
  };

  const openEventActions = (event) => {
    Alert.alert(
      event.name,
      'Escolha uma ação para este evento.',
      [
        {
          text: 'Editar',
          onPress: () => handleEditEvent(event),
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar exclusão',
              'Tem certeza que deseja excluir este evento?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Excluir',
                  style: 'destructive',
                  onPress: () => handleDeleteEvent(event),
                },
              ],
            );
          },
        },
        {
          text: 'Exportar para Google Calendar',
          onPress: () => handleExportEvent(event),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Gerenciar Eventos" />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={[styles.batchExportButton, isExportingAll && styles.batchExportButtonDisabled]}
          onPress={handleExportAllEvents}
          disabled={isExportingAll || isDeleting}
        >
          {isExportingAll ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.batchExportButtonText}>Exportar todos para Google Calendar</Text>
          )}
        </TouchableOpacity>

        {events.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum evento cadastrado.</Text>
        ) : null}

        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventItem}
            onPress={() => openEventActions(event)}
            disabled={isDeleting}
          >
            <View style={styles.eventHeader}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventActionHint}>Editar, excluir ou exportar</Text>
            </View>
            <Text style={styles.eventDate}>{event.date}</Text>
            <Text style={styles.eventTime}>{event.startTime} - {event.endTime}</Text>
            {!!event.location && <Text style={styles.eventMeta}>Local: {event.location}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  batchExportButton: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  batchExportButtonDisabled: {
    opacity: 0.7,
  },
  batchExportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  eventItem: {
    padding: 14,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
    borderRadius: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#555',
  },
  eventMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
  },
  eventActionHint: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ManageEventsScreen;
