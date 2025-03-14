// frontend/screens/random/RandomSplitScreen.js
import React, { useState } from 'react';
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
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../utils/constants';

const RandomSplitScreen = ({ navigation }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [isAmountConfirmed, setIsAmountConfirmed] = useState(false);
  const [personName, setPersonName] = useState('');
  const [peopleList, setPeopleList] = useState([]);
  const [shares, setShares] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [allowRandomFree, setAllowRandomFree] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [methodInfoVisible, setMethodInfoVisible] = useState(false);
  const [splitMethod, setSplitMethod] = useState('balanced'); // 'balanced' hoặc 'fullyRandom'

  // Xác nhận số tiền
  const handleConfirmAmount = () => {
    if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const amount = parseFloat(totalAmount);
    setConfirmedAmount(amount);
    setIsAmountConfirmed(true);
  };

  // Chỉnh sửa số tiền
  const handleEditAmount = () => {
    setIsAmountConfirmed(false);
    setShares({});
  };

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
    setPeopleList(peopleList.filter(person => person.id !== id));

    // Nếu đã tạo phân chia, cập nhật lại phân chia
    if (Object.keys(shares).length > 0) {
      const newShares = { ...shares };
      delete newShares[id];
      setShares(newShares);
    }
  };

  // Hàm phân chia tiền ngẫu nhiên cân bằng
  const balancedRandomSplit = (totalAmount, members, allowRandomFree = false) => {
    const numberOfMembers = members.length;
    const result = {};

    // Trường hợp chỉ có 1 người
    if (numberOfMembers === 1) {
      result[members[0].id] = {
        amount: totalAmount,
        percentage: 100,
        isFree: false
      };
      return result;
    }

    // Xác định những người được miễn phí (nếu cho phép)
    let freeMembers = [];
    let payingMembers = [...members];

    if (allowRandomFree && numberOfMembers >= 2) {
      // Tính số người tối đa có thể được miễn phí
      let maxFreeCount;

      if (numberOfMembers <= 3) {
        maxFreeCount = 1; // Tối đa 1 người với nhóm 2-3 người
      } else if (numberOfMembers <= 6) {
        maxFreeCount = 2; // Tối đa 2 người với nhóm 4-6 người
      } else {
        maxFreeCount = Math.floor(numberOfMembers * 0.3); // Tối đa 30% với nhóm 7+ người
      }

      // Đảm bảo luôn còn ít nhất 2 người phải trả tiền
      maxFreeCount = Math.min(maxFreeCount, numberOfMembers - 2);

      // Xác định ngẫu nhiên số lượng người được miễn phí (từ 0 đến maxFreeCount)
      const actualFreeCount = Math.floor(Math.random() * (maxFreeCount + 1));

      if (actualFreeCount > 0) {
        // Chọn ngẫu nhiên những người được miễn phí
        const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
        freeMembers = shuffledMembers.slice(0, actualFreeCount);

        // Những người còn lại phải trả tiền
        payingMembers = members.filter(member =>
          !freeMembers.some(freeMember => freeMember.id === member.id)
        );

        // Khởi tạo kết quả cho người được miễn phí
        freeMembers.forEach(member => {
          result[member.id] = {
            amount: 0,
            percentage: 0,
            isFree: true
          };
        });
      }
    }

    // Tiếp tục với logic phân chia cho những người phải trả tiền
    const payingMemberCount = payingMembers.length;

    // Tính phần trăm trung bình lý tưởng (dựa trên số người phải trả tiền)
    const avgPercentage = 100 / payingMemberCount;

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

    // 3. Tính toán khoảng phần trăm cho phép
    const minPercentage = avgPercentage * ((100 - adjustedDeviationPercent) / 100);
    const maxPercentage = avgPercentage * ((100 + adjustedDeviationPercent) / 100);

    // Log thông tin debug
    console.log(`Số tiền: ${totalAmount.toLocaleString()}đ, Tổng số người: ${numberOfMembers}, Số người trả tiền: ${payingMemberCount}`);
    console.log(`Phần trăm trung bình: ${avgPercentage.toFixed(1)}%`);
    console.log(`Độ chênh lệch: ${adjustedDeviationPercent}%`);
    console.log(`Phạm vi phần trăm: ${minPercentage.toFixed(1)}% - ${maxPercentage.toFixed(1)}%`);
    console.log(`Số người được miễn phí: ${freeMembers.length}`);

    let remainingPercentage = 100;
    let remainingAmount = totalAmount;
    let remainingMembers = [...payingMembers];

    // Trường hợp không còn ai phải trả tiền (không xảy ra trong thực tế vì đã đảm bảo ít nhất 2 người)
    if (remainingMembers.length === 0) {
      return result;
    }

    // 4. Phân bổ cho n-1 thành viên (trừ người cuối cùng trong danh sách phải trả tiền)
    for (let i = 0; i < payingMemberCount - 1; i++) {
      // Người hiện tại
      const currentMember = remainingMembers[0];
      remainingMembers = remainingMembers.slice(1);

      // Tính phần trăm ngẫu nhiên trong khoảng cho phép
      // Đảm bảo phần trăm còn lại đủ cho những người còn lại
      const minAllowedPercentage = Math.max(minPercentage, remainingPercentage - (remainingMembers.length * maxPercentage));
      const maxAllowedPercentage = Math.min(maxPercentage, remainingPercentage - (remainingMembers.length * minPercentage));

      // Phần trăm ngẫu nhiên
      let randomPercentage;
      if (maxAllowedPercentage <= minAllowedPercentage) {
        // Nếu khoảng không hợp lệ, sử dụng mức trung bình
        randomPercentage = minAllowedPercentage;
      } else {
        randomPercentage = minAllowedPercentage + Math.random() * (maxAllowedPercentage - minAllowedPercentage);
      }

      // Làm tròn đến 1 chữ số thập phân
      randomPercentage = Math.round(randomPercentage * 10) / 10;

      // Tính số tiền tương ứng
      let amount = Math.round((randomPercentage / 100) * totalAmount);

      // Làm tròn số tiền cho dễ nhớ (dựa vào mức tiền)
      if (totalAmount >= 10000000) {
        // Làm tròn đến 100,000đ với số tiền rất lớn (≥ 10tr)
        amount = Math.round(amount / 100000) * 100000;
      } else if (totalAmount >= 1000000) {
        // Làm tròn đến 10,000đ với số tiền lớn (≥ 1tr)
        amount = Math.round(amount / 10000) * 10000;
      } else if (totalAmount >= 100000) {
        // Làm tròn đến 5,000đ với số tiền trung bình (≥ 100k)
        amount = Math.round(amount / 5000) * 5000;
      } else {
        // Làm tròn đến 1,000đ với số tiền nhỏ
        amount = Math.round(amount / 1000) * 1000;
      }

      // Cập nhật số tiền và phần trăm còn lại
      remainingAmount -= amount;
      remainingPercentage -= randomPercentage;

      // Lưu kết quả
      result[currentMember.id] = {
        amount: amount,
        percentage: randomPercentage,
        isFree: false
      };
    }

    // 5. Người cuối cùng nhận phần còn lại
    if (remainingMembers.length > 0) {
      const lastMember = remainingMembers[0];

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
          if (!result[id].isFree) {
            currentTotal += result[id].amount;
          }
        }

        // Điều chỉnh nếu cần
        if (currentTotal !== totalAmount) {
          const diff = totalAmount - currentTotal;
          roundedAmount += diff;
        }
      }

      // Cập nhật kết quả cho người cuối
      const finalPercentage = parseFloat((roundedAmount / totalAmount * 100).toFixed(1));
      result[lastMember.id] = {
        amount: roundedAmount,
        percentage: finalPercentage,
        isFree: false
      };
    }

    return result;
  };

  // Hàm phân chia ngẫu nhiên hoàn toàn
  const fullyRandomSplit = (totalAmount, members, allowRandomFree = false) => {
    const numberOfMembers = members.length;
    const result = {};

    // Trường hợp chỉ có 1 người
    if (numberOfMembers === 1) {
      result[members[0].id] = {
        amount: totalAmount,
        percentage: 100,
        isFree: false
      };
      return result;
    }

    // Xác định những người được miễn phí (nếu cho phép)
    let freeMembers = [];
    let payingMembers = [...members];

    if (allowRandomFree && numberOfMembers >= 2) {
      // Logic miễn phí giống với balancedRandomSplit
      let maxFreeCount;

      if (numberOfMembers <= 3) {
        maxFreeCount = 1;
      } else if (numberOfMembers <= 6) {
        maxFreeCount = 2;
      } else {
        maxFreeCount = Math.floor(numberOfMembers * 0.3);
      }

      maxFreeCount = Math.min(maxFreeCount, numberOfMembers - 2);

      const actualFreeCount = Math.floor(Math.random() * (maxFreeCount + 1));

      if (actualFreeCount > 0) {
        const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
        freeMembers = shuffledMembers.slice(0, actualFreeCount);

        payingMembers = members.filter(member =>
          !freeMembers.some(freeMember => freeMember.id === member.id)
        );

        freeMembers.forEach(member => {
          result[member.id] = {
            amount: 0,
            percentage: 0,
            isFree: true
          };
        });
      }
    }

    const payingMemberCount = payingMembers.length;

    if (payingMemberCount === 0) {
      return result;
    }

    // Tạo mảng các điểm chia ngẫu nhiên
    let points = [];
    for (let i = 0; i < payingMemberCount - 1; i++) {
      points.push(Math.random());
    }

    // Sắp xếp các điểm
    points.sort((a, b) => a - b);

    // Chia mảng thành các phần dựa trên điểm
    let previousPoint = 0;
    let percentages = [];

    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const percentage = (currentPoint - previousPoint) * 100;
      percentages.push(percentage);
      previousPoint = currentPoint;
    }

    // Phần cuối cùng
    percentages.push((1 - previousPoint) * 100);

    // Làm tròn phần trăm
    const roundedPercentages = percentages.map(p => parseFloat(p.toFixed(1)));

    // Đôi khi tổng phần trăm có thể không chính xác 100% do làm tròn
    // Điều chỉnh phần trăm cuối cùng để đảm bảo tổng là 100%
    let totalPercentage = roundedPercentages.reduce((sum, p) => sum + p, 0);
    if (totalPercentage !== 100) {
      const diff = 100 - totalPercentage;
      const lastIndex = roundedPercentages.length - 1;
      roundedPercentages[lastIndex] = parseFloat((roundedPercentages[lastIndex] + diff).toFixed(1));
    }

    // Tính toán số tiền dựa trên phần trăm
    for (let i = 0; i < payingMemberCount; i++) {
      const memberId = payingMembers[i].id;
      const percentage = roundedPercentages[i];
      let amount = Math.round((percentage / 100) * totalAmount);

      // Làm tròn số tiền giống như phương pháp cân bằng
      if (totalAmount >= 10000000) {
        amount = Math.round(amount / 100000) * 100000;
      } else if (totalAmount >= 1000000) {
        amount = Math.round(amount / 10000) * 10000;
      } else if (totalAmount >= 100000) {
        amount = Math.round(amount / 5000) * 5000;
      } else {
        amount = Math.round(amount / 1000) * 1000;
      }

      result[memberId] = {
        amount: amount,
        percentage: percentage,
        isFree: false
      };
    }

    // Điều chỉnh để đảm bảo tổng tiền chính xác
    let totalCalculated = 0;
    for (const id in result) {
      if (!result[id].isFree) {
        totalCalculated += result[id].amount;
      }
    }

    if (totalCalculated !== totalAmount) {
      // Tìm người có số tiền lớn nhất để điều chỉnh
      let maxAmountId = null;
      let maxAmount = -1;

      for (const id in result) {
        if (!result[id].isFree && result[id].amount > maxAmount) {
          maxAmount = result[id].amount;
          maxAmountId = id;
        }
      }

      if (maxAmountId) {
        // Điều chỉnh số tiền
        const diff = totalAmount - totalCalculated;
        result[maxAmountId].amount += diff;

        // Cập nhật lại phần trăm
        result[maxAmountId].percentage = parseFloat(
          ((result[maxAmountId].amount / totalAmount) * 100).toFixed(1)
        );
      }
    }

    return result;
  };

  // Tạo phân chia ngẫu nhiên
  const generateRandomSplit = () => {
    if (!isAmountConfirmed) {
      Alert.alert('Lỗi', 'Vui lòng xác nhận số tiền trước');
      return;
    }

    if (peopleList.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một người vào danh sách');
      return;
    }

    if (peopleList.length < 2 && allowRandomFree) {
      Alert.alert('Lỗi', 'Cần ít nhất 2 người để sử dụng tùy chọn miễn phí');
      return;
    }

    setIsGenerating(true);

    // Tổng số tiền
    const total = confirmedAmount;

    // Danh sách người tham gia
    const members = [...peopleList];

    try {
      // Sử dụng phương pháp phân chia được chọn
      let newShares;
      if (splitMethod === 'balanced') {
        newShares = balancedRandomSplit(total, members, allowRandomFree);
      } else { // fullyRandom
        newShares = fullyRandomSplit(total, members, allowRandomFree);
      }

      // Cập nhật state
      setShares(newShares);
    } catch (error) {
      console.error('Lỗi khi phân chia ngẫu nhiên:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tạo phân chia ngẫu nhiên.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tạo phân chia mới
  const handleGenerateNew = () => {
    generateRandomSplit();
  };

  // Modal thông tin tùy chọn miễn phí
  const InfoModal = () => (
    <Modal
      visible={infoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setInfoModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalContainer}>
              <View style={styles.infoModalHeader}>
                <Text style={styles.infoModalTitle}>Tùy chọn miễn phí ngẫu nhiên</Text>
                <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.infoModalContent}>
                <Text style={styles.infoModalText}>
                  Khi bật tùy chọn này, một hoặc một số người trong nhóm có thể được ngẫu nhiên miễn phí hoàn toàn.
                </Text>
                <Text style={styles.infoModalText}>
                  Tỉ lệ được miễn phí phụ thuộc vào số lượng người tham gia:
                </Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Nhóm 2-3 người: Tối đa 1 người có thể được miễn phí
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Nhóm 4-6 người: Tối đa 2 người có thể được miễn phí
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Nhóm 7+ người: Tối đa 30% số người có thể được miễn phí
                  </Text>
                </View>
                <Text style={styles.infoModalText}>
                  Xác suất được miễn phí cho mỗi người là ngẫu nhiên. Phần chi phí của những người được miễn phí sẽ được phân bổ cho những người còn lại.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.infoModalButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Text style={styles.infoModalButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Modal thông tin phương pháp chia
  const MethodInfoModal = () => (
    <Modal
      visible={methodInfoVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setMethodInfoVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setMethodInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalContainer}>
              <View style={styles.infoModalHeader}>
                <Text style={styles.infoModalTitle}>Phương pháp chia tiền</Text>
                <TouchableOpacity onPress={() => setMethodInfoVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.infoModalContent}>
                <Text style={styles.infoModalSubtitle}>Phương pháp cân bằng:</Text>
                <Text style={styles.infoModalText}>
                  Phân chia số tiền một cách cân bằng dựa trên tổng số tiền và số người tham gia.
                  Phương pháp này đảm bảo không có ai phải trả quá nhiều hoặc quá ít, nhưng vẫn có
                  sự chênh lệch ngẫu nhiên để tạo sự thú vị.
                </Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Số tiền nhỏ (dưới 100K): Cho phép chênh lệch tối đa 50%
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Số tiền trung bình (100K-1M): Chênh lệch từ 30-40%
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Số tiền lớn (trên 1M): Chênh lệch từ 8-20%
                  </Text>
                </View>

                <Text style={[styles.infoModalSubtitle, {marginTop: 16}]}>Phương pháp ngẫu nhiên hoàn toàn:</Text>
                <Text style={styles.infoModalText}>
                  Phân chia tiền hoàn toàn ngẫu nhiên. Mỗi người có thể nhận từ một khoản rất nhỏ
                  đến gần như toàn bộ số tiền. Phương pháp này thú vị hơn nhưng có thể tạo ra
                  sự chênh lệch lớn.
                </Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Mỗi người nhận một tỷ lệ ngẫu nhiên hoàn toàn
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoItemText}>
                    Tiền vẫn được làm tròn để dễ tính toán
                  </Text>
                </View>
                <View style={styles.infoItem}>
                 <Text style={styles.infoBullet}>•</Text>
                                   <Text style={styles.infoItemText}>
                                     Phù hợp cho các trò chơi hoặc thử thách
                                   </Text>
                                 </View>
                               </ScrollView>
                               <TouchableOpacity
                                 style={styles.infoModalButton}
                                 onPress={() => setMethodInfoVisible(false)}
                               >
                                 <Text style={styles.infoModalButtonText}>Đã hiểu</Text>
                               </TouchableOpacity>
                             </View>
                           </TouchableWithoutFeedback>
                         </View>
                       </TouchableWithoutFeedback>
                     </Modal>
                   );

                   return (
                     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                       <ScrollView
                         style={styles.container}
                         contentContainerStyle={styles.content}
                         keyboardShouldPersistTaps="handled"
                       >
                         <InfoModal />
                         <MethodInfoModal />

                         <View style={styles.header}>
                           <Text style={styles.title}>Chia tiền ngẫu nhiên</Text>
                           <Text style={styles.subtitle}>
                             Nhập số tiền và thêm danh sách người tham gia để tạo phân chia ngẫu nhiên
                           </Text>
                         </View>

                         <Card style={styles.card}>
                           {/* Nhập số tiền */}
                           <View style={styles.amountContainer}>
                             <Text style={styles.label}>Số tiền cần chia</Text>
                             <View style={styles.amountInputContainer}>
                               <TextInput
                                 style={[
                                   styles.amountInput,
                                   isAmountConfirmed && styles.amountInputDisabled
                                 ]}
                                 value={totalAmount}
                                 onChangeText={setTotalAmount}
                                 placeholder="Nhập số tiền"
                                 keyboardType="numeric"
                                 editable={!isAmountConfirmed}
                               />
                               {isAmountConfirmed ? (
                                 <TouchableOpacity
                                   style={styles.amountButton}
                                   onPress={handleEditAmount}
                                 >
                                   <Icon name="create-outline" size={20} color="#fff" />
                                 </TouchableOpacity>
                               ) : (
                                 <TouchableOpacity
                                   style={styles.amountButton}
                                   onPress={handleConfirmAmount}
                                 >
                                   <Icon name="checkmark" size={20} color="#fff" />
                                 </TouchableOpacity>
                               )}
                             </View>
                             {isAmountConfirmed && (
                               <Text style={styles.confirmedAmountText}>
                                 Số tiền: {confirmedAmount.toLocaleString()} đ
                               </Text>
                             )}
                           </View>

                           {/* Thêm người tham gia */}
                           <View style={styles.peopleContainer}>
                             <Text style={styles.label}>Người tham gia ({peopleList.length})</Text>
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
                                   {peopleList.map(person => (
                                     <View key={person.id} style={styles.personItem}>
                                       <Text style={styles.personName}>{person.name}</Text>
                                       <TouchableOpacity
                                         style={styles.removeButton}
                                         onPress={() => handleRemovePerson(person.id)}
                                       >
                                         <Icon name="close-circle" size={20} color={COLORS.danger} />
                                       </TouchableOpacity>
                                     </View>
                                   ))}
                                 </ScrollView>
                               </View>
                             ) : (
                               <Text style={styles.emptyText}>Chưa có người tham gia</Text>
                             )}
                           </View>

                           {/* Phương pháp chia tiền */}
                           <View style={styles.methodContainer}>
                             <Text style={styles.label}>Phương pháp chia tiền</Text>
                             <View style={styles.radioContainer}>
                               <TouchableOpacity
                                 style={styles.radioOption}
                                 onPress={() => setSplitMethod('balanced')}
                               >
                                 <View style={styles.radioCircle}>
                                   {splitMethod === 'balanced' && <View style={styles.radioInner} />}
                                 </View>
                                 <Text style={styles.radioLabel}>Cân bằng</Text>
                               </TouchableOpacity>
                               <TouchableOpacity
                                 style={styles.radioOption}
                                 onPress={() => setSplitMethod('fullyRandom')}
                               >
                                 <View style={styles.radioCircle}>
                                   {splitMethod === 'fullyRandom' && <View style={styles.radioInner} />}
                                 </View>
                                 <Text style={styles.radioLabel}>Ngẫu nhiên hoàn toàn</Text>
                               </TouchableOpacity>
                             </View>
                             <TouchableOpacity
                               style={styles.infoIcon}
                               onPress={() => setMethodInfoVisible(true)}
                             >
                               <Icon name="information-circle-outline" size={18} color={COLORS.secondary} />
                             </TouchableOpacity>
                           </View>

                           {/* Tùy chọn ngẫu nhiên miễn phí */}
                           <View style={styles.optionContainer}>
                             <View style={styles.checkboxContainer}>
                               <TouchableOpacity
                                 style={styles.checkbox}
                                 onPress={() => setAllowRandomFree(!allowRandomFree)}
                               >
                                 {allowRandomFree && <Icon name="checkmark" size={16} color={COLORS.primary} />}
                               </TouchableOpacity>
                               <Text style={styles.checkboxLabel}>
                                 Cho phép ngẫu nhiên miễn phí hoàn toàn
                               </Text>
                             </View>
                             <TouchableOpacity
                               onPress={() => setInfoModalVisible(true)}
                             >
                               <Icon name="information-circle-outline" size={18} color={COLORS.secondary} />
                             </TouchableOpacity>
                           </View>

                           {/* Nút tạo phân chia ngẫu nhiên */}
                           <Button
                             title="Tạo phân chia ngẫu nhiên"
                             onPress={generateRandomSplit}
                             isLoading={isGenerating}
                             disabled={!isAmountConfirmed || peopleList.length === 0}
                             style={styles.generateButton}
                           />
                         </Card>

                         {/* Kết quả phân chia */}
                         {Object.keys(shares).length > 0 && (
                           <Card style={styles.resultsCard}>
                             <View style={styles.resultsHeader}>
                               <Text style={styles.resultsTitle}>Kết quả phân chia</Text>
                               <TouchableOpacity
                                 style={styles.newSplitButton}
                                 onPress={handleGenerateNew}
                               >
                                 <Text style={styles.newSplitText}>Tạo mới</Text>
                                 <Icon name="refresh" size={16} color={COLORS.primary} />
                               </TouchableOpacity>
                             </View>

                             <ScrollView
                               style={styles.resultsList}
                               nestedScrollEnabled={true}
                             >
                               {peopleList.map(person => (
                                 <View
                                   key={person.id}
                                   style={[
                                     styles.resultItem,
                                     shares[person.id]?.isFree && styles.freeResultItem
                                   ]}
                                 >
                                   <View style={styles.resultInfo}>
                                     <Text style={styles.resultName}>{person.name}</Text>
                                     {shares[person.id]?.isFree ? (
                                       <Text style={styles.freeLabel}>Miễn phí</Text>
                                     ) : (
                                       <Text style={styles.resultPercentage}>
                                         {shares[person.id]?.percentage || 0}%
                                       </Text>
                                     )}
                                   </View>
                                   <Text style={[
                                     styles.resultAmount,
                                     shares[person.id]?.isFree && styles.freeResultAmount
                                   ]}>
                                     {shares[person.id]?.isFree
                                       ? '0 đ'
                                       : (shares[person.id]?.amount || 0).toLocaleString() + ' đ'
                                     }
                                   </Text>
                                 </View>
                               ))}
                             </ScrollView>

                             <View style={styles.totalContainer}>
                               <Text style={styles.totalLabel}>Tổng cộng</Text>
                               <Text style={styles.totalAmount}>{confirmedAmount.toLocaleString()} đ</Text>
                             </View>
                           </Card>
                         )}
                       </ScrollView>
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
                   amountContainer: {
                     marginBottom: 16,
                   },
                   label: {
                     fontSize: 16,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                     marginBottom: 8,
                   },
                   amountInputContainer: {
                     flexDirection: 'row',
                     alignItems: 'center',
                   },
                   amountInput: {
                     flex: 1,
                     height: 46,
                     borderWidth: 1,
                     borderColor: COLORS.border,
                     borderRadius: 8,
                     paddingHorizontal: 12,
                     backgroundColor: COLORS.white,
                     fontSize: 16,
                   },
                   amountInputDisabled: {
                     backgroundColor: COLORS.lightGray,
                   },
                   amountButton: {
                     width: 46,
                     height: 46,
                     backgroundColor: COLORS.primary,
                     borderRadius: 8,
                     marginLeft: 8,
                     justifyContent: 'center',
                     alignItems: 'center',
                   },
                   confirmedAmountText: {
                     marginTop: 8,
                     fontSize: 14,
                     color: COLORS.success,
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
                   personName: {
                     fontSize: 16,
                     color: COLORS.dark,
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
                   methodContainer: {
                     marginBottom: 16,
                     position: 'relative',
                   },
                   radioContainer: {
                     flexDirection: 'column',
                     marginTop: 8,
                   },
                   radioOption: {
                     flexDirection: 'row',
                     alignItems: 'center',
                     marginBottom: 10,
                   },
                   radioCircle: {
                     height: 20,
                     width: 20,
                     borderRadius: 10,
                     borderWidth: 2,
                     borderColor: COLORS.primary,
                     alignItems: 'center',
                     justifyContent: 'center',
                     marginRight: 10,
                   },
                   radioInner: {
                     height: 10,
                     width: 10,
                     borderRadius: 5,
                     backgroundColor: COLORS.primary,
                   },
                   radioLabel: {
                     fontSize: 16,
                     color: COLORS.dark,
                   },
                   infoIcon: {
                     position: 'absolute',
                     top: 0,
                     right: 0,
                   },
                   optionContainer: {
                     flexDirection: 'row',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginVertical: 12,
                   },
                   checkboxContainer: {
                     flexDirection: 'row',
                     alignItems: 'center',
                   },
                   checkbox: {
                     width: 22,
                     height: 22,
                     borderWidth: 2,
                     borderColor: COLORS.primary,
                     borderRadius: 4,
                     marginRight: 8,
                     justifyContent: 'center',
                     alignItems: 'center',
                   },
                   checkboxLabel: {
                     fontSize: 14,
                     color: COLORS.dark,
                   },
                   generateButton: {
                     marginTop: 8,
                   },
                   resultsCard: {
                     margin: 16,
                     marginTop: 0,
                     padding: 16,
                   },
                   resultsHeader: {
                     flexDirection: 'row',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginBottom: 16,
                   },
                   resultsTitle: {
                     fontSize: 18,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                   },
                   newSplitButton: {
                     flexDirection: 'row',
                     alignItems: 'center',
                   },
                   newSplitText: {
                     fontSize: 14,
                     color: COLORS.primary,
                     marginRight: 4,
                   },
                   resultsList: {
                     height: 250,
                     marginVertical: 8,
                   },
                   resultItem: {
                     flexDirection: 'row',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     paddingVertical: 12,
                     borderBottomWidth: StyleSheet.hairlineWidth,
                     borderBottomColor: COLORS.border,
                   },
                   freeResultItem: {
                     backgroundColor: 'rgba(76, 175, 80, 0.1)', // Màu nền nhẹ cho item miễn phí
                     borderRadius: 8,
                     paddingHorizontal: 8,
                     marginBottom: 4,
                   },
                   resultInfo: {
                     flex: 1,
                   },
                   resultName: {
                     fontSize: 16,
                     color: COLORS.dark,
                     marginBottom: 4,
                   },
                   resultPercentage: {
                     fontSize: 14,
                     color: COLORS.secondary,
                   },
                   freeLabel: {
                     fontSize: 14,
                     color: COLORS.success,
                     fontWeight: 'bold',
                   },
                   resultAmount: {
                     fontSize: 16,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                   },
                   freeResultAmount: {
                     color: COLORS.success,
                     fontWeight: 'bold',
                   },
                   totalContainer: {
                     flexDirection: 'row',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginTop: 16,
                     paddingTop: 12,
                     borderTopWidth: 1,
                     borderTopColor: COLORS.border,
                   },
                   totalLabel: {
                     fontSize: 16,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                   },
                   totalAmount: {
                     fontSize: 18,
                     fontWeight: 'bold',
                     color: COLORS.primary,
                   },
                   modalOverlay: {
                     flex: 1,
                     backgroundColor: 'rgba(0, 0, 0, 0.5)',
                     justifyContent: 'center',
                     alignItems: 'center',
                     padding: 20,
                   },
                   infoModalContainer: {
                     backgroundColor: COLORS.white,
                     borderRadius: 12,
                     width: '100%',
                     maxWidth: 400,
                     maxHeight: '80%',
                     padding: 20,
                     shadowColor: '#000',
                     shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.25,
                     shadowRadius: 3.84,
                     elevation: 5,
                   },
                   infoModalHeader: {
                     flexDirection: 'row',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginBottom: 16,
                   },
                   infoModalTitle: {
                     fontSize: 18,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                   },
                   infoModalContent: {
                     maxHeight: 300,
                   },
                   infoModalText: {
                     fontSize: 14,
                     color: COLORS.secondary,
                     marginBottom: 12,
                     lineHeight: 20,
                   },
                   infoModalSubtitle: {
                     fontSize: 16,
                     fontWeight: 'bold',
                     color: COLORS.dark,
                     marginBottom: 8,
                   },
                   infoItem: {
                     flexDirection: 'row',
                     marginBottom: 8,
                     paddingLeft: 8,
                   },
                   infoBullet: {
                     fontSize: 14,
                     marginRight: 8,
                     color: COLORS.primary,
                   },
                   infoItemText: {
                     fontSize: 14,
                     color: COLORS.secondary,
                     flex: 1,
                   },
                   infoModalButton: {
                     backgroundColor: COLORS.primary,
                     borderRadius: 8,
                     paddingVertical: 12,
                     alignItems: 'center',
                     marginTop: 16,
                   },
                   infoModalButtonText: {
                     color: COLORS.white,
                     fontWeight: 'bold',
                     fontSize: 16,
                   },
                 });

                 export default RandomSplitScreen;