import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase('taskhub.db');

export const initDb = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        startTime TEXT,
        endTime TEXT,
        location TEXT,
        organizer TEXT,
        description TEXT
      );`
    );
  });
};

export const insertEvent = (event, cb = () => {}) => {
  const { name, date, startTime, endTime, location, organizer, description } = event;
  db.transaction((tx) => {
    tx.executeSql(
      'INSERT INTO events (name, date, startTime, endTime, location, organizer, description) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [name, date, startTime, endTime, location, organizer, description],
      (_, result) => cb(null, result),
      (_, error) => cb(error)
    );
  });
};

export const getEvents = (cb) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM events ORDER BY date, startTime;',
      [],
      (_, { rows }) => cb(null, rows._array),
      (_, error) => cb(error)
    );
  });
};

export const migrateEventsFromAsyncStorage = async () => {
  try {
    const stored = await AsyncStorage.getItem('events');
    const events = stored ? JSON.parse(stored) : [];
    for (const ev of events) {
      insertEvent(ev);
    }
  } catch (e) {
    console.error('Falha na migração local: ', e);
  }
};

export default db;
