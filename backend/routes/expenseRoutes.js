// backend/routes/expenseRoutes.js
const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.findAll();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense', error: error.message });
  }
});

// Get expenses for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const expenses = await Expense.findByGroup(req.params.groupId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group expenses', error: error.message });
  }
});

// Get expenses for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const expenses = await Expense.findByUser(req.params.userId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user expenses', error: error.message });
  }
});

// Create a new expense
router.post('/', async (req, res) => {
  try {
    const {
      title,
      amount,
      paidBy,
      groupId,
      date,
      splitType,
      participants,
      category,
      notes
    } = req.body;

    // Validate required fields
    if (!title || !amount || !paidBy || !groupId) {
      return res.status(400).json({ message: 'Title, amount, paidBy, and groupId are required' });
    }

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Validate that paidBy is a member of the group
    if (!group.members.includes(paidBy)) {
      return res.status(400).json({ message: 'Payer must be a member of the group' });
    }

    // Create expense with only the validated fields
    const expenseData = {
      title,
      amount,
      paidBy,
      groupId,
      date,
      splitType,
      participants
    };

    if (category) expenseData.category = category;
    if (notes) expenseData.notes = notes;

    const newExpense = await Expense.create(expenseData);

    // Add expense to group
    await Group.addExpense(groupId, newExpense.id);

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error: error.message });
  }
});

// Update an expense
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      amount,
      paidBy,
      date,
      splitType,
      participants,
      category,
      notes,
      settled
    } = req.body;

    // Get current expense to check permissions
    const currentExpense = await Expense.findById(req.params.id);

    if (!currentExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Create update object with only the fields that should be updated
    const updateData = {};
    if (title) updateData.title = title;
    if (amount) updateData.amount = parseFloat(amount);
    if (paidBy) updateData.paidBy = paidBy;
    if (date) updateData.date = date;
    if (splitType) updateData.splitType = splitType;
    if (participants) updateData.participants = participants;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;
    if (settled !== undefined) updateData.settled = settled;

    const updatedExpense = await Expense.update(req.params.id, updateData);

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error: error.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Remove expense from group
    await Group.removeExpense(expense.groupId, expense.id);

    // Delete the expense
    const deleted = await Expense.delete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error: error.message });
  }
});

// Settle an expense
router.post('/:id/settle', async (req, res) => {
  try {
    const updatedExpense = await Expense.settle(req.params.id);

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error settling expense', error: error.message });
  }
});

// Unsettle an expense
router.post('/:id/unsettle', async (req, res) => {
  try {
    const updatedExpense = await Expense.unsettle(req.params.id);

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error unsettling expense', error: error.message });
  }
});
// Cập nhật trạng thái thanh toán cho một thành viên
router.post('/:id/settleParticipant', async (req, res) => {
  try {
    const { userId, settled } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Lấy chi tiêu
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Tìm người tham gia trong danh sách
    const participantIndex = expense.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      return res.status(404).json({ message: 'Participant not found in this expense' });
    }

    // Cập nhật trạng thái thanh toán
    expense.participants[participantIndex].settled = settled;

    // Cập nhật trạng thái tổng thể của chi tiêu
    expense.settled = expense.participants.every(p => p.settled);

    // Lưu thay đổi
    await Expense.update(expense.id, expense);

    res.json(expense);
  } catch (error) {
    console.error('Error updating participant settlement:', error);
    res.status(500).json({ message: 'Error updating participant settlement', error: error.message });
  }
});
router.post('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});
module.exports = router;