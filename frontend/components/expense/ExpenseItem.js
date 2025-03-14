// frontend/components/expense/ExpenseItem.js
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const ExpenseItem = ({ expense, onPress, showGroupName = false, groupName = '', userId = null }) => {
  const { title, amount, date, category, settled, paidBy, participants = [] } = expense;

  const formatDate = (dateString) => {
    try {
      const dateObj = new Date(dateString);
      return format(dateObj, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const getIconForCategory = (category) => {
    switch (category) {
      case 'Đồ ăn uống':
        return 'fast-food-outline';
      case 'Đi lại':
        return 'car-outline';
      case 'Mua sắm':
        return 'cart-outline';
      case 'Giải trí':
        return 'film-outline';
      case 'Gia dụng':
        return 'home-outline';
      case 'Thuê nhà':
        return 'business-outline';
      case 'Hóa đơn':
        return 'document-text-outline';
      default:
        return 'cash-outline';
    }
  };

  // Tính toán trạng thái thanh toán
  const getSettlementStatus = () => {
    if (!participants || participants.length === 0) return { settled: 0, total: 0 };

    const total = participants.length;
    const settledCount = participants.filter(p => p.settled).length;

    return {
      settled: settledCount,
      total,
      percent: Math.round((settledCount / total) * 100)
    };
  };

  // Kiểm tra xem người dùng hiện tại đã thanh toán chưa (nếu có userId)
  const isCurrentUserSettled = () => {
    if (!userId || !participants || participants.length === 0) return true;

    const currentUserParticipant = participants.find(p => p.userId === userId);
    // Nếu là người trả tiền hoặc đã thanh toán
    return paidBy === userId || (currentUserParticipant && currentUserParticipant.settled);
  };

  const { settled: settledCount, total, percent } = getSettlementStatus();
  const currentUserSettled = isCurrentUserSettled();

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name={getIconForCategory(category)} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {showGroupName && groupName && (
              <Text style={styles.groupName}>{groupName}</Text>
            )}
            <Text style={styles.date}>{formatDate(date)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{amount.toLocaleString()} đ</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                settled ? styles.settledIndicator :
                  (settledCount > 0 ? styles.partialSettledIndicator : styles.unsettledIndicator)
              ]}
            />
            <Text
              style={[
                settled ? styles.settledText :
                  (settledCount > 0 ? styles.partialSettledText : styles.unsettledText)
              ]}
            >
              {settled ? 'Đã thanh toán' :
                (settledCount > 0 ? `${settledCount}/${total} (${percent}%)` : 'Chưa thanh toán')}
            </Text>
          </View>

          <View style={styles.userStatusContainer}>
            {userId && !currentUserSettled && (
              <View style={styles.userStatusBadge}>
                <Text style={styles.userStatusText}>Bạn chưa TT</Text>
              </View>
            )}

            <Text style={styles.paidBy}>
              {paidBy === userId ? 'Bạn trả' : 'Người trả: ID ' + paidBy}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  groupName: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  settledIndicator: {
    backgroundColor: COLORS.success,
  },
  partialSettledIndicator: {
    backgroundColor: COLORS.warning,
  },
  unsettledIndicator: {
    backgroundColor: COLORS.danger,
  },
  settledText: {
    fontSize: 12,
    color: COLORS.success,
  },
  partialSettledText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  unsettledText: {
    fontSize: 12,
    color: COLORS.danger,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatusBadge: {
    backgroundColor: COLORS.danger + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  userStatusText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: '500',
  },
  paidBy: {
    fontSize: 12,
    color: COLORS.secondary,
  },
});

export default ExpenseItem;