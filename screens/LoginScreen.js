import React, { useState } from 'react';
import { ActivityIndicator, Alert, View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { verifyUser } from '../database/database';
import { signInWithEmailPassword, signInWithGoogle } from '../database/supabase';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Preencha e-mail e senha');
            return;
        }

        try {
            setIsEmailLoading(true);
            const { error: loginError } = await signInWithEmailPassword({
                email: email.trim(),
                password,
            });

            if (loginError) {
                const localUserIsValid = await new Promise((resolve) => {
                    verifyUser(email.trim().toLowerCase(), password, (isValid) => resolve(isValid));
                });

                if (localUserIsValid && __DEV__) {
                    Alert.alert('Conta local de teste', 'Essa conta existe apenas no modo de desenvolvimento.');
                    return;
                }

                setError(loginError.message || 'E-mail ou senha incorretos');
                return;
            }

            setError('');
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsGoogleLoading(true);
            setError('');

            const { error: googleError } = await signInWithGoogle();

            if (googleError) {
                setError(googleError.message || 'Nao foi possivel entrar com Google agora.');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Recuperação de senha', 'A recuperação de senha será conectada ao Supabase na próxima etapa.');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>TASK HUB</Text>
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
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="black" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu sua senha? <Text style={styles.forgotPasswordLink}>Clique aqui!</Text></Text>
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isEmailLoading || isGoogleLoading}>
                {isEmailLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.button}>
                <Text style={styles.buttonText}>Criar conta</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>OU</Text>
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton} disabled={isEmailLoading || isGoogleLoading}>
                {isGoogleLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.googleButtonText}>Entrar com Google</Text>}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#000',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 20,
        width: '100%',
    },
    input: {
        flex: 1,
        height: 40,
        fontSize: 16,
        paddingHorizontal: 10,
        color: '#000',
    },
    icon: {
        marginRight: 10,
    },
    eyeButton: {
        padding: 5,
    },
    forgotPassword: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#000',
    },
    forgotPasswordLink: {
        color: '#0000FF',
        textDecorationLine: 'underline',
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
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    orText: {
        marginVertical: 10,
        fontSize: 16,
        color: '#000',
    },
    googleButton: {
        backgroundColor: '#4285F4',
        padding: 15,
        alignItems: 'center',
        width: '100%',
    },
    googleButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default LoginScreen;
