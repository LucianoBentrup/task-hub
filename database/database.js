import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar dados locais: ', e);
  }
};

const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Erro ao carregar dados locais: ', e);
    return null;
  }
};

export const addUser = async (name, email, password, callback) => {
  try {
    let users = await getData('users');
    if (!users) users = [];
    users.push({ name, email, password });
    await storeData('users', users);
    callback(true);
  } catch (e) {
    console.error('Erro ao adicionar conta local: ', e);
    callback(false);
  }
};

export const verifyUser = async (email, password, callback) => {
  try {
    const users = await getData('users');
    if (!users) return callback(false);
    const user = users.find((u) => u.email === email && u.password === password);
    callback(!!user);
  } catch (e) {
    console.error('Erro ao validar conta local: ', e);
    callback(false);
  }
};

export const initDatabase = async () => {
  try {
    let users = await getData('users');
    if (!users || users.length === 0) {
      users = [{ name: 'Teste', email: 't@gmail.com', password: '123' }];
      await storeData('users', users);
    }
  } catch (e) {
    console.error('Erro ao iniciar o armazenamento local: ', e);
  }
};
