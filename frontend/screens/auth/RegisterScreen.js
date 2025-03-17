// frontend/screens/auth/RegisterScreen.js
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

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useContext(AuthContext);

  const validate = () => {
    const newErrors = {};

    if (!name) newErrors.name = "Tên không được để trống";
    if (!email) newErrors.email = "Email không được để trống";
    if (!password) newErrors.password = "Mật khẩu không được để trống";
    if (password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Mật khẩu không khớp";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await userApi.register({ name, email, password });

      // Đăng nhập tự động sau khi đăng ký thành công
      login(response.data);

      Alert.alert(
        "Đăng ký thành công",
        "Tài khoản của bạn đã được tạo thành công!"
      );
    } catch (error) {
      console.log("Register error:", error);

      let errorMessage = "Đã xảy ra lỗi khi đăng ký";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert("Đăng ký thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.title}>Đăng ký</Text>
        <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Họ tên"
          value={name}
          onChangeText={setName}
          placeholder="Nhập họ tên của bạn"
          icon="person-outline"
          autoCapitalize="words"
          error={errors.name}
        />

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

        <Input
          label="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          icon="lock-closed-outline"
          showPasswordToggle
          error={errors.confirmPassword}
        />

        <Button
          title="Đăng ký"
          onPress={handleRegister}
          isLoading={isLoading}
          style={styles.registerButton}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
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
  registerButton: {
    marginTop: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: COLORS.secondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
