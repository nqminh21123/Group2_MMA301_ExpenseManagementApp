// backend/models/Expense.js
const { readData, writeData, EXPENSES_FILE, generateId } = require('../utils/database');

class Expense {
  constructor(id, title, amount, paidBy, groupId, date, splitType, participants) {
    this.id = id || generateId();
    this.title = title;
    this.amount = parseFloat(amount);
    this.paidBy = paidBy;
    this.groupId = groupId;
    this.date = date || new Date().toISOString();
    this.createdAt = new Date().toISOString();
    this.splitType = splitType || 'equal'; // 'equal', 'percentage', 'exact'
    // Đảm bảo mỗi participant có trạng thái thanh toán
    this.participants = participants.map(participant => ({
        ...participant,
        // Người trả tiền mặc định là đã thanh toán
        settled: participant.userId === paidBy ? true : (participant.settled || false)
      }));

      // Cập nhật trạng thái tổng thể dựa trên tất cả thành viên
    this.settled = this.participants.every(p => p.settled);
    this.category = '';
    this.notes = '';
  }

  static async findAll() {
    return await readData(EXPENSES_FILE);
  }

  static async findById(id) {
    const expenses = await readData(EXPENSES_FILE);
    return expenses.find(expense => expense.id === id);
  }

  static async findByGroup(groupId) {
    const expenses = await readData(EXPENSES_FILE);
    return expenses.filter(expense => expense.groupId === groupId);
  }

  static async findByUser(userId) {
    const expenses = await readData(EXPENSES_FILE);
    return expenses.filter(expense => 
      expense.paidBy === userId || 
      expense.participants.some(participant => participant.userId === userId)
    );
  }

  static async create(expenseData) {
    const expenses = await readData(EXPENSES_FILE);

    // Đảm bảo mỗi participant có trường settled
    const participants = expenseData.participants.map(participant => {
      return {
        ...participant,
        // Người trả tiền mặc định là đã thanh toán, những người khác là chưa
        settled: participant.userId === expenseData.paidBy
      };
    });

    const newExpense = new Expense(
      null,
      expenseData.title,
      expenseData.amount,
      expenseData.paidBy,
      expenseData.groupId,
      expenseData.date,
      expenseData.splitType,
      participants
    );

    if (expenseData.category) newExpense.category = expenseData.category;
    if (expenseData.notes) newExpense.notes = expenseData.notes;

    // Trạng thái tổng thể: chi tiêu được coi là đã thanh toán khi tất cả mọi người đã thanh toán
    newExpense.settled = participants.every(p => p.settled);

    expenses.push(newExpense);
    await writeData(EXPENSES_FILE, expenses);
    return newExpense;
  }
static async updateParticipantSettlement(id, userId, settled) {
  const expenses = await readData(EXPENSES_FILE);
  const index = expenses.findIndex(expense => expense.id === id);

  if (index !== -1) {
    const expense = expenses[index];
    const participantIndex = expense.participants.findIndex(p => p.userId === userId);

    if (participantIndex !== -1) {
      expense.participants[participantIndex].settled = settled;

      // Cập nhật trạng thái tổng hợp của chi tiêu
      expense.settled = expense.participants.every(p => p.settled);

      await writeData(EXPENSES_FILE, expenses);
      return expense;
    }
  }

  return null;
}
  static async update(id, updateData) {
    const expenses = await readData(EXPENSES_FILE);
    const index = expenses.findIndex(expense => expense.id === id);
    
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updateData, updatedAt: new Date().toISOString() };
      await writeData(EXPENSES_FILE, expenses);
      return expenses[index];
    }
    
    return null;
  }

  static async delete(id) {
    const expenses = await readData(EXPENSES_FILE);
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    
    if (filteredExpenses.length < expenses.length) {
      await writeData(EXPENSES_FILE, filteredExpenses);
      return true;
    }
    
    return false;
  }

  static async settle(id) {
    return await this.update(id, { settled: true });
  }

  static async unsettle(id) {
    return await this.update(id, { settled: false });
  }
}

module.exports = Expense;