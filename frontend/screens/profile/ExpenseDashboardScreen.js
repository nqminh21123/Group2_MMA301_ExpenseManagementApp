// frontend/screens/profile/ExpenseDashboardScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { vi } from "date-fns/locale";
import { AuthContext } from "../../utils/AuthContext";
import Card from "../../components/common/Card";
import Loading from "../../components/common/Loading";
import { COLORS } from "../../utils/constants";
import { expenseApi } from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");

const ExpenseDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState("month"); // 'month', 'year', 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchExpensesData();
  }, []);

  useEffect(() => {
    if (expenses.length > 0) {
      updateDashboard();
    }
  }, [expenses, selectedView, selectedDate]);

  const fetchExpensesData = async () => {
    try {
      const response = await expenseApi.getUserExpenses(user.id);
      setExpenses(response.data);
    } catch (error) {
      console.log("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDashboard = () => {
    let filteredExpenses = [];
    let start, end;

    // Xác định khoảng thời gian dựa trên chế độ xem
    if (selectedView === "month") {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    } else if (selectedView === "year") {
      start = new Date(selectedDate.getFullYear(), 0, 1);
      end = new Date(selectedDate.getFullYear(), 11, 31);
    }

    // Lọc chi tiêu trong khoảng thời gian
    filteredExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start, end });
    });

    // Tính tổng chi tiêu thực tế (phần mà người dùng phải trả)
    let userTotalAmount = 0;
    filteredExpenses.forEach((expense) => {
      const userShare =
        expense.participants.find((p) => p.userId === user.id)?.share || 0;
      const userAmount = expense.amount * (userShare / 100);
      userTotalAmount += userAmount;
    });
    setTotalAmount(userTotalAmount);

    // Tạo dữ liệu theo tháng hoặc theo danh mục
    if (selectedView === "month") {
      // Dữ liệu chi tiết theo ngày trong tháng
      const daysInMonth = {};
      for (let i = 1; i <= 31; i++) {
        daysInMonth[i] = 0;
      }

      filteredExpenses.forEach((expense) => {
        const expenseDate = parseISO(expense.date);
        const day = expenseDate.getDate();
        const userShare =
          expense.participants.find((p) => p.userId === user.id)?.share || 0;
        const userAmount = expense.amount * (userShare / 100);
        daysInMonth[day] = (daysInMonth[day] || 0) + userAmount;
      });

      const monthData = Object.keys(daysInMonth)
        .filter((day) => daysInMonth[day] > 0)
        .map((day) => ({
          name: `Ngày ${day}`,
          amount: daysInMonth[day],
        }));
      setMonthlyData(monthData);
    } else if (selectedView === "year") {
      // Dữ liệu theo tháng trong năm
      const monthsInYear = {};
      for (let i = 0; i < 12; i++) {
        monthsInYear[i] = 0;
      }

      filteredExpenses.forEach((expense) => {
        const expenseDate = parseISO(expense.date);
        const month = expenseDate.getMonth();
        const userShare =
          expense.participants.find((p) => p.userId === user.id)?.share || 0;
        const userAmount = expense.amount * (userShare / 100);
        monthsInYear[month] = (monthsInYear[month] || 0) + userAmount;
      });

      const yearData = Object.keys(monthsInYear)
        .filter((month) => monthsInYear[month] > 0)
        .map((month) => ({
          name: `Tháng ${parseInt(month) + 1}`,
          amount: monthsInYear[month],
        }));
      setMonthlyData(yearData);
    }

    // Tạo dữ liệu theo danh mục
    const categories = {};
    filteredExpenses.forEach((expense) => {
      const category = expense.category || "Khác";
      const userShare =
        expense.participants.find((p) => p.userId === user.id)?.share || 0;
      const userAmount = expense.amount * (userShare / 100);
      categories[category] = (categories[category] || 0) + userAmount;
    });

    const categoryArray = Object.keys(categories).map((category) => ({
      name: category,
      amount: categories[category],
    }));

    // Sắp xếp theo số tiền giảm dần
    categoryArray.sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryArray);
  };

  const handleChangeView = (view) => {
    setSelectedView(view);
    // Reset date khi chuyển đổi chế độ xem
    if (view === "month") {
      setSelectedDate(new Date());
    } else if (view === "year") {
      setSelectedDate(new Date());
    }
  };

  const handlePrevious = () => {
    if (selectedView === "month") {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (selectedView === "year") {
      setSelectedDate(
        new Date(
          selectedDate.getFullYear() - 1,
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
      );
    }
  };

  const handleNext = () => {
    if (selectedView === "month") {
      setSelectedDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          selectedDate.getDate()
        )
      );
    } else if (selectedView === "year") {
      setSelectedDate(
        new Date(
          selectedDate.getFullYear() + 1,
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
      );
    }
  };

  const formatDate = (date) => {
    if (selectedView === "month") {
      return format(date, "MMMM yyyy", { locale: vi });
    } else if (selectedView === "year") {
      return format(date, "yyyy", { locale: vi });
    }
    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  if (isLoading) {
    return <Loading text="Đang tải dữ liệu chi tiêu..." />;
  }

  // Tìm giá trị lớn nhất trong dữ liệu để làm mốc
  const maxValue =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((item) => item.amount))
      : 0;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.headerTitle}>Chi tiêu của bạn</Text>
        <Text style={styles.totalAmount}>{totalAmount.toLocaleString()} đ</Text>

        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === "month" && styles.activeViewButton,
            ]}
            onPress={() => handleChangeView("month")}
          >
            <Text
              style={[
                styles.viewButtonText,
                selectedView === "month" && styles.activeViewButtonText,
              ]}
            >
              Tháng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === "year" && styles.activeViewButton,
            ]}
            onPress={() => handleChangeView("year")}
          >
            <Text
              style={[
                styles.viewButtonText,
                selectedView === "year" && styles.activeViewButtonText,
              ]}
            >
              Năm
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePrevious}>
            <Icon name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.currentDate}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity onPress={handleNext}>
            <Icon name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </Card>
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Chi tiêu theo thời gian</Text>
        {monthlyData.length > 0 ? (
          <View style={styles.barChartContainer}>
            {monthlyData.map((item, index) => {
              // Tính phần trăm so với giá trị lớn nhất
              const percentage =
                maxValue > 0 ? (item.amount / maxValue) * 100 : 0;

              return (
                <View key={index} style={styles.barItem}>
                  <View style={styles.barLabelContainer}>
                    <Text style={styles.barLabel}>{item.name}</Text>
                    <Text style={styles.barAmount}>
                      {item.amount.toLocaleString()} đ
                    </Text>
                  </View>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: getCategoryColor(index % 7),
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noDataText}>
            Không có dữ liệu trong khoảng thời gian này
          </Text>
        )}
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Chi tiêu theo danh mục</Text>
        {categoryData.length > 0 ? (
          <View style={styles.categoryContainer}>
            {categoryData.map((category, index) => {
              // Tính tỷ lệ phần trăm trên tổng chi tiêu
              const percentage =
                totalAmount > 0
                  ? Math.round((category.amount / totalAmount) * 100)
                  : 0;

              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View
                      style={[
                        styles.categoryColor,
                        { backgroundColor: getCategoryColor(index) },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryPercentage}>{percentage}%</Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBar,
                        {
                          width: `${percentage}%`,
                          backgroundColor: getCategoryColor(index),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryAmount}>
                    {category.amount.toLocaleString()} đ
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noDataText}>
            Không có dữ liệu trong khoảng thời gian này
          </Text>
        )}
      </Card>
    </ScrollView>
  );
};

// Hàm giả lập để lấy màu cho danh mục
const getCategoryColor = (index) => {
  const colors = [
    COLORS.primary,
    "#FF6B6B",
    "#4ECDC4",
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#EF476F",
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 16,
  },
  viewSelector: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  activeViewButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentDate: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 16,
  },
  barChartContainer: {
    width: "100%",
    marginTop: 10,
  },
  barItem: {
    marginBottom: 16,
  },
  barLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: "500",
  },
  barContainer: {
    width: "100%",
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
  },
  barAmount: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    color: COLORS.secondary,
    fontStyle: "italic",
    padding: 20,
  },
  categoryContainer: {
    width: "100%",
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  categoryBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  categoryBar: {
    height: "100%",
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "right",
  },
});

export default ExpenseDashboardScreen;
