// frontend/screens/auth/WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../../components/common/Button';
import { COLORS } from '../../utils/constants';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/favicon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Quản Lý Chi Tiêu Nhóm</Text>
        <Text style={styles.subtitle}>Quản lý chi tiêu nhóm dễ dàng và hiệu quả</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Đăng nhập"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        />
        <Button
          title="Đăng ký"
          onPress={() => navigation.navigate('Register')}
          type="outline"
          style={styles.registerButton}
        />
      </View>
      <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  loginButton: {
    marginBottom: 16,
  },
  registerButton: {
    marginBottom: 16,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 10,
  },
});

export default WelcomeScreen;