// backend/models/User.js
const {
  readData,
  writeData,
  USERS_FILE,
  generateId,
} = require("../utils/database");

// Lưu trữ mã xác nhận tạm thời
const verificationCodes = new Map(); // key: email, value: { code, expires }

class User {
  constructor(id, name, email, password) {
    this.id = id || generateId();
    this.name = name;
    this.email = email;
    this.password = password; // In a real app, this should be hashed
    this.createdAt = new Date().toISOString();
    this.groups = [];
  }

  static async findAll() {
    return await readData(USERS_FILE);
  }

  static async findById(id) {
    const users = await readData(USERS_FILE);
    return users.find((user) => user.id === id);
  }

  static async findByEmail(email) {
    const users = await readData(USERS_FILE);
    return users.find((user) => user.email === email);
  }

  static async create(userData) {
    const users = await readData(USERS_FILE);
    const newUser = new User(
      null,
      userData.name,
      userData.email,
      userData.password
    );
    users.push(newUser);
    await writeData(USERS_FILE, users);
    return newUser;
  }

  static async update(id, updateData) {
    const users = await readData(USERS_FILE);
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      await writeData(USERS_FILE, users);
      return users[index];
    }

    return null;
  }

  static async delete(id) {
    const users = await readData(USERS_FILE);
    const filteredUsers = users.filter((user) => user.id !== id);

    if (filteredUsers.length < users.length) {
      await writeData(USERS_FILE, filteredUsers);
      return true;
    }

    return false;
  }

  static async addGroup(userId, groupId) {
    const users = await readData(USERS_FILE);
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      if (!users[userIndex].groups.includes(groupId)) {
        users[userIndex].groups.push(groupId);
        await writeData(USERS_FILE, users);
      }
      return users[userIndex];
    }

    return null;
  }

  static async removeGroup(userId, groupId) {
    const users = await readData(USERS_FILE);
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex].groups = users[userIndex].groups.filter(
        (id) => id !== groupId
      );
      await writeData(USERS_FILE, users);
      return users[userIndex];
    }

    return null;
  }

  static async verifyPasswordResetCode(email, code) {
    console.log(`Attempting to verify code for email: ${email}, code: ${code}`);

    const verification = verificationCodes.get(email);
    console.log("Stored verification data:", verification);

    if (!verification) {
      console.log("No verification code found for this email");
      return false;
    }

    // So sánh mã nhập vào với mã được lưu trữ (chuyển về chuỗi để đảm bảo so sánh chính xác)
    const codeMatches = String(verification.code) === String(code);
    const stillValid = verification.expires > Date.now();

    console.log(`Code matches: ${codeMatches}, Still valid: ${stillValid}`);
    console.log(
      `Stored code: ${verification.code}, Expires: ${new Date(
        verification.expires
      ).toISOString()}`
    );

    return codeMatches && stillValid;
  }
  // Phương thức để lưu mã xác nhận mới
  static async saveVerificationCode(email, code) {
    // Thời gian hết hạn: 10 phút
    const expires = Date.now() + 10 * 60 * 1000;

    verificationCodes.set(email, { code, expires });
  }
  // Phương thức để thay đổi mật khẩu với xác thực mật khẩu hiện tại
  static async changePasswordWithVerification(
    userId,
    currentPassword,
    newPassword
  ) {
    console.log(`Attempting to change password for user ID: ${userId}`);

    const users = await readData(USERS_FILE);
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      console.log(`User not found with ID: ${userId}`);
      return { success: false, message: "Không tìm thấy người dùng" };
    }

    // Xác thực mật khẩu hiện tại
    if (users[userIndex].password !== currentPassword) {
      console.log("Current password verification failed");
      return { success: false, message: "Mật khẩu hiện tại không chính xác" };
    }

    // Cập nhật mật khẩu
    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();

    // Lưu lại dữ liệu
    await writeData(USERS_FILE, users);
    console.log("Password changed successfully");

    return { success: true, message: "Mật khẩu đã được thay đổi thành công" };
  }
  // Phương thức để thay đổi mật khẩu
  static async changePassword(email, newPassword) {
    const users = await readData(USERS_FILE);
    const userIndex = users.findIndex((user) => user.email === email);

    if (userIndex === -1) {
      return null;
    }

    // Cập nhật mật khẩu
    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();

    // Lưu lại dữ liệu
    await writeData(USERS_FILE, users);

    // Xóa mã xác nhận đã sử dụng
    verificationCodes.delete(email);

    return users[userIndex];
  }
}

module.exports = User;
