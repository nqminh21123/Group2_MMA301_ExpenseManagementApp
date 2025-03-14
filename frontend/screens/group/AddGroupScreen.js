// frontend/screens/group/AddGroupScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../../utils/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { COLORS } from '../../utils/constants';
import { groupApi } from '../../services/api';

const AddGroupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { user } = useContext(AuthContext);

  const validate = () => {
    const newErrors = {};

    if (!name) newErrors.name = 'Tên nhóm không được để trống';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const groupData = {
        name,
        description,
        createdBy: user.id
      };

      await groupApi.createGroup(groupData);
      Alert.alert('Thành công', 'Nhóm mới đã được tạo thành công!');
      navigation.goBack();
    } catch (error) {
      console.log('Error creating group:', error);

      let errorMessage = 'Đã xảy ra lỗi khi tạo nhóm';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert('Lỗi', errorMessage);
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
      <View style={styles.formContainer}>
        <Text style={styles.title}>Tạo nhóm mới</Text>
        <Text style={styles.subtitle}>Nhập thông tin về nhóm của bạn</Text>

        <View style={styles.form}>
          <Input
            label="Tên nhóm"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên nhóm"
            autoCapitalize="words"
            error={errors.name}
          />

          <Input
            label="Mô tả (tùy chọn)"
            value={description}
            onChangeText={setDescription}
            placeholder="Nhập mô tả về nhóm"
            multiline
            numberOfLines={3}
          />

          <Button
            title="Tạo nhóm"
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
          />

          <Button
            title="Hủy"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.cancelButton}
          />
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
    padding: 16,
  },
  formContainer: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 24,
  },
  form: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
});

export default AddGroupScreen;