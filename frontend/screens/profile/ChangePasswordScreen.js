import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { AuthContext } from "../../utils/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { COLORS } from "../../utils/constants";
import { userApi } from "../../services/api";

const ChangePasswordScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Mật khẩu hiện tại không được để trống";
    }

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới không được để trống";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword =
        "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không được để trống";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await userApi.changePassword(user.id, currentPassword, newPassword);

      Alert.alert(
        "Thành công",
        "Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.",
        [
          {
            text: "OK",
            onPress: () => logout(),
          },
        ]
      );
    } catch (error) {
      console.log("Error changing password:", error);
      let errorMessage = "Không thể đổi mật khẩu";

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Đổi mật khẩu</Text>
        <Text style={styles.description}>
          Để đổi mật khẩu, vui lòng nhập mật khẩu hiện tại và mật khẩu mới của
          bạn
        </Text>

        <Input
          label="Mật khẩu hiện tại"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Nhập mật khẩu hiện tại"
          secureTextEntry
          icon="lock-closed-outline"
          showPasswordToggle
          error={errors.currentPassword}
        />

        <Input
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
          secureTextEntry
          icon="lock-closed-outline"
          showPasswordToggle
          error={errors.newPassword}
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
          title="Đổi mật khẩu"
          onPress={handleChangePassword}
          isLoading={isLoading}
          style={styles.button}
        />

        <Button
          title="Hủy"
          onPress={() => navigation.goBack()}
          type="outline"
          style={styles.cancelButton}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
  },
  forgotPasswordContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ChangePasswordScreen;
