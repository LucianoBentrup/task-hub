import React, { useState } from 'react';
import { Alert, View, TextInput, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { insertEventToSupabase } from '../database/supabase';

const CreateEventScreen = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const onStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(false);
    setStartTime(currentTime);
  };

  const onEndTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(false);
    setEndTime(currentTime);
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSaveEvent = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe o nome do evento.');
      return;
    }

    const event = {
      name: name.trim(),
      date: date.toISOString().split('T')[0],
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      location: location.trim(),
      organizer: organizer.trim(),
      description: description.trim(),
    };

    try {
      setIsSaving(true);
      const { error } = await insertEventToSupabase(event);

      if (error) {
        Alert.alert('Erro ao salvar', error.message);
        return;
      }

      Alert.alert('Sucesso', 'Evento criado com sucesso');
      navigation.navigate('ManageEvents');
    } catch (e) {
      console.error('Erro ao salvar evento: ', e);
      Alert.alert('Erro ao salvar', 'Não foi possível salvar o evento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Criar Evento" />
      <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome do Evento"
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.timeInput}>
        <Text style={styles.timeText}>{`Início: ${formatTime(startTime)}`}</Text>
      </TouchableOpacity>
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}
      <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.timeInput}>
        <Text style={styles.timeText}>{`Fim: ${formatTime(endTime)}`}</Text>
      </TouchableOpacity>
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Local"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Organizador"
        value={organizer}
        onChangeText={setOrganizer}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity onPress={handleSaveEvent} style={styles.saveButton} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dateInput: {
    height: 40,
    justifyContent: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
  timeInput: {
    height: 40,
    justifyContent: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CreateEventScreen;
