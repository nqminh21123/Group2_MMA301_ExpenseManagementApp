// frontend/screens/group/JoinGroupScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../utils/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../utils/constants';
import { groupApi } from '../../services/api';
import Icon from 'react-native-vector-icons/Ionicons';

const JoinGroupScreen = ({ navigation }) => {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundGroup, setFoundGroup] = useState(null);
  const [error, setError] = useState('');

  const { user } = useContext(AuthContext);

  // Format mã tham gia thành chữ hoa và loại bỏ khoảng trắng
  const formatJoinCode = (code) => {
    return code.toUpperCase().replace(/\s/g, '');
  };

  const handleCodeChange = (text) => {
    const formattedCode = formatJoinCode(text);
    setJoinCode(formattedCode);

    // Reset data khi mã thay đổi
    setFoundGroup(null);
    setError('');
  };

  const handleSearchGroup = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setError('Vui lòng nhập mã tham gia hợp lệ (6 ký tự)');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await groupApi.getGroupByJoinCode(joinCode);
      setFoundGroup(response.data);
    } catch (error) {
      console.log('Error searching group:', error);
      if (error.response && error.response.status === 404) {
        setError('Không tìm thấy nhóm với mã này');
      } else {
        setError('Đã xảy ra lỗi khi tìm kiếm nhóm');
      }
      setFoundGroup(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!foundGroup) return;

    setIsLoading(true);
    try {
      await groupApi.joinGroup(joinCode, user.id);
      Alert.alert(
        'Thành công',
        `Bạn đã tham gia nhóm ${foundGroup.name} thành công!`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.log('Error joining group:', error);
      let errorMessage = 'Đã xảy ra lỗi khi tham gia nhóm';

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Tham gia nhóm</Text>
        <Text style={styles.subtitle}>Nhập mã tham gia nhóm để bắt đầu theo dõi chi tiêu cùng nhóm</Text>

        <View style={styles.codeInputContainer}>
          <Input
            value={joinCode}
            onChangeText={handleCodeChange}
            placeholder="Nhập mã tham gia (6 ký tự)"
            autoCapitalize="characters"
            maxLength={6}
            style={styles.codeInput}
            error={error}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchGroup}
            disabled={isSearching || joinCode.length !== 6}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="search" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {foundGroup && (
          <View style={styles.groupInfoContainer}>
            <Icon name="people" size={24} color={COLORS.primary} style={styles.groupIcon} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{foundGroup.name}</Text>
              <Text style={styles.memberCount}>{foundGroup.memberCount} thành viên</Text>
            </View>
          </View>
        )}

        <Button
          title="Tham gia nhóm"
          onPress={handleJoinGroup}
          isLoading={isLoading}
          disabled={!foundGroup || isLoading}
          style={styles.joinButton}
        />

        <Button
          title="Hủy"
          onPress={() => navigation.goBack()}
          type="outline"
          style={styles.cancelButton}
        />
      </Card>

      <View style={styles.infoBox}>
        <Icon name="information-circle-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Mã tham gia nhóm có thể lấy từ người tạo nhóm. Mã gồm 6 ký tự và không phân biệt chữ hoa chữ thường.
        </Text>
      </View>
    </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 24,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
  },
  searchButton: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginLeft: 8,
  },
  groupInfoContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  groupIcon: {
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  joinButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
});

export default JoinGroupScreen;