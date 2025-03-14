// backend/models/Group.js
const { readData, writeData, GROUPS_FILE, generateId } = require('../utils/database');

class Group {
  constructor(id, name, description, createdBy) {
    this.id = id || generateId();
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.createdAt = new Date().toISOString();
    this.members = [createdBy]; // Creator is automatically a member
    this.expenses = [];
    this.joinCode = this.generateJoinCode(); // Tạo mã tham gia
  }

  // Định nghĩa phương thức trong lớp
  generateJoinCode() {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    } catch (error) {
      console.error('Error generating join code:', error);
      return 'ABCDEF'; // Mã mặc định nếu có lỗi
    }
  }

  static async findAll() {
    return await readData(GROUPS_FILE);
  }

  static async findById(id) {
    const groups = await readData(GROUPS_FILE);
    return groups.find(group => group.id === id);
  }

  static async findByJoinCode(joinCode) {
    const groups = await readData(GROUPS_FILE);
    return groups.find(group => group.joinCode === joinCode);
  }

  static async findByMember(userId) {
    const groups = await readData(GROUPS_FILE);
    return groups.filter(group => group.members.includes(userId));
  }

  static async create(groupData) {
    const groups = await readData(GROUPS_FILE);
    const newGroup = new Group(null, groupData.name, groupData.description, groupData.createdBy);
    groups.push(newGroup);
    await writeData(GROUPS_FILE, groups);
    return newGroup;
  }

  static async update(id, updateData) {
    const groups = await readData(GROUPS_FILE);
    const index = groups.findIndex(group => group.id === id);

    if (index !== -1) {
      groups[index] = { ...groups[index], ...updateData, updatedAt: new Date().toISOString() };
      await writeData(GROUPS_FILE, groups);
      return groups[index];
    }

    return null;
  }

  static async delete(id) {
    const groups = await readData(GROUPS_FILE);
    const filteredGroups = groups.filter(group => group.id !== id);

    if (filteredGroups.length < groups.length) {
      await writeData(GROUPS_FILE, filteredGroups);
      return true;
    }

    return false;
  }

  static async addMember(groupId, userId) {
    const groups = await readData(GROUPS_FILE);
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
      if (!groups[groupIndex].members.includes(userId)) {
        groups[groupIndex].members.push(userId);
        await writeData(GROUPS_FILE, groups);
      }
      return groups[groupIndex];
    }

    return null;
  }

  static async removeMember(groupId, userId) {
    const groups = await readData(GROUPS_FILE);
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
      // Don't remove the creator
      if (groups[groupIndex].createdBy !== userId) {
        groups[groupIndex].members = groups[groupIndex].members.filter(id => id !== userId);
        await writeData(GROUPS_FILE, groups);
      }
      return groups[groupIndex];
    }

    return null;
  }

  static async addExpense(groupId, expenseId) {
    const groups = await readData(GROUPS_FILE);
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
      if (!groups[groupIndex].expenses.includes(expenseId)) {
        groups[groupIndex].expenses.push(expenseId);
        await writeData(GROUPS_FILE, groups);
      }
      return groups[groupIndex];
    }

    return null;
  }

  static async removeExpense(groupId, expenseId) {
    const groups = await readData(GROUPS_FILE);
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
      groups[groupIndex].expenses = groups[groupIndex].expenses.filter(id => id !== expenseId);
      await writeData(GROUPS_FILE, groups);
      return groups[groupIndex];
    }

    return null;
  }

  // Tạo mã mới nếu cần
  static async regenerateJoinCode(groupId) {
    const groups = await readData(GROUPS_FILE);
    const groupIndex = groups.findIndex(group => group.id === groupId);

    if (groupIndex !== -1) {
      // Tạo một instance tạm thời để gọi phương thức generateJoinCode
      const tempGroup = new Group();
      const newCode = tempGroup.generateJoinCode();

      groups[groupIndex].joinCode = newCode;
      await writeData(GROUPS_FILE, groups);
      return groups[groupIndex];
    }

    return null;
  }
}

module.exports = Group;