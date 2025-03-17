import React, { useState, useEffect, useContext } from "react";
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
import Icon from "react-native-vector-icons/Ionicons";

const ForgotPasswordScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập mã xác nhận, 3: Nhập mật khẩu mới
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  // Đếm ngược thời gian chờ gửi lại mã
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Kiểm tra đầu vào ở mỗi bước
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!email) newErrors.email = "Email không được để trống";
      else if (!/\S+@\S+\.\S+/.test(email))
        newErrors.email = "Email không hợp lệ";
    } else if (step === 2) {
      if (!verificationCode)
        newErrors.verificationCode = "Mã xác nhận không được để trống";
      else if (verificationCode.length !== 6)
        newErrors.verificationCode = "Mã xác nhận phải có 6 chữ số";
    } else if (step === 3) {
      if (!newPassword)
        newErrors.newPassword = "Mật khẩu mới không được để trống";
      else if (newPassword.length < 6)
        newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";

      if (!confirmPassword)
        newErrors.confirmPassword = "Xác nhận mật khẩu không được để trống";
      else if (newPassword !== confirmPassword)
        newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý gửi yêu cầu đổi mật khẩu
  const handleRequestCode = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const response = await userApi.requestPasswordReset(email);
      console.log("Request password reset response:", response.data);

      // Hiển thị mã trong môi trường phát triển để thuận tiện cho việc test
      // QUAN TRỌNG: Hãy nhớ xóa hoặc vô hiệu hóa dòng này khi phát hành ứng dụng!
      const devMessage = __DEV__
        ? "\n\nMã xác nhận (chỉ hiển thị trong môi trường phát triển): " +
            response.data.debug?.codeForTesting || ""
        : "";

      Alert.alert(
        "Thành công",
        "Mã xác nhận đã được gửi đến email của bạn" + devMessage
      );
      setStep(2);
      setCountdown(60); // 60 giây chờ để gửi lại mã
    } catch (error) {
      console.log("Error requesting reset code:", error);
      let errorMessage = "Không thể gửi mã xác nhận";

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xác thực mã
  const handleVerifyCode = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      console.log(`Verifying code: ${verificationCode} for email: ${email}`);

      // Gọi API xác thực mã
      const response = await userApi.verifyPasswordResetCode(
        email,
        verificationCode
      );
      console.log("Verification response:", response.data);

      // Nếu xác thực thành công thì mới chuyển sang bước đổi mật khẩu
      if (response.data && response.data.success) {
        setStep(3);
      } else {
        setErrors({
          ...errors,
          verificationCode: "Mã xác nhận không chính xác",
        });
      }
    } catch (error) {
      console.log("Error verifying code:", error);
      console.log("Error response:", error.response?.data);

      let errorMessage = "Mã xác nhận không chính xác";

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      setErrors({
        ...errors,
        verificationCode: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleResetPassword = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      await userApi.resetPassword(email, verificationCode, newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công", [
        {
          text: "Đăng nhập",
          onPress: () => {
            // Đăng xuất người dùng hiện tại (nếu có)
            logout();
            // Điều hướng đến màn hình đăng nhập
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" }],
            });
          },
        },
      ]);
    } catch (error) {
      console.log("Error resetting password:", error);
      let errorMessage = "Không thể đổi mật khẩu";

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý nút tiếp theo
  const handleNextStep = () => {
    if (step === 1) {
      handleRequestCode();
    } else if (step === 2) {
      handleVerifyCode();
    } else if (step === 3) {
      handleResetPassword();
    }
  };

  // Render nội dung tương ứng với từng bước
  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.stepTitle}>Đặt lại mật khẩu</Text>
          <Text style={styles.stepDescription}>
            Nhập email của bạn để nhận mã xác nhận
          </Text>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Nhập email của bạn"
            icon="mail-outline"
            error={errors.email}
          />
        </>
      );
    } else if (step === 2) {
      return (
        <>
          <Text style={styles.stepTitle}>Nhập mã xác nhận</Text>
          <Text style={styles.stepDescription}>
            Chúng tôi đã gửi mã xác nhận 6 chữ số đến email của bạn
          </Text>
          <Input
            label="Mã xác nhận"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            placeholder="Nhập mã xác nhận"
            icon="key-outline"
            maxLength={6}
            error={errors.verificationCode}
          />

          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Gửi lại mã sau {countdown} giây
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={isLoading}
              style={styles.resendLinkContainer}
            >
              <Text style={styles.resendLinkText}>Gửi lại mã</Text>
            </TouchableOpacity>
          )}
        </>
      );
    } else if (step === 3) {
      return (
        <>
          <Text style={styles.stepTitle}>Tạo mật khẩu mới</Text>
          <Text style={styles.stepDescription}>
            Nhập mật khẩu mới cho tài khoản của bạn
          </Text>
          <Input
            key="newPasswordInput"
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={(text) => {
              console.log("Setting new password:", text);
              setNewPassword(text);
            }}
            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            secureTextEntry={true}
            icon="lock-closed-outline"
            showPasswordToggle={true}
            error={errors.newPassword}
          />

          <Input
            key="confirmPasswordInput"
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={(text) => {
              console.log("Setting confirm password:", text);
              setConfirmPassword(text);
            }}
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry={true}
            icon="lock-closed-outline"
            showPasswordToggle={true}
            error={errors.confirmPassword}
          />
        </>
      );
    }
  };

  // Lấy tiêu đề nút dựa vào bước hiện tại
  const getButtonTitle = () => {
    if (step === 1) return "Gửi mã xác nhận";
    if (step === 2) return "Tiếp tục";
    return "Đổi mật khẩu";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[styles.progressStep, { backgroundColor: COLORS.primary }]}
        />
        <View
          style={[
            styles.progressLine,
            step >= 2 ? { backgroundColor: COLORS.primary } : {},
          ]}
        />
        <View
          style={[
            styles.progressStep,
            step >= 2 ? { backgroundColor: COLORS.primary } : {},
          ]}
        />
        <View
          style={[
            styles.progressLine,
            step >= 3 ? { backgroundColor: COLORS.primary } : {},
          ]}
        />
        <View
          style={[
            styles.progressStep,
            step >= 3 ? { backgroundColor: COLORS.primary } : {},
          ]}
        />
      </View>

      <Card style={styles.card}>
        {renderStepContent()}

        <Button
          title={getButtonTitle()}
          onPress={handleNextStep}
          isLoading={isLoading}
          style={styles.actionButton}
        />

        <Button
          title="Hủy"
          onPress={() => navigation.goBack()}
          type="outline"
          style={styles.cancelButton}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    paddingTop: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  progressStep: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  actionButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
  },
  countdownText: {
    textAlign: "center",
    color: COLORS.secondary,
    marginTop: 16,
  },
  resendLinkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  resendLinkText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
