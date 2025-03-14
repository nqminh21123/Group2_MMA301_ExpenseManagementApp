// frontend/components/group/GroupItem.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../../utils/constants";
import Card from "../common/Card";
import Icon from "react-native-vector-icons/Ionicons";

const GroupItem = ({ group, onPress, currentUserId, membersList = [] }) => {
  const {
    id,
    name,
    description,
    members = [],
    expenses = [],
    createdBy,
  } = group;

  // Kiểm tra xem người dùng hiện tại có phải là người tạo nhóm không
  const isCreator = currentUserId === createdBy;

  // Hàm lấy tên người dùng từ ID
  const getMemberName = (memberId) => {
    const member = membersList.find((m) => m.id === memberId);
    return member ? member.name : `ID: ${memberId}`;
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="people-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{name}</Text>
            {description && (
              <Text style={styles.description} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.creatorSection}>
          <Icon
            name="person-circle-outline"
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.creatorText}>
            {isCreator
              ? "Bạn là người tạo nhóm"
              : `Người tạo: ${getMemberName(createdBy)}`}
          </Text>
        </View>

        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Icon name="person-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>{members.length} thành viên</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="receipt-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>{expenses.length} chi tiêu</Text>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  description: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  creatorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  creatorText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 6,
    fontStyle: "italic",
  },
  info: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginLeft: 4,
  },
});

export default GroupItem;
