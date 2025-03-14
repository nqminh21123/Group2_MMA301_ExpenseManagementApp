// frontend/screens/group/GroupsScreen.js
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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../utils/AuthContext";
import GroupItem from "../../components/group/GroupItem";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import { COLORS } from "../../utils/constants";
import { groupApi, userApi } from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const GroupsScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [membersList, setMembersList] = useState([]);

  const { user } = useContext(AuthContext);

  const fetchData = async () => {
    try {
      const response = await groupApi.getUserGroups(user.id);
      // Sắp xếp nhóm mới nhất lên đầu (dựa vào createdAt)
      const sortedGroups = response.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setGroups(sortedGroups);
      setFilteredGroups(sortedGroups);

      // Lấy danh sách thành viên từ tất cả các nhóm
      await fetchAllMembers(sortedGroups);
    } catch (error) {
      console.log("Error fetching groups:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách nhóm. Vui lòng thử lại sau.");
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

      // Lấy chi tiết của mỗi nhóm để thu thập ID thành viên
      for (const group of groups) {
        // Thêm người tạo nhóm vào danh sách thành viên
        if (group.createdBy) {
          memberIds.add(group.createdBy);
        }

        // Lấy danh sách thành viên từ chi tiết nhóm nếu chưa có
        if (!group.members || group.members.length === 0) {
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
        } else {
          // Nếu đã có danh sách thành viên trong nhóm, sử dụng nó
          group.members.forEach((memberId) => memberIds.add(memberId));
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

  // Load groups when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [user.id])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleGroupPress = (group) => {
    navigation.navigate("GroupDetail", {
      groupId: group.id,
      groupName: group.name,
    });
  };

  const handleJoinGroup = () => {
    navigation.navigate("JoinGroup");
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setFilteredGroups(groups);
      return;
    }

    const filtered = groups.filter(
      (group) =>
        group.name.toLowerCase().includes(text.toLowerCase()) ||
        (group.description &&
          group.description.toLowerCase().includes(text.toLowerCase()))
    );

    setFilteredGroups(filtered);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredGroups(groups);
  };

  if (isLoading) {
    return <Loading text="Đang tải danh sách nhóm..." />;
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
            placeholder="Tìm kiếm nhóm..."
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

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupItem
            group={item}
            onPress={() => handleGroupPress(item)}
            currentUserId={user.id}
            membersList={membersList}
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
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.joinGroupButton}
            onPress={handleJoinGroup}
          >
            <Icon name="link-outline" size={20} color={COLORS.primary} />
            <View style={styles.joinGroupTextContainer}>
              <Text style={styles.joinGroupText}>Tham gia nhóm bằng mã</Text>
              <Text style={styles.joinGroupSubtext}>
                Nhập mã tham gia để kết nối với nhóm
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <EmptyState
              title="Không tìm thấy nhóm"
              message={`Không có nhóm nào phù hợp với "${searchQuery}"`}
              buttonTitle="Xóa tìm kiếm"
              onButtonPress={clearSearch}
            />
          ) : (
            <EmptyState
              title="Chưa có nhóm nào"
              message="Bạn chưa tham gia nhóm nào. Hãy tạo nhóm mới hoặc tham gia vào nhóm đã có."
              buttonTitle="Tạo nhóm mới"
              onButtonPress={() => navigation.navigate("AddGroup")}
            />
          )
        }
      />
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.secondaryFab]}
          onPress={handleJoinGroup}
        >
          <Icon name="link" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddGroup")}
        >
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  joinGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinGroupTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  joinGroupText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  joinGroupSubtext: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  fabContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  fab: {
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
    marginBottom: 16,
  },
  secondaryFab: {
    backgroundColor: COLORS.secondary,
  },
});

export default GroupsScreen;
