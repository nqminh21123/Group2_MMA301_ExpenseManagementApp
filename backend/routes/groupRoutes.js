// backend/routes/groupRoutes.js
const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.findAll();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group', error: error.message });
  }
});

// Get groups for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const groups = await Group.findByMember(req.params.userId);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user groups', error: error.message });
  }
});

// Create a new group
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    console.log('Creating group with data:', { name, description, createdBy });

    // Validate required fields
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'Name and createdBy are required' });
    }

    // Verify creator exists
    const user = await User.findById(createdBy);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(400).json({ message: 'Creator user not found' });
    }

    console.log('About to create group...');
    const newGroup = await Group.create({ name, description, createdBy });
    console.log('Group created:', newGroup);

    // Add group to user's groups
    console.log('Adding group to user...');
    await User.addGroup(createdBy, newGroup.id);
    console.log('Group added to user successfully');

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Detailed error creating group:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error creating group',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Update a group
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedGroup = await Group.update(req.params.id, { name, description });

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove group from all members
    for (const memberId of group.members) {
      await User.removeGroup(memberId, group.id);
    }

    const deleted = await Group.delete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
});

// Tìm nhóm theo mã tham gia
router.get('/join/:joinCode', async (req, res) => {
  try {
    const joinCode = req.params.joinCode.toUpperCase();
    const group = await Group.findByJoinCode(joinCode);

    if (!group) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm với mã này' });
    }

    res.json({
      id: group.id,
      name: group.name,
      memberCount: group.members.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tìm kiếm nhóm', error: error.message });
  }
});

// Tham gia nhóm bằng mã
router.post('/join', async (req, res) => {
  try {
    const { joinCode, userId } = req.body;

    if (!joinCode || !userId) {
      return res.status(400).json({ message: 'Cần cung cấp mã tham gia và ID người dùng' });
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Tìm nhóm theo mã
    const group = await Group.findByJoinCode(joinCode.toUpperCase());
    if (!group) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm với mã này' });
    }

    // Kiểm tra xem người dùng đã ở trong nhóm chưa
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'Bạn đã là thành viên của nhóm này' });
    }

    // Thêm người dùng vào nhóm
    const updatedGroup = await Group.addMember(group.id, userId);

    // Thêm nhóm vào danh sách nhóm của người dùng
    await User.addGroup(userId, group.id);

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tham gia nhóm', error: error.message });
  }
});

// Tạo mã tham gia mới (chỉ dành cho người tạo nhóm)
router.post('/:id/regenerate-code', async (req, res) => {
  try {
    const { userId } = req.body;
    const groupId = req.params.id;

    // Kiểm tra nhóm tồn tại
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Nhóm không tồn tại' });
    }

    // Kiểm tra người dùng có phải là người tạo nhóm không
    if (group.createdBy !== userId) {
      return res.status(403).json({ message: 'Chỉ người tạo nhóm mới có thể tạo mã mới' });
    }

    // Tạo mã mới
    const updatedGroup = await Group.regenerateJoinCode(groupId);

    res.json({ joinCode: updatedGroup.joinCode });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo mã mới', error: error.message });
  }
});

// Add a member to a group
router.post('/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add user to group
    const updatedGroup = await Group.addMember(req.params.id, userId);

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Add group to user's groups
    await User.addGroup(userId, req.params.id);

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error adding member to group', error: error.message });
  }
});

// Remove a member from a group
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator (can't remove the creator)
    if (group.createdBy === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the group creator' });
    }

    // Remove user from group
    const updatedGroup = await Group.removeMember(req.params.id, req.params.userId);

    // Remove group from user's groups
    await User.removeGroup(req.params.userId, req.params.id);

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error removing member from group', error: error.message });
  }
});

module.exports = router;