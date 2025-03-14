// frontend/screens/profile/SettingsScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Modal, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../utils/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../utils/constants';
import { userApi } from '../../services/api';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Settings options (these would be stored in AsyncStorage in a real app)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Đổi mật khẩu
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Nhập email, 2: Nhập mã xác nhận, 3: Nhập mật khẩu mới
  const [email, setEmail] = useState(user.email);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Đếm ngược thời gian chờ gửi lại mã
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validate = () => {
    const newErrors = {};

    if (!name) newErrors.name = 'Tên không được để trống';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await userApi.updateUser(user.id, { name });

      // Update local user data
      const updatedUser = { ...user, name };
      login(updatedUser);

      Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật!');
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mở modal đổi mật khẩu
  const handleChangePassword = () => {
    setPasswordModalVisible(true);
    setResetStep(1);
    setEmail(user.email);
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  // Đóng modal đổi mật khẩu
  const closePasswordModal = () => {
    setPasswordModalVisible(false);
  };

  // Kiểm tra đầu vào ở mỗi bước
  const validatePasswordStep = () => {
    const newErrors = {};

    if (resetStep === 1) {
      if (!email) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';
    } else if (resetStep === 2) {
      if (!verificationCode) newErrors.verificationCode = 'Mã xác nhận không được để trống';
      else if (verificationCode.length !== 6) newErrors.verificationCode = 'Mã xác nhận phải có 6 chữ số';
    } else if (resetStep === 3) {
      if (!newPassword) newErrors.newPassword = 'Mật khẩu mới không được để trống';
      else if (newPassword.length < 6) newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý gửi yêu cầu đổi mật khẩu
  const handleRequestCode = async () => {
    if (!validatePasswordStep()) return;

    setIsLoadingPassword(true);
    try {
      await userApi.requestPasswordReset(email);
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
      setIsLoadingPassword(false);
    }
  };

  // Xử lý xác thực mã
  const handleVerifyCode = () => {
    if (!validatePasswordStep()) return;
    setResetStep(3);
  };

  // Xử lý đổi mật khẩu
  const handleResetPassword = async () => {
    if (!validatePasswordStep()) return;

    setIsLoadingPassword(true);
    try {
      await userApi.resetPassword(email, verificationCode, newPassword);
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công');
      closePasswordModal();
    } catch (error) {
      console.log('Error resetting password:', error);
      let errorMessage = 'Không thể đổi mật khẩu';

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoadingPassword(false);
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
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
          <Text style={styles.modalDescription}>
            Nhập email của bạn để nhận mã xác nhận
          </Text>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
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
            error={errors.verificationCode}
          />
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Gửi lại mã sau {countdown} giây
            </Text>
          ) : (
            <TouchableOpacity onPress={handleRequestCode} disabled={isLoadingPassword}>
              <Text style={styles.resendLink}>Gửi lại mã</Text>
            </TouchableOpacity>
          )}
        </>
      );
    } else if (resetStep === 3) {
      return (
        <>
          <Text style={styles.modalTitle}>Nhập mật khẩu mới</Text>
          <Input
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={errors.newPassword}
          />
          <Input
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />
        </>
      );
    }
  };

  // Modal title và button text tương ứng với từng bước
  const getModalButtonTitle = () => {
    if (resetStep === 1) return 'Gửi mã xác nhận';
    if (resetStep === 2) return 'Xác nhận';
    return 'Đổi mật khẩu';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <Card style={styles.card}>
          <Input
            label="Họ tên"
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ tên của bạn"
            autoCapitalize="words"
            error={errors.name}
          />

          <Input
            label="Email"
            value={user.email}
            editable={false}
            style={styles.disabledInput}
          />

          <Button
            title="Cập nhật thông tin"
            onPress={handleUpdateProfile}
            isLoading={isLoading}
            style={styles.updateButton}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt thông báo</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Thông báo đẩy</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Thông báo email</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt ứng dụng</Text>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Chế độ tối</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bảo mật</Text>
        <Card style={styles.card}>
          <Button
            title="Đổi mật khẩu"
            type="outline"
            onPress={handleChangePassword}
          />
        </Card>
      </View>

      {/* Modal đổi mật khẩu */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closePasswordModal}
            >
              <Icon name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>

            {renderModalContent()}

            <Button
              title={getModalButtonTitle()}
              onPress={handleNextStep}
              isLoading={isLoadingPassword}
              style={styles.modalButton}
            />

            <Button
              title="Hủy"
              onPress={closePasswordModal}
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
    backgroundColor: COLORS.background,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  disabledInput: {
    opacity: 0.7,
  },
  updateButton: {
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.dark,
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

export default SettingsScreen;