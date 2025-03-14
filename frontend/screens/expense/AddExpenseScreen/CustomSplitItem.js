// frontend/screens/expense/AddExpenseScreen/CustomSplitItem.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from './styles';

const CustomSplitItem = ({
  memberId,
  memberName,
  isCurrentUser,
  shareAmount,
  sharePercentage,
  onChangeShare,
  onCalculateRemaining
}) => {
  return (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>
          {memberName} {isCurrentUser ? '(Bạn)' : ''}
        </Text>
      </View>

      <View style={styles.customShareContainer}>
        <TextInput
          style={styles.customShareInput}
          value={shareAmount}
          onChangeText={(value) => onChangeShare(memberId, value)}
          placeholder="0"
          keyboardType="numeric"
        />
        <Text style={styles.customShareSuffix}>
          đ ({sharePercentage || 0}%)
        </Text>
        <TouchableOpacity
          style={styles.remainingButton}
          onPress={() => onCalculateRemaining(memberId)}
        >
          <Text style={styles.remainingButtonText}>Còn lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomSplitItem;