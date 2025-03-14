// frontend/screens/expense/AddExpenseScreen/utils.js

/**
 * Lấy tên thành viên từ ID
 * @param {string} memberId - ID của thành viên
 * @param {Array} membersList - Danh sách thành viên đầy đủ
 * @returns {string} Tên thành viên hoặc ID nếu không tìm thấy
 */
export const getMemberName = (memberId, membersList) => {
  const member = membersList.find(m => m.id === memberId);
  return member ? member.name : `ID: ${memberId}`;
};

/**
 * Tạo danh sách phân chia ban đầu
 * @param {Array} memberIds - Danh sách ID thành viên
 * @param {Array} participants - Danh sách phân chia hiện tại
 * @returns {Array} Danh sách phân chia mới
 */
export const createParticipantsList = (memberIds, participants = []) => {
  return memberIds.map(memberId => {
    const existingParticipant = participants.find(p => p.userId === memberId);
    return existingParticipant || { userId: memberId, share: 0 };
  });
};

/**
 * Tạo đối tượng phân chia tùy chỉnh ban đầu
 * @param {Array} memberIds - Danh sách ID thành viên
 * @returns {Object} Đối tượng phân chia tùy chỉnh
 */
export const createCustomShares = (memberIds) => {
  const shares = {};
  memberIds.forEach(memberId => {
    shares[memberId] = '';
  });
  return shares;
};

/**
 * Cập nhật phân chia đều
 * @param {Array} memberIds - Danh sách ID thành viên
 * @param {number} totalAmount - Tổng số tiền
 * @returns {Object} Thông tin phân chia đều
 */
export const calculateEqualShares = (memberIds, totalAmount) => {
  if (!memberIds.length) return { participants: [], customShares: {} };

  const equalShare = 100 / memberIds.length;
  const participants = memberIds.map(memberId => ({
    userId: memberId,
    share: parseFloat(equalShare.toFixed(2))
  }));

  const customShares = {};
  if (totalAmount > 0) {
    const equalAmount = totalAmount / memberIds.length;
    memberIds.forEach(memberId => {
      customShares[memberId] = equalAmount.toFixed(0);
    });
  }

  return { participants, customShares };
};

/**
 * Tạo phân chia ngẫu nhiên
 * @param {Array} memberIds - Danh sách ID thành viên
 * @param {number} totalAmount - Tổng số tiền
 * @returns {Object} Đối tượng phân chia ngẫu nhiên
 */
export const createRandomSplit = (memberIds, totalAmount) => {
  if (!memberIds.length || totalAmount <= 0) return {};

  const newShares = {};
  let remaining = totalAmount;

  // Phân bổ ngẫu nhiên cho n-1 thành viên
  for (let i = 0; i < memberIds.length - 1; i++) {
    // Số tiền tối đa có thể phân bổ cho thành viên này
    const maxAmount = remaining * 0.8; // Giữ lại ít nhất 20% cho người còn lại

    // Số tiền ngẫu nhiên từ 10% đến maxAmount
    const minAmount = remaining * 0.1; // Ít nhất 10%
    let randomAmount = Math.floor(Math.random() * (maxAmount - minAmount) + minAmount);

    // Làm tròn số tiền (làm tròn đến 1000đ cho dễ nhớ)
    randomAmount = Math.round(randomAmount / 1000) * 1000;

    // Lưu giá trị
    newShares[memberIds[i]] = randomAmount.toString();

    // Giảm số tiền còn lại
    remaining -= randomAmount;
  }

  // Phần còn lại cho thành viên cuối
  newShares[memberIds[memberIds.length - 1]] = remaining.toString();

  return newShares;
};

/**
 * Tính toán số tiền còn lại cho một thành viên
 * @param {string} memberId - ID thành viên cần tính
 * @param {Object} customShares - Đối tượng chứa phân chia hiện tại
 * @param {Array} selectedMembers - Danh sách thành viên đã chọn
 * @param {number} totalAmount - Tổng số tiền
 * @returns {string} Số tiền còn lại (dạng chuỗi)
 */
export const calculateRemainingAmount = (memberId, customShares, selectedMembers, totalAmount) => {
  // Tính tổng số tiền đã phân bổ (trừ người hiện tại)
  let allocatedAmount = 0;

  for (const id in customShares) {
    if (id !== memberId && selectedMembers.includes(id)) {
      const share = customShares[id] === '' ? 0 : parseFloat(customShares[id]);
      if (!isNaN(share)) {
        allocatedAmount += share;
      }
    }
  }

  // Tính số tiền còn lại
  const remainingAmount = totalAmount - allocatedAmount;
  return Math.max(0, remainingAmount).toFixed(0);
};

/**
 * Tính toán và cập nhật tỷ lệ phần trăm dựa trên số tiền
 * @param {Array} participants - Danh sách thành viên tham gia
 * @param {Object} customShares - Đối tượng chứa phân chia hiện tại
 * @param {Array} selectedMembers - Danh sách thành viên đã chọn
 * @param {number} totalAmount - Tổng số tiền
 * @returns {Object} Kết quả tính toán
 */
export const recalculateParticipantShares = (participants, customShares, selectedMembers, totalAmount) => {
  if (!participants || participants.length === 0 || totalAmount <= 0) {
    return { updatedParticipants: participants, error: null };
  }

  // Tính tổng số tiền đã được phân bổ
  let allocatedAmount = 0;
  let percentageSum = 0;

  // Tạo mảng participants mới để cập nhật
  const updatedParticipants = [...participants];

  // Cập nhật tất cả các thành viên với giá trị hiện tại
  for (const participant of updatedParticipants) {
    if (selectedMembers.includes(participant.userId)) {
      const userAmount = customShares[participant.userId] === '' ? 0 :
                        parseFloat(customShares[participant.userId]);

      if (!isNaN(userAmount)) {
        allocatedAmount += userAmount;

        // Tính phần trăm
        const percentage = totalAmount > 0 ? (userAmount / totalAmount * 100) : 0;
        participant.share = parseFloat(percentage.toFixed(2));
        percentageSum += participant.share;
      }
    } else {
      participant.share = 0;
    }
  }

  // Kiểm tra tổng số tiền đã phân bổ
  let error = null;
  if (Math.abs(allocatedAmount - totalAmount) > 0.01) {
    error = `Tổng số tiền: ${allocatedAmount.toFixed(0)}/${totalAmount.toFixed(0)} đ (${percentageSum.toFixed(1)}%)`;
  }

  return { updatedParticipants, error };
};

/**
 * Xác thực dữ liệu trước khi gửi
 * @param {Object} data - Dữ liệu cần xác thực
 * @returns {Object} Kết quả xác thực
 */
export const validateExpenseData = (data) => {
  const {
    title,
    isAmountConfirmed,
    groupId,
    category,
    selectedMembers,
    splitType,
    customShares,
    confirmedAmount
  } = data;

  const errors = {};

  if (!title) errors.title = 'Tiêu đề không được để trống';
  if (!isAmountConfirmed) {
    errors.amount = 'Vui lòng xác nhận số tiền';
  }
  if (!groupId) errors.groupId = 'Vui lòng chọn nhóm';
  if (!category) errors.category = 'Vui lòng chọn danh mục';
  if (!selectedMembers || selectedMembers.length === 0) {
    errors.members = 'Vui lòng chọn ít nhất một thành viên tham gia';
  }

  // Với kiểu phân chia tùy chỉnh, kiểm tra tổng số tiền
  if (splitType === 'custom' && selectedMembers && selectedMembers.length > 0) {
    let totalAmount = 0;

    for (const memberId of selectedMembers) {
      const amount = customShares[memberId] === '' ? 0 : parseFloat(customShares[memberId]);
      if (!isNaN(amount)) {
        totalAmount += amount;
      }
    }

    // Cho phép sai số nhỏ do làm tròn
    if (Math.abs(totalAmount - confirmedAmount) > 1) {
      errors.split = `Tổng số tiền phân chia (${totalAmount.toFixed(0)}đ) phải bằng số tiền chi tiêu (${confirmedAmount.toFixed(0)}đ)`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};