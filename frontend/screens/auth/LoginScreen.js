import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthContext } from "../../utils/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { COLORS } from "../../utils/constants";
import { userApi } from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useContext(AuthContext);

  const validate = () => {
    const newErrors = {};

    if (!email) newErrors.email = "Email không được để trống";
    if (!password) newErrors.password = "Mật khẩu không được để trống";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await userApi.login({ email, password });
      login(response.data);
    } catch (error) {
      console.log("Login error:", error);

      let errorMessage = "Đã xảy ra lỗi khi đăng nhập";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert("Đăng nhập thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Điều hướng đến trang quên mật khẩu
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="dark" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={COLORS.dark} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Đăng nhập để sử dụng ứng dụng</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Nhập email của bạn"
          keyboardType="email-address"
          icon="mail-outline"
          error={errors.email}
        />

        <Input
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu của bạn"
          secureTextEntry
          icon="lock-closed-outline"
          showPasswordToggle
          error={errors.password}
        />

        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          isLoading={isLoading}
          style={styles.loginButton}
        />

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  form: {
    marginBottom: 20,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 10,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: COLORS.secondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});

export default LoginScreen;
