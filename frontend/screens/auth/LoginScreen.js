// frontend/screens/auth/LoginScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../../utils/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../utils/constants';
import { userApi } from '../../services/api';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Trạng thái cho quên mật khẩu
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Nhập email, 2: Nhập mã xác nhận, 3: Nhập mật khẩu mới
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  const { login } = useContext(AuthContext);

  // Đếm ngược thời gian chờ gửi lại mã
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validate = () => {
    const newErrors = {};

    if (!email) newErrors.email = 'Email không được để trống';
    if (!password) newErrors.password = 'Mật khẩu không được để trống';

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
      console.log('Login error:', error);

      let errorMessage = 'Đã xảy ra lỗi khi đăng nhập';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mở modal quên mật khẩu
  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true);
    setResetStep(1);
    setResetEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetErrors({});
  };

  // Đóng modal
  const closeForgotPasswordModal = () => {
    setForgotPasswordModalVisible(false);
  };

  // Xác thực đầu vào ở mỗi bước
  const validateResetStep = () => {
    const newErrors = {};

    if (resetStep === 1) {
      if (!resetEmail) newErrors.resetEmail = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(resetEmail)) newErrors.resetEmail = 'Email không hợp lệ';
    } else if (resetStep === 2) {
      if (!verificationCode) newErrors.verificationCode = 'Mã xác nhận không được để trống';
      else if (verificationCode.length !== 6) newErrors.verificationCode = 'Mã xác nhận phải có 6 chữ số';
    } else if (resetStep === 3) {
      if (!newPassword) newErrors.newPassword = 'Mật khẩu mới không được để trống';
      else if (newPassword.length < 6) newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    setResetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gửi yêu cầu reset mật khẩu
  const handleRequestCode = async () => {
    if (!validateResetStep()) return;

    setIsLoadingReset(true);
    try {
      await userApi.requestPasswordReset(resetEmail);
      Alert.alert('Thành công', 'Mã xác nhận đã được gửi đến email của bạn');
      setResetStep(2);
      setCountdown(60); // 60 giây chờ để gửi lại mã
    } catch (error) {
      console.log('Error requesting reset code:', error);
      let errorMessage = 'Không thể gửi mã xác nhận';

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoadingReset(false);
    }
  };

  // Xác thực mã
  const handleVerifyCode = () => {
    if (!validateResetStep()) return;
    setResetStep(3);
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async () => {
    if (!validateResetStep()) return;

    setIsLoadingReset(true);
    try {
      await userApi.resetPassword(resetEmail, verificationCode, newPassword);
      Alert.alert(
        'Thành công',
        'Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập với mật khẩu mới.',
        [{ text: 'OK', onPress: closeForgotPasswordModal }]
      );

      // Tự động điền email để người dùng dễ đăng nhập sau khi đổi mật khẩu
      setEmail(resetEmail);
    } catch (error) {
      console.log('Error resetting password:', error);
      let errorMessage = 'Không thể đặt lại mật khẩu';

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoadingReset(false);
    }
  };

  // Xử lý nút tiếp theo trong modal
  const handleNextStep = () => {
    if (resetStep === 1) {
      handleRequestCode();
    } else if (resetStep === 2) {
      handleVerifyCode();
    } else if (resetStep === 3) {
      handleResetPassword();
    }
  };

  // Render nội dung modal tương ứng với từng bước
  const renderModalContent = () => {
    if (resetStep === 1) {
      return (
        <>
          <Text style={styles.modalTitle}>Quên mật khẩu</Text>
          <Text style={styles.modalDescription}>
            Nhập email của bạn để nhận mã xác nhận
          </Text>
          <Input
            label="Email"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            error={resetErrors.resetEmail}
          />
        </>
      );
    } else if (resetStep === 2) {
      return (
        <>
          <Text style={styles.modalTitle}>Nhập mã xác nhận</Text>
          <Text style={styles.modalDescription}>
            Chúng tôi đã gửi mã xác nhận đến email của bạn
          </Text>
          <Input
            label="Mã xác nhận (6 chữ số)"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            error={resetErrors.verificationCode}
          />
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Gửi lại mã sau {countdown} giây
            </Text>
          ) : (
            <TouchableOpacity onPress={handleRequestCode} disabled={isLoadingReset}>
              <Text style={styles.resendLink}>Gửi lại mã</Text>
            </TouchableOpacity>
          )}
        </>
      );
    } else if (resetStep === 3) {
      return (
        <>
          <Text style={styles.modalTitle}>Tạo mật khẩu mới</Text>
          <Input
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={resetErrors.newPassword}
            showPasswordToggle
          />
          <Input
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={resetErrors.confirmPassword}
            showPasswordToggle
          />
        </>
      );
    }
  };

  // Modal title và button text tương ứng với từng bước
  const getModalButtonTitle = () => {
    if (resetStep === 1) return 'Gửi mã xác nhận';
    if (resetStep === 2) return 'Xác nhận';
    return 'Đặt lại mật khẩu';
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
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal quên mật khẩu */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeForgotPasswordModal}
            >
              <Icon name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>

            {renderModalContent()}

            <Button
              title={getModalButtonTitle()}
              onPress={handleNextStep}
              isLoading={isLoadingReset}
              style={styles.modalButton}
            />

            <Button
              title="Hủy"
              onPress={closeForgotPasswordModal}
              type="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
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
    fontWeight: 'bold',
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
    alignSelf: 'flex-end',
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: COLORS.secondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
  },
  resendText: {
    textAlign: 'center',
    color: COLORS.secondary,
    marginTop: 12,
  },
  resendLink: {
    textAlign: 'center',
    color: COLORS.primary,
    marginTop: 12,
    fontWeight: '600',
  },
});

export default LoginScreen;