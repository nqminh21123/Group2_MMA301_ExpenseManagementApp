// frontend/navigation/AppNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import ExpensesScreen from "../screens/expense/ExpensesScreen";
import AddExpenseScreen from "../screens/expense/AddExpenseScreen";
import ExpenseDetailScreen from "../screens/expense/ExpenseDetailScreen";
import GroupsScreen from "../screens/group/GroupsScreen";
import AddGroupScreen from "../screens/group/AddGroupScreen";
import GroupDetailScreen from "../screens/group/GroupDetailScreen";
import JoinGroupScreen from "../screens/group/JoinGroupScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ExpenseDashboardScreen from "../screens/profile/ExpenseDashboardScreen";

// Random Tool Screens
import RandomMenuScreen from "../screens/random/RandomMenuScreen";
import RandomSplitScreen from "../screens/random/RandomSplitScreen";
import RandomPickerScreen from "../screens/random/RandomPickerScreen";

// Colors
import { COLORS } from "../utils/constants";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RandomStack = createNativeStackNavigator();

// Navigator cho các màn hình Random
const RandomNavigator = () => {
  return (
    <RandomStack.Navigator>
      <RandomStack.Screen
        name="RandomMenu"
        component={RandomMenuScreen}
        options={{ headerShown: false }}
      />
      <RandomStack.Screen
        name="RandomSplit"
        component={RandomSplitScreen}
        options={{ title: "Chia tiền ngẫu nhiên" }}
      />
      <RandomStack.Screen
        name="RandomPicker"
        component={RandomPickerScreen}
        options={{ title: "Bộ chọn ngẫu nhiên" }}
      />
    </RandomStack.Navigator>
  );
};

// Tạo một Stack Navigator chung cho tất cả các màn hình
const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ headerShown: true, title: "Thêm Chi Tiêu" }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ headerShown: true, title: "Chi Tiết" }}
      />
      <Stack.Screen
        name="AddGroup"
        component={AddGroupScreen}
        options={{ headerShown: true, title: "Tạo Nhóm Mới" }}
      />
      <Stack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ headerShown: true, title: "Tham Gia Nhóm" }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.groupName || "Chi Tiết Nhóm",
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: "Cài Đặt" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: true, title: "Đổi Mật Khẩu" }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExpenseDashboard"
        component={ExpenseDashboardScreen}
        options={{ headerShown: true, title: "Thống Kê Chi Tiêu" }}
      />

      {/* Thêm màn hình Random vào Root Stack */}
      <Stack.Screen
        name="RandomTools"
        component={RandomNavigator}
        options={{ headerShown: true, title: "Công cụ ngẫu nhiên" }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator chỉ chứa các màn hình chính
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Expenses") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Groups") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Random") {
            iconName = focused ? "shuffle" : "shuffle-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
      })}
    >
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: "Chi Tiêu" }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ title: "Nhóm" }}
      />
      <Tab.Screen
        name="Random"
        component={RandomNavigator}
        options={{ title: "Ngẫu nhiên" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Tài Khoản" }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
