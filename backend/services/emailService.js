// backend/services/emailService.js
const nodemailer = require("nodemailer");

// Cấu hình transporter - bạn cần thay đổi thông tin này tùy theo nhà cung cấp email
const transporter = nodemailer.createTransport({
  service: "gmail", // Hoặc các dịch vụ khác như 'outlook', 'yahoo', v.v.
  auth: {
    user: "bimat0906@gmail.com", // Email dùng để gửi
    pass: "ncts ykxh eocf jtgz", // Mật khẩu hoặc mật khẩu ứng dụng
  },
});

// Tạo mã xác nhận ngẫu nhiên 6 chữ số
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email xác nhận mã đổi mật khẩu
const sendPasswordResetCode = async (email, code) => {
  const mailOptions = {
    from: "bimat0906@gmail.com",
    to: email,
    subject: "Mã xác nhận đổi mật khẩu - Ứng dụng Quản Lý Chi Tiêu Nhóm",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1DA1F2;">Xác nhận đổi mật khẩu</h2>
        <p>Bạn đã yêu cầu đổi mật khẩu trên ứng dụng Quản Lý Chi Tiêu Nhóm.</p>
        <p>Mã xác nhận của bạn là:</p>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${code}
        </div>
        <p>Mã xác nhận có hiệu lực trong 10 phút.</p>
        <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ Quản Lý Chi Tiêu Nhóm</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  generateVerificationCode,
  sendPasswordResetCode,
};
