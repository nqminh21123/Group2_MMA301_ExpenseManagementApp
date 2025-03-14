// frontend/screens/expense/AddExpenseScreen/SplitConfiguration.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import CustomSplitItem from './CustomSplitItem';
import styles from './styles';
import { COLORS } from '../../../utils/constants';

const SplitConfiguration = ({
  splitType,
  setSplitType,
  selectedMembers,
  participants,
  setParticipants,
  customShares,
  setCustomShares,
  confirmedAmount,
  errors,
  setErrors,
  getMemberName,
  userId
}) => {
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [lastEditedMemberId, setLastEditedMemberId] = useState(null);

  const toggleSplitOptions = () => {
    setShowSplitOptions(!showSplitOptions);
  };

  const selectSplitType = (type) => {
    setSplitType(type);
    setShowSplitOptions(false);

    if (type === 'equal') {
      updateEqualShares();
    } else if (type === 'custom') {
      initializeCustomShares();
    }
  };

  const updateEqualShares = () => {
    if (selectedMembers.length === 0) return;

    // Chia đều cho tất cả thành viên
    const equalShare = 100 / selectedMembers.length;

    // Cập nhật participants
    const updatedParticipants = [...participants];
    selectedMembers.forEach(memberId => {
      const index = updatedParticipants.findIndex(p => p.userId === memberId);
      if (index !== -1) {
        updatedParticipants[index].share = parseFloat(equalShare.toFixed(2));
      }
    });

    setParticipants(updatedParticipants);

    // Cập nhật customShares cho việc hiển thị
    const equalAmount = confirmedAmount / selectedMembers.length;
    const newShares = {};
    selectedMembers.forEach(memberId => {
      newShares[memberId] = equalAmount.toFixed(0);
    });
    setCustomShares(newShares);
  };

  const initializeCustomShares = () => {
    if (selectedMembers.length === 0 || confirmedAmount <= 0) return;

    const equalAmount = confirmedAmount / selectedMembers.length;
    const newShares = {};

    selectedMembers.forEach((memberId) => {
      newShares[memberId] = equalAmount.toFixed(0);
    });

    setCustomShares(newShares);

    // Cập nhật tỷ lệ phần trăm cho tất cả người dùng
    updateAllParticipantsShares(newShares);
  };

  const handleCustomShareChange = (userId, value) => {
    // Cập nhật giá trị trong customShares
    const newShares = { ...customShares };
    newShares[userId] = value;
    setCustomShares(newShares);

    // Cập nhật người cuối cùng nhập
    setLastEditedMemberId(userId);

    // Tính toán lại tỷ lệ phần trăm
    recalculateShares(userId, value);
  };

  const calculateRemainingAmount = (userId) => {
    if (confirmedAmount <= 0) {
      Alert.alert('Thông báo', 'Vui lòng xác nhận số tiền trước');
      return;
    }

    // Tính tổng số tiền đã phân bổ (trừ người hiện tại)
    let allocatedAmount = 0;

    for (const memberId in customShares) {
      if (memberId !== userId && selectedMembers.includes(memberId)) {
        const share = customShares[memberId] === '' ? 0 : parseFloat(customShares[memberId]);
        if (!isNaN(share)) {
          allocatedAmount += share;
        }
      }
    }

    // Tính số tiền còn lại
    const remainingAmount = confirmedAmount - allocatedAmount;

    // Cập nhật giá trị cho người hiện tại
    const newShares = { ...customShares };
    newShares[userId] = Math.max(0, remainingAmount).toFixed(0);
    setCustomShares(newShares);

    // Cập nhật tỷ lệ phần trăm
    updateAllParticipantsShares(newShares);
  };

  const recalculateShares = (changedUserId, value) => {
    try {
      // Đảm bảo có participants trước khi tiếp tục
      if (!participants || participants.length === 0) {
        return;
      }

      // Tổng số tiền đã xác nhận
      const totalAmount = confirmedAmount;
      if (totalAmount <= 0) return;

      // Tính tổng số tiền đã được phân bổ
      let allocatedAmount = 0;
      let percentageSum = 0;

      // Tạo mảng participants mới để cập nhật
      const updatedParticipants = [...participants];

      // Cập nhật tất cả các thành viên với giá trị hiện tại
      for (const participant of updatedParticipants) {
        if (selectedMembers.includes(participant.userId)) {
          const userAmount = customShares[participant.userId] === '' ? 0 :
                           parseFloat(customShares[participant.userId]);

          if (!isNaN(userAmount)) {
            allocatedAmount += userAmount;

            // Tính phần trăm
            const percentage = totalAmount > 0 ? (userAmount / totalAmount * 100) : 0;
            participant.share = parseFloat(percentage.toFixed(2));
            percentageSum += participant.share;
          }
        } else {
          participant.share = 0;
        }
      }

      // Cập nhật participants
      setParticipants(updatedParticipants);

      // Kiểm tra tổng số tiền đã phân bổ
      if (Math.abs(allocatedAmount - totalAmount) > 0.01) {
        setErrors(prev => ({
          ...prev,
          split: `Tổng số tiền: ${allocatedAmount.toFixed(0)}/${totalAmount.toFixed(0)} đ (${percentageSum.toFixed(1)}%)`
        }));
      } else {
        setErrors(prev => ({...prev, split: undefined}));
      }
    } catch (error) {
      console.log('Error recalculating shares:', error);
    }
  };

  const updateAllParticipantsShares = (shares) => {
    try {
      // Đảm bảo có participants trước khi tiếp tục
      if (!participants || participants.length === 0) {
        return;
      }

      // Tổng số tiền đã xác nhận
      const totalAmount = confirmedAmount;
      if (totalAmount <= 0) return;

      // Tính tổng số tiền đã được phân bổ
      let allocatedAmount = 0;
      let percentageSum = 0;

      // Tạo mảng participants mới để cập nhật
      const updatedParticipants = [...participants];

      // Cập nhật tất cả các thành viên với giá trị hiện tại
      for (const participant of updatedParticipants) {
        if (selectedMembers.includes(participant.userId)) {
          const userAmount = shares[participant.userId] === '' ? 0 :
                           parseFloat(shares[participant.userId]);

          if (!isNaN(userAmount)) {
            allocatedAmount += userAmount;

            // Tính phần trăm
            const percentage = totalAmount > 0 ? (userAmount / totalAmount * 100) : 0;
            participant.share = parseFloat(percentage.toFixed(2));
            percentageSum += participant.share;
          }
        } else {
          participant.share = 0;
        }
      }

      // Cập nhật participants
      setParticipants(updatedParticipants);

      // Kiểm tra tổng số tiền đã phân bổ
      if (Math.abs(allocatedAmount - totalAmount) > 0.01) {
        setErrors(prev => ({
          ...prev,
          split: `Tổng số tiền: ${allocatedAmount.toFixed(0)}/${totalAmount.toFixed(0)} đ (${percentageSum.toFixed(1)}%)`
        }));
      } else {
        setErrors(prev => ({...prev, split: undefined}));
      }
    } catch (error) {
      console.log('Error updating all participants shares:', error);
    }
  };

  const handleRandomSplit = () => {
    if (confirmedAmount <= 0) {
      Alert.alert('Thông báo', 'Vui lòng xác nhận số tiền trước');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }

    // Tạo mảng các thành viên đã chọn
    const membersToSplit = [...selectedMembers];

    // Tổng số tiền
    const total = confirmedAmount;

    // Phân bổ ngẫu nhiên
    let remaining = total;
    const newShares = {};

    // Phân bổ ngẫu nhiên cho n-1 thành viên
    for (let i = 0; i < membersToSplit.length - 1; i++) {
      // Số tiền tối đa có thể phân bổ cho thành viên này
      const maxAmount = remaining * 0.8; // Giữ lại ít nhất 20% cho người còn lại

      // Số tiền ngẫu nhiên từ 10% đến maxAmount
      const minAmount = remaining * 0.1; // Ít nhất 10%
      let randomAmount = Math.floor(Math.random() * (maxAmount - minAmount) + minAmount);

      // Làm tròn số tiền (có thể làm tròn đến 1000đ cho dễ nhớ)
      randomAmount = Math.round(randomAmount / 1000) * 1000;

      // Lưu giá trị
      newShares[membersToSplit[i]] = randomAmount.toString();

      // Giảm số tiền còn lại
      remaining -= randomAmount;
    }

    // Phần còn lại cho thành viên cuối
    newShares[membersToSplit[membersToSplit.length - 1]] = remaining.toString();

    // Cập nhật state
    setCustomShares(newShares);

    // Cập nhật tỷ lệ phần trăm cho tất cả người dùng
    updateAllParticipantsShares(newShares);
  };

  // Calculate share percentage for a given member
  const getSharePercentage = (memberId) => {
    const participant = participants.find(p => p.userId === memberId);
    return participant ? participant.share : 0;
  };

  return (
    <View style={styles.splitConfigContainer}>
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Cách phân chia</Text>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={toggleSplitOptions}
        >
          <Text style={styles.categoryButtonText}>
            {splitType === 'equal' ? 'Chia đều' : 'Tùy chỉnh'}
          </Text>
          <Icon name="chevron-down" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        {showSplitOptions && (
          <Card style={styles.categoryPicker}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => selectSplitType('equal')}
            >
              <Text style={styles.categoryItemText}>Chia đều</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => selectSplitType('custom')}
            >
              <Text style={styles.categoryItemText}>Tùy chỉnh</Text>
            </TouchableOpacity>
          </Card>
        )}

        {errors.split && <Text style={styles.errorText}>{errors.split}</Text>}
      </View>

      <View style={styles.participantsContainer}>
        <Text style={styles.subLabel}>Chi tiết phân chia</Text>

        {/* Tùy chọn phân chia */}
        {splitType === 'custom' && (
          <View style={styles.customSplitOptionsContainer}>
            <Button
              title="Chia ngẫu nhiên"
              type="outline"
              onPress={handleRandomSplit}
              style={styles.splitOptionButton}
            />
          </View>
        )}

        {/* Danh sách phân chia */}
        {splitType === 'equal' && selectedMembers.map((memberId) => (
          <View key={memberId} style={styles.participantItem}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {getMemberName(memberId)} {memberId === userId ? '(Bạn)' : ''}
              </Text>
              <Text style={styles.participantShare}>
                {(100 / selectedMembers.length).toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.equalShareAmount}>
              {(confirmedAmount / selectedMembers.length).toFixed(0)} đ
            </Text>
          </View>
        ))}

        {splitType === 'custom' && selectedMembers.map((memberId) => (
          <CustomSplitItem
            key={memberId}
            memberId={memberId}
            memberName={getMemberName(memberId)}
            isCurrentUser={memberId === userId}
            shareAmount={customShares[memberId] || '0'}
            sharePercentage={getSharePercentage(memberId)}
            onChangeShare={handleCustomShareChange}
            onCalculateRemaining={() => calculateRemainingAmount(memberId)}
          />
        ))}

        {/* Thông tin tổng cộng */}
        {splitType === 'custom' && (
          <View style={styles.totalContainer}>
            <Text style={errors.split ? styles.errorBalanceText : styles.balanceText}>
              {errors.split || 'Tổng số tiền đã cân bằng'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default SplitConfiguration;