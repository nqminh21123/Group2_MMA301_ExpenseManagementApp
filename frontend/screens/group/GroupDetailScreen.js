// frontend/screens/group/GroupDetailScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  TextInput,
  Modal,
} from "react-native";
import { AuthContext } from "../../utils/AuthContext";
import ExpenseItem from "../../components/expense/ExpenseItem";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import Button from "../../components/common/Button";
import { COLORS } from "../../utils/constants";
import { groupApi, expenseApi, userApi } from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'settled', 'unsettled', 'myUnsettled'
  const [showMembersModal, setShowMembersModal] = useState(false);

  const { user } = useContext(AuthContext);

  const fetchGroupDetails = async () => {
    try {
      // Fetch group information
      const groupResponse = await groupApi.getGroup(groupId);
      setGroup(groupResponse.data);

      // Fetch expenses for this group
      const expensesResponse = await expenseApi.getGroupExpenses(groupId);

      // Sắp xếp chi tiêu theo thời gian tạo mới nhất
      const sortedExpenses = expensesResponse.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setExpenses(sortedExpenses);
      // Apply default filters to expenses (moved from here to applyFilters function call)

      // Calculate total expenses
      const total = sortedExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      setTotalExpenses(total);

      // Fetch members details
      setMembers(groupResponse.data.members);

      // Lấy thông tin chi tiết của các thành viên
      const memberDetailsPromises = groupResponse.data.members.map((memberId) =>
        userApi.getUser(memberId)
      );

      const memberResponses = await Promise.all(memberDetailsPromises);
      const memberDetails = memberResponses.map((response) => response.data);
      setMembersList(memberDetails);

      // Apply initial filters
      applyFilters(sortedExpenses, searchQuery, filterStatus);
    } catch (error) {
      console.log("Error fetching group details:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin nhóm. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGroupDetails();
  };

  const handleAddExpense = () => {
    navigation.navigate("AddExpense", { groupId, groupName: group.name });
  };

  const handleExpensePress = (expense) => {
    navigation.navigate("ExpenseDetail", { expenseId: expense.id });
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleAddMember = () => {
    // Hiển thị mã tham gia để chia sẻ với người khác
    Alert.alert(
      "Mã tham gia nhóm",
      `Mã tham gia nhóm của bạn là: ${group.joinCode}\n\nBạn có thể chia sẻ mã này với bạn bè để họ tham gia vào nhóm.`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Sao chép mã", onPress: () => copyJoinCode() },
        { text: "Chia sẻ", onPress: () => shareJoinCode() },
      ]
    );
  };

  const copyJoinCode = async () => {
    await Clipboard.setStringAsync(group.joinCode);
    Alert.alert("Thành công", "Đã sao chép mã tham gia vào clipboard");
  };

  const shareJoinCode = async () => {
    try {
      await Share.share({
        message: `Tham gia nhóm "${group.name}" của tôi trong ứng dụng Quản Lý Chi Tiêu Nhóm. Mã tham gia: ${group.joinCode}`,
      });
    } catch (error) {
      console.log("Error sharing join code:", error);
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      "Tạo mã mới",
      "Bạn có chắc chắn muốn tạo mã tham gia mới cho nhóm này không? Mã cũ sẽ không còn sử dụng được nữa.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Tạo mã mới", onPress: regenerateJoinCode },
      ]
    );
  };

  const regenerateJoinCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const response = await groupApi.regenerateJoinCode(groupId, user.id);

      // Cập nhật lại thông tin nhóm với mã mới
      const updatedGroup = { ...group, joinCode: response.data.joinCode };
      setGroup(updatedGroup);

      Alert.alert(
        "Thành công",
        `Mã tham gia mới của nhóm là: ${response.data.joinCode}`
      );
    } catch (error) {
      console.log("Error regenerating join code:", error);
      let errorMessage = "Đã xảy ra lỗi khi tạo mã mới";

      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  // Hàm xử lý tìm kiếm và lọc
  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(expenses, text, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(expenses, searchQuery, status);
  };

  const applyFilters = (expenseList, query, status) => {
    let filtered = [...expenseList];

    // Apply search filter
    if (query.trim() !== "") {
      filtered = filtered.filter(
        (expense) =>
          expense.title.toLowerCase().includes(query.toLowerCase()) ||
          (expense.category &&
            expense.category.toLowerCase().includes(query.toLowerCase())) ||
          (expense.notes &&
            expense.notes.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply status filter
    switch (status) {
      case "settled":
        // Chi tiêu đã thanh toán hoàn toàn
        filtered = filtered.filter((expense) => expense.settled);
        break;
      case "unsettled":
        // Chi tiêu chưa thanh toán hoàn toàn
        filtered = filtered.filter((expense) => !expense.settled);
        break;
      case "myUnsettled":
        // Chi tiêu mà người dùng hiện tại chưa thanh toán
        filtered = filtered.filter((expense) => {
          // Tìm người dùng hiện tại trong danh sách người tham gia
          const currentUserParticipant = expense.participants.find(
            (p) => p.userId === user.id
          );
          // Người dùng là người tham gia và chưa thanh toán
          return currentUserParticipant && !currentUserParticipant.settled;
        });
        break;
      default: // 'all'
        // Không lọc thêm
        break;
    }

    setFilteredExpenses(filtered);
  };

  const clearSearch = () => {
    setSearchQuery("");
    applyFilters(expenses, "", filterStatus);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilteredExpenses(expenses);
  };

  const isCreator = group?.createdBy === user.id;

  if (isLoading) {
    return <Loading text="Đang tải thông tin nhóm..." />;
  }

  return (
    <View style={styles.container}>
      {/* Modal hiển thị danh sách thành viên */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thành viên nhóm</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Icon name="close" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={membersList}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                  {group.createdBy === item.id && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>Người tạo</Text>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyMembersText}>
                  Không có thành viên nào
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onPress={() => handleExpensePress(item)}
            membersList={membersList}
            userId={user.id}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Card style={styles.groupInfoCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              {group.description && (
                <Text style={styles.groupDescription}>{group.description}</Text>
              )}

              {/* Hiển thị thông tin người tạo nhóm */}
              <View style={styles.creatorContainer}>
                <Icon
                  name="person-circle-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.creatorText}>
                  {isCreator
                    ? "Bạn là người tạo nhóm này"
                    : `Người tạo: ${
                        membersList.find((m) => m.id === group.createdBy)
                          ?.name || "Không xác định"
                      }`}
                </Text>
              </View>

              {/* Hiển thị mã tham gia nếu là người tạo nhóm */}
              {isCreator && (
                <View style={styles.joinCodeContainer}>
                  <View style={styles.joinCodeHeader}>
                    <Text style={styles.joinCodeLabel}>Mã tham gia:</Text>
                    <TouchableOpacity
                      onPress={handleRegenerateCode}
                      disabled={isRegeneratingCode}
                      style={styles.regenerateButton}
                    >
                      <Icon name="refresh" size={18} color={COLORS.primary} />
                      <Text style={styles.regenerateText}>Tạo mã mới</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.joinCodeBox}>
                    <Text style={styles.joinCode}>{group.joinCode}</Text>
                    <TouchableOpacity
                      onPress={copyJoinCode}
                      style={styles.copyButton}
                    >
                      <Icon
                        name="copy-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={shareJoinCode}
                      style={styles.shareButton}
                    >
                      <Icon
                        name="share-social-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.statsContainer}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={handleViewMembers}
                >
                  <Text style={styles.statValue}>{members.length}</Text>
                  <Text style={styles.statLabel}>Thành viên</Text>
                </TouchableOpacity>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{expenses.length}</Text>
                  <Text style={styles.statLabel}>Chi tiêu</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {totalExpenses.toLocaleString()} đ
                  </Text>
                  <Text style={styles.statLabel}>Tổng chi</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  title="Thêm chi tiêu"
                  onPress={handleAddExpense}
                  style={styles.actionButton}
                />
                {isCreator ? (
                  <Button
                    title="Chia sẻ nhóm"
                    onPress={handleAddMember}
                    type="outline"
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chi tiêu gần đây</Text>
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon
                  name="search"
                  size={20}
                  color={COLORS.secondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm chi tiêu..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    style={styles.clearButton}
                  >
                    <Icon
                      name="close-circle"
                      size={20}
                      color={COLORS.secondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bộ lọc trạng thái */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterStatus === "all" && styles.activeFilterTab,
                ]}
                onPress={() => handleFilterChange("all")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterStatus === "all" && styles.activeFilterText,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterStatus === "myUnsettled" && styles.activeFilterTab,
                ]}
                onPress={() => handleFilterChange("myUnsettled")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterStatus === "myUnsettled" && styles.activeFilterText,
                  ]}
                >
                  Tôi chưa thanh toán
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterStatus === "unsettled" && styles.activeFilterTab,
                ]}
                onPress={() => handleFilterChange("unsettled")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterStatus === "unsettled" && styles.activeFilterText,
                  ]}
                >
                  Chi tiêu nhóm chưa hoàn thiện
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterStatus === "settled" && styles.activeFilterTab,
                ]}
                onPress={() => handleFilterChange("settled")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterStatus === "settled" && styles.activeFilterText,
                  ]}
                >
                  Chi tiêu nhóm đã thanh toán hết
                </Text>
              </TouchableOpacity>

              {(searchQuery !== "" || filterStatus !== "all") && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Icon name="refresh" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          expenses.length > 0 ? (
            <EmptyState
              title="Không tìm thấy chi tiêu nào"
              message="Không có chi tiêu nào phù hợp với bộ lọc hiện tại."
              buttonTitle="Xóa bộ lọc"
              onButtonPress={clearFilters}
            />
          ) : (
            <EmptyState
              title="Chưa có chi tiêu nào"
              message="Nhóm này chưa có chi tiêu nào. Bắt đầu thêm chi tiêu để theo dõi!"
              buttonTitle="Thêm chi tiêu"
              onButtonPress={handleAddExpense}
            />
          )
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Icon name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  groupInfoCard: {
    marginBottom: 16,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 16,
  },
  creatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
    fontStyle: "italic",
  },
  joinCodeContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  joinCodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  joinCodeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  regenerateText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
  },
  joinCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 10,
  },
  joinCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
  },

  // Styles cho tìm kiếm và lọc
  searchContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: COLORS.lightGray,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary + "20", // Add transparency
  },
  filterText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  clearFiltersButton: {
    padding: 6,
    marginLeft: "auto",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // Styles cho modal thành viên
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.dark,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 12,
  },
  creatorBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyMembersText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 20,
  },
});

export default GroupDetailScreen;
