import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../../components/common/Button';
import { COLORS } from '../../../utils/constants';
import styles from './styles';

const MemberSelectionModal = ({
  visible,
  membersList,
  selectedMembers,
  currentUserId,
  paidBy, // 🆕 Thêm paidBy để nhận giá trị từ component cha
  onToggleMember,
  onClose
}) => {
  // State lưu người trả tiền
  const [selectedPayer, setSelectedPayer] = useState(paidBy || currentUserId);

  // 🆕 Khi modal mở, nếu paidBy khác null thì giữ nguyên, không reset về currentUserId
  useEffect(() => {
    if (visible) {
      setSelectedPayer(paidBy || currentUserId);
    }
  }, [visible, paidBy, currentUserId]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => onClose(selectedPayer)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn người tham gia</Text>
            <TouchableOpacity onPress={() => onClose(selectedPayer)}>
              <Icon name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {/* Danh sách chọn người tham gia */}
          <FlatList
            data={membersList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberSelectionItem}
                onPress={() => onToggleMember(item.id)}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {item.name} {item.id === currentUserId ? '(Bạn)' : ''}
                  </Text>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
                <View style={[
                  styles.checkBox,
                  selectedMembers.includes(item.id) && styles.checkBoxSelected
                ]}>
                  {selectedMembers.includes(item.id) && (
                    <Icon name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Không có thành viên nào</Text>
            }
          />

          {/* Chọn người trả tiền */}
          {selectedMembers.length > 0 && (
            <View style={styles.payerSection}>
              <Text style={styles.sectionTitle}>Chọn người trả tiền</Text>
              <FlatList
                data={membersList.filter((item) => selectedMembers.includes(item.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.payerItem,
                      selectedPayer === item.id && styles.payerSelected
                    ]}
                    onPress={() => {
                      setSelectedPayer(item.id);
                      if (!selectedMembers.includes(item.id)) {
                        onToggleMember(item.id); // Đảm bảo người này có trong danh sách tham gia
                      }
                    }}
                  >
                    <Text style={styles.payerName}>{item.name}</Text>
                    {selectedPayer === item.id && (
                      <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Button
              title="Xác nhận"
              onPress={() => onClose(selectedPayer)}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MemberSelectionModal;
