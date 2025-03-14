// frontend/screens/random/RandomMenuScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Card from "../../components/common/Card";
import { COLORS } from "../../utils/constants";

const FeatureCard = ({ title, description, icon, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.featureCard}>
        <View style={styles.featureIconContainer}>
          <Icon name={icon} size={32} color={COLORS.primary} />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <Icon name="chevron-forward" size={24} color={COLORS.secondary} />
      </Card>
    </TouchableOpacity>
  );
};

const RandomMenuScreen = ({ navigation }) => {
  const navigateToRandomSplit = () => {
    navigation.navigate("RandomSplit");
  };

  const navigateToRandomPicker = () => {
    navigation.navigate("RandomPicker");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Công cụ ngẫu nhiên</Text>
          <Text style={styles.subtitle}>
            Các công cụ hỗ trợ chia sẻ và lựa chọn ngẫu nhiên
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <FeatureCard
            title="Chia tiền ngẫu nhiên"
            description="Nhập số tiền và danh sách người, phân chia số tiền ngẫu nhiên cho từng người"
            icon="cash-outline"
            onPress={navigateToRandomSplit}
          />

          <FeatureCard
            title="Bộ chọn ngẫu nhiên"
            description="Thêm danh sách người tham gia và chọn ra một người một cách ngẫu nhiên"
            icon="people-outline"
            onPress={navigateToRandomPicker}
          />
        </View>

        <View style={styles.infoContainer}>
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon
                name="information-circle-outline"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.infoTitle}>Hướng dẫn sử dụng</Text>
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Chia tiền ngẫu nhiên:</Text> Công cụ này
              giúp bạn chia một khoản tiền cho nhiều người một cách ngẫu nhiên
              nhưng vẫn đảm bảo tổng số tiền không đổi.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Bộ chọn ngẫu nhiên:</Text> Công cụ này
              giúp bạn chọn ngẫu nhiên một người từ danh sách, hữu ích khi bạn
              cần chọn người thắng cuộc hoặc người thực hiện một nhiệm vụ nào
              đó.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  featuresContainer: {
    padding: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  infoContainer: {
    padding: 16,
    paddingTop: 0,
  },
  infoCard: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
    color: COLORS.dark,
  },
});

export default RandomMenuScreen;
