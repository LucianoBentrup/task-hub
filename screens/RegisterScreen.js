import React, { useState } from 'react';
import { Alert, View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { signUpWithEmailPassword } from '../database/supabase';

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigation = useNavigation();

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não conferem');
            return;
        }

        try {
            setIsSaving(true);
            setError('');

            const { data, error: supabaseError } = await signUpWithEmailPassword({
                name: name.trim(),
                email: email.trim(),
                password,
            });

            if (supabaseError) {
                setError(supabaseError.message);
                return;
            }

            const successMessage = data?.session
                ? 'Conta criada com sucesso'
                : 'Conta criada com sucesso. Se o Supabase estiver exigindo confirmação de e-mail, confirme seu e-mail antes de entrar.';

            Alert.alert('Sucesso', successMessage, [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login'),
                },
            ]);
        } catch (e) {
            setError('Não foi possível concluir o cadastro');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CRIAR CONTA</Text>
            <Text style={styles.subtitle}>O segredo para o sucesso acadêmico começa aqui.</Text>
            <View style={styles.inputContainer}>
                <Icon name="user" size={20} color="black" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Nome"
                    placeholderTextColor="gray"
                    value={name}
                    onChangeText={setName}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="black" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="gray"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="black" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="gray"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="black" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirma senha"
                    placeholderTextColor="gray"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity onPress={handleRegister} style={styles.button} disabled={isSaving}>
                <Text style={styles.buttonText}>{isSaving ? 'Criando conta...' : 'Criar conta'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#000',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
        padding: 10,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#000',
    },
    error: {
        color: 'red',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        marginVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    backButton: {
        backgroundColor: '#ccc',
        padding: 15,
        marginVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    backButtonText: {
        color: '#000',
        fontSize: 16,
    },
});

export default RegisterScreen;
