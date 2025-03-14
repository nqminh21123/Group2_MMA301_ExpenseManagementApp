// frontend/screens/random/RandomPickerScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../utils/constants';

const RandomPickerScreen = ({ navigation }) => {
  const [personName, setPersonName] = useState('');
  const [peopleList, setPeopleList] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinIntervalRef = useRef(null);

  // Thêm người vào danh sách
  const handleAddPerson = () => {
    if (!personName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người tham gia');
      return;
    }

    // Kiểm tra tên trùng (không phân biệt hoa thường)
    const trimmedName = personName.trim();
    const isDuplicate = peopleList.some(
      person => person.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      Alert.alert('Lỗi', 'Tên này đã tồn tại trong danh sách. Vui lòng nhập tên khác.');
      return;
    }

    const newPerson = {
      id: Date.now().toString(),
      name: trimmedName
    };

    // Thêm người mới vào đầu danh sách
    setPeopleList([newPerson, ...peopleList]);
    setPersonName('');
  };

  // Xóa người khỏi danh sách
  const handleRemovePerson = (id) => {
    // Không cho phép xóa khi đang chọn
    if (isSelecting) return;

    // Nếu người được chọn bị xóa, đóng modal
    if (id === selectedPersonId) {
      setSelectedPersonId(null);
      setShowResultModal(false);
    }

    setPeopleList(peopleList.filter(person => person.id !== id));
  };

  // Xóa người đã chọn khỏi danh sách và đóng modal
  const handleRemoveSelected = () => {
    if (selectedPersonId) {
      setPeopleList(peopleList.filter(person => person.id !== selectedPersonId));
      setSelectedPersonId(null);
      setShowResultModal(false);
    }
  };

  // Xóa tất cả người
  const handleClearAll = () => {
    if (isSelecting) return;

    if (peopleList.length === 0) return;

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa tất cả người tham gia?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          onPress: () => {
            setPeopleList([]);
            setSelectedPersonId(null);
            setShowResultModal(false);
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Chọn người ngẫu nhiên
  const startRandomSelection = () => {
    if (peopleList.length < 2) {
      Alert.alert('Lỗi', 'Vui lòng thêm ít nhất 2 người để chọn ngẫu nhiên');
      return;
    }

    // Đóng modal kết quả cũ nếu đang mở
    setShowResultModal(false);

    setIsSelecting(true);
    setSelectedPersonId(null);

    // Bắt đầu hiệu ứng quay
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Chạy ngẫu nhiên giữa các người
    let count = 0;
    spinIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * peopleList.length);
      setSelectedPersonId(peopleList[randomIndex].id);

      count++;
      // Dừng sau 10-15 lần ngẫu nhiên
      if (count > 10 + Math.floor(Math.random() * 5)) {
        finalizeSelection();
      }
    }, 200);
  };

  // Kết thúc chọn ngẫu nhiên
  const finalizeSelection = () => {
    clearInterval(spinIntervalRef.current);
    spinAnim.stopAnimation();
    spinAnim.setValue(0);

    // Chọn người cuối cùng
    const finalIndex = Math.floor(Math.random() * peopleList.length);
    setSelectedPersonId(peopleList[finalIndex].id);

    setIsSelecting(false);

    // Hiển thị modal kết quả
    setTimeout(() => {
      setShowResultModal(true);
    }, 500);
  };

  // Hiệu ứng xoay
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Người được chọn
  const selectedPerson = peopleList.find(person => person.id === selectedPersonId);

  // Kiểm soát hiển thị người được chọn
  useEffect(() => {
    // Cleanup khi component bị unmount
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
      spinAnim.stopAnimation();
    };
  }, []);

  // Modal kết quả
  const ResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowResultModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowResultModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.resultModalContainer}>
              <View style={styles.resultModalHeader}>
                <Text style={styles.resultModalTitle}>Kết quả chọn ngẫu nhiên</Text>
                <TouchableOpacity onPress={() => setShowResultModal(false)}>
                  <Icon name="close" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.resultModalContent}>
                <Icon name="trophy" size={60} color={COLORS.warning} style={styles.trophyIcon} />
                <Text style={styles.resultModalName}>{selectedPerson?.name}</Text>
                <Text style={styles.resultModalDescription}>
                  Đã được chọn ngẫu nhiên từ {peopleList.length} người
                </Text>
              </View>

              <View style={styles.resultModalActions}>
                <TouchableOpacity
                  style={styles.resultModalAction}
                  onPress={handleRemoveSelected}
                >
                  <Icon name="trash-outline" size={20} color={COLORS.danger} />
                  <Text style={[styles.resultModalActionText, {color: COLORS.danger}]}>
                    Xóa khỏi danh sách
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resultModalAction}
                  onPress={() => {
                    setShowResultModal(false);
                    startRandomSelection();
                  }}
                >
                  <Icon name="refresh-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.resultModalActionText}>Chọn lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ResultModal />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Bộ chọn ngẫu nhiên</Text>
            <Text style={styles.subtitle}>
              Thêm danh sách người tham gia và quay số để chọn ngẫu nhiên một người
            </Text>
          </View>

          <Card style={styles.card}>
            {/* Thêm người tham gia */}
            <View style={styles.peopleContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Người tham gia ({peopleList.length})</Text>
                {peopleList.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text style={styles.clearText}>Xóa tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.addPersonContainer}>
                <TextInput
                  style={styles.personInput}
                  value={personName}
                  onChangeText={setPersonName}
                  placeholder="Nhập tên người tham gia"
                  onSubmitEditing={handleAddPerson}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPerson}
                >
                  <Icon name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Danh sách người tham gia */}
              {peopleList.length > 0 ? (
                <View style={styles.peopleListContainer}>
                  <ScrollView
                    style={styles.peopleList}
                    nestedScrollEnabled={true}
                  >
                    {peopleList.map((person) => (
                      <View
                        key={person.id}
                        style={[
                          styles.personItem,
                          selectedPersonId === person.id && !showResultModal && styles.personItemSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.personName,
                            selectedPersonId === person.id && !showResultModal && styles.personNameSelected
                          ]}
                        >
                          {person.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemovePerson(person.id)}
                          disabled={isSelecting}
                        >
                          <Icon
                            name="close-circle"
                            size={20}
                            color={selectedPersonId === person.id && !showResultModal ? COLORS.white : COLORS.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.emptyText}>Chưa có người tham gia</Text>
              )}
            </View>

            {/* Nút chọn ngẫu nhiên */}
            <Button
              title={isSelecting ? "Đang chọn..." : "Chọn ngẫu nhiên"}
              onPress={startRandomSelection}
              isLoading={isSelecting}
              disabled={peopleList.length < 2 || isSelecting}
              style={styles.randomButton}
            />
          </Card>
        </ScrollView>

        {/* Hiệu ứng quay khi chọn ngẫu nhiên */}
        {isSelecting && (
          <View style={styles.spinnerOverlay}>
            <Animated.View
              style={[
                styles.spinner,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <Icon name="sync" size={40} color={COLORS.primary} />
            </Animated.View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 24,
    // Đảm bảo nội dung đủ cao để overlay spinner không làm ảnh hưởng đến scroll
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  card: {
    margin: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.danger,
  },
  peopleContainer: {
    marginBottom: 16,
  },
  addPersonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    fontSize: 16,
  },
  addButton: {
    width: 46,
    height: 46,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peopleListContainer: {
    marginTop: 8,
    height: 200,
  },
  peopleList: {
    flex: 1,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  personItemSelected: {
    backgroundColor: COLORS.primary,
  },
  personName: {
    fontSize: 16,
    color: COLORS.dark,
  },
  personNameSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    padding: 12,
  },
  randomButton: {
    marginTop: 8,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  resultModalContent: {
    alignItems: 'center',
    marginVertical: 16,
  },
  trophyIcon: {
    marginBottom: 12,
  },
  resultModalName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultModalDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  resultModalActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultModalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  resultModalActionText: {
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.primary,
  }
});

export default RandomPickerScreen;