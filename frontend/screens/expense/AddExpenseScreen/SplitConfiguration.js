// frontend/screens/expense/AddExpenseScreen/SplitConfiguration.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import CustomSplitItem from "./CustomSplitItem";
import styles from "./styles";
import { COLORS } from "../../../utils/constants";

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
  userId,
}) => {
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [lastEditedMemberId, setLastEditedMemberId] = useState(null);
  const [allowRandomFree, setAllowRandomFree] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [randomType, setRandomType] = useState("balanced"); // 'simple' hoặc 'balanced'

  const toggleSplitOptions = () => {
    setShowSplitOptions(!showSplitOptions);
  };

  const selectSplitType = (type) => {
    setSplitType(type);
    setShowSplitOptions(false);

    if (type === "equal") {
      updateEqualShares();
    } else if (type === "custom") {
      initializeCustomShares();
    }
  };

  const updateEqualShares = () => {
    if (selectedMembers.length === 0) return;

    // Chia đều cho tất cả thành viên
    const equalShare = 100 / selectedMembers.length;

    // Cập nhật participants
    const updatedParticipants = [...participants];
    selectedMembers.forEach((memberId) => {
      const index = updatedParticipants.findIndex((p) => p.userId === memberId);
      if (index !== -1) {
        updatedParticipants[index].share = parseFloat(equalShare.toFixed(2));
      }
    });

    setParticipants(updatedParticipants);

    // Cập nhật customShares cho việc hiển thị
    const equalAmount = confirmedAmount / selectedMembers.length;
    const newShares = {};
    selectedMembers.forEach((memberId) => {
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
      Alert.alert("Thông báo", "Vui lòng xác nhận số tiền trước");
      return;
    }

    // Tính tổng số tiền đã phân bổ (trừ người hiện tại)
    let allocatedAmount = 0;

    for (const memberId in customShares) {
      if (memberId !== userId && selectedMembers.includes(memberId)) {
        const share =
          customShares[memberId] === ""
            ? 0
            : parseFloat(customShares[memberId]);
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
          const userAmount =
            customShares[participant.userId] === ""
              ? 0
              : parseFloat(customShares[participant.userId]);

          if (!isNaN(userAmount)) {
            allocatedAmount += userAmount;

            // Tính phần trăm
            const percentage =
              totalAmount > 0 ? (userAmount / totalAmount) * 100 : 0;
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
        setErrors((prev) => ({
          ...prev,
          split: `Tổng số tiền: ${allocatedAmount.toFixed(
            0
          )}/${totalAmount.toFixed(0)} đ (${percentageSum.toFixed(1)}%)`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, split: undefined }));
      }
    } catch (error) {
      console.log("Error recalculating shares:", error);
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
          const userAmount =
            shares[participant.userId] === ""
              ? 0
              : parseFloat(shares[participant.userId]);

          if (!isNaN(userAmount)) {
            allocatedAmount += userAmount;

            // Tính phần trăm
            const percentage =
              totalAmount > 0 ? (userAmount / totalAmount) * 100 : 0;
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
        setErrors((prev) => ({
          ...prev,
          split: `Tổng số tiền: ${allocatedAmount.toFixed(
            0
          )}/${totalAmount.toFixed(0)} đ (${percentageSum.toFixed(1)}%)`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, split: undefined }));
      }
    } catch (error) {
      console.log("Error updating all participants shares:", error);
    }
  };

  // Xử lý chia ngẫu nhiên thông thường (logic cũ)
  const handleSimpleRandomSplit = () => {
    if (confirmedAmount <= 0) {
      Alert.alert("Thông báo", "Vui lòng xác nhận số tiền trước");
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một thành viên");
      return;
    }

    // Tạo mảng các thành viên đã chọn
    let membersToSplit = [...selectedMembers];
    let freeMembers = [];

    // Xử lý miễn phí ngẫu nhiên nếu được chọn
    if (allowRandomFree && selectedMembers.length >= 2) {
      // Tính số người tối đa có thể được miễn phí
      let maxFreeCount;

      if (selectedMembers.length <= 3) {
        maxFreeCount = 1; // Tối đa 1 người với nhóm 2-3 người
      } else if (selectedMembers.length <= 6) {
        maxFreeCount = 2; // Tối đa 2 người với nhóm 4-6 người
      } else {
        maxFreeCount = Math.floor(selectedMembers.length * 0.3); // Tối đa 30% với nhóm 7+ người
      }

      // Đảm bảo luôn còn ít nhất 2 người phải trả tiền
      maxFreeCount = Math.min(maxFreeCount, selectedMembers.length - 2);

      // Xác định ngẫu nhiên số lượng người được miễn phí (từ 0 đến maxFreeCount)
      const actualFreeCount = Math.floor(Math.random() * (maxFreeCount + 1));

      if (actualFreeCount > 0) {
        // Chọn ngẫu nhiên những người được miễn phí
        const shuffledMembers = [...selectedMembers].sort(
          () => 0.5 - Math.random()
        );
        freeMembers = shuffledMembers.slice(0, actualFreeCount);

        // Những người còn lại phải trả tiền
        membersToSplit = selectedMembers.filter(
          (memberId) => !freeMembers.includes(memberId)
        );
      }
    }

    // Tổng số tiền
    const total = confirmedAmount;

    // Phân bổ ngẫu nhiên
    let remaining = total;
    const newShares = {};

    // Khởi tạo giá trị cho người được miễn phí
    freeMembers.forEach((memberId) => {
      newShares[memberId] = "0";
    });

    // Phân bổ ngẫu nhiên cho n-1 thành viên
    for (let i = 0; i < membersToSplit.length - 1; i++) {
      // Số tiền tối đa có thể phân bổ cho thành viên này
      const maxAmount = remaining * 0.8; // Giữ lại ít nhất 20% cho người còn lại

      // Số tiền ngẫu nhiên từ 10% đến maxAmount
      const minAmount = remaining * 0.1; // Ít nhất 10%
      let randomAmount = Math.floor(
        Math.random() * (maxAmount - minAmount) + minAmount
      );

      // Làm tròn số tiền (có thể làm tròn đến 1000đ cho dễ nhớ)
      randomAmount = Math.round(randomAmount / 1000) * 1000;

      // Lưu giá trị
      newShares[membersToSplit[i]] = randomAmount.toString();

      // Giảm số tiền còn lại
      remaining -= randomAmount;
    }

    // Phần còn lại cho thành viên cuối
    if (membersToSplit.length > 0) {
      newShares[membersToSplit[membersToSplit.length - 1]] =
        remaining.toString();
    }

    // Cập nhật state
    setCustomShares(newShares);

    // Cập nhật tỷ lệ phần trăm cho tất cả người dùng
    updateAllParticipantsShares(newShares);
  };

  // Hàm phân chia ngẫu nhiên cải tiến
  const balancedRandomSplit = (allowFree = false) => {
    if (confirmedAmount <= 0) {
      Alert.alert("Thông báo", "Vui lòng xác nhận số tiền trước");
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một thành viên");
      return;
    }

    if (selectedMembers.length < 2 && allowFree) {
      Alert.alert(
        "Thông báo",
        "Cần ít nhất 2 người để sử dụng tùy chọn miễn phí"
      );
      return;
    }

    const result = {};
    const totalAmount = confirmedAmount;
    const members = [...selectedMembers];

    // Xác định những người được miễn phí (nếu cho phép)
    let freeMembers = [];
    let payingMembers = [...members];

    if (allowFree && members.length >= 2) {
      // Tính số người tối đa có thể được miễn phí
      let maxFreeCount;

      if (members.length <= 3) {
        maxFreeCount = 1; // Tối đa 1 người với nhóm 2-3 người
      } else if (members.length <= 6) {
        maxFreeCount = 2; // Tối đa 2 người với nhóm 4-6 người
      } else {
        maxFreeCount = Math.floor(members.length * 0.3); // Tối đa 30% với nhóm 7+ người
      }

      // Đảm bảo luôn còn ít nhất 2 người phải trả tiền
      maxFreeCount = Math.min(maxFreeCount, members.length - 2);

      // Xác định ngẫu nhiên số lượng người được miễn phí (từ 0 đến maxFreeCount)
      const actualFreeCount = Math.floor(Math.random() * (maxFreeCount + 1));

      if (actualFreeCount > 0) {
        // Chọn ngẫu nhiên những người được miễn phí
        const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
        freeMembers = shuffledMembers.slice(0, actualFreeCount);

        // Những người còn lại phải trả tiền
        payingMembers = members.filter(
          (memberId) => !freeMembers.includes(memberId)
        );

        // Khởi tạo kết quả cho người được miễn phí
        freeMembers.forEach((memberId) => {
          result[memberId] = "0";
        });
      }
    }

    // Tiếp tục với logic phân chia cho những người phải trả tiền
    const payingMemberCount = payingMembers.length;

    // Tính phần trăm trung bình lý tưởng (dựa trên số người phải trả tiền)
    const avgAmount = totalAmount / payingMemberCount;

    // 1. Xác định mức chênh lệch cơ bản dựa vào tổng số tiền
    let baseDeviationPercent;

    if (totalAmount < 100000) {
      baseDeviationPercent = 50; // Chênh lệch tối đa 50% so với trung bình
    } else if (totalAmount < 500000) {
      baseDeviationPercent = 40; // Chênh lệch tối đa 40% so với trung bình
    } else if (totalAmount < 1000000) {
      baseDeviationPercent = 30; // Chênh lệch tối đa 30% so với trung bình
    } else if (totalAmount < 5000000) {
      baseDeviationPercent = 20; // Chênh lệch tối đa 20% so với trung bình
    } else if (totalAmount < 10000000) {
      baseDeviationPercent = 15; // Chênh lệch tối đa 15% so với trung bình
    } else if (totalAmount < 50000000) {
      baseDeviationPercent = 12; // Chênh lệch tối đa 12% so với trung bình
    } else if (totalAmount < 100000000) {
      baseDeviationPercent = 10; // Chênh lệch tối đa 10% so với trung bình
    } else {
      baseDeviationPercent = 8; // Chênh lệch tối đa 8% so với trung bình
    }

    // 2. Điều chỉnh mức chênh lệch dựa vào số lượng người
    let adjustedDeviationPercent = baseDeviationPercent;

    if (payingMemberCount >= 20) {
      adjustedDeviationPercent -= 7; // Giảm 7% độ chênh lệch với 20+ người
    } else if (payingMemberCount >= 10) {
      adjustedDeviationPercent -= 5; // Giảm 5% độ chênh lệch với 10-19 người
    } else if (payingMemberCount >= 5) {
      adjustedDeviationPercent -= 2; // Giảm 2% độ chênh lệch với 5-9 người
    } else if (payingMemberCount <= 2) {
      adjustedDeviationPercent += 10; // Tăng 10% độ chênh lệch với 2 người
    }

    // Đảm bảo độ chênh lệch không âm và không quá lớn
    adjustedDeviationPercent = Math.max(adjustedDeviationPercent, 5);
    adjustedDeviationPercent = Math.min(adjustedDeviationPercent, 70);

    // Phạm vi số tiền cho phép
    const minAmount = avgAmount * ((100 - adjustedDeviationPercent) / 100);
    const maxAmount = avgAmount * ((100 + adjustedDeviationPercent) / 100);

    let remainingAmount = totalAmount;
    let remainingMembers = [...payingMembers];

    // 4. Phân bổ cho n-1 thành viên (trừ người cuối cùng trong danh sách phải trả tiền)
    for (let i = 0; i < payingMemberCount - 1; i++) {
      // Người hiện tại
      const currentMemberId = remainingMembers[0];
      remainingMembers = remainingMembers.slice(1);

      // Tính số tiền ngẫu nhiên trong khoảng cho phép
      // Đảm bảo số tiền còn lại đủ cho những người còn lại
      const minAllowedAmount = Math.max(
        minAmount,
        remainingAmount - remainingMembers.length * maxAmount
      );
      const maxAllowedAmount = Math.min(
        maxAmount,
        remainingAmount - remainingMembers.length * minAmount
      );

      // Số tiền ngẫu nhiên
      let randomAmount;
      if (maxAllowedAmount <= minAllowedAmount) {
        // Nếu khoảng không hợp lệ, sử dụng mức trung bình
        randomAmount = minAllowedAmount;
      } else {
        randomAmount =
          minAllowedAmount +
          Math.random() * (maxAllowedAmount - minAllowedAmount);
      }

      // Làm tròn số tiền cho dễ nhớ (dựa vào mức tiền)
      if (totalAmount >= 10000000) {
        randomAmount = Math.round(randomAmount / 100000) * 100000; // Làm tròn đến 100,000đ
      } else if (totalAmount >= 1000000) {
        randomAmount = Math.round(randomAmount / 10000) * 10000; // Làm tròn đến 10,000đ
      } else if (totalAmount >= 100000) {
        randomAmount = Math.round(randomAmount / 5000) * 5000; // Làm tròn đến 5,000đ
      } else {
        randomAmount = Math.round(randomAmount / 1000) * 1000; // Làm tròn đến 1,000đ
      }

      // Cập nhật số tiền còn lại
      remainingAmount -= randomAmount;

      // Lưu kết quả
      result[currentMemberId] = randomAmount.toString();
    }

    // 5. Người cuối cùng nhận phần còn lại
    if (remainingMembers.length > 0) {
      const lastMemberId = remainingMembers[0];

      // Làm tròn số tiền tùy theo mức
      let roundedAmount = remainingAmount;
      if (totalAmount >= 10000000) {
        roundedAmount = Math.round(roundedAmount / 100000) * 100000;
      } else if (totalAmount >= 1000000) {
        roundedAmount = Math.round(roundedAmount / 10000) * 10000;
      } else if (totalAmount >= 100000) {
        roundedAmount = Math.round(roundedAmount / 5000) * 5000;
      } else {
        roundedAmount = Math.round(roundedAmount / 1000) * 1000;
      }

      // Nếu có chênh lệch sau khi làm tròn, điều chỉnh để đảm bảo tổng = totalAmount
      if (roundedAmount !== remainingAmount) {
        // Tính tổng hiện tại sau khi làm tròn
        let currentTotal = roundedAmount;
        for (const id in result) {
          if (result[id] !== "0") {
            currentTotal += parseFloat(result[id]);
          }
        }

        // Điều chỉnh nếu cần
        if (Math.abs(currentTotal - totalAmount) > 0.5) {
          roundedAmount += totalAmount - currentTotal;
        }
      }

      // Cập nhật kết quả cho người cuối
      result[lastMemberId] = roundedAmount.toString();
    }

    // Cập nhật customShares
    setCustomShares(result);

    // Cập nhật tỷ lệ phần trăm
    updateAllParticipantsShares(result);
  };

  // Hàm thực hiện chia ngẫu nhiên dựa trên các lựa chọn
  const executeRandomSplit = () => {
    if (confirmedAmount <= 0) {
      Alert.alert("Thông báo", "Vui lòng xác nhận số tiền trước");
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một thành viên");
      return;
    }

    if (selectedMembers.length < 2 && allowRandomFree) {
      Alert.alert(
        "Thông báo",
        "Cần ít nhất 2 người để sử dụng tùy chọn miễn phí"
      );
      return;
    }

    // Thực hiện chia ngẫu nhiên dựa trên loại đã chọn
    if (randomType === "simple") {
      handleSimpleRandomSplit();
    } else {
      balancedRandomSplit(allowRandomFree);
    }
  };

  // Calculate share percentage for a given member
  const getSharePercentage = (memberId) => {
    const participant = participants.find((p) => p.userId === memberId);
    return participant ? participant.share : 0;
  };

  // Modal thông tin tùy chọn miễn phí
  const InfoModal = () => (
    <Modal
      visible={infoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setInfoModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tùy chọn miễn phí ngẫu nhiên</Text>
            <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
              <Icon name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>
              Khi bật tùy chọn này, một hoặc một số người trong nhóm có thể được
              ngẫu nhiên miễn phí hoàn toàn.
            </Text>
            <Text style={styles.modalText}>
              Tỉ lệ được miễn phí phụ thuộc vào số lượng người tham gia:
            </Text>
            <View style={styles.modalListItem}>
              <Text style={styles.modalBullet}>•</Text>
              <Text style={styles.modalListText}>
                Nhóm 2-3 người: Tối đa 1 người có thể được miễn phí
              </Text>
            </View>
            <View style={styles.modalListItem}>
              <Text style={styles.modalBullet}>•</Text>
              <Text style={styles.modalListText}>
                Nhóm 4-6 người: Tối đa 2 người có thể được miễn phí
              </Text>
            </View>
            <View style={styles.modalListItem}>
              <Text style={styles.modalBullet}>•</Text>
              <Text style={styles.modalListText}>
                Nhóm 7+ người: Tối đa 30% số người có thể được miễn phí
              </Text>
            </View>
            <Text style={styles.modalText}>
              Phần chi phí của những người được miễn phí sẽ được phân bổ cho
              những người còn lại.
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setInfoModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Đã hiểu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.splitConfigContainer}>
      <InfoModal />

      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Cách phân chia</Text>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={toggleSplitOptions}
        >
          <Text style={styles.categoryButtonText}>
            {splitType === "equal" ? "Chia đều" : "Tùy chỉnh"}
          </Text>
          <Icon name="chevron-down" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        {showSplitOptions && (
          <Card style={styles.categoryPicker}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => selectSplitType("equal")}
            >
              <Text style={styles.categoryItemText}>Chia đều</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => selectSplitType("custom")}
            >
              <Text style={styles.categoryItemText}>Tùy chỉnh</Text>
            </TouchableOpacity>
          </Card>
        )}

        {errors.split && <Text style={styles.errorText}>{errors.split}</Text>}
      </View>

      <View style={styles.participantsContainer}>
        <Text style={styles.subLabel}>Chi tiết phân chia</Text>

        {/* Tùy chọn phân chia - sử dụng radio button */}
        {splitType === "custom" && (
          <View style={styles.randomSplitContainer}>
            <Text style={styles.randomSplitTitle}>
              Tùy chọn chia ngẫu nhiên
            </Text>

            {/* Radio button cho các lựa chọn */}
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setRandomType("simple")}
              >
                <View style={styles.radioButton}>
                  {randomType === "simple" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Ngẫu nhiên đơn giản</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setRandomType("balanced")}
              >
                <View style={styles.radioButton}>
                  {randomType === "balanced" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>Ngẫu nhiên cân bằng</Text>
              </TouchableOpacity>
            </View>

            {/* Checkbox cho tùy chọn miễn phí */}
            <View style={styles.randomSplitCheckboxContainer}>
              <TouchableOpacity
                style={styles.randomSplitCheckbox}
                onPress={() => setAllowRandomFree(!allowRandomFree)}
              >
                {allowRandomFree && (
                  <Icon name="checkmark" size={16} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              <Text style={styles.randomSplitCheckboxLabel}>
                Cho phép miễn phí ngẫu nhiên
              </Text>
              <TouchableOpacity onPress={() => setInfoModalVisible(true)}>
                <Icon
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Nút thực hiện chia ngẫu nhiên */}
            <Button
              title="Thực hiện chia ngẫu nhiên"
              onPress={executeRandomSplit}
              style={styles.executeRandomButton}
              icon={
                <Icon
                  name="shuffle"
                  size={16}
                  color={COLORS.white}
                  style={{ marginRight: 5 }}
                />
              }
            />

            <View style={styles.randomSplitSeparator} />
          </View>
        )}

        {/* Danh sách phân chia */}
        {splitType === "equal" &&
          selectedMembers.map((memberId) => (
            <View key={memberId} style={styles.participantItem}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {getMemberName(memberId)} {memberId === userId ? "(Bạn)" : ""}
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

        {splitType === "custom" &&
          selectedMembers.map((memberId) => (
            <CustomSplitItem
              key={memberId}
              memberId={memberId}
              memberName={getMemberName(memberId)}
              isCurrentUser={memberId === userId}
              shareAmount={customShares[memberId] || "0"}
              sharePercentage={getSharePercentage(memberId)}
              onChangeShare={handleCustomShareChange}
              onCalculateRemaining={() => calculateRemainingAmount(memberId)}
            />
          ))}

        {/* Thông tin tổng cộng */}
        {splitType === "custom" && (
          <View style={styles.totalContainer}>
            <Text
              style={
                errors.split ? styles.errorBalanceText : styles.balanceText
              }
            >
              {errors.split || "Tổng số tiền đã cân bằng"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default SplitConfiguration;
