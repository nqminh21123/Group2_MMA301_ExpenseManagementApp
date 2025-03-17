// backend/routes/userRoutes.js
const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Thêm import emailService
const {
  generateVerificationCode,
  sendPasswordResetCode,
} = require("../services/emailService");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    // Don't send passwords to the client
    const safeUsers = users.map((user) => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send password to the client
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user with this email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const newUser = await User.create({ name, email, password });

    // Don't send password to the client
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Update a user
router.put("/:id", async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await User.update(req.params.id, { name, email });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send password to the client
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Don't send password to the client
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});
// Gửi mã xác nhận đổi mật khẩu
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    // Kiểm tra xem email có tồn tại trong hệ thống không
    const user = await User.findByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });
    }

    // Tạo mã xác nhận
    const verificationCode = generateVerificationCode();

    // Lưu mã xác nhận
    await User.saveVerificationCode(email, verificationCode);

    // Gửi email
    await sendPasswordResetCode(email, verificationCode);

    res.json({ message: "Mã xác nhận đã được gửi đến email của bạn" });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi gửi mã xác nhận", error: error.message });
  }
});

// Xác thực mã và đổi mật khẩu
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, mã xác nhận và mật khẩu mới là bắt buộc" });
    }

    // Kiểm tra mã xác nhận
    const isValid = await User.verifyPasswordResetCode(email, code);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
    }

    // Đổi mật khẩu
    const updatedUser = await User.changePassword(email, newPassword);
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });
    }

    res.json({ message: "Mật khẩu đã được thay đổi thành công" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi đổi mật khẩu", error: error.message });
  }
});
// Add this new route after the login route

// Change password with current password verification
router.post("/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: "User ID, current password, and new password are required",
      });
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return res
        .status(401)
        .json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    // Update password
    const updatedUser = await User.update(userId, { password: newPassword });

    res.json({ message: "Mật khẩu đã được thay đổi thành công" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi đổi mật khẩu", error: error.message });
  }
});
// Xác thực mã đổi mật khẩu
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email và mã xác nhận là bắt buộc" });
    }

    // Kiểm tra mã xác nhận có hợp lệ không
    const isValid = await User.verifyPasswordResetCode(email, code);

    if (isValid) {
      res.json({ success: true, message: "Mã xác nhận hợp lệ" });
    } else {
      res.status(400).json({
        success: false,
        message: "Mã xác nhận không hợp lệ hoặc đã hết hạn",
      });
    }
  } catch (error) {
    console.error("Error verifying reset code:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xác thực mã", error: error.message });
  }
});
// Change password with current password verification
router.post("/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID, current password, and new password are required",
      });
    }

    // Change password with verification
    const result = await User.changePasswordWithVerification(
      userId,
      currentPassword,
      newPassword
    );

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(401).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi đổi mật khẩu",
      error: error.message,
    });
  }
});
module.exports = router;
