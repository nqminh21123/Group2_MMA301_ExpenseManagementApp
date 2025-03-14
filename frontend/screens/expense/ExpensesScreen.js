// frontend/screens/expense/ExpensesScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../utils/AuthContext";
import ExpenseItem from "../../components/expense/ExpenseItem";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import { COLORS } from "../../utils/constants";
import { expenseApi, groupApi, userApi } from "../../services/api"; // Thêm userApi
import Icon from "react-native-vector-icons/Ionicons";

const ExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'settled', 'unsettled', 'partiallySettled', 'myUnsettled'
  const [selectedGroup, setSelectedGroup] = useState("all"); // 'all' or groupId
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [membersList, setMembersList] = useState([]); // Thêm state cho danh sách thành viên

  const { user } = useContext(AuthContext);

  const fetchData = async () => {
    try {
      // Get user's expenses
      const expensesResponse = await expenseApi.getUserExpenses(user.id);

      // Sắp xếp chi tiêu theo thời gian tạo mới nhất
      const sortedExpenses = expensesResponse.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setExpenses(sortedExpenses);
      applyFilters(sortedExpenses, searchQuery, filterStatus, selectedGroup);

      // Get user's groups for filtering
      const groupsResponse = await groupApi.getUserGroups(user.id);
      setGroups(groupsResponse.data);

      // Tải danh sách thành viên từ tất cả các nhóm
      await fetchAllMembers(groupsResponse.data);
    } catch (error) {
      console.log("Error fetching expenses:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách chi tiêu. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Hàm lấy danh sách tất cả thành viên từ các nhóm
  const fetchAllMembers = async (groups) => {
    try {
      // Tập hợp tất cả ID thành viên từ tất cả các nhóm
      const memberIds = new Set();

      // Thu thập tất cả ID từ expenses (người trả tiền)
      expenses.forEach((expense) => {
        if (expense.paidBy) {
          memberIds.add(expense.paidBy);
        }
      });

      // Lấy chi tiết của mỗi nhóm để thu thập ID thành viên
      for (const group of groups) {
        try {
          const groupDetails = await groupApi.getGroup(group.id);
          if (
            groupDetails.data.members &&
            Array.isArray(groupDetails.data.members)
          ) {
            groupDetails.data.members.forEach((memberId) =>
              memberIds.add(memberId)
            );
          }
        } catch (err) {
          console.log(`Error fetching group ${group.id}:`, err);
          // Tiếp tục với nhóm tiếp theo nếu xảy ra lỗi
        }
      }

      // Chuyển đổi Set thành Array
      const uniqueMemberIds = [...memberIds].filter((id) => id); // Lọc bỏ undefined/null

      if (uniqueMemberIds.length === 0) return;

      // Lấy thông tin chi tiết của mỗi thành viên
      const memberPromises = uniqueMemberIds.map((id) => userApi.getUser(id));
      const memberResponses = await Promise.all(memberPromises);

      // Lọc các response hợp lệ và map thành danh sách thành viên
      const validMembers = memberResponses
        .filter((response) => response && response.data)
        .map((response) => response.data);

      setMembersList(validMembers);
    } catch (error) {
      console.log("Error fetching members:", error);
      // Không hiển thị Alert vì đây không phải dữ liệu quan trọng
    }
  };

  // Load expenses when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [user.id])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleExpensePress = (expense) => {
    navigation.navigate("ExpenseDetail", { expenseId: expense.id });
  };

  const handleAddExpense = () => {
    if (groups.length === 0) {
      Alert.alert(
        "Không có nhóm",
        "Bạn cần tham gia ít nhất một nhóm để thêm chi tiêu.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Tạo nhóm",
            onPress: () =>
              navigation.navigate("Groups", { screen: "AddGroup" }),
          },
        ]
      );
      return;
    }

    navigation.navigate("AddExpense");
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(expenses, text, filterStatus, selectedGroup);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(expenses, searchQuery, status, selectedGroup);
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    applyFilters(expenses, searchQuery, filterStatus, groupId);
    setShowGroupFilter(false);
  };

  const applyFilters = (expenseList, query, status, group) => {
    let filtered = [...expenseList];

    // Apply group filter
    if (group !== "all") {
      filtered = filtered.filter((expense) => expense.groupId === group);
    }

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
    applyFilters(expenses, "", filterStatus, selectedGroup);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setSelectedGroup("all");
    setFilteredExpenses(expenses);
  };

  const getGroupName = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Nhóm không xác định";
  };

  const getSelectedGroupName = () => {
    if (selectedGroup === "all") return "Tất cả nhóm";
    return getGroupName(selectedGroup);
  };

  if (isLoading) {
    return <Loading text="Đang tải danh sách chi tiêu..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Group Filter */}
      <View style={styles.groupFilterContainer}>
        <TouchableOpacity
          style={styles.groupSelector}
          onPress={() => setShowGroupFilter(!showGroupFilter)}
        >
          <Text style={styles.groupSelectorText}>{getSelectedGroupName()}</Text>
          <Icon
            name={showGroupFilter ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.secondary}
          />
        </TouchableOpacity>

        {showGroupFilter && (
          <View style={styles.groupDropdown}>
            <TouchableOpacity
              style={[
                styles.groupItem,
                selectedGroup === "all" && styles.selectedGroupItem,
              ]}
              onPress={() => handleGroupSelect("all")}
            >
              <Text
                style={[
                  styles.groupItemText,
                  selectedGroup === "all" && styles.selectedGroupItemText,
                ]}
              >
                Tất cả nhóm
              </Text>
            </TouchableOpacity>

            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupItem,
                  selectedGroup === group.id && styles.selectedGroupItem,
                ]}
                onPress={() => handleGroupSelect(group.id)}
              >
                <Text
                  style={[
                    styles.groupItemText,
                    selectedGroup === group.id && styles.selectedGroupItemText,
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
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
        </ScrollView>

        {(searchQuery !== "" ||
          filterStatus !== "all" ||
          selectedGroup !== "all") && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Icon name="refresh" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onPress={() => handleExpensePress(item)}
            showGroupName={selectedGroup === "all"}
            groupName={getGroupName(item.groupId)}
            userId={user.id}
            membersList={membersList} // Truyền danh sách thành viên vào ExpenseItem
          />
        )}
        contentContainerStyle={styles.list}
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
              message="Bạn chưa có chi tiêu nào. Hãy thêm chi tiêu để theo dõi!"
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
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  clearButton: {
    padding: 4,
  },
  groupFilterContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  groupSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  groupSelectorText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  groupDropdown: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    maxHeight: 200,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  selectedGroupItem: {
    backgroundColor: COLORS.lightGray,
  },
  groupItemText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  selectedGroupItemText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScrollContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary + "20", // Add transparency
  },
  filterText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  clearFiltersButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 80,
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
});

export default ExpensesScreen;
