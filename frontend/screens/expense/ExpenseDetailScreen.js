// frontend/screens/expense/ExpenseDetailScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
} from "react-native";
import { AuthContext } from "../../utils/AuthContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import { COLORS } from "../../utils/constants";
import { expenseApi, userApi } from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const ExpenseDetailScreen = ({ route, navigation }) => {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState(null);
  const [participantsDetails, setParticipantsDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      const response = await expenseApi.getExpense(expenseId);
      setExpense(response.data);

      // Lấy thông tin chi tiết về mỗi người tham gia
      await fetchParticipantsDetails(response.data.participants);
    } catch (error) {
      console.log("Error fetching expense details:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin chi tiêu. Vui lòng thử lại sau."
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipantsDetails = async (participants) => {
    try {
      // Lấy danh sách ID duy nhất của người tham gia
      const userIds = [...new Set(participants.map((p) => p.userId))];

      // Lấy thông tin của từng người dùng
      const userDetailsPromises = userIds.map((userId) =>
        userApi.getUser(userId)
      );
      const userResponses = await Promise.all(userDetailsPromises);
      const userDetails = userResponses.map((response) => response.data);

      // Kết hợp thông tin người dùng và thông tin tham gia
      const participantsWithDetails = participants.map((participant) => {
        const userDetail = userDetails.find((u) => u.id === participant.userId);
        return {
          ...participant,
          name: userDetail ? userDetail.name : "Người dùng không xác định",
          email: userDetail ? userDetail.email : "",
          isCurrentUser: participant.userId === user.id,
        };
      });

      setParticipantsDetails(participantsWithDetails);
    } catch (error) {
      console.log("Error fetching participants details:", error);
    }
  };

  const handleToggleSettlement = async (participantId, currentSettled) => {
    // Đảm bảo người dùng không thể đánh dấu chưa thanh toán cho người trả tiền
    if (participantId === expense.paidBy && currentSettled) {
      Alert.alert(
        "Không thể thực hiện",
        "Người trả tiền luôn được đánh dấu là đã thanh toán."
      );
      return;
    }

    setIsUpdating(true);
    try {
      await expenseApi.settleParticipant(
        expenseId,
        participantId,
        !currentSettled
      );

      // Cập nhật UI mà không cần tải lại toàn bộ
      const updatedExpense = { ...expense };
      const participantIndex = updatedExpense.participants.findIndex(
        (p) => p.userId === participantId
      );

      if (participantIndex !== -1) {
        updatedExpense.participants[participantIndex].settled = !currentSettled;

        // Cập nhật trạng thái tổng thể
        updatedExpense.settled = updatedExpense.participants.every(
          (p) => p.settled
        );
        setExpense(updatedExpense);

        // Cập nhật chi tiết người tham gia hiển thị
        const updatedParticipants = [...participantsDetails];
        const detailIndex = updatedParticipants.findIndex(
          (p) => p.userId === participantId
        );

        if (detailIndex !== -1) {
          updatedParticipants[detailIndex].settled = !currentSettled;
          setParticipantsDetails(updatedParticipants);
        }
      }
    } catch (error) {
      console.log("Error updating settlement status:", error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại sau."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettleAll = async () => {
    const unsettledParticipants = expense.participants.filter(
      (p) => !p.settled && p.userId !== expense.paidBy
    );

    if (unsettledParticipants.length === 0) {
      Alert.alert("Thông báo", "Tất cả mọi người đã thanh toán.");
      return;
    }

    setIsUpdating(true);
    try {
      // Tạo mảng promises để cập nhật đồng thời
      const updatePromises = unsettledParticipants.map((p) =>
        expenseApi.settleParticipant(expenseId, p.userId, true)
      );

      await Promise.all(updatePromises);

      // Cập nhật UI
      const updatedExpense = { ...expense };
      updatedExpense.participants.forEach((p) => {
        p.settled = true;
      });
      updatedExpense.settled = true;
      setExpense(updatedExpense);

      // Cập nhật chi tiết người tham gia hiển thị
      const updatedParticipants = [...participantsDetails];
      updatedParticipants.forEach((p) => {
        p.settled = true;
      });
      setParticipantsDetails(updatedParticipants);

      Alert.alert(
        "Thành công",
        "Tất cả thành viên đã được đánh dấu là đã thanh toán!"
      );
    } catch (error) {
      console.log("Error settling all participants:", error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại sau."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa chi tiêu này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(expenseId);
              Alert.alert("Thành công", "Chi tiêu đã được xóa!");
              navigation.goBack();
            } catch (error) {
              console.log("Error deleting expense:", error);
              Alert.alert(
                "Lỗi",
                "Không thể xóa chi tiêu. Vui lòng thử lại sau."
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      const dateObj = new Date(dateString);
      return format(dateObj, "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const calculateSettlementStatus = () => {
    if (!expense || !expense.participants) return { settled: 0, total: 0 };

    const total = expense.participants.length;
    const settled = expense.participants.filter((p) => p.settled).length;

    return { settled, total };
  };

  if (isLoading) {
    return <Loading text="Đang tải thông tin chi tiêu..." />;
  }

  const isPayer = expense.paidBy === user.id;
  const { settled, total } = calculateSettlementStatus();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.expenseCard}>
        <View style={styles.header}>
          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <View
            style={[
              styles.statusBadge,
              expense.settled ? styles.settledBadge : styles.unsettledBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {expense.settled
                ? "Đã thanh toán"
                : `${settled}/${total} đã thanh toán`}
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền:</Text>
          <Text style={styles.amount}>{expense.amount.toLocaleString()} đ</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Danh mục:</Text>
            <Text style={styles.infoValue}>{expense.category || "Khác"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày:</Text>
            <Text style={styles.infoValue}>{formatDate(expense.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người trả:</Text>
            <Text style={styles.infoValue}>
              {participantsDetails.find((p) => p.userId === expense.paidBy)
                ?.name || "Không xác định"}
              {isPayer ? " (Bạn)" : ""}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phân chia:</Text>
            <Text style={styles.infoValue}>
              {expense.splitType === "equal" ? "Chia đều" : "Tùy chỉnh"}
            </Text>
          </View>
        </View>

        {expense.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Ghi chú:</Text>
            <Text style={styles.notes}>{expense.notes}</Text>
          </View>
        )}

        <View style={styles.participantsSection}>
          <View style={styles.participantsSectionHeader}>
            <Text style={styles.participantsLabel}>Người tham gia:</Text>
            <Text style={styles.settlementStatus}>
              {settled}/{total} đã thanh toán
            </Text>
          </View>

          {participantsDetails.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {participant.name}
                  {participant.isCurrentUser ? " (Bạn)" : ""}
                  {participant.userId === expense.paidBy ? " 💰" : ""}
                </Text>
                <Text style={styles.participantAmount}>
                  {Math.round(
                    expense.amount * (participant.share / 100)
                  ).toLocaleString()}{" "}
                  đ ({participant.share}%)
                </Text>
              </View>

              <View style={styles.settlementToggle}>
                <Text
                  style={[
                    styles.settlementStatus,
                    participant.settled
                      ? styles.settledText
                      : styles.unsettledText,
                  ]}
                >
                  {participant.settled ? "Đã TT" : "Chưa TT"}
                </Text>

                {/* Chỉ hiển thị nút toggle nếu người dùng hiện tại là người trả tiền */}
                {isPayer && (
                  <Switch
                    value={participant.settled}
                    onValueChange={() =>
                      handleToggleSettlement(
                        participant.userId,
                        participant.settled
                      )
                    }
                    disabled={
                      isUpdating || participant.userId === expense.paidBy
                    }
                    trackColor={{
                      false: COLORS.lightGray,
                      true: COLORS.primary + "70",
                    }}
                    thumbColor={
                      participant.settled ? COLORS.primary : COLORS.gray
                    }
                  />
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttonSection}>
          {isPayer && !expense.settled && (
            <Button
              title="Đánh dấu tất cả đã thanh toán"
              onPress={handleSettleAll}
              style={styles.actionButton}
              isLoading={isUpdating}
            />
          )}

          {isPayer && (
            <Button
              title="Xóa chi tiêu"
              onPress={handleDelete}
              type="danger"
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  expenseCard: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  expenseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settledBadge: {
    backgroundColor: COLORS.success + "20", // Adding transparency
  },
  unsettledBadge: {
    backgroundColor: COLORS.warning + "20", // Adding transparency
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.dark,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  amountLabel: {
    fontSize: 16,
    color: COLORS.secondary,
    marginRight: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.dark,
  },
  notesSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.secondary,
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: COLORS.dark,
  },
  participantsSection: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  participantsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  participantsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  settlementStatus: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.dark,
    marginBottom: 4,
  },
  participantAmount: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  settlementToggle: {
    flexDirection: "row",
    alignItems: "center",
    width: 120,
    justifyContent: "space-between",
  },
  settledText: {
    color: COLORS.success,
  },
  unsettledText: {
    color: COLORS.warning,
  },
  buttonSection: {
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default ExpenseDetailScreen;
