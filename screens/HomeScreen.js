import React, { useState, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getEventsFromSupabase, signOutFromSupabase } from '../database/supabase';

// Mantém o calendário no padrão pt-BR em toda a tela.
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const HomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState([]);

  // Recarrega a lista ao voltar para a tela.
  useEffect(() => {
    if (isFocused) fetchEvents();
  }, [isFocused]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await getEventsFromSupabase();
      if (error) {
        console.error('Erro ao carregar eventos: ', error);
        return;
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erro ao carregar eventos: ', e);
    }
  };

  const handleDayPress = (day) => {
    setSelectedDay(day.dateString);
  };

  const eventsForSelectedDay = events.filter(event => event.date === selectedDay);

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  const handleLogout = async () => {
    const { error } = await signOutFromSupabase();

    if (error) {
      Alert.alert('Erro ao sair', error.message);
    }
  };

  const markedDates = events.reduce((accumulator, event) => {
    if (!event.date) {
      return accumulator;
    }

    accumulator[event.date] = {
      ...(accumulator[event.date] || {}),
      marked: true,
      dotColor: '#2563eb',
    };

    return accumulator;
  }, {});

  if (selectedDay) {
    markedDates[selectedDay] = {
      ...(markedDates[selectedDay] || {}),
      selected: true,
      selectedColor: '#0f766e',
    };
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Task Hub" rightIconName="sign-out" onRightPress={handleLogout} />
      <Calendar 
        current={new Date().toISOString().split('T')[0]} 
        onDayPress={handleDayPress}
        monthFormat={'MMMM yyyy'}
        onMonthChange={() => {}}
        hideExtraDays={true}
        firstDay={1}
        showWeekNumbers={false}
        onPressArrowLeft={subtractMonth => subtractMonth()}
        onPressArrowRight={addMonth => addMonth()}
        disableAllTouchEventsForDisabledDays={true}
        enableSwipeMonths={true}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#fff',
          calendarBackground: '#fff',
          textSectionTitleColor: '#000',
          dayTextColor: '#000',
          todayTextColor: '#00adf5',
          selectedDayTextColor: '#fff',
          monthTextColor: '#000',
          indicatorColor: '#000',
        }}
      />
      {selectedDay && (
        <View style={styles.eventBox}>
          <Text style={styles.selectedDayText}>{formatDate(selectedDay)}</Text>
          <ScrollView>
            {eventsForSelectedDay.length > 0 ? (
              eventsForSelectedDay.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventItem} onPress={() => handleEventPress(event)}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventTime}>{event.startTime} - {event.endTime}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum evento cadastrado para esta data.</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  eventBox: {
    flex: 1,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  selectedDayText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventItem: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 14,
    color: '#555',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default HomeScreen;
