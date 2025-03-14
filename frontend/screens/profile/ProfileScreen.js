// frontend/screens/profile/ProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl // Import RefreshControl
} from 'react-native';
import { AuthContext } from '../../utils/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { COLORS } from '../../utils/constants';
import { userApi, expenseApi, groupApi } from '../../services/api';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalGroups: 0,
    totalAmount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State for tracking refresh

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Trong ProfileScreen.js
  const fetchProfileData = async () => {
    try {
      // Get user data
      const userResponse = await userApi.getUser(user.id);
      setUserData(userResponse.data);

      // Get user expenses
      const expensesResponse = await expenseApi.getUserExpenses(user.id);
      const expenses = expensesResponse.data;

      // Get user groups
      const groupsResponse = await groupApi.getUserGroups(user.id);
      const groups = groupsResponse.data;

      // Tính toán tổng chi tiêu thực tế (phần mà người dùng phải trả)
      let userTotalAmount = 0;
      expenses.forEach(expense => {
        const userShare = expense.participants.find(p => p.userId === user.id)?.share || 0;
        const userAmount = expense.amount * (userShare / 100);
        userTotalAmount += userAmount;
      });

      setStats({
        totalExpenses: expenses.length,
        totalGroups: groups.length,
        totalAmount: userTotalAmount
      });
    } catch (error) {
      console.log('Error fetching profile data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
      setRefreshing(false); // Stop refreshing indicator
    }
  };

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  // Thêm phương thức để mở dashboard
  const openDashboard = () => {
    navigation.navigate('ExpenseDashboard');
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: logout }
      ]
    );
  };

  if (isLoading) {
    return <Loading text="Đang tải thông tin hồ sơ..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]} // Customize refresh indicator color
          tintColor={COLORS.primary} // For iOS
          title="Đang tải..." // For iOS
          titleColor={COLORS.secondary} // For iOS
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{userData.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Icon name="people-outline" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{stats.totalGroups}</Text>
          <Text style={styles.statLabel}>Nhóm</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Icon name="wallet-outline" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>{stats.totalExpenses}</Text>
          <Text style={styles.statLabel}>Chi tiêu</Text>
        </Card>

         <TouchableOpacity onPress={openDashboard}>
            <Card style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Icon name="cash-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalAmount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Tổng chi (đ)</Text>
              <View style={styles.viewMoreIndicator}>
                <Icon name="chevron-forward-circle" size={16} color={COLORS.primary} />
              </View>
            </Card>
          </TouchableOpacity>
      </View>

      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.menuItemContent}>
            <Icon name="settings-outline" size={22} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Cài đặt</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Icon name="help-circle-outline" size={22} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Trợ giúp</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <Icon name="information-circle-outline" size={22} color={COLORS.dark} />
            <Text style={styles.menuItemText}>Thông tin ứng dụng</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </Card>

      <Button
        title="Đăng xuất"
        onPress={handleLogout}
        type="outline"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  viewMoreIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  menuCard: {
    margin: 16,
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 12,
  },
  logoutButton: {
    margin: 16,
  },
});

export default ProfileScreen;