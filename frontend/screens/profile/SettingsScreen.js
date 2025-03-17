// frontend/screens/profile/SettingsScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { AuthContext } from "../../utils/AuthContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { COLORS } from "../../utils/constants";
import { userApi } from "../../services/api";

const SettingsScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Settings options (these would be stored in AsyncStorage in a real app)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!name) newErrors.name = "Tên không được để trống";

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

      Alert.alert("Thành công", "Thông tin hồ sơ đã được cập nhật!");
    } catch (error) {
      console.log("Error updating profile:", error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Chuyển đến màn hình đổi mật khẩu
  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
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
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.dark,
  },
});

export default SettingsScreen;
