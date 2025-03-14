import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';
import { expenseApi, groupApi, userApi } from '../../../services/api';
import { AuthContext } from '../../../utils/AuthContext';
import { CATEGORIES, COLORS } from '../../../utils/constants';

// Import các component con
import AmountInput from './AmountInput';
import MemberSelectionModal from './MemberSelectionModal';
import SplitConfiguration from './SplitConfiguration';
import styles from './styles';

// Import utilities
import { validateExpenseData } from './utils';

const AddExpenseScreen = ({ route, navigation }) => {
  const initialGroupId = route.params?.groupId;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || '');
  const [groups, setGroups] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customShares, setCustomShares] = useState({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [isAmountConfirmed, setIsAmountConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(!initialGroupId);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errors, setErrors] = useState({});
  const [paidBy, setPaidBy] = useState(null); // 🆕 Thêm state cho người trả tiền

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!initialGroupId) {
      fetchUserGroups();
    }
  }, [initialGroupId]);

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers();
    }
  }, [groupId]);

  const fetchUserGroups = async () => {
    try {
      const response = await groupApi.getUserGroups(user.id);
      setGroups(response.data);
      if (response.data.length > 0 && !groupId) {
        setGroupId(response.data[0].id);
      }
    } catch (error) {
      console.log('Error fetching user groups:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhóm. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const fetchGroupMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await groupApi.getGroup(groupId);
      const group = response.data;

      const memberDetailsPromises = group.members.map(memberId =>
        userApi.getUser(memberId)
      );

      const memberResponses = await Promise.all(memberDetailsPromises);
      const memberDetails = memberResponses.map(response => response.data);

      setMembersList(memberDetails);

      const memberIds = memberDetails.map(member => member.id);
      setSelectedMembers(memberIds);

      // 🆕 Khởi tạo paidBy mặc định là current user nếu chưa có
      if (!paidBy) {
        setPaidBy(user.id);
      }

      initializeParticipants(memberIds);
    } catch (error) {
      console.log('Error fetching group members:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const initializeParticipants = (memberIds) => {
    const newParticipants = memberIds.map(id => ({
      userId: id,
      share: 100 / memberIds.length
    }));
    setParticipants(newParticipants);

    if (isAmountConfirmed && confirmedAmount > 0) {
      const equalAmount = confirmedAmount / memberIds.length;
      const newShares = {};
      memberIds.forEach(id => {
        newShares[id] = equalAmount.toFixed(0);
      });
      setCustomShares(newShares);
    }
  };

  const handleConfirmAmount = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setErrors({ ...errors, amount: 'Vui lòng nhập số tiền hợp lệ' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    setConfirmedAmount(parsedAmount);
    setIsAmountConfirmed(true);
    setErrors({ ...errors, amount: undefined });

    updateShares(parsedAmount);
  };

  const handleEditAmount = () => {
    setIsAmountConfirmed(false);
  };

  const updateShares = (newAmount) => {
    if (selectedMembers.length === 0) return;

    if (splitType === 'equal') {
      const equalShare = 100 / selectedMembers.length;
      const equalAmount = newAmount / selectedMembers.length;

      const updatedParticipants = participants.map(p => {
        if (selectedMembers.includes(p.userId)) {
          return { ...p, share: equalShare };
        }
        return { ...p, share: 0 };
      });

      setParticipants(updatedParticipants);

      const newShares = {};
      selectedMembers.forEach(id => {
        newShares[id] = equalAmount.toFixed(0);
      });
      setCustomShares(newShares);
    } else {
      const newShares = {};
      participants.forEach(p => {
        if (selectedMembers.includes(p.userId)) {
          newShares[p.userId] = ((p.share / 100) * newAmount).toFixed(0);
        }
      });
      setCustomShares(newShares);
    }
  };

  const toggleMemberSelection = (memberId) => {
    let newSelectedMembers;

    if (selectedMembers.includes(memberId)) {
      // 🆕 Không cho bỏ chọn nếu thành viên là người trả tiền
      if (memberId === paidBy) {
        Alert.alert('Thông báo', 'Người trả tiền phải tham gia vào chi tiêu.');
        return;
      }
      newSelectedMembers = selectedMembers.filter(id => id !== memberId);
    } else {
      newSelectedMembers = [...selectedMembers, memberId];
    }

    setSelectedMembers(newSelectedMembers);

    const updatedParticipants = participants.map(p => {
      if (newSelectedMembers.includes(p.userId)) {
        return { ...p, share: 100 / newSelectedMembers.length };
      }
      return { ...p, share: 0 };
    });

    setParticipants(updatedParticipants);

    if (isAmountConfirmed && confirmedAmount > 0) {
      const equalAmount = confirmedAmount / newSelectedMembers.length;
      const newShares = {};
      newSelectedMembers.forEach(id => {
        newShares[id] = equalAmount.toFixed(0);
      });
      setCustomShares(newShares);
    }
  };

  const openMemberSelection = () => {
    setShowMemberSelection(true);
  };

  // 🆕 Hàm xử lý khi đóng modal, nhận selectedPayer
  const handleCloseMemberSelection = (selectedPayer) => {
    setPaidBy(selectedPayer); // Cập nhật người trả tiền
    setShowMemberSelection(false);

    // Đảm bảo người trả tiền nằm trong selectedMembers
    if (!selectedMembers.includes(selectedPayer)) {
      toggleMemberSelection(selectedPayer);
    }
  };

  const toggleCategoryPicker = () => {
    setShowCategoryPicker(!showCategoryPicker);
  };

  const selectCategory = (cat) => {
    setCategory(cat);
    setShowCategoryPicker(false);
    setErrors({ ...errors, category: undefined });
  };

  const handleSubmit = async () => {
    const validationData = {
      title,
      isAmountConfirmed,
      groupId,
      category,
      selectedMembers,
      splitType,
      customShares,
      confirmedAmount,
      paidBy // 🆕 Thêm paidBy vào validation
    };

    const { isValid, errors: validationErrors } = validateExpenseData(validationData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const filteredParticipants = participants.filter(
        participant => selectedMembers.includes(participant.userId)
      );

      const expenseData = {
        title,
        amount: confirmedAmount,
        paidBy, // 🆕 Sử dụng paidBy từ state thay vì cứng mã user.id
        groupId,
        date,
        splitType,
        participants: filteredParticipants,
        category,
        notes
      };

      await expenseApi.createExpense(expenseData);
      Alert.alert('Thành công', 'Chi tiêu mới đã được thêm thành công!');
      navigation.goBack();
    } catch (error) {
      console.log('Error creating expense:', error);
      let errorMessage = 'Đã xảy ra lỗi khi thêm chi tiêu';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberName = (memberId) => {
    const member = membersList.find(m => m.id === memberId);
    return member ? member.name : `ID: ${memberId}`;
  };

  if (isLoadingGroups) {
    return <Loading text="Đang tải dữ liệu..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Modal chọn thành viên tham gia */}
      <MemberSelectionModal
        visible={showMemberSelection}
        membersList={membersList}
        selectedMembers={selectedMembers}
        currentUserId={user.id}
        paidBy={paidBy} // 🆕 Truyền paidBy vào modal
        onToggleMember={toggleMemberSelection}
        onClose={handleCloseMemberSelection} // 🆕 Dùng hàm mới để nhận selectedPayer
      />

      <View style={styles.formContainer}>
        <Text style={styles.title}>Thêm chi tiêu mới</Text>

        <View style={styles.form}>
          <Input
            label="Tiêu đề"
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề chi tiêu"
            autoCapitalize="sentences"
            error={errors.title}
          />

          <AmountInput
            amount={amount}
            onChangeAmount={setAmount}
            isAmountConfirmed={isAmountConfirmed}
            confirmedAmount={confirmedAmount}
            onConfirmAmount={handleConfirmAmount}
            onEditAmount={handleEditAmount}
            error={errors.amount}
          />

          {!initialGroupId && groups.length > 0 && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Nhóm</Text>
              <View style={styles.dropdown}>
                {groups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.dropdownItem,
                      groupId === group.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => setGroupId(group.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        groupId === group.id && styles.dropdownItemTextSelected
                      ]}
                    >
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.groupId && <Text style={styles.errorText}>{errors.groupId}</Text>}
            </View>
          )}

          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Danh mục</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={toggleCategoryPicker}
            >
              <Text style={styles.categoryButtonText}>
                {category || 'Chọn danh mục'}
              </Text>
              <Icon name="chevron-down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

            {showCategoryPicker && (
              <Card style={styles.categoryPicker}>
                <ScrollView style={styles.categoryScroll} nestedScrollEnabled={true} maxHeight={200}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.categoryItem}
                      onPress={() => selectCategory(cat)}
                    >
                      <Text style={styles.categoryItemText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
            )}
          </View>

          {!isLoadingMembers && membersList.length > 0 && (
            <View style={styles.membersContainer}>
              <View style={styles.membersHeader}>
                <Text style={styles.label}>Người tham gia ({selectedMembers.length}/{membersList.length})</Text>
                <TouchableOpacity
                  style={styles.selectMembersButton}
                  onPress={openMemberSelection}
                >
                  <Text style={styles.selectMembersText}>Chọn</Text>
                  <Icon name="people" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {errors.members && <Text style={styles.errorText}>{errors.members}</Text>}

              <View style={styles.selectedMembersContainer}>
                {selectedMembers.length > 0 ? (
                  selectedMembers.map(memberId => (
                    <View key={memberId} style={styles.selectedMemberChip}>
                      <Text style={styles.selectedMemberText}>
                        {getMemberName(memberId)}
                        {memberId === paidBy ? ' (Trả tiền)' : ''} {/* 🆕 Hiển thị người trả tiền */}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noMemberText}>Chưa chọn người tham gia</Text>
                )}
              </View>
            </View>
          )}

          {isAmountConfirmed && selectedMembers.length > 0 && (
            <SplitConfiguration
              splitType={splitType}
              setSplitType={setSplitType}
              selectedMembers={selectedMembers}
              participants={participants}
              setParticipants={setParticipants}
              customShares={customShares}
              setCustomShares={setCustomShares}
              confirmedAmount={confirmedAmount}
              errors={errors}
              setErrors={setErrors}
              getMemberName={getMemberName}
              userId={user.id}
            />
          )}

          <Input
            label="Ghi chú (tùy chọn)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Nhập ghi chú về chi tiêu"
            multiline
            numberOfLines={3}
          />

          <Button
            title="Thêm chi tiêu"
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

export default AddExpenseScreen;