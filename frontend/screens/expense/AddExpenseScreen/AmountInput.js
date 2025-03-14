// frontend/screens/expense/AddExpenseScreen/AmountInput.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';

const AmountInput = ({
  amount,
  onChangeAmount,
  isAmountConfirmed,
  confirmedAmount,
  onConfirmAmount,
  onEditAmount,
  error
}) => {
  return (
    <View style={styles.amountContainer}>
      <Text style={styles.label}>Số tiền</Text>
      <View style={styles.amountInputContainer}>
        <TextInput
          style={[
            styles.amountInput,
            isAmountConfirmed && styles.amountInputDisabled
          ]}
          value={amount}
          onChangeText={onChangeAmount}
          placeholder="Nhập số tiền"
          keyboardType="numeric"
          editable={!isAmountConfirmed}
        />
        {isAmountConfirmed ? (
          <TouchableOpacity
            style={styles.amountButton}
            onPress={onEditAmount}
          >
            <Icon name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.amountButton}
            onPress={onConfirmAmount}
          >
            <Icon name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isAmountConfirmed && (
        <Text style={styles.confirmedAmountText}>
          Số tiền đã xác nhận: {confirmedAmount.toLocaleString()} đ
        </Text>
      )}
    </View>
  );
};

export default AmountInput;